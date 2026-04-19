/**
 * Code Execution Utility
 * Safely executes user code in a sandboxed environment and captures output
 * Supports multiple languages (simulated execution for demo purposes)
 */

const vm = require('vm');

// ─── Helper: Clean code by removing comments ──────────────────────────────────

const removeComments = (code, language) => {
  let cleaned = code;

  if (['javascript', 'typescript', 'java', 'cpp', 'go', 'rust'].includes(language)) {
    // Remove single-line comments (//)
    cleaned = cleaned.replace(/\/\/.*$/gm, '');
    // Remove multi-line comments (/* ... */)
    cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '');
  } else if (language === 'python') {
    // Remove single-line comments (#)
    cleaned = cleaned.replace(/#.*$/gm, '');
    // Remove multi-line strings (""" or ''')
    cleaned = cleaned.replace(/'''[\s\S]*?'''/g, '');
    cleaned = cleaned.replace(/"""[\s\S]*?"""/g, '');
  }

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

// ─── Execute Python (simulated) ────────────────────────────────────────────────

const executePython = (code, userInput = '') => {
  // For Python, we simulate execution (real execution would require python-shell or child_process)
  // In production, use python-shell package or docker
  return {
    success: true,
    output: '[Python execution simulated]\nUnable to execute Python in Node.js environment.\nPlease use Python environment.',
    error: null,
  };
};

// ─── Execute Java (simulated) ──────────────────────────────────────────────────

const executeJava = (code, userInput = '') => {
  return {
    success: true,
    output: '[Java execution simulated]\nUnable to execute Java code directly.\nPlease compile and run in JVM environment.',
    error: null,
  };
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

    switch (language) {
      case 'javascript':
      case 'typescript':
        return executeJavaScript(cleanedCode, userInput);
      case 'python':
        return executePython(cleanedCode, userInput);
      case 'java':
        return executeJava(cleanedCode, userInput);
      case 'cpp':
      case 'go':
      case 'rust':
        return {
          success: true,
          output: `[${language.toUpperCase()} execution simulated]\nDirect execution not supported in this environment.`,
          error: null,
        };
      default:
        return {
          success: true,
          output: '[Execution simulated]\nLanguage not supported for direct execution.',
          error: null,
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

module.exports = { executeCode, removeComments };
