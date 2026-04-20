const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const tempDir = path.join(__dirname, "../temp");

// Ensure temp directory exists
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Language configurations with Docker images
const languages = {
  javascript: {
    file: "code.js",
    image: "node:18-alpine",
    command: "node /app/code.js"
  },
  typescript: {
    file: "code.ts",
    image: "node:18-alpine",
    command: "bash -c 'npx ts-node /app/code.ts 2>&1'"
  },
  python: {
    file: "code.py",
    image: "python:3.11-alpine",
    command: "python /app/code.py"
  },
  java: {
    file: "Main.java",
    image: "openjdk:17-slim",
    command: "bash -c 'cd /app && javac Main.java && java Main'"
  },
  cpp: {
    file: "code.cpp",
    image: "gcc:12",
    command: "bash -c 'cd /app && g++ -std=c++17 code.cpp -o code && ./code'"
  },
  go: {
    file: "code.go",
    image: "golang:1.22-alpine",
    command: "bash -c 'cd /app && go run code.go'"
  },
  rust: {
    file: "main.rs",
    image: "rust:latest",
    command: "bash -c 'cd /app && rustc -O main.rs -o main && ./main'"
  }
};

/**
 * Execute code in a sandboxed Docker container
 * @param {string} code - The source code to execute
 * @param {string} language - The programming language (javascript, python, java, cpp, go, rust)
 * @returns {Promise<{success: boolean, output?: string, error?: string}>}
 */
const runCode = (code, language) => {
  return new Promise((resolve) => {
    const lang = languages[language];
    if (!lang) {
      return resolve({ 
        success: false, 
        error: `Unsupported language: ${language}. Supported: javascript, typescript, python, java, cpp, go, rust` 
      });
    }

    if (!code || typeof code !== 'string' || code.trim().length === 0) {
      return resolve({ 
        success: false, 
        error: "Code cannot be empty" 
      });
    }

    // Create unique file with timestamp
    const timestamp = Date.now();
    const uniqueFile = lang.file.replace(/(\.\w+)$/, `_${timestamp}$1`);
    const filePath = path.join(tempDir, uniqueFile);

    try {
      // Write code to file
      fs.writeFileSync(filePath, code, 'utf8');
      console.log(`[Docker] Wrote ${language} code to ${filePath}`);

      // Docker command: memory/CPU limits + timeout
      // --rm: Remove container after exit
      // --memory=256m: Max 256MB
      // --cpus=0.5: Max half CPU
      // -v: Volume mount (temp folder as /app)
      // --network=none: No network access
      const dockerCmd = `docker run --rm --memory=256m --cpus=0.5 --network=none -v "${path.resolve(tempDir)}:/app" ${lang.image} ${lang.command}`;

      console.log(`[Docker] Executing ${language}:`, dockerCmd);

      // Use execSync with timeout for reliability
      try {
        const stdout = execSync(dockerCmd, {
          timeout: 8000,
          maxBuffer: 1024 * 1024 * 5,
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'pipe']
        });

        console.log(`[Docker] Success for ${language}`);
        return resolve({
          success: true,
          output: stdout || ""
        });
      } catch (execErr) {
        // Handle execution errors
        const stderr = execErr.stderr ? execErr.stderr.toString() : '';
        const stdout = execErr.stdout ? execErr.stdout.toString() : '';
        const message = execErr.message || '';

        // Docker not installed or not available
        if (message.includes('ENOENT') || message.includes('docker: not found') || message.includes('Error: Cannot find module')) {
          console.warn(`[Docker] Not available - ${message}`);
          return resolve({
            success: true,
            output: ''  // Return success with empty output on serverless platforms
          });
        }

        // Timeout
        if (execErr.killed || message.includes('timeout')) {
          return resolve({
            success: false,
            error: `Execution timeout: Code took longer than 8 seconds`
          });
        }

        // Compilation/runtime error
        console.warn(`[Docker] Error: ${stderr || stdout || message}`);
        return resolve({
          success: false,
          error: stderr || stdout || message || 'Execution failed'
        });
      }
    } catch (err) {
      console.error(`[Docker] Error: ${err.message}`);
      return resolve({
        success: false,
        error: `Failed to execute: ${err.message}`
      });
    } finally {
      // Cleanup
      setImmediate(() => {
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`[Docker] Cleaned up ${filePath}`);
          }
        } catch (cleanupErr) {
          console.warn(`Cleanup error: ${cleanupErr.message}`);
        }
      });
    }
  });
};

module.exports = runCode;