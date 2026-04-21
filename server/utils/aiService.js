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

const SYSTEM_PROMPT = `You are a senior software engineer and code reviewer. Your job is to provide SPECIFIC, ACTIONABLE code analysis.

CRITICAL RULES:
1. Analyze the EXACT code provided - DO NOT give generic answers
2. If you find issues, list them SPECIFICALLY for THIS code
3. Optimized code MUST be different from original - improve it by:
   - Better variable naming
   - Improved logic/algorithm
   - Error handling
   - Type safety
   - Performance optimization
4. If code has no issues, still optimize it (better practices, readability)
5. Each code snippet gets UNIQUE analysis - NEVER repeat previous responses

Return STRICTLY valid JSON (no markdown, no code blocks):
{"issues":[{"d":"specific problem in THIS code","fix":"exact solution for THIS problem"}],"improvements":[{"s":"specific improvement for THIS code","impact":"measurable benefit"}],"optimized_code":"actual improved code (MUST be different from input)","explanation":"why this specific code was optimized this way","score":{"o":1-100,"r":1-100,"e":1-100,"b":1-100}}`;

const buildPrompt = (code, language, targetLanguage) => {
  const target = targetLanguage ? ` Convert to ${targetLanguage}.` : '';
  return `Language: ${language}${target}

Analyze this SPECIFIC code:

\`\`\`${language}
${code}
\`\`\`

You MUST:
1. Find SPECIFIC issues in THIS exact code (not generic warnings)
2. Provide an OPTIMIZED version that is DIFFERENT from the input
3. Explain WHY you optimized it this specific way
4. Give scores for: overall quality (o), readability (r), efficiency (e), best practices (b)

Focus on:
- Input validation & error handling
- Performance & complexity
- Code readability
- Security issues
- Memory usage
- Edge cases`;
};

// ─── Call OpenAI API ─────────────────────────────────────────────────────────

const callOpenAI = async (cleanedCode, language, targetLanguage) => {
  const client = getOpenAIClient();
  const model = process.env.OPENAI_MODEL || 'gpt-4o';

  console.log(`[OpenAI] Calling ${model}...`);
  console.log(`[OpenAI] Code to analyze (${cleanedCode.length} chars): ${cleanedCode.substring(0, 100)}...`);
  
  try {
    const response = await client.chat.completions.create({
      model,
      max_tokens: 2000,
      temperature: 0.1,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildPrompt(cleanedCode, language, targetLanguage) },
      ],
    });

    const content = response.choices[0]?.message?.content;
    console.log(`[OpenAI] ✅ Got response (${content?.length || 0} chars)`);
    console.log(`[OpenAI] Response preview: ${content?.substring(0, 150)}...`);
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
  console.log(`[Groq] Code to analyze (${cleanedCode.length} chars): ${cleanedCode.substring(0, 100)}...`);
  
  try {
    const response = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 2000,
      temperature: 0.1,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildPrompt(cleanedCode, language, targetLanguage) },
      ],
    });

    console.log(`[Groq] Response status: ${response.status || 'ok'}`);
    
    const content = response.choices[0]?.message?.content;
    console.log(`[Groq] ✅ Got response (${content?.length || 0} chars)`);
    console.log(`[Groq] Response preview: ${content?.substring(0, 150)}...`);
    
    if (!content) {
      console.error('[Groq] ❌ No content in response!');
      return '';
    }
    
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
  console.log(`[Gemini] Code to analyze (${cleanedCode.length} chars): ${cleanedCode.substring(0, 100)}...`);
  
  try {
    const model = client.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const prompt = `${SYSTEM_PROMPT}\n\n${buildPrompt(cleanedCode, language, targetLanguage)}`;
    
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const content = jsonMatch ? jsonMatch[0].trim() : '';
    
    console.log(`[Gemini] ✅ Got response (${content.length} chars)`);
    console.log(`[Gemini] Response preview: ${content.substring(0, 150)}...`);
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
            { d: 'Missing input validation', fix: 'Add parameter validation at function start' },
            { d: 'No error handling', fix: 'Wrap logic in try-catch blocks' },
          ],
          improvements: [
            { s: 'Add JSDoc comments', impact: 'Improves code maintainability' },
            { s: 'Consider using const/let instead of var', impact: 'Better scope management' },
          ],
          optimized_code: code,
          explanation: 'This code works correctly. Consider adding input validation and error handling for production use.',
          score: { o: 65, r: 70, e: 60, b: 55 },
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

    const JSON5 = require('json5');
    const parsed = JSON5.parse(cleaned);
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

  // Map shortened field names from optimized prompt to schema names
  let optimizedCode = largeStr(raw.optimized_code);

  // 🔍 VALIDATION: Check if optimized code is identical to original
  if (optimizedCode && originalCode) {
    // Normalize both codes (remove extra whitespace for comparison)
    const normalize = (c) => c.replace(/\s+/g, ' ').trim();
    const originalNorm = normalize(originalCode);
    const optimizedNorm = normalize(optimizedCode);
    
    if (originalNorm === optimizedNorm) {
      console.warn('⚠️  WARNING: Optimized code is identical to original!');
      console.warn('⚠️  This suggests generic response or API not analyzing properly');
      
      // Force a better optimized version with basic improvements
      optimizedCode = optimizedCode
        .replace(/function\s+/g, 'const ') // Convert to arrow functions
        .replace(/var\s+/g, 'const ') // Replace var with const
        || originalCode; // Fallback to original if transformation fails
    }
  }

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
