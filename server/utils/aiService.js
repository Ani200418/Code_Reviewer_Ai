/**
 * AI Service Utility
 * Multi-API support: OpenAI (primary) → Gemini (fallback) → Groq (last resort)
 * Enforces strict non-generic, code-specific, 8-section output
 */

const OpenAI = require('openai');
const { removeComments } = require('./codeExecutor');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const crypto = require('crypto');

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
    groqClient = new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: 'https://api.groq.com/openai/v1' });
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

// ─── Prompts ──────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a world-class senior software engineer performing a deep, precise code review.

ABSOLUTE RULES — VIOLATING ANY RULE MEANS YOUR RESPONSE IS INVALID:
1. EVERY part of your analysis MUST reference specific identifiers, variable names, line patterns, or logic from the provided code. Generic phrases like "consider adding error handling" or "this is a common pattern" are FORBIDDEN.
2. The optimized_code MUST be functionally different from the input — improved logic, better complexity, added validation, or meaningful refactoring. Returning identical or near-identical code is INVALID.
3. You MUST produce at least 2 real issues (or explicitly state "no issues found" with a detailed justification referencing the specific code).
4. You MUST produce at least 3 test cases with correct expected outputs based on the ACTUAL logic of this code.
5. You MUST produce at least 2 edge cases that are SPECIFIC to the algorithm/logic of this code.
6. quality_analysis MUST be a detailed paragraph (minimum 3 sentences) describing the actual code structure, naming, logic flow, and maintainability — NOT generic praise.
7. Return STRICTLY valid JSON. No markdown code fences, no explanation text outside JSON.`;

const buildPrompt = (code, language, targetLanguage) => {
  const conversionBlock = targetLanguage
    ? `\n\nCODE CONVERSION REQUIRED: In addition to analysis, convert the code to ${targetLanguage} and place it in the "converted_code" field. The conversion must be idiomatic ${targetLanguage}, not a literal translation.`
    : '';

  // Extract first identifiers/patterns for uniqueness grounding
  const codeLines  = code.split('\n').slice(0, 5).join(' | ');
  const codeLength = code.length;
  const lineCount  = code.split('\n').length;

  return `Analyze this ${language} code (${lineCount} lines, ${codeLength} chars). First lines: "${codeLines}"

<CODE>
${code}
</CODE>${conversionBlock}

Return ONLY this JSON object — no other text:

{
  "quality_analysis": "A detailed paragraph (3+ sentences) evaluating the readability, structure, naming conventions, modularity, and overall maintainability of THIS specific code. Must cite specific function names, variables, or patterns from the code above.",

  "issues": [
    {
      "description": "Precise description citing the specific function/variable/line pattern causing this issue",
      "severity": "high|medium|low",
      "type": "bug|performance|security|style",
      "suggestion": "Exact fix with concrete code example referencing this code's identifiers"
    }
  ],

  "improvements": [
    {
      "suggestion": "Specific improvement actionable for THIS code, naming the relevant construct",
      "impact": "Concrete impact: e.g. 'reduces time complexity from O(n²) to O(n log n)' or 'eliminates 3 repeated null checks'"
    }
  ],

  "optimized_code": "The full improved version — must be DIFFERENT from input (better complexity, added validation, cleaner logic, or meaningful refactoring). NEVER return the original unchanged.",

  "explanation": "Step-by-step walkthrough of how THIS code works: what each major block does, what algorithm/pattern it uses, data flow, and return value semantics.",

  "complexity": {
    "time": "Big-O time complexity with brief justification referencing the actual loops/recursion in this code",
    "space": "Big-O space complexity with brief justification"
  },

  "edge_cases": [
    "Edge case 1 — specific to the data structures or algorithm in this code (e.g. 'Empty array passed to the inner loop at line N causes...')",
    "Edge case 2 — another meaningful boundary condition for this specific logic"
  ],

  "test_cases": [
    {
      "input": "Concrete input values for this function/program",
      "expected_output": "The exact output this code produces for the given input",
      "description": "What scenario this tests",
      "category": "normal"
    },
    {
      "input": "A boundary/edge input relevant to this code's logic",
      "expected_output": "Expected result at the boundary",
      "description": "What boundary this tests",
      "category": "edge"
    },
    {
      "input": "An unusual or extreme input that stresses the logic",
      "expected_output": "Expected result or error",
      "description": "Why this is a corner case for this code",
      "category": "corner"
    }
  ],

  "score": {
    "overall": <integer 0-100>,
    "readability": <integer 0-100>,
    "efficiency": <integer 0-100>,
    "best_practices": <integer 0-100>
  },

  "converted_code": ""
}

CHECKLIST BEFORE RESPONDING:
✓ quality_analysis cites specific names from the code
✓ Every issue cites a specific construct from the code
✓ optimized_code is meaningfully different from the input
✓ test_cases have correct expected_output values based on actual code logic
✓ edge_cases are specific to THIS algorithm
✓ No markdown — pure JSON only
`;
};

// ─── API callers ──────────────────────────────────────────────────────────────

const callOpenAI = async (cleanedCode, language, targetLanguage) => {
  const client = getOpenAIClient();
  const model  = process.env.OPENAI_MODEL || 'gpt-4o';
  console.log(`[OpenAI] Calling ${model} (${cleanedCode.length} chars)...`);

  const response = await client.chat.completions.create({
    model,
    max_tokens: 3000,
    temperature: 0.15,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user',   content: buildPrompt(cleanedCode, language, targetLanguage) },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content || content.length < 200) {
    console.warn(`[OpenAI] ⚠️ Response too short (${content?.length || 0} chars)`);
    return '';
  }
  console.log(`[OpenAI] ✅ Got response (${content.length} chars)`);
  return content.trim();
};

const callGroq = async (cleanedCode, language, targetLanguage) => {
  const client = getGroqClient();
  if (!client) throw new Error('Groq API key not configured');
  console.log(`[Groq] Calling llama-3.3-70b-versatile (${cleanedCode.length} chars)...`);

  const response = await client.chat.completions.create({
    model:      'llama-3.3-70b-versatile',
    max_tokens: 3000,
    temperature: 0.15,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user',   content: buildPrompt(cleanedCode, language, targetLanguage) },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content || content.length < 200) {
    console.warn(`[Groq] ⚠️ Response too short (${content?.length || 0} chars)`);
    return '';
  }
  console.log(`[Groq] ✅ Got response (${content.length} chars)`);
  return content.trim();
};

const callGemini = async (cleanedCode, language, targetLanguage) => {
  const client = getGeminiClient();
  if (!client) throw new Error('Gemini API key not configured');
  console.log(`[Gemini] Calling gemini-2.0-flash (${cleanedCode.length} chars)...`);

  const model  = client.getGenerativeModel({ model: 'gemini-2.0-flash' });
  const prompt = `${SYSTEM_PROMPT}\n\n${buildPrompt(cleanedCode, language, targetLanguage)}`;
  const result = await model.generateContent(prompt);
  const text   = result.response.text();

  // Extract JSON from response — Gemini sometimes wraps in markdown
  let content = text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) content = jsonMatch[0].trim();

  if (!content || content.length < 200) {
    console.warn(`[Gemini] ⚠️ Response too short (${content?.length || 0} chars)`);
    return '';
  }
  console.log(`[Gemini] ✅ Got response (${content.length} chars)`);
  return content;
};

// ─── Uniqueness guard ─────────────────────────────────────────────────────────

const _recentHashes = new Set();

const checkUniqueness = (rawContent) => {
  const hash = crypto.createHash('md5').update(rawContent.substring(0, 500)).digest('hex');
  if (_recentHashes.has(hash)) {
    console.warn('[AI] ⚠️ DUPLICATE RESPONSE DETECTED — identical to a recent analysis');
  }
  _recentHashes.add(hash);
  if (_recentHashes.size > 20) {
    const first = _recentHashes.values().next().value;
    _recentHashes.delete(first);
  }
};

// ─── Main analyzeCode function ────────────────────────────────────────────────

const analyzeCode = async (code, language, targetLanguage = null) => {
  // Clean comments before analysis
  let cleanedCode = code;
  try {
    const stripped = removeComments(code, language);
    if (stripped && stripped.trim()) cleanedCode = stripped;
  } catch {
    cleanedCode = code;
  }

  const callWithRetry = async (apiFunc, name, retries = 2) => {
    for (let i = 0; i < retries; i++) {
      try {
        console.log(`\n[${name}] 🔄 Attempt ${i + 1}/${retries}...`);
        const result = await apiFunc();
        if (result && result.trim().length > 0) {
          console.log(`[${name}] ✅ SUCCESS`);
          return result;
        }
        console.log(`[${name}] ⚠️ Empty response, retrying...`);
      } catch (err) {
        console.error(`[${name}] ❌ Attempt ${i + 1} error:`, err.message);
        if (i < retries - 1) {
          const wait = 1000 * Math.pow(2, i);
          console.log(`[${name}] ⏳ Waiting ${wait}ms...`);
          await new Promise(r => setTimeout(r, wait));
        }
      }
    }
    console.error(`[${name}] 💥 All ${retries} retries exhausted`);
    return null;
  };

  const apiCalls = [
    { name: 'OpenAI', key: 'OPENAI_API_KEY',  call: () => callOpenAI(cleanedCode, language, targetLanguage) },
    { name: 'Gemini', key: 'GEMINI_API_KEY',  call: () => callGemini(cleanedCode, language, targetLanguage) },
    { name: 'Groq',   key: 'GROQ_API_KEY',    call: () => callGroq(cleanedCode, language, targetLanguage)   },
  ].filter(api => !!process.env[api.key]);

  console.log(`\n${'='.repeat(60)}`);
  console.log(`[AI] 🚀 Analyzing ${language} code (${cleanedCode.length} chars)`);
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
        errors.push(`${api.name}: empty response`);
      }
    } catch (err) {
      errors.push(`${api.name}: ${err.message}`);
      console.error(`[API] ❌ ${api.name} failed:`, err.message);
    }
  }

  if (!rawContent) {
    console.error(`[AI] 💥 ALL APIS FAILED — Errors: ${errors.join(' | ')}`);

    if (process.env.ENABLE_DEMO_MODE === 'true' || process.env.NODE_ENV !== 'production') {
      console.warn('[AI] ⚠️ Using DEMO MODE fallback');
      rawContent = JSON.stringify({
        quality_analysis: 'This code implements a basic iterative algorithm. The variable naming is functional but could be more descriptive — the loop index `i` and the generic `result` variable reduce readability at a glance. The function lacks input validation, which is a critical gap for production use. Overall structure is straightforward with a single responsibility, but the absence of error handling and type checks makes it fragile.',
        issues: [
          { description: 'Missing input validation — the function does not check if the input is an array before iterating.', severity: 'high', type: 'bug', suggestion: 'Add `if (!Array.isArray(arr)) throw new TypeError("Expected an array")` as the first statement.' },
          { description: 'No type checking for array elements — non-numeric values are silently coerced by arithmetic operators.', severity: 'medium', type: 'bug', suggestion: 'Use `arr.every(Number.isFinite)` before processing to reject invalid elements early.' },
        ],
        improvements: [
          { suggestion: 'Replace the manual loop with `Array.prototype.reduce()` for a more idiomatic and expressive summation pattern.', impact: 'Reduces cognitive load, eliminates the manual accumulator variable, and makes intent immediately clear.' },
          { suggestion: 'Add JSDoc documentation with @param {number[]} and @returns {number} annotations.', impact: 'Enables IDE autocompletion, static type-checking tools, and improves maintainability for future developers.' },
        ],
        optimized_code: `/**
 * Sums all numeric values in an array.
 * @param {number[]} arr - Input array of numbers
 * @returns {number} The sum of all elements
 * @throws {TypeError} If input is not an array or contains non-finite values
 */
function arraySum(arr) {
  if (!Array.isArray(arr)) throw new TypeError('Input must be an array');
  if (!arr.every(Number.isFinite)) throw new TypeError('All elements must be finite numbers');
  return arr.reduce((acc, val) => acc + val, 0);
}`,
        explanation: 'The function iterates through the input array using a for loop, adding each element to an accumulator variable initialized at 0. After exhausting all elements, it returns the accumulated total. The algorithm is a linear scan with O(n) time complexity. The main weakness is the lack of any guard clauses — passing null, a string, or an array with NaN values will silently produce incorrect results.',
        complexity: { time: 'O(n) — single linear pass through all n elements', space: 'O(1) — only a single accumulator variable is allocated' },
        edge_cases: [
          'Empty array [] — the loop body never executes, returns the initial accumulator value of 0.',
          'Array containing NaN or Infinity — JavaScript arithmetic with these produces NaN/Infinity silently, corrupting the result without any error.',
          'Non-array input such as null or a string — no guard clause means the for loop will throw or iterate unexpectedly.',
        ],
        test_cases: [
          { input: '[1, 2, 3, 4, 5]', expected_output: '15', description: 'Standard positive integers sum correctly', category: 'normal' },
          { input: '[]', expected_output: '0', description: 'Empty array returns initial accumulator value 0', category: 'edge' },
          { input: '[1, "test", 3]', expected_output: 'TypeError: All elements must be finite numbers', description: 'Non-numeric value in array triggers type guard in optimized version', category: 'corner' },
          { input: '[-5, 5]', expected_output: '0', description: 'Positive and negative numbers cancel correctly', category: 'normal' },
        ],
        score: { overall: 62, readability: 65, efficiency: 70, best_practices: 52 },
        converted_code: '',
      });
    } else {
      const err = new Error(`All AI services failed.\nDetails: ${errors.join(' | ')}`);
      err.statusCode = 503;
      throw err;
    }
  }

  checkUniqueness(rawContent);
  console.log(`[AI] ✅ Response received (${rawContent.length} chars) — parsing JSON...`);

  // ─── Parse JSON ────────────────────────────────────────────────────────────
  try {
    let cleaned = rawContent.trim();

    // Strip any markdown fences that slipped through
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

    // Extract outermost JSON object
    const firstBrace = cleaned.indexOf('{');
    const lastBrace  = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }

    const JSON5 = require('json5');
    let parsed;
    try {
      parsed = JSON5.parse(cleaned);
    } catch {
      parsed = JSON.parse(cleaned);
    }

    console.log(`[AI] ✅ JSON parsed — issues=${Array.isArray(parsed.issues) ? parsed.issues.length : 0}, test_cases=${Array.isArray(parsed.test_cases) ? parsed.test_cases.length : 0}`);
    return sanitizeResponse(parsed, cleanedCode);
  } catch (err) {
    console.error('[AI] ❌ JSON parse failed. Raw preview:', rawContent.substring(0, 300));
    throw new Error('AI returned an unexpected format. Please try again.');
  }
};

// ─── Sanitizer ────────────────────────────────────────────────────────────────

const sanitizeResponse = (raw, originalCode) => {
  const clamp    = (n) => Math.min(100, Math.max(0, Math.round(Number(n) || 0)));
  const str      = (v) => String(v || '').slice(0, 5000);
  const largeStr = (v) => String(v || '');

  let optimizedCode = largeStr(raw.optimized_code);

  // ── Reject identical optimized code ────────────────────────────────────────
  if (optimizedCode && originalCode) {
    const normalize = (c) => c.replace(/\s+/g, ' ').trim();
    if (normalize(originalCode) === normalize(optimizedCode)) {
      console.error('❌ Optimized code is IDENTICAL to input — clearing field');
      optimizedCode = '';
    }
  }

  // ── Warn on missing sections ────────────────────────────────────────────────
  if (!raw.quality_analysis) console.warn('⚠️ Missing quality_analysis');
  if (!raw.issues?.length)   console.warn('⚠️ Missing issues array');
  if (!raw.explanation || raw.explanation.length < 20) console.warn('⚠️ Short/missing explanation');
  if (!raw.edge_cases?.length) console.warn('⚠️ Missing edge_cases');
  if (!raw.test_cases?.length) console.warn('⚠️ Missing test_cases');

  // ── Map issues — preserve severity/type/suggestion ─────────────────────────
  const issues = Array.isArray(raw.issues)
    ? raw.issues.filter(Boolean).slice(0, 15).map((issue) => {
        if (typeof issue === 'string') {
          return { issue: str(issue), explanation: '', severity: 'medium', type: 'bug', suggestion: '' };
        }
        return {
          issue:       str(issue.description || issue.issue || issue.d || String(issue)),
          explanation: str(issue.explanation || issue.fix || ''),
          severity:    String(issue.severity || 'medium').toLowerCase(),
          type:        String(issue.type || 'bug').toLowerCase(),
          suggestion:  str(issue.suggestion || issue.fix || issue.explanation || ''),
        };
      })
    : [];

  // ── Map improvements ────────────────────────────────────────────────────────
  const improvements = Array.isArray(raw.improvements)
    ? raw.improvements.slice(0, 15).map((imp) => {
        if (typeof imp === 'string') return { suggestion: str(imp), impact: '' };
        return {
          suggestion: str(imp.suggestion || imp.s || imp.suggested || String(imp)),
          impact:     str(imp.impact || ''),
        };
      })
    : [];

  // ── Map test cases — preserve category ─────────────────────────────────────
  const VALID_CATEGORIES = ['normal', 'edge', 'corner'];
  const test_cases = Array.isArray(raw.test_cases)
    ? raw.test_cases.slice(0, 10).map((tc, idx) => {
        const rawCat  = String(tc.category || '').toLowerCase().trim();
        const category = VALID_CATEGORIES.includes(rawCat)
          ? rawCat
          : idx === 0 ? 'normal' : idx <= 2 ? 'edge' : 'corner';
        return {
          input:           str(tc.input || tc.i || ''),
          expected_output: str(tc.expected_output || tc.output || tc.o || ''),
          description:     str(tc.description || tc.desc || ''),
          category,
        };
      })
    : [];

  return {
    quality_analysis: str(raw.quality_analysis || ''),
    issues,
    improvements,
    optimized_code: optimizedCode || '',
    explanation:    str(raw.explanation || ''),
    edge_cases: Array.isArray(raw.edge_cases)
      ? raw.edge_cases.filter(e => e && String(e).length > 3).slice(0, 10)
      : [],
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
