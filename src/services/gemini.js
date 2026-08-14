const { GoogleGenAI } = require('@google/genai');

const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

async function generateChatResponse(message, language, context = '', session) {
  if (!ai) return "AI service is currently unavailable. Please use the menu options.";

  const systemInstruction = `You are GoMate's WhatsApp assistant — an equipment rental marketplace in Maharashtra, India. You help CUSTOMERS find and book agricultural, transport, and infrastructure equipment, and OWNERS list equipment and manage subscriptions. Respond in the user's language (${language}). Keep replies under 200 words, formatted for WhatsApp (*bold*, _italic_, bullets). Never invent equipment — only reference database results passed as context. Be warm, professional, and helpful. Use ₹ for prices. Context: ${context}`;

  try {
    const history = (session.conversation_history || []).slice(-10);
    let contents = history.map(m => ({ role: m.role, parts: [{ text: m.text }] }));
    contents.push({ role: 'user', parts: [{ text: message }] });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: { systemInstruction: systemInstruction }
    });

    const reply = response.text;
    session.conversation_history = history.concat(
      { role: 'user', text: message },
      { role: 'model', text: reply }
    );
    return reply;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "I am unable to process your request right now. Type 'menu' to return to the main menu.";
  }
}

module.exports = { generateChatResponse };
