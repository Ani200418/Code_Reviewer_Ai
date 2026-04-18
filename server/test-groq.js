require('dotenv').config();
const { analyzeCode } = require('./utils/aiService');

(async () => {
  try {
    const code = "print('hello world')";
    const lang = "java"; // Ask it to translate Python to Java
    console.log("Testing analyzeCode with Groq translation...");
    const result = await analyzeCode(code, lang);
    console.log("Success! Converted Code:", result.converted_code);
  } catch (err) {
    console.error("Test failed:", err.message);
    if (err.stack) console.error(err.stack);
  }
})();
