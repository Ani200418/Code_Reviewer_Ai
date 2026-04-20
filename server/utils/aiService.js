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

const SYSTEM_PROMPT = `Analyze code. Return ONLY JSON (no text):
{"issues":[{"d":"problem description","fix":"solution"}],"improvements":[{"s":"suggestion","impact":"effect"}],"optimized_code":"code","explanation":"brief summary","score":{"o":0,"r":0,"e":0,"b":0}}`;

const buildPrompt = (code, language, targetLanguage) => {
  const target = targetLanguage ? ` to ${targetLanguage}` : '';
  return `${language}${target}\n\`\`\`\n${code}\n\`\`\``;
};

// ─── Call OpenAI API ─────────────────────────────────────────────────────────

const callOpenAI = async (cleanedCode, language, targetLanguage) => {
  const client = getOpenAIClient();
  const model = process.env.OPENAI_MODEL || 'gpt-4o';

  console.log(`[OpenAI] Calling ${model}...`);
  
  try {
    const response = await client.chat.completions.create({
      model,
      max_tokens: 1500,
      temperature: 0.1,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildPrompt(cleanedCode, language, targetLanguage) },
      ],
    });

    const content = response.choices[0]?.message?.content;
    console.log(`[OpenAI] ✅ Got response (${content?.length || 0} chars)`);
    return content?.trim() || '';
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
  
  try {
    const response = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 1200,
      temperature: 0.1,
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
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const content = jsonMatch ? jsonMatch[0].trim() : '';
    
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
  // Using all 3 APIs with smart fallback strategy
  const apiCalls = [
    // Try Groq first (free tier, fast)
    {
      name: 'Groq',
      call: () => callGroq(cleanedCode, language, targetLanguage)
    },
    // Try Gemini second (free tier available)
    {
      name: 'Gemini',
      call: () => callGemini(cleanedCode, language, targetLanguage)
    },
    // Try OpenAI third (backup, requires credits)
    { 
      name: 'OpenAI', 
      call: () => callOpenAI(cleanedCode, language, targetLanguage)
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

  // Map shortened field names from optimized prompt to schema names
  const optimizedCode = largeStr(raw.optimized_code);

  return {
    // Schema expects: issues = [{issue, explanation}]
    issues: Array.isArray(raw.issues)
      ? raw.issues.slice(0, 15).map((i) => ({
          issue: str(i.d || i.description || i.issue),
          explanation: str(i.fix || i.suggestion || i.explanation),
        }))
      : [],
    // Schema expects: improvements = [{suggestion, impact}]
    improvements: Array.isArray(raw.improvements)
      ? raw.improvements.slice(0, 15).map((imp) => ({
          suggestion: str(imp.s || imp.suggested || imp.suggestion),
          impact: str(imp.impact),
        }))
      : [],
    optimized_code: optimizedCode || '',
    explanation: str(raw.explanation || 'Code analysis complete'),
    edge_cases: Array.isArray(raw.edge_cases) ? raw.edge_cases.slice(0, 10).map(str) : [],
    test_cases: Array.isArray(raw.test_cases)
      ? raw.test_cases.slice(0, 10).map((t) => ({
          input: str(t.input || t.i || ''),
          expected_output: str(t.expected_output || t.o || ''),
        }))
      : [],
    score: {
      overall:       clamp(raw.score?.o ?? raw.score?.overall ?? 0),
      readability:   clamp(raw.score?.r ?? raw.score?.readability ?? 0),
      efficiency:    clamp(raw.score?.e ?? raw.score?.efficiency ?? 0),
      best_practices: clamp(raw.score?.b ?? raw.score?.best_practices ?? 0),
    },
    converted_code: largeStr(raw.converted_code || ''),
  };
};

module.exports = { analyzeCode };
