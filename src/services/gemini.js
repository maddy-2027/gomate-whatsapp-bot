const { GoogleGenAI } = require('@google/genai');

const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

async function generateChatResponse(message, language = 'en', context = '', session = {}) {
  if (!ai) {
    if (language === 'mr') return "AI सेवा सध्या अनुपलब्ध आहे. कृपया मेनू पर्याय वापरा किंवा '0' पाठवा.";
    if (language === 'hi') return "AI सेवा वर्तमान में अनुपलब्ध है। कृपया मेनू विकल्पों का उपयोग करें या '0' भेजें।";
    return "AI service is currently unavailable. Please use the menu options or reply '0'.";
  }

  const langInstruction = language === 'mr' 
    ? "Respond natively in Marathi (मराठी) using natural Devanagari script."
    : (language === 'hi' 
      ? "Respond natively in Hindi (हिंदी) using natural Devanagari script." 
      : "Respond in clear English.");

  const systemInstruction = `You are GoMate's AI WhatsApp Assistant — an equipment rental marketplace in Maharashtra, India.
Your mission:
1. Help FARMERS & CUSTOMERS find & rent Agricultural equipment (tractors, harvesters, rotavators, spray drones), Transport vehicles (Tata Ace, tippers, cargo vans), and Infrastructure machinery (JCB 3DX, excavators, bulldozers).
2. Help MACHINERY OWNERS list equipment and manage their ₹599/month Owner Pro subscription.
3. ${langInstruction}
4. Formatting rules:
   - Format for WhatsApp using *bold*, _italic_, and bullet points.
   - Keep answers concise (under 150 words).
   - Use ₹ (INR) for daily prices.
   - Mention that farmers book for FREE with ₹0 commission, and owners pay flat ₹599/month.
   - Context data: ${context}`;

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

  if (language === 'mr') return "क्षमस्व, मी सध्या या विनंतीवर प्रक्रिया करू शकत नाही. मुख्य मेनूवर परत येण्यासाठी '0' टाईप करा.";
  if (language === 'hi') return "क्षमा करें, मैं अभी इस अनुरोध को संसाधित नहीं कर सकता। मुख्य मेनू पर लौटने के लिए '0' टाइप करें।";
  return "I am unable to process your request right now. Type '0' to return to the main menu.";
}

module.exports = { generateChatResponse };
