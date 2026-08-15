require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

async function test() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const models = ['gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-2.5-flash-lite'];
  for (const m of models) {
    try {
      const res = await ai.models.generateContent({
        model: m,
        contents: 'Say GoMate in Marathi and English'
      });
      console.log(`✅ Success with ${m}:`, res.text.trim());
      return;
    } catch (e) {
      console.log(`❌ ${m} failed:`, e.message.substring(0, 80));
    }
  }
}

test();
