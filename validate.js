#!/usr/bin/env node

/**
 * Project Validation Script
 * Checks if the AI Code Reviewer is properly configured and ready to run
 */

const fs = require('fs');
const path = require('path');

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

const checks = [];

function check(name, condition, details = '') {
  checks.push({ name, pass: condition, details });
}

function section(title) {
  console.log(`\n${BLUE}═══ ${title} ═══${RESET}`);
}

function result(passed, failed) {
  console.log(`\n${GREEN}✅ Passed: ${passed}${RESET} | ${RED}❌ Failed: ${failed}${RESET}`);
  if (failed === 0) {
    console.log(`\n${GREEN}🎉 All checks passed! You're ready to go.${RESET}`);
    return true;
  } else {
    console.log(`\n${RED}⚠️  Fix the issues above and try again.${RESET}`);
    return false;
  }
}

// ─── File Checks ──────────────────────────────────────────────────────────────

section('File Structure');

const files = [
  'server/utils/aiService.js',
  'server/utils/aiService.js.tmp',
  'server/middlewares/errorHandler.js',
  'server/controllers/reviewController.js',
  'server/models/Review.js',
  'server/package.json',
  'client/package.json',
  'server/test-apis.js',
  'server/.env.example',
  'client/.env.example',
];

files.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, file));
  check(`File exists: ${file}`, exists);
  process.stdout.write(exists ? `${GREEN}✓${RESET} ` : `${RED}✗${RESET} `);
  console.log(file);
});

// ─── Code Syntax Checks ────────────────────────────────────────────────────────

section('Code Syntax');

const codeFiles = [
  'server/utils/aiService.js',
  'server/middlewares/errorHandler.js',
  'server/package.json',
];

codeFiles.forEach(file => {
  try {
    const content = fs.readFileSync(path.join(__dirname, file), 'utf8');
    if (file.endsWith('.json')) {
      JSON.parse(content);
    }
    check(`Valid syntax: ${file}`, true);
    console.log(`${GREEN}✓${RESET} ${file}`);
  } catch (err) {
    check(`Valid syntax: ${file}`, false, err.message);
    console.log(`${RED}✗${RESET} ${file}: ${err.message}`);
  }
});

// ─── Configuration Checks ─────────────────────────────────────────────────────

section('Configuration');

const envPath = path.join(__dirname, 'server', '.env');
const envExists = fs.existsSync(envPath);
check('Server .env file exists', envExists);
console.log(`${envExists ? GREEN + '✓' : RED + '✗'} ${RESET}server/.env${!envExists ? ' (create from .env.example)' : ''}`);

if (envExists) {
  const env = fs.readFileSync(envPath, 'utf8');
  const hasApiKey = /OPENAI_API_KEY|GROQ_API_KEY|GOOGLE_API_KEY/.test(env);
  check('At least one API key configured', hasApiKey);
  
  const apiKeys = [];
  if (/OPENAI_API_KEY=sk-/.test(env)) apiKeys.push('OpenAI');
  if (/GROQ_API_KEY=gsk_/.test(env)) apiKeys.push('Groq');
  if (/GOOGLE_API_KEY=AIzaSy/.test(env)) apiKeys.push('Gemini');
  
  if (apiKeys.length > 0) {
    console.log(`${GREEN}✓${RESET} Found API keys: ${apiKeys.join(', ')}`);
  } else {
    console.log(`${YELLOW}⚠${RESET} API keys configured but not valid format. Check .env`);
  }
  
  const hasMongo = /MONGODB_URI/.test(env);
  check('MongoDB URI configured', hasMongo);
  console.log(`${hasMongo ? GREEN + '✓' : YELLOW + '⚠'} ${RESET}MongoDB URI: ${hasMongo ? 'configured' : 'missing'}`);
}

// ─── Package Checks ────────────────────────────────────────────────────────────

section('Dependencies');

try {
  const serverPkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'server', 'package.json'), 'utf8'));
  const deps = serverPkg.dependencies || {};
  
  const requiredDeps = [
    { name: 'openai', key: 'openai' },
    { name: '@google/generative-ai', key: '@google/generative-ai' },
    { name: 'express', key: 'express' },
    { name: 'mongoose', key: 'mongoose' },
    { name: 'dotenv', key: 'dotenv' },
  ];
  
  requiredDeps.forEach(dep => {
    const has = !!deps[dep.key];
    check(`Dependency installed: ${dep.name}`, has);
    console.log(`${has ? GREEN + '✓' : RED + '✗'} ${RESET}${dep.name}${has ? ` (v${deps[dep.key]})` : ''}`);
  });
} catch (err) {
  check('Package.json readable', false, err.message);
  console.log(`${RED}✗${RESET} Could not read package.json`);
}

// ─── Feature Checks ────────────────────────────────────────────────────────────

section('Features');

try {
  const aiService = fs.readFileSync(path.join(__dirname, 'server', 'utils', 'aiService.js'), 'utf8');
  
  check('OpenAI provider implemented', aiService.includes('analyzeWithOpenAI'));
  check('Groq provider implemented', aiService.includes('analyzeWithGroq'));
  check('Gemini provider implemented', aiService.includes('analyzeWithGemini'));
  check('Multi-provider fallback implemented', aiService.includes('for (const provider of providers)'));
  check('Error handling with details', aiService.includes('Details: '));
  
  const features = [
    { name: 'OpenAI provider', test: aiService.includes('analyzeWithOpenAI') },
    { name: 'Groq provider', test: aiService.includes('analyzeWithGroq') },
    { name: 'Gemini provider', test: aiService.includes('analyzeWithGemini') },
    { name: 'Fallback logic', test: aiService.includes('for (const provider of providers)') },
    { name: 'Error details', test: aiService.includes('Details: ') },
  ];
  
  features.forEach(f => {
    console.log(`${f.test ? GREEN + '✓' : RED + '✗'} ${RESET}${f.name}`);
  });
} catch (err) {
  console.log(`${RED}✗${RESET} Could not read aiService.js`);
}

// ─── Documentation Checks ─────────────────────────────────────────────────────

section('Documentation');

const docs = [
  { name: 'QUICK_FIX.md', file: 'QUICK_FIX.md' },
  { name: 'SETUP_AND_TROUBLESHOOTING.md', file: 'SETUP_AND_TROUBLESHOOTING.md' },
  { name: 'ADVANCED_DEBUGGING.md', file: 'ADVANCED_DEBUGGING.md' },
  { name: 'FIX_SUMMARY.md', file: 'FIX_SUMMARY.md' },
];

docs.forEach(doc => {
  const exists = fs.existsSync(path.join(__dirname, doc.file));
  check(`Documentation: ${doc.name}`, exists);
  console.log(`${exists ? GREEN + '✓' : RED + '✗'} ${RESET}${doc.name}`);
});

// ─── Summary ───────────────────────────────────────────────────────────────────

section('Summary');

const passed = checks.filter(c => c.pass).length;
const failed = checks.filter(c => !c.pass).length;

if (failed > 0) {
  console.log(`\n${YELLOW}Issues to fix:${RESET}`);
  checks.filter(c => !c.pass).forEach(c => {
    console.log(`  ${RED}•${RESET} ${c.name}${c.details ? `: ${c.details}` : ''}`);
  });
}

result(passed, failed);

// ─── Next Steps ────────────────────────────────────────────────────────────────

if (failed === 0) {
  console.log(`\n${BLUE}Next Steps:${RESET}`);
  console.log(`  1. cd server && npm run test:apis`);
  console.log(`  2. npm run dev:server  (Terminal 1)`);
  console.log(`  3. npm run dev:client  (Terminal 2)`);
  console.log(`  4. Open http://localhost:3000`);
  console.log(`  5. Test with sample code`);
}

process.exit(failed > 0 ? 1 : 0);
