const { exec } = require("child_process");
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
    image: "gcc:latest",
    command: "bash -c 'cd /app && g++ code.cpp -o code && ./code'"
  },
  go: {
    file: "code.go",
    image: "golang:1.22-alpine",
    command: "bash -c 'cd /app && go run code.go'"
  },
  rust: {
    file: "main.rs",
    image: "rust:latest",
    command: "bash -c 'cd /app && rustc main.rs && ./main'"
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
    // Validate language
    const lang = languages[language];
    if (!lang) {
      return resolve({ 
        success: false, 
        error: `Unsupported language: ${language}. Supported: javascript, python, java, cpp, go, rust` 
      });
    }

    // Validate code
    if (!code || typeof code !== 'string' || code.trim().length === 0) {
      return resolve({ 
        success: false, 
        error: "Code cannot be empty" 
      });
    }

    // Generate unique filename to avoid conflicts
    const timestamp = Date.now();
    const uniqueFile = lang.file.replace(/(\.\w+)$/, `_${timestamp}$1`);
    const filePath = path.join(tempDir, uniqueFile);

    try {
      // Write code to file
      fs.writeFileSync(filePath, code, 'utf8');

      // Docker command with safety limits:
      // --rm: Remove container after execution
      // --memory=200m: Max 200MB memory
      // --cpus=0.5: Max 0.5 CPU cores
      // --read-only: Read-only filesystem
      // --network=none: No network access
      // timeout: 8 seconds max execution time
      const dockerCommand = `docker run --rm \
        --memory=200m \
        --cpus=0.5 \
        --read-only \
        --network=none \
        -v "${path.resolve(tempDir)}:/app:ro" \
        ${lang.image} \
        ${lang.command}`;

      // Execute with timeout
      exec(dockerCommand, { timeout: 8000, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
        // Cleanup temp file
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (cleanupErr) {
          console.warn(`Cleanup failed for ${filePath}:`, cleanupErr.message);
        }

        // Handle execution errors
        if (error) {
          // Timeout error
          if (error.killed) {
            return resolve({ 
              success: false, 
              error: "Execution timeout: Code took longer than 8 seconds to run" 
            });
          }
          // Other errors (compilation, runtime)
          return resolve({ 
            success: false, 
            error: stderr || error.message || "Execution failed" 
          });
        }

        // Check for stderr (compile/runtime errors)
        if (stderr && stderr.trim().length > 0) {
          return resolve({ 
            success: false, 
            error: stderr 
          });
        }

        // Success: return output
        resolve({ 
          success: true, 
          output: stdout || "" 
        });
      });
    } catch (err) {
      // Cleanup on error
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (cleanupErr) {
        console.warn(`Cleanup failed for ${filePath}:`, cleanupErr.message);
      }

      resolve({ 
        success: false, 
        error: `File write failed: ${err.message}` 
      });
    }
  });
};

module.exports = runCode;