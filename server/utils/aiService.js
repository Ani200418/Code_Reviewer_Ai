/**
 * AI Service Utility with Multi-Provider Support
 * Supports OpenAI, Groq, and Google Gemini with intelligent fallback
 */

const OpenAI = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');

let openaiClient = null;
let geminiClient = null;

// ─── Client Initialization ────────────────────────────────────────────────────

const getOpenAIClient = () => {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      console.warn('⚠️  OPENAI_API_KEY not set');
      return null;
    }
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
};

const getGeminiClient = () => {
  if (!geminiClient) {
    if (!process.env.GOOGLE_API_KEY) {
      console.warn('⚠️  GOOGLE_API_KEY not set');
      return null;
    }
    geminiClient = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
  }
  return geminiClient;
};

// ─── Optimized Prompt ─────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a senior software engineer with 15+ years of experience.
Analyze the given code deeply and return ONLY valid JSON — no markdown fences, no extra text.

JSON schema (ALL fields required):
{
  "bugs": [{ "issue": "string", "explanation": "string" }],
  "optimizations": [{ "suggestion": "string", "impact": "string" }],
  "explanation": "string (2-3 sentences specific to THIS code)",
  "edge_cases": ["string"],
  "test_cases": [{ "input": "string", "expected_output": "string" }],
  "score": { "overall": 0, "readability": 0, "efficiency": 0, "best_practices": 0 }
}

Rules:
- CRITICAL: ALL analysis must be SPECIFIC to the code provided. No generic responses.
- Scoring: 90-100=Excellent, 70-89=Good, 50-69=Average, 30-49=Poor, 0-29=Critical
- Return 2-4 bugs if found, 2-3 optimizations, 2-3 edge cases, 3-4 test cases
- If no bugs, return empty array for bugs
- Each recommendation MUST reference actual code patterns`;

const buildPrompt = (code, language) =>
  `Language: ${language.toUpperCase()}\n\nCode:\n\`\`\`${language}\n${code}\n\`\`\`\n\nAnalyze this specific code. Return ONLY the JSON, nothing else.`;

// ─── OpenAI Provider ──────────────────────────────────────────────────────────

const analyzeWithOpenAI = async (code, language) => {
  const client = getOpenAIClient();
  if (!client) throw new Error('OpenAI: API key not configured');

  try {
    const response = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      max_tokens: 1500,
      temperature: 0.3,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildPrompt(code, language) },
      ],
    });

    const rawContent = response.choices[0]?.message?.content?.trim() || '';
    if (!rawContent) throw new Error('OpenAI: empty response');

    return parseAndSanitize(rawContent, 'OpenAI');
  } catch (err) {
    console.error('❌ OpenAI error:', err.message);
    if (err.status === 429) throw new Error('OpenAI: rate limited');
    if (err.status === 401) throw new Error('OpenAI: invalid API key');
    throw err;
  }
};

// ─── Groq Provider ───────────────────────────────────────────────────────────

const analyzeWithGroq = async (code, language) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('Groq: API key not configured');

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mixtral-8x7b-32768',
        max_tokens: 1500,
        temperature: 0.3,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildPrompt(code, language) },
        ],
      }),
    });

    if (!response.ok) {
      const errData = await response.json();
      if (response.status === 429) throw new Error('Groq: rate limited');
      throw new Error(`Groq: ${errData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const rawContent = data.choices[0]?.message?.content?.trim() || '';
    if (!rawContent) throw new Error('Groq: empty response');

    return parseAndSanitize(rawContent, 'Groq');
  } catch (err) {
    console.error('❌ Groq error:', err.message);
    throw err;
  }
};

// ─── Google Gemini Provider ──────────────────────────────────────────────────

const analyzeWithGemini = async (code, language) => {
  const client = getGeminiClient();
  if (!client) throw new Error('Gemini: API key not configured');

  try {
    const model = client.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const prompt = buildPrompt(code, language) + '\n\nRespond with ONLY the JSON object.';

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      systemInstruction: SYSTEM_PROMPT,
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1500,
      },
    });

    const rawContent = result.response.text()?.trim() || '';
    if (!rawContent) throw new Error('Gemini: empty response');

    return parseAndSanitize(rawContent, 'Gemini');
  } catch (err) {
    console.error('❌ Gemini error:', err.message);
    if (err.message.includes('quota')) throw new Error('Gemini: quota exceeded');
    throw err;
  }
};

// ─── Response Parser & Sanitizer ──────────────────────────────────────────────

const parseAndSanitize = (rawContent, provider) => {
  try {
    // Clean markdown code fences if present
    const cleaned = rawContent
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    const parsed = JSON.parse(cleaned);
    return sanitizeResponse(parsed);
  } catch (err) {
    console.error(`${provider} JSON parse error. Raw: ${rawContent.substring(0, 200)}`);
    throw new Error(`${provider}: Invalid JSON response format`);
  }
};

// ─── Main Orchestration with Fallback ─────────────────────────────────────────

const analyzeCode = async (code, language) => {
  const providers = [];
  const errors = {};

  // Determine which providers to try based on configuration
  if (process.env.OPENAI_API_KEY) providers.push({ name: 'OpenAI', fn: analyzeWithOpenAI });
  if (process.env.GROQ_API_KEY) providers.push({ name: 'Groq', fn: analyzeWithGroq });
  if (process.env.GOOGLE_API_KEY) providers.push({ name: 'Gemini', fn: analyzeWithGemini });

  if (providers.length === 0) {
    throw new Error('No AI services configured. Please set OPENAI_API_KEY, GROQ_API_KEY, or GOOGLE_API_KEY');
  }

  console.log(`🔄 Trying ${providers.length} AI provider(s)...`);

  // Try each provider in order
  for (const provider of providers) {
    try {
      console.log(`  ✓ Attempting ${provider.name}...`);
      const result = await provider.fn(code, language);
      console.log(`  ✅ ${provider.name} succeeded`);
      return result;
    } catch (err) {
      errors[provider.name] = err.message;
      console.log(`  ⚠️  ${provider.name} failed: ${err.message}`);
      // Continue to next provider
    }
  }

  // All providers failed
  const errorDetails = Object.entries(errors)
    .map(([name, msg]) => `${name}: ${msg}`)
    .join(' | ');
  
  throw new Error(`All AI services are temporarily unavailable (likely quota limits). Please wait a few minutes and try again, or check your API keys. Details: ${errorDetails}`);
};

// ─── Sanitizer ────────────────────────────────────────────────────────────────

const sanitizeResponse = (raw) => {
  const clamp = (n) => Math.min(100, Math.max(0, Math.round(Number(n) || 0)));
  const str = (v) => String(v || '').slice(0, 1000);

  // Handle both field name variations (bugs vs issues, optimizations vs improvements)
  const bugs = raw.bugs || raw.issues || [];
  const optimizations = raw.optimizations || raw.improvements || [];

  return {
    bugs: Array.isArray(bugs)
      ? bugs.slice(0, 10).map((b) => ({
          issue: str(b.issue || b.description || ''),
          explanation: str(b.explanation || b.suggestion || '')
        }))
      : [],
    optimizations: Array.isArray(optimizations)
      ? optimizations.slice(0, 10).map((o) => ({
          suggestion: str(o.suggestion || o.current || ''),
          impact: str(o.impact || o.suggested || '')
        }))
      : [],
    explanation: str(raw.explanation || ''),
    edge_cases: Array.isArray(raw.edge_cases)
      ? raw.edge_cases.slice(0, 8).map(str)
      : [],
    test_cases: Array.isArray(raw.test_cases)
      ? raw.test_cases.slice(0, 8).map((t) => ({
          input: str(t.input || ''),
          expected_output: str(t.expected_output || t.output || '')
        }))
      : [],
    score: {
      overall:       clamp(raw.score?.overall),
      readability:   clamp(raw.score?.readability),
      efficiency:    clamp(raw.score?.efficiency),
      best_practices: clamp(raw.score?.best_practices),
    },
  };
};

module.exports = { analyzeCode };
