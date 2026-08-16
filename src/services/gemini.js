const { GoogleGenAI } = require('@google/genai');
const { detectLanguage } = require('./language');

const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

async function generateChatResponse(message, language = 'en', context = '', session = {}) {
  // Dynamically detect language from the user's latest prompt
  const detected = detectLanguage(message);
  const effectiveLang = detected || session.language || language || 'en';

  if (!ai) {
    if (effectiveLang === 'mr') return "AI सेवा सध्या अनुपलब्ध आहे. कृपया मेनू पर्याय वापरा किंवा मुख्य मेनूसाठी '0' पाठवा.";
    if (effectiveLang === 'hi') return "AI सेवा वर्तमान में अनुपलब्ध है। कृपया मेनू विकल्पों का उपयोग करें या मुख्य मेनू के लिए '0' भेजें।";
    return "AI service is currently unavailable. Please use the menu options or reply '0'.";
  }

  let langInstruction = '';
  if (effectiveLang === 'mr') {
    langInstruction = `CRITICAL LANGUAGE REQUIREMENT: You MUST reply natively and fluently in MARATHI (मराठी) using Devanagari script.
- Even if the user asked using English letters (e.g. 'tractor pahije' or 'pune madhe harvester bhetel ka'), you MUST reply in pure, natural, respectful Marathi (उदा. 'होय, पुणे परिसरामध्ये महिंद्रा आणि जॉन डीअर ट्रॅक्टर उपलब्ध आहेत...').
- Use standard agricultural terminology used in Maharashtra (e.g., नांगरणी, रोटाव्हेटर, ऊस तोडणी, भाडे).`;
  } else if (effectiveLang === 'hi') {
    langInstruction = `CRITICAL LANGUAGE REQUIREMENT: You MUST reply natively and fluently in HINDI (हिंदी) using Devanagari script.
- Even if the user asked in Hinglish (e.g. 'tractor chahiye' or 'jcb ka rent kya hai'), you MUST reply in natural, polite Hindi (उदा. 'जी हाँ, आपके क्षेत्र में जेसीबी और ट्रैक्टर उचित किराए पर उपलब्ध हैं...').`;
  } else {
    langInstruction = `CRITICAL LANGUAGE REQUIREMENT: Reply in clear, simple English formatted for WhatsApp.`;
  }

  const systemInstruction = `You are GoMate's AI WhatsApp Assistant — an equipment rental marketplace in Maharashtra, India.

Your mission:
1. Help FARMERS & CUSTOMERS find & rent:
   - Agricultural equipment (Mahindra/John Deere tractors, Claas harvesters, rotavators, spray drones).
   - Transport vehicles (Tata Ace 'Chhota Hathi', tippers, cargo vans).
   - Infrastructure machinery (JCB 3DX backhoes, Komatsu excavators, bulldozers).
2. Help MACHINERY OWNERS list equipment and manage their ₹599/month Owner Pro subscription.
3. Pricing & Booking Policy:
   - Farmers/customers book for FREE with ₹0 commission.
   - Machinery owners pay a flat ₹599/month subscription for unlimited bookings.
   - Standard tractor rent is ~₹1,500/day, JCB ~₹4,500/day, Tata Ace ~₹1,300/day.
4. Response formatting rules:
   - Format for WhatsApp using *bold*, _italic_, and clean bullet points.
   - Keep answers concise and direct (under 120 words).
   - Include a call to action at the end: e.g. "मुख्य मेनूवर जाण्यासाठी *0* टाइप करा किंवा थेट वर्ग निवडा."
   - Context data: ${context}

${langInstruction}`;

  const fallbackModels = ['gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];

  for (const modelName of fallbackModels) {
    try {
      const history = (session.conversation_history || []).slice(-6);
      let contents = history.map(m => ({ role: m.role, parts: [{ text: m.text }] }));
      contents.push({ role: 'user', parts: [{ text: message }] });

      const response = await ai.models.generateContent({
        model: modelName,
        contents: contents,
        config: { systemInstruction: systemInstruction }
      });

      const reply = response.text;
      if (reply) {
        if (!session.conversation_history) session.conversation_history = [];
        session.conversation_history.push(
          { role: 'user', text: message },
          { role: 'model', text: reply }
        );
        return reply;
      }
    } catch (err) {
      console.warn(`Gemini (${modelName}) error:`, err.message.substring(0, 100));
    }
  }

  if (effectiveLang === 'mr') return "क्षमस्व, मी सध्या या विनंतीवर प्रक्रिया करू शकत नाही. मुख्य मेनूवर परत येण्यासाठी '0' टाईप करा.";
  if (effectiveLang === 'hi') return "क्षमा करें, मैं अभी इस अनुरोध को संसाधित नहीं कर सकता। मुख्य मेनू पर लौटने के लिए '0' टाइप करें।";
  return "I am unable to process your request right now. Type '0' to return to the main menu.";
}

module.exports = { generateChatResponse };
