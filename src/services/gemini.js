const { GoogleGenAI } = require('@google/genai');
const { detectLanguage } = require('./language');

const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

// High-speed low-latency model chain (sub-second response times)
const FAST_MODELS = [
  'gemini-3.1-flash-lite',
  'gemini-3.5-flash-lite',
  'gemini-flash-lite-latest'
];

async function generateChatResponse(message, language = 'en', context = '', session = {}) {
  const detected = detectLanguage(message);
  const effectiveLang = detected || session.language || language || 'en';

  if (!ai) {
    if (effectiveLang === 'mr') return "AI सेवा सध्या अनुपलब्ध आहे. कृपया मेनू पर्याय वापरा किंवा मुख्य मेनूसाठी '0' पाठवा.";
    if (effectiveLang === 'hi') return "AI सेवा वर्तमान में अनुपलब्ध है। कृपया मेनू विकल्पों का उपयोग करें या मुख्य मेनू के लिए '0' भेजें।";
    return "AI service is currently unavailable. Please use the menu options or reply '0'.";
  }

  let langInstruction = '';
  if (effectiveLang === 'mr') {
    langInstruction = `CRITICAL LANGUAGE RULE: You MUST reply natively in MARATHI (मराठी) using Devanagari script. Keep it concise, respectful, and helpful.`;
  } else if (effectiveLang === 'hi') {
    langInstruction = `CRITICAL LANGUAGE RULE: You MUST reply natively in HINDI (हिंदी) using Devanagari script. Keep it concise and polite.`;
  } else {
    langInstruction = `CRITICAL LANGUAGE RULE: Reply in clear, simple English.`;
  }

  const systemInstruction = `You are GoMate's AI WhatsApp Assistant — Maharashtra's machinery rental platform.
- Farmers/customers book for FREE with ₹0 commission.
- Owners list machinery for flat ₹599/month.
- Tractors ~₹1,500/day, JCB ~₹4,500/day, Tata Ace ~₹1,300/day.
- Keep answers under 80 words for ultra-fast reading on WhatsApp.
- Format with *bold* and bullet points.
- Context: ${context}
${langInstruction}`;

  for (const modelName of FAST_MODELS) {
    try {
      const history = (session.conversation_history || []).slice(-4);
      let contents = history.map(m => ({ role: m.role, parts: [{ text: m.text }] }));
      contents.push({ role: 'user', parts: [{ text: message }] });

      const response = await ai.models.generateContent({
        model: modelName,
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          maxOutputTokens: 300,
          temperature: 0.4
        }
      });

      const reply = response.text;
      if (reply) {
        if (!session.conversation_history) session.conversation_history = [];
        session.conversation_history.push(
          { role: 'user', text: message },
          { role: 'model', text: reply }
        );
        return reply.trim();
      }
    } catch (err) {
      console.warn(`⚡ Fast fallback: ${modelName} error (${err.message.substring(0, 50)}) -> trying next`);
    }
  }

  if (effectiveLang === 'mr') return "क्षमस्व, मी सध्या या विनंतीवर प्रक्रिया करू शकत नाही. मुख्य मेनूवर परत येण्यासाठी '0' टाईप करा.";
  if (effectiveLang === 'hi') return "क्षमा करें, मैं अभी इस अनुरोध को संसाधित नहीं कर सकता। मुख्य मेनू पर लौटने के लिए '0' टाइप करें।";
  return "I am unable to process your request right now. Type '0' to return to the main menu.";
}

module.exports = { generateChatResponse };
