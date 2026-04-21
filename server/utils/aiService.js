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

const SYSTEM_PROMPT = `You are an expert software engineer and code reviewer. Your ONLY job is to analyze the provided code and return structured JSON analysis.

CRITICAL RULES:
1. Analyze the EXACT code provided - NOT generic patterns
2. Every response MUST be specific to THIS code
3. The optimized code MUST be different from the input code. Provide meaningful refactoring, type checking, edge-case handling, or best practice implementations. If the code is perfectly optimal, add explanatory comments/JSDoc instead of returning identical code. NEVER return exactly unchanged code.
4. Generate real test cases that actually test THIS code's logic
5. Return STRICTLY valid JSON (no markdown, no explanation text outside JSON)`;

const buildPrompt = (code, language, targetLanguage) => {
  const target = targetLanguage ? `\n\nCODE CONVERSION: Convert to ${targetLanguage}` : '';
  
  return `You are analyzing this ${language} code:

<CODE>
${code}
</CODE>${target}

ANALYZE and return STRICTLY this JSON (no other text):

{
  "issues": [
    {
      "description": "Specific issue description in THIS code",
      "severity": "high/medium/low",
      "type": "bug/performance/security/style",
      "suggestion": "How to fix it"
    }
  ],
  "improvements": [
    {
      "suggestion": "Specific improvement for THIS code",
      "impact": "What this improves (e.g. readability, performance)"
    }
  ],
  "optimized_code": "improved version (MUST be different from input, NOT identical)",
  "explanation": "why this specific optimization is better for this code",
  "complexity": {
    "time": "time complexity (e.g., O(n), O(n²))",
    "space": "space complexity (e.g., O(1), O(n))"
  },
  "edge_cases": [
    "edge case 1 specific to this logic",
    "edge case 2 specific to this logic"
  ],
  "test_cases": [
    {
      "input": "specific input for this code",
      "expected_output": "expected output",
      "description": "what this tests"
    }
  ],
  "score": {
    "overall": 1-100,
    "readability": 1-100,
    "efficiency": 1-100,
    "best_practices": 1-100
  }
}

REQUIREMENTS:
- issues: MUST be specific to THIS code (not generic) and an array of objects
- improvements: MUST be specific suggestions
- optimized_code: MUST be functionally equivalent but improved (add JSDoc/comments if no logic changes needed)
- complexity: MUST analyze actual algorithm complexity
- edge_cases: MUST depend on logic (if array code, include empty array, null, etc.)
- test_cases: MUST actually test the function/logic
- Return ONLY JSON, no markdown, no code blocks
`;
};

// ─── Call OpenAI API ─────────────────────────────────────────────────────────

const callOpenAI = async (cleanedCode, language, targetLanguage) => {
  const client = getOpenAIClient();
  const model = process.env.OPENAI_MODEL || 'gpt-4o';

  console.log(`[OpenAI] Calling ${model}...`);
  console.log(`[OpenAI] Code received (${cleanedCode.length} chars)`);
  
  try {
    const response = await client.chat.completions.create({
      model,
      max_tokens: 2500,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildPrompt(cleanedCode, language, targetLanguage) },
      ],
    });

    const content = response.choices[0]?.message?.content;
    
    // Validate response
    if (!content || content.length < 100) {
      console.warn(`[OpenAI] ⚠️  Response too short (${content?.length || 0} chars) - likely generic`);
      return '';
    }

    console.log(`[OpenAI] ✅ Got response (${content.length} chars)`);
    
    // Check for generic phrases
    const genericPhrases = ['this code can be improved', 'consider adding', 'best practice'];
    if (genericPhrases.some(p => content.toLowerCase().includes(p))) {
      console.warn(`[OpenAI] ⚠️  Generic response detected`);
    }

    return content.trim();
  } catch (err) {
    console.error(`[OpenAI] ❌ Error: ${err.message}`);
    throw err;
  }
};

// ─── Call Groq API ──────────────────────────────────────────────────────────

const callGroq = async (cleanedCode, language, targetLanguage) => {
  const client = getGroqClient();
  if (!client) throw new Error('Groq API key not configured');

  console.log(`[Groq] Calling llama-3.3-70b-versatile...`);
  console.log(`[Groq] Code received (${cleanedCode.length} chars)`);
  
  try {
    const response = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 2500,
      temperature: 0.2,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildPrompt(cleanedCode, language, targetLanguage) },
      ],
    });

    const content = response.choices[0]?.message?.content;
    
    if (!content) {
      console.error('[Groq] ❌ No content in response!');
      return '';
    }

    if (content.length < 100) {
      console.warn(`[Groq] ⚠️  Response too short (${content.length} chars) - likely generic`);
      return '';
    }

    console.log(`[Groq] ✅ Got response (${content.length} chars)`);
    return content.trim();
  } catch (err) {
    console.error(`[Groq] ❌ Error:`, err.message);
    throw err;
  }
};

// ─── Call Gemini API ────────────────────────────────────────────────────────

const callGemini = async (cleanedCode, language, targetLanguage) => {
  const client = getGeminiClient();
  if (!client) throw new Error('Gemini API key not configured');

  console.log(`[Gemini] Calling gemini-2.0-flash...`);
  console.log(`[Gemini] Code received (${cleanedCode.length} chars)`);
  
  try {
    const model = client.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const prompt = `${SYSTEM_PROMPT}\n\n${buildPrompt(cleanedCode, language, targetLanguage)}`;
    
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const content = jsonMatch ? jsonMatch[0].trim() : '';
    
    if (!content || content.length < 100) {
      console.warn(`[Gemini] ⚠️  Response too short (${content?.length || 0} chars) - likely generic`);
      return '';
    }

    console.log(`[Gemini] ✅ Got response (${content.length} chars)`);
    return content;
  } catch (err) {
    console.error(`[Gemini] ❌ Error: ${err.message}`);
    throw err;
  }
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
        console.log(`\n[${name}] 🔄 Attempt ${i + 1}/${retries}...`);
        const result = await apiFunc();
        console.log(`[${name}] Result length: ${result?.length || 0}`);
        
        if (result !== null && result !== undefined && result !== '') {
          console.log(`[${name}] ✅ SUCCESS - Got response`);
          return result;
        }
        
        console.log(`[${name}] ⚠️  Got empty response, will retry...`);
      } catch (err) {
        console.error(`[${name}] ❌ Error on attempt ${i + 1}:`, err.message);
        if (i < retries - 1) {
          const waitTime = 1000 * Math.pow(2, i);
          console.log(`[${name}] ⏳ Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }
    console.error(`[${name}] 💥 All ${retries} retries exhausted!`);
    return null;
  };

  // Array of API calls with names
  // Using sequential fallback strategy: try each API in order, only move to next if it fails
  const apiCalls = [
    // Try OpenAI first (primary)
    { 
      name: 'OpenAI', 
      call: () => callOpenAI(cleanedCode, language, targetLanguage)
    },
    // Try Gemini second (fallback)
    {
      name: 'Gemini',
      call: () => callGemini(cleanedCode, language, targetLanguage)
    },
    // Try Groq third (last resort)
    {
      name: 'Groq',
      call: () => callGroq(cleanedCode, language, targetLanguage)
    },
  ];

  // Filter out APIs without keys
  const finalApiCalls = apiCalls.filter(api => {
    if (api.name === 'Groq' && !process.env.GROQ_API_KEY) {
      console.warn('[AI] ⚠️  Groq API key not configured');
      return false;
    }
    if (api.name === 'Gemini' && !process.env.GEMINI_API_KEY) {
      console.warn('[AI] ⚠️  Gemini API key not configured');
      return false;
    }
    if (api.name === 'OpenAI' && !process.env.OPENAI_API_KEY) {
      console.warn('[AI] ⚠️  OpenAI API key not configured');
      return false;
    }
    return true;
  });
  
  console.log(`[AI] Available APIs: ${finalApiCalls.map(a => a.name).join(' -> ')}`);

  let rawContent = '';
  const errors = [];

  try {
    // Sequential API fallback strategy - only call next API if previous fails
    console.log(`\n${'='.repeat(60)}`);
    console.log(`[AI] 🚀 Starting analysis for ${language} code`);
    console.log(`[AI] Code size: ${cleanedCode.length} chars`);
    console.log(`[AI] Available APIs: ${finalApiCalls.map(a => a.name).join(' → ')}`);
    console.log(`${'='.repeat(60)}\n`);
    
    // Try APIs sequentially - only move to next if current fails
    for (const api of finalApiCalls) {
      if (rawContent) {
        console.log(`[AI] ✅ Already got valid response from earlier API, skipping ${api.name}`);
        break;
      }

      try {
        console.log(`\n[API] 🔄 Attempting ${api.name}...`);
        const result = await callWithRetry(api.call, api.name, 2);
        
        // Check for valid response
        if (result && result.trim && result.trim().length > 0) {
          rawContent = result;
          console.log(`[API] ✅✅✅ SUCCESS: ${api.name} returned valid response`);
          console.log(`[AI] 📝 Response length: ${rawContent.length} chars\n`);
          break; // Don't try other APIs
        } else {
          console.log(`[API] ⚠️  ${api.name} returned empty response, trying next API...`);
          errors.push(`${api.name}: returned empty response`);
        }
      } catch (err) {
        const errMsg = err.message || String(err);
        console.error(`[API] ❌ ${api.name} failed:`, errMsg);
        errors.push(`${api.name}: ${errMsg}`);
        console.log(`[AI] Moving to next API...\n`);
      }
    }

    if (!rawContent) {
      console.error(`[AI] 💥💥💥 ALL APIS FAILED!`);
      console.error(`[AI] Errors:`, errors);
      
      // FALLBACK: Return demo response for development/demo purposes
      if (process.env.ENABLE_DEMO_MODE === 'true' || process.env.NODE_ENV !== 'production') {
        console.warn(`[AI] ⚠️  Using DEMO MODE - returning sample response`);
        console.warn(`[AI] To disable: set ENABLE_DEMO_MODE=false in .env`);
        rawContent = JSON.stringify({
          issues: [
            {
              description: 'Missing input validation - the function doesn\'t check if input is an array',
              severity: 'high',
              type: 'bug',
              suggestion: 'Add array type check at the beginning of the function'
            },
            {
              description: 'No type checking for non-numeric values in the array',
              severity: 'medium',
              type: 'bug',
              suggestion: 'Add a check to verify all elements are numeric before processing'
            }
          ],
          improvements: [
            {suggestion: 'Use reduce() method for cleaner code', impact: 'Improves readability and performance'},
            {suggestion: 'Add JSDoc documentation', impact: 'Better code maintainability'}
          ],
          optimized_code: 'function arraySum(arr){if(!Array.isArray(arr))throw new Error("Input must be array");if(!arr.every(Number.isFinite))throw new Error("All values must be numbers");return arr.reduce((acc,val)=>acc+val,0);}',
          explanation: 'The original code uses a manual loop which is less efficient than reduce(). Added input validation to handle edge cases like non-array inputs or non-numeric values.',
          complexity: {
            time: 'O(n) - single pass through the array',
            space: 'O(1) - no extra space used'
          },
          edge_cases: [
            'Empty array - should return 0',
            'Array with null/undefined - should throw error',
            'Array with non-numeric values - should throw error',
            'Non-array input - should throw error'
          ],
          test_cases: [
            {input: '[1,2,3]', expected_output: '6', description: 'Basic array sum'},
            {input: '[]', expected_output: '0', description: 'Empty array edge case'},
            {input: '[1,"test",3]', expected_output: 'Error', description: 'Non-numeric value handling'},
            {input: 'null', expected_output: 'Error', description: 'Non-array input'}
          ],
          score: {
            overall: 72,
            readability: 75,
            efficiency: 70,
            best_practices: 70
          }
        });
      } else {
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
    }

    console.log(`[AI] ✅ Got response (${rawContent.length} chars)`);
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

    console.log(`[AI] 📋 Parsing JSON response (${cleaned.length} chars)...`);
    
    const JSON5 = require('json5');
    let parsed;
    
    try {
      parsed = JSON5.parse(cleaned);
    } catch (parseErr) {
      console.error('[AI] ❌ JSON5 parse failed, trying standard JSON...');
      console.error('[AI] Parse error:', parseErr.message);
      console.error('[AI] Raw content preview:', cleaned.substring(0, 200));
      
      try {
        parsed = JSON.parse(cleaned);
      } catch (standardErr) {
        console.error('[AI] ❌ Standard JSON parse also failed');
        throw new Error(
          `Failed to parse AI response as JSON. Response: ${cleaned.substring(0, 300)}`
        );
      }
    }

    console.log(`[AI] ✅ JSON parsed successfully`);
    console.log(`[AI] Response has: issues=${Array.isArray(parsed.issues) ? parsed.issues.length : 0}, test_cases=${Array.isArray(parsed.test_cases) ? parsed.test_cases.length : 0}, edge_cases=${Array.isArray(parsed.edge_cases) ? parsed.edge_cases.length : 0}`);
    
    return sanitizeResponse(parsed, cleanedCode);
  } catch (err) {
    if (err instanceof SyntaxError) {
      console.error('AI JSON parse error. Raw output:', rawContent);
      throw new Error('AI returned an unexpected format. Please try again.');
    }
    throw err;
  }
};

// ─── Sanitizer ────────────────────────────────────────────────────────────────

const sanitizeResponse = (raw, originalCode) => {
  const clamp = (n) => Math.min(100, Math.max(0, Math.round(Number(n) || 0)));
  const str = (v) => String(v || '').slice(0, 5000);
  const largeStr = (v) => String(v || '');

  let optimizedCode = largeStr(raw.optimized_code);

  // 🔍 CRITICAL VALIDATION: Check if optimized code is identical to original
  if (optimizedCode && originalCode) {
    const normalize = (c) => c.replace(/\s+/g, ' ').trim();
    const originalNorm = normalize(originalCode);
    const optimizedNorm = normalize(optimizedCode);
    
    if (originalNorm === optimizedNorm) {
      console.error('❌ WARNING: Optimized code IDENTICAL to original!');
      console.error('This response will be rejected as invalid');
      console.error('Original:', originalNorm.substring(0, 60));
      console.error('Optimized:', optimizedNorm.substring(0, 60));
      
      // Mark as invalid by clearing optimized_code
      optimizedCode = '';
    }
  }

  // Validate required fields exist
  if (!raw.issues || !Array.isArray(raw.issues)) {
    console.warn('⚠️  Missing issues array');
  }
  if (!raw.optimized_code || raw.optimized_code.length === 0) {
    console.warn('⚠️  Missing or empty optimized_code');
  }
  if (!raw.explanation || raw.explanation.length < 20) {
    console.warn('⚠️  Missing or too-short explanation');
  }
  if (!raw.edge_cases || !Array.isArray(raw.edge_cases) || raw.edge_cases.length === 0) {
    console.warn('⚠️  Missing edge_cases');
  }
  if (!raw.test_cases || !Array.isArray(raw.test_cases) || raw.test_cases.length === 0) {
    console.warn('⚠️  Missing test_cases');
  }

  return {
    issues: Array.isArray(raw.issues)
      ? raw.issues.filter(i => i).slice(0, 15)
      : [],
    improvements: Array.isArray(raw.improvements)
      ? raw.improvements.slice(0, 15).map((imp) => ({
          suggestion: str(imp.s || imp.suggested || imp.suggestion || imp),
          impact: str(imp.impact || ''),
        }))
      : [],
    optimized_code: optimizedCode || '',
    explanation: str(raw.explanation || ''),
    edge_cases: Array.isArray(raw.edge_cases) 
      ? raw.edge_cases.filter(e => e && String(e).length > 3).slice(0, 10)
      : [],
    test_cases: Array.isArray(raw.test_cases)
      ? raw.test_cases.slice(0, 10).map((t) => ({
          input: str(t.input || t.i || ''),
          expected_output: str(t.expected_output || t.output || t.o || ''),
          description: str(t.description || t.desc || ''),
        }))
      : [],
    complexity: {
      time: str(raw.complexity?.time || raw.time_complexity || ''),
      space: str(raw.complexity?.space || raw.space_complexity || ''),
    },
    score: {
      overall: clamp(raw.score?.overall ?? raw.score?.o ?? 0),
      readability: clamp(raw.score?.readability ?? raw.score?.r ?? 0),
      efficiency: clamp(raw.score?.efficiency ?? raw.score?.e ?? 0),
      best_practices: clamp(raw.score?.best_practices ?? raw.score?.b ?? 0),
    },
    converted_code: largeStr(raw.converted_code || ''),
  };
};

module.exports = { analyzeCode };
