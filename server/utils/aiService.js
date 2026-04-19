/**
 * AI Service Utility
 * Wraps OpenAI API calls with structured prompts for code analysis
 */

const OpenAI = require('openai');
const { removeComments } = require('./codeExecutor');

let openaiClient = null;

const getClient = () => {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not set. Please add it to your .env file.');
    }
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
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
  "optimized_code": "COMPLETE refactored code with ALL improvements applied. Must be fully functional and ready to use.",
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

CRITICAL RULES:
1. OPTIMIZED_CODE is MANDATORY - must always include a complete refactored version
2. Include ALL improvements in optimized_code (not just suggestions)
3. Keep original functionality while improving quality
4. Use modern language features and best practices
5. Include proper error handling and edge case handling in optimized code
6. If code is already excellent, still provide an optimized version with minor enhancements
7. Scoring guidelines:
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

// ─── Main function ────────────────────────────────────────────────────────────

const analyzeCode = async (code, language, targetLanguage = null) => {
  const client = getClient();
  const model = process.env.OPENAI_MODEL || 'gpt-4o';

  // Clean comments before analysis to prevent parsing errors
  let cleanedCode = code;
  try {
    cleanedCode = removeComments(code, language);
    if (!cleanedCode) {
      // If code is only comments, use original code
      cleanedCode = code;
    }
  } catch (err) {
    console.warn('Comment removal failed, using original code:', err.message);
    cleanedCode = code;
  }

  let rawContent = '';

  try {
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

    rawContent = response.choices[0]?.message?.content?.trim() || '';
    if (!rawContent) throw new Error('Empty response received from AI service.');

  } catch (err) {
    console.warn('OpenAI request failed:', err.message);
    
    // --- 2. Fallback to Groq ---
    let groqSuccess = false;
    if (process.env.GROQ_API_KEY) {
      console.log('Falling back to Groq API...');
      try {
        const groqClient = new OpenAI({
          apiKey: process.env.GROQ_API_KEY,
          baseURL: "https://api.groq.com/openai/v1",
        });
        const groqResponse = await groqClient.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          max_tokens: 4000,
          temperature: 0.2,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: buildPrompt(cleanedCode, language, targetLanguage) },
          ],
        });
        rawContent = groqResponse.choices[0]?.message?.content?.trim() || '';
        if (rawContent) {
          groqSuccess = true;
        } else {
          console.warn('Empty response received from Groq service.');
        }
      } catch (groqErr) {
        console.error('Groq fallback failed:', groqErr.message);
      }
    }

    // --- 3. Fallback to Gemini ---
    if (!groqSuccess) {
      const geminiKey = process.env.GEMINI_API_KEY;
      if (!geminiKey) {
        throw err; // Throw the original OpenAI error if both fallbacks fail or are missing
      }

      console.log('Falling back to Google Gemini API...');
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(geminiKey);
      const geminiModel = genAI.getGenerativeModel({ 
        model: 'gemini-flash-latest', 
        systemInstruction: SYSTEM_PROMPT 
      });
      
      try {
        const result = await geminiModel.generateContent({
          contents: [{ role: 'user', parts: [{ text: buildPrompt(cleanedCode, language, targetLanguage) }] }],
          generationConfig: {
            maxOutputTokens: 8192,
            temperature: 0.2,
            responseMimeType: 'application/json',
          }
        });
        rawContent = result.response.text().trim();
        if (!rawContent) throw new Error('Empty response from Gemini.');
      } catch (geminiErr) {
        console.error('Gemini fallback failed:', geminiErr.message);
        throw err; // Throw the original OpenAI error if all fail
      }
    }
  }

  try {
    // Robust JSON extraction: find the first { and the last }
    let cleaned = rawContent.trim();
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    } else {
      // Fallback if no braces found (shouldn't happen with our prompt)
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
  const str = (v) => String(v || '').slice(0, 1000);

  return {
    bugs: Array.isArray(raw.bugs)
      ? raw.bugs.slice(0, 10).map((b) => ({ issue: str(b.issue), explanation: str(b.explanation) }))
      : [],
    optimizations: Array.isArray(raw.optimizations)
      ? raw.optimizations.slice(0, 10).map((o) => ({ suggestion: str(o.suggestion), impact: str(o.impact) }))
      : [],
    explanation: str(raw.explanation),
    edge_cases: Array.isArray(raw.edge_cases)
      ? raw.edge_cases.slice(0, 8).map(str)
      : [],
    test_cases: Array.isArray(raw.test_cases)
      ? raw.test_cases.slice(0, 8).map((t) => ({ input: str(t.input), expected_output: str(t.expected_output) }))
      : [],
    score: {
      overall:       clamp(raw.score?.overall),
      readability:   clamp(raw.score?.readability),
      efficiency:    clamp(raw.score?.efficiency),
      best_practices: clamp(raw.score?.best_practices),
    },
    converted_code: String(raw.converted_code || ''),
  };
};

module.exports = { analyzeCode };
