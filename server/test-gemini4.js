require('dotenv').config();
const { analyzeCode } = require('./utils/aiService');

(async () => {
  try {
    const code = "console.log('hello');";
    const lang = "javascript";
    console.log("Testing analyzeCode...");
    const result = await analyzeCode(code, lang);
    console.log("Success!");
  } catch (err) {
    console.error("Test failed:", err.message);
    if (err.stack) console.error(err.stack);
  }
})();
