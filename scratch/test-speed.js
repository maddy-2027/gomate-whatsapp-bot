require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function benchmark() {
  const models = [
    'gemini-flash-lite-latest',
    'gemini-2.5-flash-lite',
    'gemini-3.1-flash-lite',
    'gemini-3.5-flash-lite',
    'gemini-flash-latest'
  ];

  for (const m of models) {
    const t0 = Date.now();
    try {
      const res = await ai.models.generateContent({
        model: m,
        contents: "Hello in Marathi in 5 words"
      });
      console.log(`⚡ Model [${m}]: ${Date.now() - t0}ms -> ${res.text.trim()}`);
    } catch (e) {
      console.log(`❌ Model [${m}]: ${Date.now() - t0}ms -> ${e.message.substring(0, 50)}`);
    }
  }
}

benchmark();
