#!/usr/bin/env node

/**
 * API Key Tester
 * Tests all configured AI services to ensure they're working
 * Usage: npm run test:apis
 */

require('dotenv').config();

const { GoogleGenerativeAI } = require('@google/generative-ai');

const testCode = `
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}
`.trim();

console.log('🔍 AI Service Configuration Check');
console.log('================================\n');

// Check what services are configured
const hasGemini = !!process.env.GOOGLE_API_KEY;
const hasGroq = !!process.env.GROQ_API_KEY;
const hasMistral = !!process.env.MISTRAL_API_KEY;

console.log('📊 Configured Services:');
console.log(`  Gemini:  ${hasGemini ? '✅ KEY FOUND' : '❌ NOT SET'}`);
console.log(`  Groq:    ${hasGroq ? '✅ KEY FOUND' : '❌ NOT SET'}`);
console.log(`  Mistral: ${hasMistral ? '✅ KEY FOUND' : '❌ NOT SET'}`);
console.log('');

if (!hasGemini && !hasGroq && !hasMistral) {
  console.error('❌ ERROR: No API keys configured!');
  console.error('Please set at least one of:');
  console.error('  - GOOGLE_API_KEY');
  console.error('  - GROQ_API_KEY');
  console.error('  - MISTRAL_API_KEY');
  process.exit(1);
}

// Test Gemini
if (hasGemini) {
  testGemini();
}

// Test Groq
if (hasGroq) {
  testGroq();
}

// Test Mistral
if (hasMistral) {
  testMistral();
}

// ─── Gemini Test ───────────────────────────────────────────────────────────────

async function testGemini() {
  console.log('🧪 Testing Google Gemini...');
  try {
    const client = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    const model = client.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: 'Say OK' }] }],
    });

    const content = result.response.text()?.trim();
    if (content) {
      console.log('  ✅ Gemini: Working');
    } else {
      console.log('  ❌ Gemini: Empty response');
    }
  } catch (err) {
    if (err.message.includes('quota')) {
      console.log('  ⚠️  Gemini: Quota exceeded');
    } else if (err.message.includes('API key')) {
      console.log('  ❌ Gemini: Invalid API key');
    } else {
      console.log(`  ❌ Gemini: ${err.message}`);
    }
  }
}

// ─── Groq Test ────────────────────────────────────────────────────────────────

async function testGroq() {
  console.log('🧪 Testing Groq...');
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
        max_tokens: 100,
        messages: [
          { role: 'system', content: 'You are a helpful assistant. Respond with just "OK".' },
          { role: 'user', content: 'Say OK' },
        ],
      }),
    });

    if (!response.ok) {
      const errData = await response.json();
      if (response.status === 429) {
        console.log('  ⚠️  Groq: Rate limited (check daily token limit)');
      } else {
        console.log(`  ❌ Groq: ${errData.error?.message || response.statusText}`);
      }
    } else {
      const data = await response.json();
      const content = data.choices[0]?.message?.content?.trim();
      if (content) {
        console.log('  ✅ Groq: Working');
      } else {
        console.log('  ❌ Groq: Empty response');
      }
    }
  } catch (err) {
    console.log(`  ❌ Groq: ${err.message}`);
  }
}

// ─── Mistral Test ─────────────────────────────────────────────────────────────

async function testMistral() {
  console.log('🧪 Testing Mistral...');
  try {
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.MISTRAL_MODEL || 'mistral-small',
        max_tokens: 100,
        messages: [
          { role: 'system', content: 'You are a helpful assistant. Respond with just "OK".' },
          { role: 'user', content: 'Say OK' },
        ],
      }),
    });

    if (!response.ok) {
      const errData = await response.json();
      if (response.status === 429) {
        console.log('  ⚠️  Mistral: Rate limited (check daily token limit)');
      } else {
        console.log(`  ❌ Mistral: ${errData.message || response.statusText}`);
      }
    } else {
      const data = await response.json();
      const content = data.choices[0]?.message?.content?.trim();
      if (content) {
        console.log('  ✅ Mistral: Working');
      } else {
        console.log('  ❌ Mistral: Empty response');
      }
    }
  } catch (err) {
    console.log(`  ❌ Mistral: ${err.message}`);
  }
}

console.log('\n📝 Test Complete!');
console.log('If all services show ✅, your configuration is correct.');
console.log('If some show ⚠️, those services have rate limits triggered.');
console.log('If some show ❌, check your API keys.\n');
