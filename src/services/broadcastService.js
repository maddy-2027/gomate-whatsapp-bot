/**
 * GoMate WhatsApp Seasonal Broadcast Engine
 * Dispatches targeted agricultural announcements, seasonal alerts,
 * and machinery demand notifications to farmers and equipment owners.
 */

const { sendWhatsAppDirect } = require('./whatsappWeb');

// Pre-crafted, high-conversion Seasonal Marathi & English Broadcast Templates
const BROADCAST_TEMPLATES = [
  {
    id: 'kharif_ploughing',
    title: '🌾 खरिप हंगाम नांगरट व मशागत (Kharif Season Alert)',
    target: 'farmers',
    messageMr: `🌾 *GoMate खरिप हंगाम सूचना (जत तालुका)* 🚜
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
नमस्कार शेतकरी बंधूंनो,
पावसाळ्यापूर्वीच्या *खरिप नांगरट व मशागतीसाठी* ट्रॅक्टर व रोटाव्हेटर आता तुमच्या गावात थेट उपलब्ध आहेत!

✅ *उपलब्ध अवजारे व चालू दर:*
• ट्रॅक्टर नांगरट (Ploughing): *₹850/तास*
• रोटाव्हेटर मशागत (Rotavator): *₹800/तास*
• कल्टीव्हेटर (Cultivator): *₹900/तास*

🛡️ ०% कमिशन • थेट शेतात डिलिव्हरी • वेळेची हमी!

👉 *आत्ताच '1' पाठवून ट्रॅक्टर बुक करा किंवा 'दर' पाठवून दरपत्रक पहा.*
📞 टोल-फ्री हेल्पलाइन: 1800-123-4567`
  },
  {
    id: 'pomegranate_grape_spray',
    title: '🍇 डाळिंब व द्राक्ष बागेसाठी कृषी ड्रोन फवारणी (Drone Spray Alert)',
    target: 'farmers',
    messageMr: `🍇 *डाळिंब व द्राक्ष बागायतदारांसाठी खुशखबर!* 🚁
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
जत व सांगली भागातील बागांसाठी **GoMate 10L हाय-प्रेशर स्प्रे ड्रोन** आता सेवेत दाखल झाले आहे!

✅ *ड्रोन फवारणीचे फायदे:*
• १० मिनिटांत १ एकर अचूक फवारणी ⚡
• औषधाची ३०% बचत व पानांखाली १००% कव्हरेज 🌿
• दर: *फक्त ₹450/एकर*

👉 *ड्रोन ऑपरेटर बुक करण्यासाठी '1' पाठवा.*
_GoMate ॲग्रीटेक — स्मार्ट शेती, दुप्पट नफा!_ 🚜🌾`
  },
  {
    id: 'sugarcane_harvesting',
    title: '🚚 ऊस तोडणी, हार्वेस्टर व हायड्रॉलिक ट्रॉली (Sugarcane Harvest)',
    target: 'farmers',
    messageMr: `🚜 *GoMate ऊस तोडणी व वाहतूक विशेष सेवा* 🚚
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ऊस तोडणी व साखर कारखाना वाहतुकीसाठी **हायड्रॉलिक टिपिंग ट्रॉली व ट्रॅक्टर** तात्काळ उपलब्ध:

✅ *उपलब्ध वाहने:*
• ४-टन हायड्रॉलिक ट्रॉली: *₹600/तास*
• महिंद्रा / स्वराज ट्रॅक्टर: *₹1,500/दिवस*
• कंबाइन हार्वेस्टर: *₹4,200/दिवस*

👉 *वाहतूक बुक करण्यासाठी '1' पाठवा.*`
  },
  {
    id: 'owner_recruitment',
    title: '💼 ट्रॅक्टर व JCB मालकांसाठी विशेष कमाई संधी (Owner Recruitment)',
    target: 'owners',
    messageMr: `🚜 *GoMate Owner Pro — आपला ट्रॅक्टर रिकामा बसवू नका!* 💰
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
नमस्कार मशिनरी मालक मित्रांनो,
खरिप व रब्बी हंगामात जत तालुक्यातील शेतकऱ्यांकडून दररोज **ट्रॅक्टर, JCB व अवजारांना मोठी मागणी** आहे!

🎁 *गोमेट मालक फायदे:*
✅ परिसरातील शेतकऱ्यांकडून थेट ऑर्डर्स
✅ थेट बँक/UPI खात्यात १००% भाडे जमा
✅ ७ दिवस मोफत ट्रायल (नोंदणी फी ₹०)

👉 *आपली मशिनरी जोडण्यासाठी '2' पाठवा किंवा gomate-whatsapp-bot.onrender.com/owner उघडा.*`
  },
  {
    id: 'emergency_weather',
    title: '⛈️ हवामान अंदाज व तात्काळ काढणी अलर्ट (Weather & Harvest Notice)',
    target: 'all',
    messageMr: `⚠️ *GoMate कृषी हवामान व काढणी सूचना* ⛈️
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
हवामान खात्याच्या अंदाजानुसार पुढील ३ दिवसांत ढगाळ वातावरण व अवकाळी पावसाची शक्यता आहे.

🌾 *पिकांचे नुकसान टाळण्यासाठी तात्काळ हार्वेस्टर व मळणी यंत्रे उपलब्ध आहेत.*
👉 *तात्काळ बुकिंगसाठी '1' पाठवा.*`
  }
];

// In-memory broadcast audit history
const broadcastHistory = [
  {
    id: 'BC-2026-001',
    title: 'खरिप पूर्व नांगरट अलर्ट',
    target: 'farmers',
    recipientsCount: 48,
    deliveredCount: 48,
    status: 'COMPLETED',
    sentAt: '2026-08-28T09:30:00.000Z'
  }
];

/**
 * Get sample or registered audience for broadcast
 */
function getAudience(targetAudience = 'all', taluka = 'all') {
  const defaultRecipients = [
    { phone: '+919876500001', name: 'Ramesh Patil', role: 'customer', village: 'Shegaon' },
    { phone: '+919876500002', name: 'Suresh Shinde', role: 'customer', village: 'Sankh' },
    { phone: '+919876500003', name: 'Tukaram Mali', role: 'customer', village: 'Umadi' },
    { phone: '+919822012345', name: 'Rajesh Patil', role: 'owner', village: 'Jat' },
    { phone: '+919822067890', name: 'Anand Kulkarni', role: 'owner', village: 'Dafalapur' },
    { phone: '+918605470552', name: 'GoMate Live SIM', role: 'owner', village: 'Jat' }
  ];

  return defaultRecipients.filter(u => {
    if (targetAudience === 'farmers' && u.role !== 'customer') return false;
    if (targetAudience === 'owners' && u.role !== 'owner') return false;
    if (taluka !== 'all' && u.village.toLowerCase() !== taluka.toLowerCase()) return false;
    return true;
  });
}

/**
 * Execute a WhatsApp Broadcast
 */
async function executeBroadcast({ targetAudience = 'all', taluka = 'all', templateId = 'kharif_ploughing', customMessage = '' }) {
  let messageToSend = customMessage;

  if (!messageToSend) {
    const tmpl = BROADCAST_TEMPLATES.find(t => t.id === templateId) || BROADCAST_TEMPLATES[0];
    messageToSend = tmpl.messageMr;
  }

  const recipients = getAudience(targetAudience, taluka);
  let delivered = 0;
  let failed = 0;

  for (const r of recipients) {
    try {
      await sendWhatsAppDirect(r.phone, messageToSend);
      delivered++;
    } catch (err) {
      failed++;
    }
  }

  const logEntry = {
    id: `BC-${Date.now().toString().slice(-6)}`,
    title: templateId || 'Custom Broadcast',
    target: targetAudience,
    recipientsCount: recipients.length,
    deliveredCount: delivered,
    failedCount: failed,
    status: 'COMPLETED',
    sentAt: new Date().toISOString()
  };

  broadcastHistory.unshift(logEntry);

  return {
    success: true,
    totalRecipients: recipients.length,
    delivered,
    failed,
    preview: messageToSend,
    logEntry
  };
}

function getBroadcastTemplates() {
  return BROADCAST_TEMPLATES;
}

function getBroadcastHistory() {
  return broadcastHistory;
}

module.exports = {
  getBroadcastTemplates,
  getBroadcastHistory,
  executeBroadcast,
  getAudience
};
