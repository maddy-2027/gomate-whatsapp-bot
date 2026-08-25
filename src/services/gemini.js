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

    const PLATFORM_FEE = 49;
    const rentalTotal = rate * qty * days;
    const total = rentalTotal + PLATFORM_FEE;

    // Save active quote into session for instant 1-click booking
    if (session && session.data) {
      session.data.lastQuote = {
        name: machine,
        rate,
        qty,
        days,
        rentalTotal,
        platformFee: PLATFORM_FEE,
        total,
        machineMr,
        machineHi,
        machineEn,
        model: qty > 1 ? `${qty}x ${machineEn}` : machineEn
      };
      session.data.totalAmount = total;
      session.data.rentalTotal = rentalTotal;
      session.data.platformFee = PLATFORM_FEE;
      session.data.duration = days;
      session.data.quantity = qty;
    }

    if (effectiveLang === 'mr') {
      return `🚜 *GoMate भाडे अंदाज व दरपत्रक*
━━━━━━━━━━━━━━━━━━━━
उपकरण: *${qty > 1 ? `${qty}x ` : ''}${machineMr}*
दर: *₹${rate.toLocaleString('en-IN')}/दिवस*
कालावधी: *${days} दिवस*
• उपकरण भाडे: *₹${rentalTotal.toLocaleString('en-IN')}* (${qty > 1 ? `${qty} ट्रॅक्टर x ` : ''}₹${rate} x ${days} दिवस)
• गोमेट सुरक्षा व सहाय्य फी: *₹${PLATFORM_FEE}*
━━━━━━━━━━━━━━━━━━━━
💰 *एकूण रक्कम: ₹${total.toLocaleString('en-IN')}*
━━━━━━━━━━━━━━━━━━━━
✅ १००% गोमेट सुरक्षा हमी व थेट मालकाशी संपर्क!

👉 *थेट बुक करण्यासाठी आणि पेमेंट लिंक मिळवण्यासाठी 'बुक करा' किंवा '1' पाठवा.*
_(मुख्य मेनूसाठी *0* पाठवा)_`;
    } else if (effectiveLang === 'hi') {
      return `🚜 *GoMate किराया अनुमान व दर सूची*
━━━━━━━━━━━━━━━━━━━━
मशीनरी: *${qty > 1 ? `${qty}x ` : ''}${machineHi}*
दर: *₹${rate.toLocaleString('en-IN')}/दिन*
अवधि: *${days} दिन*
• मशीनरी किराया: *₹${rentalTotal.toLocaleString('en-IN')}* (${qty > 1 ? `${qty} मशीन x ` : ''}₹${rate} x ${days} दिन)
• गोमेट सुरक्षा व सेवा शुल्क: *₹${PLATFORM_FEE}*
━━━━━━━━━━━━━━━━━━━━
💰 *कुल राशि: ₹${total.toLocaleString('en-IN')}*
━━━━━━━━━━━━━━━━━━━━
✅ १००% गोमेट सुरक्षा गारंटी और सीधे मालिक से संपर्क!

👉 *बुक करने और पेमेंट लिंक प्राप्त करने के लिए 'बुक करो' या '1' भेजें।*
_(मुख्य मेनू के लिए *0* भेजें)_`;
    } else {
      return `🚜 *GoMate Rental Quote & Estimate*
━━━━━━━━━━━━━━━━━━━━
Equipment: *${qty > 1 ? `${qty}x ` : ''}${machineEn}*
Daily Rate: *₹${rate.toLocaleString('en-IN')}/day*
Duration: *${days} day(s)*
• Equipment Rental: *₹${rentalTotal.toLocaleString('en-IN')}* (${qty > 1 ? `${qty} units x ` : ''}₹${rate} x ${days} days)
• GoMate Protection & Support Fee: *₹${PLATFORM_FEE}*
━━━━━━━━━━━━━━━━━━━━
💰 *Total Amount: ₹${total.toLocaleString('en-IN')}*
━━━━━━━━━━━━━━━━━━━━
✅ 100% GoMate Protection & direct owner connect!

👉 *To book now & get your instant payment link, reply 'Book' or '1'.*
_(Reply *0* for Main Menu)_`;
    }
  }

  return null;
}

const responseCache = new Map();

async function generateChatResponse(message, language = 'en', context = '', session = {}) {
  // Detect language from the current message or fall back to session language
  const detected = detectLanguage(message);
  const effectiveLang = detected || session.language || language || 'en';
  const cleanMsg = (message || '').trim().toLowerCase();

  // 1. Check in-memory instant response cache (sub-millisecond)
  const cacheKey = `${effectiveLang}:${cleanMsg}`;
  if (responseCache.has(cacheKey)) {
    return responseCache.get(cacheKey);
  }

  // 2. Check instant direct calculation engine (sub-millisecond & 100% reliable)
  const directAnswer = solveDirectQuery(message, effectiveLang, session);
  if (directAnswer) {
    responseCache.set(cacheKey, directAnswer);
    return directAnswer;
  }

  // 3. Fast Keyword & Instant Menu Shortcuts (Sub-millisecond 0ms execution)
  
  // Rate Card & Price List
  if (cleanMsg.includes('rate') || cleanMsg.includes('price') || cleanMsg.includes('दर') || cleanMsg.includes('किंमत') || cleanMsg.includes('दरपत्रक') || cleanMsg.includes('खर्च किती')) {
    let rateText = '';
    if (effectiveLang === 'mr') {
      rateText = `📊 *गोमेट मशिनरी अधिकृत दरपत्रक (प्रति दिवस)*
━━━━━━━━━━━━━━━━━━━━
🌾 *शेती उपकरणे:*
• महिंद्रा ट्रॅक्टर (45 HP): *₹1,500/दिवस*
• कम्बाईन हार्वेस्टर: *₹4,200/दिवस*
• शक्तिमान रोटाव्हेटर: *₹850/दिवस*
• शेती फवारणी ड्रोन: *₹2,500/दिवस*

🚚 *वाहतूक उपकरणे:*
• टाटा एसी (छोटा हत्ती): *₹1,300/दिवस*
• बोलेरो / दोस्त पिकअप: *₹1,600/दिवस*
• टाटा 407 ट्रक: *₹2,600/दिवस*

🏗️ *बांधकाम उपकरणे:*
• JCB 3DX बॅकहो लोडर: *₹4,500/दिवस*
• हायड्रॉलिक एक्सकॅव्हेटर (पोकलेन): *₹7,000/दिवस*
━━━━━━━━━━━━━━━━━━━━
🛡️ गोमेट सुरक्षा व सेवा फी: *फक्त ₹49*
✅ १००% सुरक्षित व थेट मालकाशी संपर्क!

👉 *थेट बुक करण्यासाठी उपकरणाचे नाव पाठवा (उदा: 'मला 2 दिवस ट्रॅक्टर हवा') किंवा मेनूसाठी '0' पाठवा.*`;
    } else if (effectiveLang === 'hi') {
      rateText = `📊 *गोमेट मशीनरी आधिकारिक दर सूची (प्रति दिन)*
━━━━━━━━━━━━━━━━━━━━
🌾 *कृषि उपकरण:*
• महिंद्रा ट्रैक्टर (45 HP): *₹1,500/दिन*
• कंबाइन हार्वेस्टर: *₹4,200/दिन*
• शक्तिमान रोटावेटर: *₹850/दिन*
• कृषि छिड़काव ड्रोन: *₹2,500/दिन*

🚚 *परिवहन उपकरण:*
• टाटा ऐस (छोटा हाथी): *₹1,300/दिन*
• बोलेरो / दोस्त पिकअप: *₹1,600/दिन*
• टाटा 407 ट्रक: *₹2,600/दिन*

🏗️ *निर्माण उपकरण:*
• JCB 3DX बैकहो लोडर: *₹4,500/दिन*
• हाइड्रोलिक एक्सकेवेटर (पोकलेन): *₹7,000/दिन*
━━━━━━━━━━━━━━━━━━━━
🛡️ गोमेट सुरक्षा शुल्क: *मात्र ₹49*

👉 *मशीनरी बुक करने के लिए नाम भेजें या मेनू के लिए '0' भेजें।*`;
    } else {
      rateText = `📊 *GoMate Official Rental Rate Card (Per Day)*
━━━━━━━━━━━━━━━━━━━━
🌾 *Agriculture Equipment:*
• Mahindra Tractor (45 HP): *₹1,500/day*
• Combine Harvester: *₹4,200/day*
• Shaktiman Rotavator: *₹850/day*
• Agri Spraying Drone: *₹2,500/day*

🚚 *Transport & Logistics:*
• Tata Ace (Chhota Hathi): *₹1,300/day*
• Bolero / Dost Pickup: *₹1,600/day*
• Tata 407 Truck: *₹2,600/day*

🏗️ *Infrastructure & Construction:*
• JCB 3DX Backhoe Loader: *₹4,500/day*
• Hydraulic Excavator (Poklane): *₹7,000/day*
━━━━━━━━━━━━━━━━━━━━
🛡️ GoMate Protection & Support Fee: *Flat ₹49*

👉 *To get a quote, type machinery name (e.g. '1 JCB for 2 days') or reply '0' for Menu.*`;
    }
    responseCache.set(cacheKey, rateText);
    return rateText;
  }

  // Contact & Helpline
  if (cleanMsg.includes('contact') || cleanMsg.includes('helpline') || cleanMsg.includes('कॉल') || cleanMsg.includes('फोन') || cleanMsg.includes('संपर्क') || cleanMsg.includes('number')) {
    const contactText = effectiveLang === 'mr' 
      ? `📞 *GoMate शेतकरी व ग्राहक मदत केंद्र*\n\nटोल-फ्री नंबर: *1800-123-4567*\nWhatsApp: *+91 98220 12345*\nवेळ: सकाळी 7:00 ते रात्री 10:00 (सर्व 7 दिवस)\n\n👉 मेनूसाठी *0* पाठवा.`
      : `📞 *GoMate Farmer & Customer Helpline*\n\nToll-Free Number: *1800-123-4567*\nWhatsApp: *+91 98220 12345*\nHours: 7:00 AM – 10:00 PM (All 7 days)\n\n👉 Reply *0* for Main Menu.`;
    responseCache.set(cacheKey, contactText);
    return contactText;
  }

  // How it works & Process
  if (cleanMsg.includes('process') || cleanMsg.includes('how it works') || cleanMsg.includes('कसे काम') || cleanMsg.includes('प्रक्रिया') || cleanMsg.includes('डिलिव्हरी')) {
    const procText = effectiveLang === 'mr'
      ? `📋 *GoMate वर बुकिंग कसे करावे? (४ सोप्या पायऱ्या)*
━━━━━━━━━━━━━━━━━━━━
1️⃣ *दर व अंदाज:* हवे असलेले उपकरण सांगा (उदा. 'मला २ दिवस ट्रॅक्टर हवा').
2️⃣ *१-क्लिक बुकिंग:* 'बुक करा' पाठवून सुरक्षित UPI लिंक मिळवा.
3️⃣ *मालकाशी थेट संपर्क:* पेमेंट पूर्ण होताच मशिनरी मालकाचा फोन नंबर व थेट पत्ता मिळतो.
4️⃣ *सुरक्षित डिलिव्हरी:* मालक स्वतः तुमच्या शेतात/साइटवर मशिनरी वेळेत पोहोचवतील. काम सुरू होईपर्यंत तुमची रक्कम GoMate द्वारे सुरक्षित!

👉 *उपकरण शोधण्यासाठी '1' पाठवा किंवा मेनूसाठी '0' पाठवा.*`
      : `📋 *How GoMate Booking Works (4 Simple Steps)*
━━━━━━━━━━━━━━━━━━━━
1️⃣ *Quote & Estimate:* Ask for any equipment (e.g. '1 JCB for 2 days').
2️⃣ *Instant 1-Click Booking:* Reply 'Book' to receive your secure UPI link.
3️⃣ *Direct Owner Connect:* Receive verified owner name, phone & hub location instantly.
4️⃣ *Guaranteed Delivery:* The owner delivers the machinery with driver directly to your site.

👉 *Reply '1' to Search Equipment or '0' for Main Menu.*`;
    responseCache.set(cacheKey, procText);
    return procText;
  }

  // Locations & Districts
  if (cleanMsg.includes('location') || cleanMsg.includes('district') || cleanMsg.includes('पुणे') || cleanMsg.includes('नाशिक') || cleanMsg.includes('सातारा') || cleanMsg.includes('कोल्हापूर') || cleanMsg.includes('सोलापूर') || cleanMsg.includes('नगर') || cleanMsg.includes('पत्ता') || cleanMsg.includes('कुठे')) {
    const locText = effectiveLang === 'mr'
      ? `📍 *GoMate संपूर्ण महाराष्ट्रात कार्यरत आहे!*
━━━━━━━━━━━━━━━━━━━━
आम्ही पुणे, नाशिक, सातारा, सांगली, कोल्हापूर, सोलापूर, छत्रपती संभाजीनगर, नागपूर, अमरावती आणि महाराष्ट्रातील सर्व जिल्ह्यांत व तालुक्यांत सेवा देतो.

👉 *आपल्या शेतातील पिनकोड किंवा तालुक्याचे नाव पाठवून जवळची उपकरणे शोधा.*
_(मेनूसाठी *0* पाठवा)_`
      : `📍 *GoMate Operates Across All Maharashtra!*
━━━━━━━━━━━━━━━━━━━━
Active hubs in Pune, Nashik, Satara, Kolhapur, Solapur, Aurangabad, Nagpur, and all rural agricultural talukas.

👉 *Send your location pin or taluka name to find nearby machinery.*
_(Reply *0* for Main Menu)_`;
    responseCache.set(cacheKey, locText);
    return locText;
  }

  // Owner Listing Inquiry
  if (cleanMsg.includes('माझी मशीन') || cleanMsg.includes('मालक') || cleanMsg.includes('list') || cleanMsg.includes('attach') || cleanMsg.includes('owner') || cleanMsg.includes('भाड्याने द्यायची')) {
    const ownerText = effectiveLang === 'mr'
      ? `🚜 *आपली मशिनरी गोमेटवर जोडा व नियमित भाडे कमवा!*
━━━━━━━━━━━━━━━━━━━━
• शेतकऱ्यांकडून थेट चौकशी व बुकिंग
• पहिल्या महिन्यासाठी ₹0 नोंदणी फी
• १००% थेट UPI पेमेंट

👉 *मशिनरी नोंदणी सुरू करण्यासाठी '2' पाठवा, किंवा मेनूसाठी '0' पाठवा.*`
      : `🚜 *List Your Equipment on GoMate & Earn Daily Rentals!*
━━━━━━━━━━━━━━━━━━━━
• Get direct farmer inquiries across your district
• ₹0 listing fee for the first 30 days
• 100% direct bank payouts

👉 *Reply '2' to register as an Equipment Owner or '0' for Menu.*`;
    responseCache.set(cacheKey, ownerText);
    return ownerText;
  }

  // Instant Graceful Catalog Overview (No remote AI wait needed!)
  if (effectiveLang === 'mr') {
    return `🙏 *GoMate कृषी, वाहतूक व बांधकाम सहाय्यक*

आम्ही शेती (ट्रॅक्टर, हार्वेस्टर), वाहतूक (छोटा हत्ती, ट्रक) आणि बांधकाम (JCB, एक्सकॅव्हेटर) उपकरणे वाजवी दरात उपलब्ध करतो.

👉 *उपकरणे शोधण्यासाठी '1' पाठवा, मालक नोंदणीसाठी '2' पाठवा, किंवा दरपत्रकासाठी 'दर' पाठवा.*`;
  }
  if (effectiveLang === 'hi') {
    return `🙏 *GoMate कृषि, परिवहन व निर्माण सहायक*

हम कृषि (ट्रैक्टर, हार्वेस्टर), परिवहन (छोटा हाथी, ट्रक) और निर्माण (JCB, एक्सकेवेटर) उपकरण किफायती दरों पर प्रदान करते हैं।

👉 *मशीनरी खोजने के लिए '1' भेजें, या दर सूची के लिए 'दर' भेजें।*`;
  }
  return `🙏 *GoMate Machinery & Rental Assistant*

We provide verified rentals for Agriculture (Tractors, Harvesters), Transport (Tata Ace, Trucks), and Infrastructure (JCB, Excavators).

👉 *Reply '1' to search equipment, '2' for Owner listing, or 'rates' for Rate Card.*`;
}

module.exports = { generateChatResponse };
