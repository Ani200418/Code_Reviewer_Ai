require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

(async () => {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const geminiModel = genAI.getGenerativeModel({ 
      model: 'gemini-flash-latest', 
      systemInstruction: 'You are a bot. Return JSON only.'
    });
    
    const result = await geminiModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: 'say hi' }] }],
      generationConfig: {
        maxOutputTokens: 2000,
        temperature: 0.2,
        responseMimeType: 'application/json',
      }
    });
    console.log("Raw Response:", result.response.text());
  } catch (err) {
    console.error("Direct Gemini Error:", err);
  }
})();
