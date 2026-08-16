require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function listModels() {
  try {
    const list = await ai.models.list();
    console.log('Available models:');
    for await (const m of list) {
      if (m.name.includes('gemini') && m.supportedActions && m.supportedActions.includes('generateContent')) {
        console.log(` - ${m.name}`);
      }
    }
  } catch (e) {
    console.error('List error:', e);
  }
}

listModels();
