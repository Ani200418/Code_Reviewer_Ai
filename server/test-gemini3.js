require('dotenv').config();
const { analyzeCode } = require('./utils/aiService');

(async () => {
  try {
    const code = "console.log('hello');";
    const lang = "javascript";
    console.log("Testing analyzeCode with fallback...");
    const result = await analyzeCode(code, lang);
    console.log("Result success!");
  } catch (err) {
    console.error("Test failed:", err.message, err.stack);
  }
})();
