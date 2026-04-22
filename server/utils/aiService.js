/**
 * AI Service Utility
 * Multi-API support: OpenAI (primary) → Gemini (fallback) → Groq (last resort)
 *
 * CRITICAL DESIGN RULES (enforced at prompt level):
 * - Language of OUTPUT must ALWAYS match language of INPUT
 * - Algorithm type must be correctly identified from the actual code structure
 * - Every field must reference actual variable names, function names, and constructs
 * - Optimized code must solve the SAME problem in the SAME language
 * - NO hardcoded demo fallback — all responses are live AI analysis
 */

const OpenAI = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const crypto = require('crypto');

// ─── Try to load optional codeExecutor ────────────────────────────────────────
let removeComments = (code) => code;
try {
  const executor = require('./codeExecutor');
  if (executor && typeof executor.removeComments === 'function') {
    removeComments = executor.removeComments;
  }
} catch { /* codeExecutor is optional */ }

let openaiClient = null;
let groqClient   = null;
let geminiClient = null;

const getOpenAIClient = () => {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not set');
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
};

const getGroqClient = () => {
  if (!groqClient) {
    if (!process.env.GROQ_API_KEY) return null;
    groqClient = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1',
    });
  }
  return groqClient;
};

const getGeminiClient = () => {
  if (!geminiClient) {
    if (!process.env.GEMINI_API_KEY) return null;
    geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return geminiClient;
};

// ─── SYSTEM PROMPT ────────────────────────────────────────────────────────────
// This is injected into every API call as the authoritative instruction set.
// It is intentionally verbose to force models away from template responses.

const SYSTEM_PROMPT = `You are a world-class senior software engineer performing an in-depth, code-specific review.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ABSOLUTE LANGUAGE RULE — HIGHEST PRIORITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
The "optimized_code" field MUST be written in the EXACT SAME programming language as the input code.
If the input is Java → optimized_code must be valid Java.
If the input is Python → optimized_code must be valid Python.
If the input is JavaScript → optimized_code must be valid JavaScript.
NEVER switch languages. Returning code in a different language is a critical failure.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ABSOLUTE ALGORITHM RULE — HIGHEST PRIORITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
You MUST identify what the code actually does before writing anything else:
- If code contains binary search logic (divide-and-conquer with left/right/mid pointers) → it is Binary Search: O(log n), NOT O(n)
- If code sorts elements → it is Sorting: O(n log n) or O(n²)
- If code uses nested loops comparing every pair → O(n²)
- If code uses a single pass accumulation → O(n)
- If code uses recursion → identify the recurrence relation
DO NOT default to "O(n) linear scan" for all inputs. Derive the actual complexity.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STRICT RULES — VIOLATING ANY RULE = INVALID RESPONSE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Every analysis field MUST reference specific variable names, function names, class names, or line patterns from the provided code. Generic phrases ("basic iterative algorithm", "accumulator pattern") are FORBIDDEN unless those exact terms match the code.

2. optimized_code MUST solve the SAME problem as the input. If input is a search algorithm → output must be a search algorithm. If input sums numbers → output must sum numbers. NEVER swap the problem.

3. Issues MUST be real and code-specific. For Java code with int[] parameters, do NOT mention JavaScript-specific issues like NaN, Infinity, or Array.isArray(). Those are irrelevant in statically-typed Java.

4. edge_cases MUST be relevant to the algorithm. For Binary Search:
   - Empty array is relevant ✓
   - Null array is relevant ✓
   - NaN in array is IRRELEVANT for Java int[] ✗
   - "Non-array input" is IRRELEVANT for Java ✗

5. test_cases MUST reflect the actual function behavior. For a search function, expected_output is an index or -1, NOT a sum. For a sum function, expected_output is a number.

6. Return STRICTLY valid JSON only. No markdown fences, no explanatory text outside the JSON object.`;

// ─── Dynamic prompt builder ────────────────────────────────────────────────────

const buildPrompt = (code, language, targetLanguage) => {
  const conversionBlock = targetLanguage
    ? `\n\nCODE CONVERSION REQUIRED: Also translate this code to ${targetLanguage} and place it in "converted_code". The translation must be idiomatic ${targetLanguage}, not a word-for-word copy.`
    : '';

  // Extract structural fingerprints from the code to force model grounding
  const lines      = code.split('\n');
  const lineCount  = lines.length;
  const charCount  = code.length;
  const firstLines = lines.slice(0, 6).join(' | ');

  // Extract identifiers for grounding — force the model to reference them
  const identifiers = [];
  const idRegex = /\b([a-zA-Z_][a-zA-Z0-9_]{2,})\b/g;
  let m;
  const seen = new Set(['return', 'while', 'for', 'if', 'else', 'new', 'null', 'true', 'false', 'void', 'int', 'public', 'static', 'class', 'String']);
  while ((m = idRegex.exec(code)) !== null && identifiers.length < 12) {
    if (!seen.has(m[1])) { identifiers.push(m[1]); seen.add(m[1]); }
  }
  const fingerprint = identifiers.slice(0, 8).join(', ');

  return `You are reviewing the following ${language.toUpperCase()} code. The language is ${language.toUpperCase()} — keep ALL generated code in ${language.toUpperCase()}.

Code statistics: ${lineCount} lines, ${charCount} characters.
Key identifiers found in code: ${fingerprint || '(none detected)'}
First lines: "${firstLines}"

<CODE_TO_REVIEW language="${language}">
${code}
</CODE_TO_REVIEW>${conversionBlock}

STEP 1 — Before writing anything, identify:
a) What is the primary algorithm or pattern? (e.g., Binary Search, Bubble Sort, BFS, DP, etc.)
b) What problem does it solve? (e.g., finds target index in sorted array)
c) What language is it? → ${language} — ALL optimized code must be in ${language}

STEP 2 — Return ONLY the following JSON. No other text:

{
  "quality_analysis": "3+ sentence paragraph. Must mention the actual algorithm name (e.g., Binary Search), cite the actual ${language} identifiers found in this code (e.g., ${fingerprint || 'the function and variable names'}), evaluate readability, structure, correctness, and any design choices (like interval conventions). Do NOT describe a different problem or algorithm.",

  "issues": [
    {
      "description": "Specific issue citing actual variable/method from this code",
      "severity": "high|medium|low",
      "type": "bug|performance|security|style",
      "suggestion": "Exact fix in ${language} using this code's actual identifiers"
    }
  ],

  "improvements": [
    {
      "suggestion": "Specific improvement for this ${language} code, naming the actual construct",
      "impact": "Concrete, measurable impact (e.g., 'reduces O(n²) to O(n)' or 'adds null-safety')"
    }
  ],

  "optimized_code": "MUST be in ${language}. MUST solve the same problem as the input. Must be a genuinely improved version — better complexity, added validation, or cleaner logic. NEVER switch to a different language or a different problem.",

  "explanation": "Step-by-step walkthrough of how THIS specific code works. Mention the actual algorithm, cite actual variable names (${fingerprint || 'from the code'}), describe the actual logic flow, and state what the function returns.",

  "complexity": {
    "time": "Correct Big-O for THIS algorithm. Derive it from the actual loop/recursion structure. For divide-and-conquer: O(log n). For nested loops: O(n²). For single pass: O(n).",
    "space": "Correct space complexity derived from actual data structures allocated in this code."
  },

  "edge_cases": [
    "Edge case 1 relevant to THIS algorithm in ${language} (e.g., for Binary Search: empty array causes right=0, loop never executes, returns -1)",
    "Edge case 2 specific to this code's logic and ${language} type system",
    "Edge case 3 if applicable"
  ],

  "test_cases": [
    {
      "input": "Concrete input matching this function's actual signature",
      "expected_output": "The actual return value of THIS function for this input — NOT a different problem's output",
      "description": "What this tests about THIS algorithm",
      "category": "normal"
    },
    {
      "input": "A boundary input for THIS algorithm (e.g., target not found, empty array)",
      "expected_output": "Correct result for this boundary input",
      "description": "What boundary condition this covers",
      "category": "edge"
    },
    {
      "input": "Extreme/unusual input for THIS code",
      "expected_output": "Correct result or exception",
      "description": "Why this stresses THIS algorithm",
      "category": "corner"
    }
  ],

  "score": {
    "overall": <0-100 integer based on actual code quality>,
    "readability": <0-100>,
    "efficiency": <0-100>,
    "best_practices": <0-100>
  },

  "converted_code": ""
}

MANDATORY SELF-CHECK before responding:
✓ Is optimized_code in ${language}? (not JavaScript, not Python — must be ${language})
✓ Does optimized_code solve the SAME problem as the input?
✓ Does quality_analysis name the actual algorithm (not "basic iterative algorithm" if this is Binary Search)?
✓ Does complexity.time reflect the actual algorithm's Big-O (not defaulting to O(n) for all code)?
✓ Do test_cases have correct expected_output for THIS function (not outputs from a different problem)?
✓ Are edge_cases relevant to ${language} and THIS algorithm (not JS-specific NaN/Infinity for Java int[])?
`;
};

// ─── API callers ──────────────────────────────────────────────────────────────

const callOpenAI = async (cleanedCode, language, targetLanguage) => {
  const client = getOpenAIClient();
  const model  = process.env.OPENAI_MODEL || 'gpt-4o';
  console.log(`[OpenAI] Calling ${model} (${cleanedCode.length} chars, lang=${language})...`);

  const response = await client.chat.completions.create({
    model,
    max_tokens: 3500,
    temperature: 0.1,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user',   content: buildPrompt(cleanedCode, language, targetLanguage) },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content || content.length < 100) {
    console.warn(`[OpenAI] ⚠️ Response too short (${content?.length || 0} chars)`);
    return '';
  }
  console.log(`[OpenAI] ✅ Got response (${content.length} chars)`);
  return content.trim();
};

const callGroq = async (cleanedCode, language, targetLanguage) => {
  const client = getGroqClient();
  if (!client) throw new Error('Groq API key not configured');
  console.log(`[Groq] Calling llama-3.3-70b-versatile (${cleanedCode.length} chars, lang=${language})...`);

  const response = await client.chat.completions.create({
    model:       'llama-3.3-70b-versatile',
    max_tokens:  3500,
    temperature: 0.1,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user',   content: buildPrompt(cleanedCode, language, targetLanguage) },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content || content.length < 100) {
    console.warn(`[Groq] ⚠️ Response too short (${content?.length || 0} chars)`);
    return '';
  }
  console.log(`[Groq] ✅ Got response (${content.length} chars)`);
  return content.trim();
};

const callGemini = async (cleanedCode, language, targetLanguage) => {
  const client = getGeminiClient();
  if (!client) throw new Error('Gemini API key not configured');
  console.log(`[Gemini] Calling gemini-2.0-flash (${cleanedCode.length} chars, lang=${language})...`);

  const model  = client.getGenerativeModel({ model: 'gemini-2.0-flash' });
  const prompt = `${SYSTEM_PROMPT}\n\n${buildPrompt(cleanedCode, language, targetLanguage)}`;
  const result = await model.generateContent(prompt);
  const text   = result.response.text();

  // Gemini sometimes wraps JSON in markdown — strip it
  let content = text.trim();
  content = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) content = jsonMatch[0].trim();

  if (!content || content.length < 100) {
    console.warn(`[Gemini] ⚠️ Response too short (${content?.length || 0} chars)`);
    return '';
  }
  console.log(`[Gemini] ✅ Got response (${content.length} chars)`);
  return content;
};

// ─── Uniqueness guard ─────────────────────────────────────────────────────────

const _recentHashes = new Set();

const checkUniqueness = (rawContent, code) => {
  // Hash of optimized_code snippet + quality_analysis first 200 chars
  const snippet = rawContent.substring(0, 600);
  const hash    = crypto.createHash('md5').update(snippet).digest('hex');
  if (_recentHashes.has(hash)) {
    console.warn('[AI] ⚠️ DUPLICATE RESPONSE DETECTED — responses are suspiciously similar');
  }
  _recentHashes.add(hash);
  if (_recentHashes.size > 20) {
    const first = _recentHashes.values().next().value;
    _recentHashes.delete(first);
  }
};

// ─── Main analyzeCode ─────────────────────────────────────────────────────────

const analyzeCode = async (code, language, targetLanguage = null) => {
  // Optionally strip comments — catch errors gracefully
  let cleanedCode = code;
  try {
    const stripped = removeComments(code, language);
    if (stripped && stripped.trim().length > 20) cleanedCode = stripped;
  } catch {
    cleanedCode = code;
  }

  // Retry wrapper with exponential backoff
  const callWithRetry = async (apiFunc, name, retries = 2) => {
    for (let i = 0; i < retries; i++) {
      try {
        console.log(`\n[${name}] 🔄 Attempt ${i + 1}/${retries}...`);
        const result = await apiFunc();
        if (result && result.trim().length > 0) {
          console.log(`[${name}] ✅ SUCCESS`);
          return result;
        }
        console.log(`[${name}] ⚠️ Empty response on attempt ${i + 1}`);
      } catch (err) {
        const isQuota = err.status === 429 || err.message?.includes('429') || err.message?.includes('quota') || err.message?.includes('Quota');
        console.error(`[${name}] ❌ Attempt ${i + 1} error (${isQuota ? 'QUOTA' : 'ERROR'}):`, err.message?.substring(0, 120));
        if (isQuota) {
          console.warn(`[${name}] 🚫 Quota exceeded — skipping retries for this provider`);
          break; // Don't waste retries on quota errors — move to next API immediately
        }
        if (i < retries - 1) {
          const wait = 1200 * Math.pow(2, i);
          console.log(`[${name}] ⏳ Waiting ${wait}ms before retry...`);
          await new Promise(r => setTimeout(r, wait));
        }
      }
    }
    console.error(`[${name}] 💥 Provider failed — moving to next`);
    return null;
  };

  // API priority order: Groq first (reliable free tier), OpenAI second (best quality),
  // Gemini third (fallback). Groq is first because OpenAI/Gemini free quotas
  // are frequently exhausted, while Groq's llama-3.3-70b has generous free limits.
  const apiCalls = [
    { name: 'Groq',   key: 'GROQ_API_KEY',   call: () => callGroq(cleanedCode, language, targetLanguage)   },
    { name: 'OpenAI', key: 'OPENAI_API_KEY', call: () => callOpenAI(cleanedCode, language, targetLanguage) },
    { name: 'Gemini', key: 'GEMINI_API_KEY', call: () => callGemini(cleanedCode, language, targetLanguage) },
  ].filter(api => !!process.env[api.key]);

  console.log(`\n${'='.repeat(60)}`);
  console.log(`[AI] 🚀 Analyzing ${language.toUpperCase()} code (${cleanedCode.length} chars)`);
  console.log(`[AI] Available APIs: ${apiCalls.map(a => a.name).join(' → ')}`);
  console.log(`${'='.repeat(60)}\n`);

  let rawContent = '';
  const errors   = [];

  for (const api of apiCalls) {
    if (rawContent) break;
    try {
      console.log(`\n[API] 🔄 Attempting ${api.name}...`);
      const result = await callWithRetry(api.call, api.name, 2);
      if (result && result.trim()) {
        rawContent = result;
        console.log(`[API] ✅✅✅ ${api.name} succeeded (${rawContent.length} chars)\n`);
      } else {
        errors.push(`${api.name}: empty/null response`);
      }
    } catch (err) {
      errors.push(`${api.name}: ${err.message}`);
      console.error(`[API] ❌ ${api.name} threw:`, err.message);
    }
  }

  // All APIs failed — throw a clean error. NO hardcoded fallback.
  if (!rawContent) {
    const errDetail = errors.join(' | ');
    console.error(`[AI] 💥 ALL APIS FAILED — ${errDetail}`);
    const err = new Error(
      'All AI services are temporarily unavailable (likely quota limits). ' +
      'Please wait a few minutes and try again, or check your API keys. ' +
      `Details: ${errDetail}`
    );
    err.statusCode = 503;
    throw err;
  }

  checkUniqueness(rawContent, cleanedCode);
  console.log(`[AI] ✅ Raw response received (${rawContent.length} chars) — parsing...`);

  // ─── Parse & validate JSON ─────────────────────────────────────────────────
  try {
    let cleaned = rawContent.trim();

    // Strip any stray markdown fences
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

    // Extract the outermost JSON object
    const firstBrace = cleaned.indexOf('{');
    const lastBrace  = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }

    let parsed;
    try {
      const JSON5 = require('json5');
      parsed = JSON5.parse(cleaned);
    } catch {
      parsed = JSON.parse(cleaned);
    }

    console.log(`[AI] ✅ JSON parsed — issues=${Array.isArray(parsed.issues) ? parsed.issues.length : 0}, test_cases=${Array.isArray(parsed.test_cases) ? parsed.test_cases.length : 0}`);

    return sanitizeResponse(parsed, cleanedCode, language);
  } catch (parseErr) {
    console.error('[AI] ❌ JSON parse failed. Raw preview:', rawContent.substring(0, 400));
    throw new Error('AI returned a malformed response. Please try submitting again.');
  }
};

// ─── Response Sanitizer ───────────────────────────────────────────────────────
// Validates, normalizes, and maps all fields from the raw AI response.
// Preserves severity, type, suggestion (no field flattening).

const sanitizeResponse = (raw, originalCode, language) => {
  const clamp    = (n) => Math.min(100, Math.max(0, Math.round(Number(n) || 0)));
  const str      = (v, max = 5000) => String(v || '').substring(0, max);
  const largeStr = (v) => String(v || '');

  let optimizedCode = largeStr(raw.optimized_code);

  // ── Reject identical optimized code ────────────────────────────────────────
  if (optimizedCode && originalCode) {
    const normalize = (c) => c.replace(/\s+/g, '').toLowerCase();
    if (normalize(originalCode) === normalize(optimizedCode)) {
      console.error('[Sanitizer] ❌ optimized_code is IDENTICAL to input — clearing');
      optimizedCode = '';
    }
  }

  // ── Warn on missing/thin sections ──────────────────────────────────────────
  if (!raw.quality_analysis || raw.quality_analysis.length < 30)
    console.warn('[Sanitizer] ⚠️ quality_analysis missing or too short');
  if (!Array.isArray(raw.issues) || raw.issues.length === 0)
    console.warn('[Sanitizer] ⚠️ No issues returned');
  if (!raw.explanation || raw.explanation.length < 20)
    console.warn('[Sanitizer] ⚠️ Explanation missing or too short');
  if (!Array.isArray(raw.edge_cases) || raw.edge_cases.length === 0)
    console.warn('[Sanitizer] ⚠️ No edge_cases returned');
  if (!Array.isArray(raw.test_cases) || raw.test_cases.length === 0)
    console.warn('[Sanitizer] ⚠️ No test_cases returned');

  // ── Map issues: preserve severity / type / suggestion ──────────────────────
  const VALID_SEVERITIES = ['high', 'medium', 'low'];
  const VALID_TYPES      = ['bug', 'performance', 'security', 'style'];

  const issues = Array.isArray(raw.issues)
    ? raw.issues.filter(Boolean).slice(0, 15).map((issue) => {
        if (typeof issue === 'string') {
          return { issue: str(issue), explanation: '', severity: 'medium', type: 'bug', suggestion: '' };
        }
        const severity = VALID_SEVERITIES.includes(String(issue.severity || '').toLowerCase())
          ? String(issue.severity).toLowerCase()
          : 'medium';
        const type = VALID_TYPES.includes(String(issue.type || '').toLowerCase())
          ? String(issue.type).toLowerCase()
          : 'bug';
        return {
          issue:       str(issue.description || issue.issue || String(issue)),
          explanation: str(issue.explanation || ''),
          severity,
          type,
          suggestion:  str(issue.suggestion || issue.fix || issue.explanation || ''),
        };
      })
    : [];

  // ── Map improvements ────────────────────────────────────────────────────────
  const improvements = Array.isArray(raw.improvements)
    ? raw.improvements.slice(0, 10).map((imp) => {
        if (typeof imp === 'string') return { suggestion: str(imp), impact: '' };
        return {
          suggestion: str(imp.suggestion || imp.suggested || String(imp)),
          impact:     str(imp.impact || ''),
        };
      })
    : [];

  // ── Map test cases: preserve category ──────────────────────────────────────
  const VALID_CATS = ['normal', 'edge', 'corner'];
  const test_cases = Array.isArray(raw.test_cases)
    ? raw.test_cases.slice(0, 10).map((tc, idx) => {
        const rawCat   = String(tc.category || '').toLowerCase().trim();
        const category = VALID_CATS.includes(rawCat)
          ? rawCat
          : idx === 0 ? 'normal' : idx <= 2 ? 'edge' : 'corner';
        return {
          input:           str(tc.input  || ''),
          expected_output: str(tc.expected_output || tc.output || ''),
          description:     str(tc.description || ''),
          category,
        };
      })
    : [];

  // ── Map edge cases ──────────────────────────────────────────────────────────
  const edge_cases = Array.isArray(raw.edge_cases)
    ? raw.edge_cases
        .filter(e => e && String(e).trim().length > 5)
        .map(e => str(String(e)))
        .slice(0, 10)
    : [];

  return {
    quality_analysis: str(raw.quality_analysis || ''),
    issues,
    improvements,
    optimized_code:  optimizedCode || '',
    explanation:     str(raw.explanation || ''),
    edge_cases,
    test_cases,
    complexity: {
      time:  str(raw.complexity?.time  || raw.time_complexity  || ''),
      space: str(raw.complexity?.space || raw.space_complexity || ''),
    },
    score: {
      overall:        clamp(raw.score?.overall        ?? 0),
      readability:    clamp(raw.score?.readability     ?? 0),
      efficiency:     clamp(raw.score?.efficiency      ?? 0),
      best_practices: clamp(raw.score?.best_practices  ?? 0),
    },
    converted_code: largeStr(raw.converted_code || ''),
  };
};

module.exports = { analyzeCode };
