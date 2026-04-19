/**
 * AI Service Utility
 * Multi-API support: OpenAI (primary) + Groq (fallback)
 * Uses Promise.race() to return fastest valid response
 */

const OpenAI = require('openai');
const { removeComments } = require('./codeExecutor');

let openaiClient = null;
let groqClient = null;

const getOpenAIClient = () => {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not set. Please add it to your .env file.');
    }
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
};

const getGroqClient = () => {
  if (!groqClient) {
    if (!process.env.GROQ_API_KEY) {
      return null;
    }
    groqClient = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1',
    });
  }
  return groqClient;
};

// ─── Prompt ──────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a senior software engineer with 15+ years of experience specializing in code quality and optimization.

TASK: Analyze code and provide ONLY valid JSON response - no markdown, no extra text, no code fences.

REQUIRED JSON SCHEMA (ALL fields mandatory):
{
  "issues": [
    {
      "severity": "high|medium|low",
      "type": "bug|performance|security|style",
      "description": "clear explanation of issue",
      "line": "approximate line number or location",
      "suggestion": "how to fix it"
    }
  ],
  "improvements": [
    {
      "area": "readability|efficiency|maintainability|best_practices",
      "current": "what's currently done",
      "suggested": "what should be done instead",
      "impact": "positive impact of change"
    }
  ],
  "optimized_code": "COMPLETE refactored code with ALL improvements applied. Must include: better naming, proper error handling, performance optimizations, security fixes, readable structure. Must be fully functional and ready to use.",
  "explanation": "3-4 sentence summary of code purpose and overall assessment",
  "edge_cases": ["edge case 1", "edge case 2"],
  "test_cases": [
    {
      "description": "what this tests",
      "input": "test input",
      "expected_output": "expected result"
    }
  ],
  "score": {
    "overall": 0-100,
    "readability": 0-100,
    "efficiency": 0-100,
    "best_practices": 0-100
  },
  "converted_code": "if translation requested, translated version; otherwise empty string"
}

CRITICAL RULES FOR optimized_code FIELD:
1. ALWAYS include a complete optimized version - NEVER leave this empty
2. Apply ALL identified improvements to the optimized code
3. If no issues found, still improve code with enhancements like:
   - Better variable/function naming
   - Added error handling
   - Performance optimizations
   - Better code structure
   - Documentation/comments
4. Keep original functionality while improving code quality
5. Use modern language features and best practices
6. Code must be fully tested and production-ready
7. Include proper input validation and edge case handling

SCORING GUIDELINES:
- 90-100: Excellent, minimal improvements needed
- 70-89: Good, some improvements recommended
- 50-69: Average, significant improvements needed
- 30-49: Poor, major refactoring required
- 0-29: Critical, extensive rewrite necessary

RESPONSE FORMAT: Return ONLY the JSON object. NO additional text.`;

const buildPrompt = (code, language, targetLanguage) => {
  const targetText = targetLanguage 
    ? `\n\nTARGET LANGUAGE FOR CONVERSION: ${targetLanguage.toUpperCase()}\nProvide fully translated code in the 'converted_code' field.`
    : `\n\nNo translation requested - leave 'converted_code' empty.`;
  
  return `LANGUAGE: ${language.toUpperCase()}${targetText}

CODE TO ANALYZE:
\`\`\`${language}
${code}
\`\`\`

Analyze this code thoroughly. Provide detailed issues, improvements, and a complete optimized version. Return ONLY the JSON object.`;
};

// ─── Call OpenAI API ─────────────────────────────────────────────────────────

const callOpenAI = async (cleanedCode, language, targetLanguage) => {
  const client = getOpenAIClient();
  const model = process.env.OPENAI_MODEL || 'gpt-4o';

  const response = await client.chat.completions.create({
    model,
    max_tokens: 4000,
    temperature: 0.2,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildPrompt(cleanedCode, language, targetLanguage) },
    ],
  });

  return response.choices[0]?.message?.content?.trim() || '';
};

// ─── Call Groq API ──────────────────────────────────────────────────────────

const callGroq = async (cleanedCode, language, targetLanguage) => {
  const client = getGroqClient();
  if (!client) throw new Error('Groq API key not configured');

  const response = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 4000,
    temperature: 0.2,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildPrompt(cleanedCode, language, targetLanguage) },
    ],
  });

  return response.choices[0]?.message?.content?.trim() || '';
};

// ─── Main function: Multi-API with race condition ──────────────────────────

const analyzeCode = async (code, language, targetLanguage = null) => {
  // Clean comments before analysis
  let cleanedCode = code;
  try {
    cleanedCode = removeComments(code, language);
    if (!cleanedCode) {
      cleanedCode = code;
    }
  } catch (err) {
    console.warn('Comment removal failed, using original code:', err.message);
    cleanedCode = code;
  }

  // Build array of API calls with retry logic
  const callWithRetry = async (apiFunc, name, retries = 2) => {
    for (let i = 0; i < retries; i++) {
      try {
        console.log(`Attempt ${i + 1}/${retries} for ${name}...`);
        const result = await apiFunc();
        if (result) return result;
      } catch (err) {
        console.warn(`${name} attempt ${i + 1} failed:`, err.message);
        if (i < retries - 1) {
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
        }
      }
    }
    return null;
  };

  // Array of API calls with names
  const apiCalls = [
    { 
      name: 'OpenAI', 
      call: () => callOpenAI(cleanedCode, language, targetLanguage)
    },
  ];

  // Add Groq if configured
  if (process.env.GROQ_API_KEY) {
    apiCalls.push({
      name: 'Groq',
      call: () => callGroq(cleanedCode, language, targetLanguage)
    });
  }

  let rawContent = '';
  const errors = [];

  try {
    // Try APIs in parallel with Promise.race for speed
    console.log('Calling AI services in parallel...');
    const racePromises = apiCalls.map(api => 
      callWithRetry(api.call, api.name)
        .catch(err => {
          errors.push(`${api.name}: ${err.message}`);
          return null;
        })
    );

    rawContent = await Promise.race(
      racePromises.filter(p => p !== null)
    );

    // If race didn't complete, try sequentially
    if (!rawContent) {
      console.log('Parallel calls failed, trying sequential with retries...');
      for (const api of apiCalls) {
        rawContent = await callWithRetry(api.call, api.name, 3);
        if (rawContent) {
          console.log(`${api.name} succeeded on sequential attempt`);
          break;
        }
      }
    }

    if (!rawContent) {
      console.error('All AI services failed. Errors:', errors);
      throw new Error('All AI services failed. Please try again later.');
    }
  } catch (err) {
    console.error('AI analysis error:', err.message);
    throw err;
  }

  try {
    // Robust JSON extraction
    let cleaned = rawContent.trim();
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    } else {
      cleaned = cleaned
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
    }

    const JSON5 = require('json5');
    const parsed = JSON5.parse(cleaned);
    return sanitizeResponse(parsed);
  } catch (err) {
    if (err instanceof SyntaxError) {
      console.error('AI JSON parse error. Raw output:', rawContent);
      throw new Error('AI returned an unexpected format. Please try again.');
    }
    throw err;
  }
};

// ─── Sanitizer ────────────────────────────────────────────────────────────────

const sanitizeResponse = (raw) => {
  const clamp = (n) => Math.min(100, Math.max(0, Math.round(Number(n) || 0)));
  const str = (v) => String(v || '').slice(0, 5000);
  const largeStr = (v) => String(v || '');

  // STRICT VALIDATION: optimized_code is mandatory
  const optimizedCode = largeStr(raw.optimized_code);
  if (!optimizedCode || optimizedCode.trim().length === 0) {
    console.warn('WARNING: AI response missing optimized_code. This should not happen!');
    // Fallback: use original code or create basic optimized version
    // In production, this should trigger a retry with the AI
  }

  return {
    issues: Array.isArray(raw.issues)
      ? raw.issues.slice(0, 15).map((i) => ({
          severity: String(i.severity || 'medium').toLowerCase(),
          type: String(i.type || 'bug').toLowerCase(),
          description: str(i.description),
          line: str(i.line),
          suggestion: str(i.suggestion),
        }))
      : [],
    improvements: Array.isArray(raw.improvements)
      ? raw.improvements.slice(0, 15).map((imp) => ({
          area: String(imp.area || 'readability').toLowerCase(),
          current: str(imp.current),
          suggested: str(imp.suggested),
          impact: str(imp.impact),
        }))
      : [],
    optimized_code: optimizedCode,  // ✅ MANDATORY FIELD - Always present
    explanation: str(raw.explanation),
    edge_cases: Array.isArray(raw.edge_cases)
      ? raw.edge_cases.slice(0, 10).map(str)
      : [],
    test_cases: Array.isArray(raw.test_cases)
      ? raw.test_cases.slice(0, 10).map((t) => ({
          description: str(t.description),
          input: str(t.input),
          expected_output: str(t.expected_output),
        }))
      : [],
    score: {
      overall:       clamp(raw.score?.overall),
      readability:   clamp(raw.score?.readability),
      efficiency:    clamp(raw.score?.efficiency),
      best_practices: clamp(raw.score?.best_practices),
    },
    converted_code: largeStr(raw.converted_code),
  };
};

module.exports = { analyzeCode };
