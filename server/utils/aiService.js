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

const SYSTEM_PROMPT = `You are a code quality expert. Analyze code briefly and provide ONLY valid JSON.

SCHEMA: {
  "issues": [{"severity":"high|medium|low","type":"bug|performance|security|style","description":"","suggestion":""}],
  "improvements": [{"area":"readability|efficiency|maintainability|best_practices","current":"","suggested":"","impact":""}],
  "optimized_code": "improved code",
  "explanation": "brief summary",
  "edge_cases": [],
  "test_cases": [{"description":"","input":"","expected_output":""}],
  "score": {"overall":0,"readability":0,"efficiency":0,"best_practices":0},
  "converted_code": ""
}

IMPORTANT: Return ONLY JSON, no text before or after.`;

const buildPrompt = (code, language, targetLanguage) => {
  const targetText = targetLanguage 
    ? `Translate to: ${targetLanguage.toUpperCase()}`
    : '';
  
  return `LANG: ${language}\n${targetText}\n\nCODE:\n\`\`\`\n${code}\n\`\`\`\n\nAnalyze. Return JSON only.`;
};

// ─── Call OpenAI API ─────────────────────────────────────────────────────────
// DISABLED - Account has no credits
// const callOpenAI = async (cleanedCode, language, targetLanguage) => {
//   ... removed for free tier ...
// };

// ─── Call Groq API ──────────────────────────────────────────────────────────

const callGroq = async (cleanedCode, language, targetLanguage) => {
  const client = getGroqClient();
  if (!client) throw new Error('Groq API key not configured');

  console.log(`[Groq] Calling llama-3.3-70b-versatile...`);
  
  try {
    const response = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 4000,
      temperature: 0.2,
      // NOTE: Groq doesn't support response_format yet, so we request JSON in the prompt instead
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildPrompt(cleanedCode, language, targetLanguage) },
      ],
    });

    console.log(`[Groq] Response status: ${response.status || 'ok'}`);
    console.log(`[Groq] Choices count: ${response.choices?.length}`);
    
    const content = response.choices[0]?.message?.content;
    console.log(`[Groq] Raw content length: ${content?.length || 0}`);
    console.log(`[Groq] Raw content preview: ${content?.substring(0, 150)}`);
    
    if (!content) {
      console.error('[Groq] ❌ No content in response!');
      return '';
    }
    
    const trimmed = content.trim();
    console.log(`[Groq] ✅ Got response (${trimmed.length} chars)`);
    return trimmed;
  } catch (err) {
    console.error(`[Groq] 💥 Error:`, err.message);
    console.error(`[Groq] Full error:`, err);
    throw err;
  }
};

// ─── Call Gemini API ────────────────────────────────────────────────────────

const callGemini = async (cleanedCode, language, targetLanguage) => {
  const client = getGeminiClient();
  if (!client) throw new Error('Gemini API key not configured');

  console.log(`[Gemini] Calling gemini-2.0-flash...`);
  
  try {
    const model = client.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const prompt = `${SYSTEM_PROMPT}\n\n${buildPrompt(cleanedCode, language, targetLanguage)}`;
    
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    console.log(`[Gemini] Response length: ${text?.length || 0}`);
    console.log(`[Gemini] Response preview: ${text?.substring(0, 100)}`);
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const content = jsonMatch ? jsonMatch[0].trim() : '';
    
    if (!content) {
      console.error('[Gemini] ❌ No JSON found in response!');
      return '';
    }
    
    console.log(`[Gemini] ✅ Got response (${content.length} chars)`);
    return content;
  } catch (err) {
    console.error(`[Gemini] 💥 Error:`, err.message);
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
  // Using FREE tier APIs only: Groq (primary)
  // Gemini is quota-limited, using Groq only
  const apiCalls = [
    // Try Groq (free tier, generous limits)
    {
      name: 'Groq',
      call: () => callGroq(cleanedCode, language, targetLanguage)
    },
  ];

  // Filter out APIs without keys
  const finalApiCalls = apiCalls.filter(api => {
    if (api.name === 'Groq' && !process.env.GROQ_API_KEY) {
      console.warn('[AI] ⚠️  Groq API key not configured, skipping');
      return false;
    }
    return true;
  });
  
  console.log(`[AI] Using API: ${finalApiCalls.map(a => a.name).join(', ')}`);

  let rawContent = '';
  const errors = [];

  try {
    // Try APIs in parallel with Promise.allSettled for robust handling
    console.log(`\n${'='.repeat(60)}`);
    console.log(`[AI] 🚀 Starting analysis for ${language} code`);
    console.log(`[AI] Code size: ${cleanedCode.length} chars`);
    console.log(`[AI] Available APIs: ${finalApiCalls.map(a => a.name).join(', ')}`);
    console.log(`${'='.repeat(60)}\n`);
    
    // Call all APIs with timeout and retry
    const apiPromises = finalApiCalls.map(async (api) => {
      try {
        console.log(`[API] Calling ${api.name}...`);
        const result = await callWithRetry(api.call, api.name, 2);
        
        // Check for null/undefined explicitly
        if (result && result.trim && result.trim().length > 0) {
          console.log(`[API] ✅ ${api.name} returned valid response`);
          return { success: true, apiName: api.name, result };
        }
        
        console.log(`[API] ❌ ${api.name} returned empty response`);
        errors.push(`${api.name}: returned empty response`);
        return { success: false, apiName: api.name };
      } catch (err) {
        const errMsg = err.message || String(err);
        console.error(`[API] 💥 ${api.name} error:`, errMsg);
        errors.push(`${api.name}: ${errMsg}`);
        return { success: false, apiName: api.name, error: errMsg };
      }
    });

    // Use allSettled to get results from all APIs, then pick first successful
    console.log(`[AI] 📡 Waiting for API responses...`);
    const results = await Promise.allSettled(apiPromises);
    
    console.log(`[AI] 📊 Got ${results.length} results`);
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value?.success && result.value?.result) {
        rawContent = result.value.result;
        console.log(`[AI] ✅✅✅ Using response from ${result.value.apiName}`);
        break;
      }
    }

    // If parallel failed, try sequentially with longer retries
    if (!rawContent) {
      console.log(`[AI] ⚠️  Parallel attempts failed, trying sequential with more retries...`);
      for (const api of finalApiCalls) {
        try {
          console.log(`[AI] 🔄 Sequential attempt for ${api.name}...`);
          rawContent = await callWithRetry(api.call, api.name, 3);
          
          if (rawContent && typeof rawContent === 'string' && rawContent.trim().length > 0) {
            console.log(`[AI] ✅✅✅ Sequential: ${api.name} succeeded`);
            break;
          }
          
          console.log(`[AI] Sequential ${api.name} returned empty, trying next...`);
        } catch (err) {
          console.error(`[AI] Sequential ${api.name} failed:`, err.message);
        }
      }
    }

    if (!rawContent) {
      console.error(`[AI] 💥💥💥 ALL APIS FAILED!`);
      console.error(`[AI] Errors:`, errors);
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
