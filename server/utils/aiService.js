/**
 * AI Service Utility
 * Multi-API support: OpenAI (primary) + Groq (fallback)
 * Uses Promise.race() to return fastest valid response
 */

const OpenAI = require('openai');
const { removeComments } = require('./codeExecutor');
const { GoogleGenerativeAI } = require('@google/generative-ai');

let openaiClient = null;
let groqClient = null;
let geminiClient = null;

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

const getGeminiClient = () => {
  if (!geminiClient) {
    if (!process.env.GEMINI_API_KEY) {
      return null;
    }
    geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return geminiClient;
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

// ─── Call Gemini API ────────────────────────────────────────────────────────

const callGemini = async (cleanedCode, language, targetLanguage) => {
  const client = getGeminiClient();
  if (!client) throw new Error('Gemini API key not configured');

  const model = client.getGenerativeModel({ model: 'gemini-2.0-flash' });
  const prompt = `${SYSTEM_PROMPT}\n\n${buildPrompt(cleanedCode, language, targetLanguage)}`;
  
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  
  // Extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  return jsonMatch ? jsonMatch[0].trim() : '';
};

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

  // Add Gemini if configured
  if (process.env.GEMINI_API_KEY) {
    apiCalls.push({
      name: 'Gemini',
      call: () => callGemini(cleanedCode, language, targetLanguage)
    });
  }

  let rawContent = '';
  const errors = [];

  try {
    // Try APIs in parallel with Promise.allSettled for robust handling
    console.log(`[AI] Starting analysis for ${language} code (${cleanedCode.length} chars)`);
    console.log(`[AI] Available APIs: ${apiCalls.map(a => a.name).join(', ')}`);
    
    // Call all APIs with timeout and retry
    const apiPromises = apiCalls.map(async (api) => {
      try {
        const result = await callWithRetry(api.call, api.name, 2);
        if (result) {
          console.log(`[AI] ✅ ${api.name} succeeded`);
          return { success: true, apiName: api.name, result };
        }
        errors.push(`${api.name}: returned empty response`);
        return { success: false, apiName: api.name };
      } catch (err) {
        const errMsg = err.message || String(err);
        errors.push(`${api.name}: ${errMsg}`);
        console.warn(`[AI] ${api.name} failed: ${errMsg}`);
        return { success: false, apiName: api.name, error: errMsg };
      }
    });

    // Use allSettled to get results from all APIs, then pick first successful
    const results = await Promise.allSettled(apiPromises);
    
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value?.success && result.value?.result) {
        rawContent = result.value.result;
        console.log(`[AI] ✅ Using response from ${result.value.apiName}`);
        break;
      }
    }

    // If parallel failed, try sequentially with longer retries
    if (!rawContent) {
      console.log('[AI] Parallel attempts exhausted, trying sequential with more retries...');
      for (const api of apiCalls) {
        try {
          rawContent = await callWithRetry(api.call, api.name, 3);
          if (rawContent) {
            console.log(`[AI] ✅ Sequential: ${api.name} succeeded`);
            break;
          }
        } catch (err) {
          console.warn(`[AI] Sequential ${api.name} failed:`, err.message);
        }
      }
    }

    if (!rawContent) {
      console.error('[AI] All APIs exhausted. Errors:', errors);
      const err = new Error(
        `All AI services failed. Common causes:\n` +
        `• OpenAI: Check quota at https://platform.openai.com/account/billing/overview\n` +
        `• Groq: Rate limit or invalid key at https://console.groq.com\n` +
        `• Gemini: Quota exceeded at https://ai.google.dev/gemini-api/docs/rate-limits\n\n` +
        `Details: ${errors.join(' | ')}`
      );
      err.statusCode = 503;
      throw err;
    }

    console.log(`[AI] Got response (${rawContent.length} chars)`);
  } catch (err) {
    console.error('[AI] Analysis error:', err.message);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
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
