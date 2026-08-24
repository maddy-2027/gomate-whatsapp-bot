const { GoogleGenAI } = require('@google/genai');
const { detectLanguage } = require('./language');

const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

// High-speed model fallback chain
const FAST_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash'
];

/**
 * Intelligent Multilingual AI Assistant for GoMate
 * Understands Marathi, Hindi, and English (including Romanized/phonetic text).
 * Explains GoMate equipment, rates, services, and helps user book what they need.
 */
/**
 * Intelligent Multilingual Rate & Catalog Resolver
 * Calculates instant quotes for equipment combinations, typo-tolerant with support for Marathi, Hindi, and English number words.
 */
function parseWordsToNumber(str) {
  const s = (str || '').toLowerCase();
  if (s.includes('दहा') || s.includes('दस') || s.includes('ten') || s.includes('10')) return 10;
  if (s.includes('पाच') || s.includes('पाँच') || s.includes('five') || s.includes('5')) return 5;
  if (s.includes('चार') || s.includes('four') || s.includes('4')) return 4;
  if (s.includes('तीन') || s.includes('three') || s.includes('3')) return 3;
  if (s.includes('दोन') || s.includes('दो') || s.includes('two') || s.includes('to') || s.includes('2')) return 2;
  if (s.includes('एक') || s.includes('one') || s.includes('1')) return 1;
  const m = s.match(/\b([1-9][0-9]?)\b/);
  if (m) return parseInt(m[1]);
  return null;
}

function solveDirectQuery(message, effectiveLang, session = {}) {
  const t = (message || '').toLowerCase();
  
  // Detect machinery
  let machine = null;
  let rate = 0;
  let machineMr = '';
  let machineHi = '';
  let machineEn = '';

  if (t.includes('jcb') || t.includes('gcd') || t.includes('जेसीबी') || t.includes('backhoe') || t.includes('loader')) {
    machine = 'JCB';
    rate = 4500;
    machineEn = 'JCB 3DX Backhoe Loader';
    machineMr = 'JCB 3DX बॅकहो लोडर';
    machineHi = 'JCB 3DX बैकहो लोडर';
  } else if (t.includes('tractor') || t.includes('ट्रॅक्टर') || t.includes('ट्रैक्टर') || t.includes('mahindra') || t.includes('john deere')) {
    machine = 'Tractor';
    rate = 1500;
    machineEn = 'Mahindra 575 DI Tractor (45 HP)';
    machineMr = 'महिंद्रा 575 DI ट्रॅक्टर (45 HP)';
    machineHi = 'महिंद्रा 575 DI ट्रैक्टर (45 HP)';
  } else if (t.includes('harvester') || t.includes('हार्वेस्टर') || t.includes('combine') || t.includes('ऊस तोडणी')) {
    machine = 'Harvester';
    rate = 4200;
    machineEn = 'Combine Harvester';
    machineMr = 'कम्बाईन हार्वेस्टर';
    machineHi = 'कंबाइन हार्वेस्टर';
  } else if (t.includes('ace') || t.includes('chhota hathi') || t.includes('छोटा हत्ती') || t.includes('छोटा हाथी') || t.includes('pickup') || t.includes('पिकअप')) {
    machine = 'Tata Ace';
    rate = 1300;
    machineEn = 'Tata Ace Gold (Chhota Hathi)';
    machineMr = 'टाटा एसी गोल्ड (छोटा हत्ती)';
    machineHi = 'टाटा ऐस गोल्ड (छोटा हाथी)';
  } else if (t.includes('excavator') || t.includes('एक्सकॅव्हेटर') || t.includes('poklane') || t.includes('पोकलेन')) {
    machine = 'Excavator';
    rate = 7000;
    machineEn = 'Komatsu / Tata Hitachi Hydraulic Excavator';
    machineMr = 'हायड्रॉलिक एक्सकॅव्हेटर (पोकलेन)';
    machineHi = 'हाइड्रोलिक एक्सकेवेटर (पोकलेन)';
  } else if (t.includes('rotavator') || t.includes('रोटाव्हेटर') || t.includes('cultivator')) {
    machine = 'Rotavator';
    rate = 850;
    machineEn = 'Shaktiman Rotavator Attachment';
    machineMr = 'शक्तिमान रोटाव्हेटर';
    machineHi = 'शक्तिमान रोटावेटर';
  } else if (t.includes('drone') || t.includes('ड्रोन')) {
    machine = 'Agri Drone';
    rate = 2500;
    machineEn = 'Agri Spraying Hexacopter Drone';
    machineMr = 'शेती फवारणी ड्रोन';
    machineHi = 'कृषि छिड़काव ड्रोन';
  } else if (session && session.data && session.data.lastMachine) {
    // Retain machine from previous turn if user is doing a followup (e.g. "नाही मला दोन दिवसांसाठी आहे")
    const lm = session.data.lastMachine;
    machine = lm.name;
    rate = lm.rate;
    machineMr = lm.machineMr;
    machineHi = lm.machineHi;
    machineEn = lm.machineEn;
  }

  // Check if user is asking about cost/rate or specific duration:
  const isAskingCost = t.includes('cost') || t.includes('how much') || t.includes('rate') || t.includes('price') || 
                       t.includes('rent') || t.includes('भाडे') || t.includes('दर') || t.includes('खर्च') || 
                       t.includes('रुपये') || t.includes('किती') || t.includes('पाहिजे') || t.includes('हवे') ||
                       t.includes('किराया') || t.includes('कितना') || t.includes('चाहिए') || t.includes('दोन दिवस') || t.includes('तीन दिवस');

  if (machine && (isAskingCost || t.includes('day') || t.includes('दिवस') || t.includes('दिन'))) {
    // Save last machine in session
    if (session && session.data) {
      session.data.lastMachine = { name: machine, rate, machineMr, machineHi, machineEn };
    }

    // Extract quantity (e.g. "दोन ट्रॅक्टर", "2 tractors", "5 tractors")
    let qty = 1;
    // Check phrases like "दोन ट्रॅक्टर" or "3 tractors"
    if (t.includes('दोन ट्रॅक्टर') || t.includes('दो ट्रैक्टर') || t.includes('2 tractor') || t.includes('2 ट्रॅक्टर') || t.includes('two tractor')) qty = 2;
    else if (t.includes('तीन ट्रॅक्टर') || t.includes('तीन ट्रैक्टर') || t.includes('3 tractor') || t.includes('3 ट्रॅक्टर') || t.includes('three tractor')) qty = 3;
    else if (t.includes('चार ट्रॅक्टर') || t.includes('4 tractor') || t.includes('4 ट्रॅक्टर')) qty = 4;
    else if (t.includes('पाच ट्रॅक्टर') || t.includes('5 tractor') || t.includes('5 ट्रॅक्टर')) qty = 5;
    else {
      const qMatch = t.match(/\b([1-9]|एक|दोन|तीन|चार|पाच|दो|तीन|चार|पाँच|one|two|three|four|five)\s*(jcb|gcd|tractor|truck|ace|harvester|ट्रॅक्टर|जेसीबी|हार्वेस्टर|हत्ती)/i);
      if (qMatch) {
        const parsed = parseWordsToNumber(qMatch[1]);
        if (parsed) qty = parsed;
      }
    }

    // Extract duration (e.g. "तीन दिवसांसाठी", "दोन दिवसांचे", "2 days", "3 days")
    let days = 1;
    if (t.includes('तीन दिवस') || t.includes('३ दिवस') || t.includes('3 दिवस') || t.includes('तीन दिन') || t.includes('3 days') || t.includes('three days')) days = 3;
    else if (t.includes('दोन दिवस') || t.includes('२ दिवस') || t.includes('2 दिवस') || t.includes('दो दिन') || t.includes('2 days') || t.includes('two days') || t.includes('to days')) days = 2;
    else if (t.includes('चार दिवस') || t.includes('४ दिवस') || t.includes('4 दिवस') || t.includes('चार दिन') || t.includes('4 days')) days = 4;
    else if (t.includes('पाच दिवस') || t.includes('५ दिवस') || t.includes('5 दिवस') || t.includes('5 days')) days = 5;
    else if (t.includes('आठवडा') || t.includes('week') || t.includes('7 दिवस') || t.includes('7 days')) days = 7;
    else {
      const dMatch = t.match(/\b([1-9][0-9]?|एक|दोन|तीन|चार|पाच|दो|तीन|चार|पाँच|one|two|three|four|five)\s*(day|days|दिवस|दिवसांचे|दिवसांसाठी|दिन)/i);
      if (dMatch) {
        const parsed = parseWordsToNumber(dMatch[1]);
        if (parsed) days = parsed;
      }
    }

    const total = rate * qty * days;

    // Save active quote into session for instant 1-click booking
    if (session && session.data) {
      session.data.lastQuote = {
        name: machine,
        rate,
        qty,
        days,
        total,
        machineMr,
        machineHi,
        machineEn,
        model: qty > 1 ? `${qty}x ${machineEn}` : machineEn
      };
      session.data.totalAmount = total;
      session.data.duration = days;
      session.data.quantity = qty;
    }

    if (effectiveLang === 'mr') {
      return `🚜 *GoMate भाडे अंदाज व दरपत्रक*
━━━━━━━━━━━━━━━━━━━━
उपकरण: *${qty > 1 ? `${qty}x ` : ''}${machineMr}*
दर: *₹${rate.toLocaleString('en-IN')}/दिवस*
कालावधी: *${days} दिवस*
अंदाजित एकूण भाडे: *₹${total.toLocaleString('en-IN')}* (${qty > 1 ? `${qty} ट्रॅक्टर x ` : ''}₹${rate} x ${days} दिवस)
━━━━━━━━━━━━━━━━━━━━
✅ शेतकऱ्यांसाठी ₹0 कमिशन व थेट मालकाशी संपर्क!

👉 *थेट बुक करण्यासाठी आणि पेमेंट लिंक मिळवण्यासाठी 'बुक करा' किंवा '1' पाठवा.*
_(मुख्य मेनूसाठी *0* पाठवा)_`;
    } else if (effectiveLang === 'hi') {
      return `🚜 *GoMate किराया अनुमान व दर सूची*
━━━━━━━━━━━━━━━━━━━━
मशीनरी: *${qty > 1 ? `${qty}x ` : ''}${machineHi}*
दर: *₹${rate.toLocaleString('en-IN')}/दिन*
अवधि: *${days} दिन*
अनुमानित कुल किराया: *₹${total.toLocaleString('en-IN')}* (${qty > 1 ? `${qty} मशीन x ` : ''}₹${rate} x ${days} दिन)
━━━━━━━━━━━━━━━━━━━━
✅ किसानों के लिए ₹0 कमीशन और सीधे मालिक से संपर्क!

👉 *बुक करने और पेमेंट लिंक प्राप्त करने के लिए 'बुक करो' या '1' भेजें।*
_(मुख्य मेनू के लिए *0* भेजें)_`;
    } else {
      return `🚜 *GoMate Rental Quote & Estimate*
━━━━━━━━━━━━━━━━━━━━
Equipment: *${qty > 1 ? `${qty}x ` : ''}${machineEn}*
Daily Rate: *₹${rate.toLocaleString('en-IN')}/day*
Duration: *${days} day(s)*
Estimated Total: *₹${total.toLocaleString('en-IN')}* (${qty > 1 ? `${qty} units x ` : ''}₹${rate} x ${days} days)
━━━━━━━━━━━━━━━━━━━━
✅ ₹0 booking fee for farmers & direct owner connect!

👉 *To book now & get your instant payment link, reply 'Book' or '1'.*
_(Reply *0* for Main Menu)_`;
    }
  }

  return null;
}

async function generateChatResponse(message, language = 'en', context = '', session = {}) {
  // Detect language from the current message or fall back to session language
  const detected = detectLanguage(message);
  const effectiveLang = detected || session.language || language || 'en';

  // 1. Check instant direct calculation engine first (sub-millisecond & 100% reliable)
  const directAnswer = solveDirectQuery(message, effectiveLang, session);
  if (directAnswer) {
    return directAnswer;
  }

  if (!ai) {
    if (effectiveLang === 'mr') return "🙏 *GoMate सहाय्यक*\nआम्ही शेती (ट्रॅक्टर, हार्वेस्टर), वाहतूक (छोटा हत्ती, ट्रक) आणि बांधकाम (JCB, क्रेन) उपकरणे भाड्याने देतो.\n\n👉 उपकरणे शोधण्यासाठी *1* पाठवा किंवा मेनूसाठी *0* पाठवा.";
    if (effectiveLang === 'hi') return "🙏 *GoMate सहायक*\nहम कृषि (ट्रैक्टर, हार्वेस्टर), परिवहन (छोटा हाथी, ट्रक) और निर्माण (JCB, क्रेन) उपकरण किराए पर उपलब्ध कराते हैं।\n\n👉 मशीन खोजने के लिए *1* भेजें या मेनू के लिए *0* भेजें।";
    return "🙏 *GoMate Assistant*\nWe provide rentals for Agriculture (Tractors, Harvesters), Transport (Tata Ace, Trucks), and Infrastructure (JCB, Excavators).\n\n👉 Reply *1* to search equipment or *0* for Main Menu.";
  }

  let langInstruction = '';
  if (effectiveLang === 'mr') {
    langInstruction = `CRITICAL LANGUAGE RULE: You MUST reply in clear, natural MARATHI (मराठी) using Devanagari script. Be extremely polite, respectful, and helpful.`;
  } else if (effectiveLang === 'hi') {
    langInstruction = `CRITICAL LANGUAGE RULE: You MUST reply in natural HINDI (हिंदी) using Devanagari script. Be polite and helpful.`;
  } else {
    langInstruction = `CRITICAL LANGUAGE RULE: Reply in clear, friendly, and simple English.`;
  }

  const systemInstruction = `You are GoMate's Multilingual WhatsApp AI Assistant.
GoMate is Maharashtra's #1 verified equipment and machinery rental marketplace connecting farmers, contractors, and transporters directly with equipment owners with ₹0 booking fees.

OUR CATALOG & SERVICES:
1. 🌾 AGRICULTURE (शेती):
   - Tractors (Mahindra 575 DI, John Deere 5310, Sonalika, Swaraj): ~₹1,500/day
   - Rotavators, Cultivators, Seed Drills, Tippers: ~₹600-₹900/day
   - Harvesters (Combine / Sugarcane Cutters / Claas): ~₹4,200/day
   - Agricultural Spraying Drones (10L Hexacopter): ~₹2,500/day
   - Services offered: Ploughing (नांगरणी), Rotavator, Sowing (पेरणी), Harvesting (कापणी), Spraying (फवारणी), Trolley transport.

2. 🚚 TRANSPORT & LOGISTICS (वाहतूक):
   - Mini Trucks: Tata Ace Gold (Chhota Hathi): ~₹1,300/day
   - Pickups: Ashok Leyland Dost Plus, Mahindra Bolero Maxi Truck: ~₹1,600/day
   - Medium & Heavy Trucks: Tata 407 (4T), Mahindra Blazo: ~₹2,600 - ₹3,500/day
   - Dumpers / Tippers (16 Cu.M): ~₹4,000/day
   - Water / Liquid Tankers: ~₹4,200/day
   - Services offered: Mandi & farm produce, house shifting, construction materials (sand/bricks), commercial goods.

3. 🏗️ INFRASTRUCTURE & CONSTRUCTION (बांधकाम):
   - Backhoe Loaders: JCB 3DX, JCB 4DX: ~₹4,500 - ₹5,200/day
   - Hydraulic Excavators: Komatsu PC210, Tata Hitachi EX 200: ~₹7,000 - ₹7,500/day
   - Crawler Bulldozers: CAT D6, BEML: ~₹6,500 - ₹8,500/day
   - Services offered: Farm ponds (शेततळे), land levelling, wells & foundation digging, rock breaker, trenching & pipeline.

KEY POLICIES:
- For Customers/Farmers: 100% Free booking, ₹0 commission, direct owner contact and UPI payment.
- For Equipment Owners: List equipment for flat ₹599/month, unlimited farmer enquiries.
- Coverage: Active across all districts of Maharashtra (Pune, Nashik, Satara, Sangli, Kolhapur, Solapur, Aurangabad, Nagpur, Mumbai, etc.).

INSTRUCTIONS FOR YOUR RESPONSE:
1. Even if the user asks something out of context, unrelated, or in casual speech, warmly address their query, connect it to how GoMate can help them, and explain what we offer.
2. If they ask about custom machinery combinations or multi-day calculations (e.g. "2 JCBs and 3 Tractors for 4 days"), calculate accurately and show total price estimate.
3. Keep the tone warm, respectful, and formatted cleanly with WhatsApp *bolding* and bullet points.
4. Keep the response concise (around 60-90 words).
5. Always conclude with a clear next step:
   - In Marathi: "\n\n👉 *उपकरणे शोधण्यासाठी '1' पाठवा, किंवा मुख्य मेनूसाठी '0' पाठवा.*"
   - In Hindi: "\n\n👉 *मशीनरी खोजने के लिए '1' भेजें, या मुख्य मेनू के लिए '0' भेजें।*"
   - In English: "\n\n👉 *Reply '1' to search equipment, or '0' for Main Menu.*"

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
          maxOutputTokens: 350,
          temperature: 0.3
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
      console.warn(`⚡ Model ${modelName} fallback attempt: ${err.message ? err.message.substring(0, 50) : err}`);
    }
  }

  // Graceful fallback
  if (effectiveLang === 'mr') {
    return `🙏 *GoMate कृषी व बांधकाम सहाय्यक*\n\nआम्ही शेती (ट्रॅक्टर, हार्वेस्टर), वाहतूक (छोटा हत्ती, ट्रक) आणि बांधकाम (JCB, क्रेन) उपकरणे वाजवी दरात उपलब्ध करतो.\n\n👉 उपकरणे शोधण्यासाठी *1* पाठवा किंवा मुख्य मेनूसाठी *0* पाठवा.`;
  }
  if (effectiveLang === 'hi') {
    return `🙏 *GoMate कृषि और निर्माण सहायक*\n\nहम कृषि (ट्रैक्टर, हार्वेस्टर), परिवहन (छोटा हाथी, ट्रक) और निर्माण (JCB, क्रेन) उपकरण किफायती दरों पर प्रदान करते हैं।\n\n👉 मशीनरी खोजने के लिए *1* भेजें या मुख्य मेनू के लिए *0* भेजें।`;
  }
  return `🙏 *GoMate Machinery Assistant*\n\nWe provide verified rentals for Agriculture (Tractors, Harvesters), Transport (Tata Ace, Trucks), and Infrastructure (JCB, Excavators).\n\n👉 Reply *1* to search equipment, or *0* for Main Menu.`;
}

module.exports = { generateChatResponse };
