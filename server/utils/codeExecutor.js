/**
 * Code Execution Utility
 * Safely executes user code in a sandboxed environment and captures output
 * Supports JavaScript natively; other languages return "not supported" message
 * Includes UTF-8 validation and encoding error handling
 */

const vm = require('vm');
const { execSync } = require('child_process');

// ─── Helper: Validate UTF-8 encoding ──────────────────────────────────────────

const validateUTF8 = (buffer) => {
  try {
    const str = buffer.toString('utf8');
    // Verify by converting back
    const reencoded = Buffer.from(str, 'utf8');
    if (reencoded.toString('utf8') !== str) {
      throw new Error('Invalid UTF-8 sequence detected');
    }
    return { valid: true, content: str, error: null };
  } catch (err) {
    return {
      valid: false,
      content: null,
      error: `UTF-8 Encoding Error: ${err.message}`,
    };
  }
};

// ─── Helper: Clean code by removing comments safely ────────────────────────────

const removeComments = (code, language) => {
  let cleaned = code;

  if (['javascript', 'typescript', 'java', 'cpp', 'go', 'rust'].includes(language)) {
    // Remove single-line comments (//)
    cleaned = cleaned.replace(/\/\/.*$/gm, '');
    // Remove multi-line comments (/* ... */)
    cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '');
    // Remove trailing whitespace on each line
    cleaned = cleaned.split('\n').map(line => line.replace(/\s+$/, '')).join('\n');
  } else if (language === 'python') {
    // Remove single-line comments (#)
    cleaned = cleaned.replace(/#.*$/gm, '');
    // Remove docstrings (""" or ''')
    cleaned = cleaned.replace(/'''[\s\S]*?'''/g, '');
    cleaned = cleaned.replace(/"""[\s\S]*?"""/g, '');
    // Remove trailing whitespace
    cleaned = cleaned.split('\n').map(line => line.replace(/\s+$/, '')).join('\n');
  }

  // Remove multiple blank lines, keep single
  cleaned = cleaned.replace(/\n\n\n+/g, '\n\n');
  
  return cleaned.trim();
};

// ─── Execute JavaScript/TypeScript ────────────────────────────────────────────

const executeJavaScript = (code, userInput = '') => {
  try {
    const logs = [];
    const originalLog = console.log;
    const originalError = console.error;
    
    // Capture console output
    console.log = (...args) => {
      logs.push(args.map(arg => String(arg)).join(' '));
    };
    console.error = (...args) => {
      logs.push(args.map(arg => String(arg)).join(' '));
    };

    // Parse user input - handle plain text, JSON, or multiline
    let userInputArg = '';
    try {
      // Try to parse as JSON first
      if (userInput.trim().startsWith('{') || userInput.trim().startsWith('[')) {
        userInputArg = JSON.parse(userInput);
      } else {
        // Treat as plain text or multiline string
        userInputArg = userInput.trim();
      }
    } catch {
      // If not JSON, just use as string
      userInputArg = userInput.trim();
    }

    const sandbox = {
      console: { log: console.log, error: console.error },
      process: { argv: [userInputArg] },
      // Expose input directly for easy access
      INPUT: userInputArg,
    };

    const script = new vm.Script(code);
    const context = vm.createContext(sandbox);
    script.runInContext(context, { timeout: 5000 });

    console.log = originalLog;
    console.error = originalError;
    return {
      success: true,
      output: logs.join('\n') || '(no output)',
      error: null,
    };
  } catch (err) {
    console.log = originalLog;
    console.error = originalError;
    return {
      success: false,
      output: '',
      error: `Execution error: ${err.message}`,
    };
  }
};

// ─── Validate Syntax for Various Languages ────────────────────────────────────

const validateSyntax = (code, language) => {
  try {
    switch (language) {
      case 'javascript':
      case 'typescript':
        // Parse with Node's built-in parser
        new vm.Script(code);
        return { valid: true, error: null };
      
      case 'python':
        // Basic Python syntax validation using regex patterns
        // Check for common syntax issues
        if (code.match(/^\s*if\s+.*:\s*$/m) && !code.match(/^\s+\S/m)) {
          return { valid: false, error: 'SyntaxError: Expected indented block after if statement' };
        }
        return { valid: true, error: null };
      
      case 'java':
        // Basic Java syntax validation
        if (!code.includes('class ') && !code.includes('public ')) {
          return { valid: false, error: 'SyntaxError: Java code should contain class or public declaration' };
        }
        return { valid: true, error: null };
      
      case 'cpp':
        // Basic C++ syntax validation
        if (!code.includes('#include') && !code.includes('int main')) {
          return { valid: false, error: 'SyntaxError: C++ code structure incomplete' };
        }
        return { valid: true, error: null };
      
      case 'go':
        // Basic Go syntax validation
        if (!code.includes('package ')) {
          return { valid: false, error: 'SyntaxError: Go code must declare a package' };
        }
        return { valid: true, error: null };
      
      case 'rust':
        // Basic Rust syntax validation
        if (!code.includes('fn ')) {
          return { valid: false, error: 'SyntaxError: Rust code must contain at least one function' };
        }
        return { valid: true, error: null };
      
      default:
        return { valid: true, error: null };
    }
  } catch (err) {
    return { valid: false, error: `SyntaxError: ${err.message}` };
  }
};

// ─── Main execution function ───────────────────────────────────────────────────

const executeCode = (code, language = 'javascript', userInput = '') => {
  if (!code || !code.trim()) {
    return {
      success: false,
      output: '',
      error: 'Code is empty',
    };
  }

  try {
    const cleanedCode = removeComments(code, language);

    if (!cleanedCode) {
      return {
        success: false,
        output: '',
        error: 'Code contains only comments',
      };
    }

    // STEP 1: Validate syntax first
    const syntaxCheck = validateSyntax(cleanedCode, language);
    if (!syntaxCheck.valid) {
      return {
        success: false,
        output: '',
        error: syntaxCheck.error,
      };
    }

    // STEP 2: Execute based on language
    switch (language) {
      case 'javascript':
      case 'typescript':
        return executeJavaScript(cleanedCode, userInput);
      
      case 'python':
        // Python not supported in Node.js environment
        return {
          success: false,
          output: '',
          error: 'Python execution is not supported in this environment. Use a Python runtime or docker container.',
        };
      
      case 'java':
        // Java not supported without JVM
        return {
          success: false,
          output: '',
          error: 'Java execution is not supported in this environment. Use a Java runtime or docker container.',
        };
      
      case 'cpp':
      case 'go':
      case 'rust':
        // Compiled languages not supported
        return {
          success: false,
          output: '',
          error: `${language.toUpperCase()} execution is not supported in this environment. Use appropriate compiler/runtime.`,
        };
      
      default:
        return {
          success: false,
          output: '',
          error: `Execution not supported for language: ${language}`,
        };
    }
  } catch (err) {
    return {
      success: false,
      output: '',
      error: `Execution failed: ${err.message}`,
    };
  }
};

module.exports = { executeCode, removeComments, validateUTF8 };
