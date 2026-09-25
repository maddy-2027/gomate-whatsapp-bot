/**
 * GoMate WhatsApp Interactive Message Engine (Baileys Multi-Device)
 * 
 * Provides:
 * 1. Native WhatsApp 1-tap quick reply buttons (Accept/Reject, Role Select, Category Select)
 * 2. Native WhatsApp single-select list menus (Service Tasks, Time Slots, Quick Actions)
 * 3. Transparent text fallback for non-supporting clients, Twilio webhooks & test suites
 * 4. Universal response extraction for all Baileys interactive response protobuf flavors
 */

const { generateWAMessageFromContent } = require('@whiskeysockets/baileys');

/**
 * Construct an Interactive Quick Reply Buttons Message
 * @param {object} params
 * @param {string} params.text - Main body text
 * @param {string} [params.footer] - Footer text (defaults to 'GoMate WhatsApp Portal')
 * @param {string} [params.title] - Header title
 * @param {Array<{id: string, title: string}>} params.buttons - Button definitions (max 3 for quick reply)
 */
function buildButtonMessage({ text, footer = 'GoMate — जत तालुका शेती व वाहतूक', title = 'GoMate Assistant', buttons = [] }) {
  const nativeButtons = buttons.slice(0, 3).map(btn => ({
    name: 'quick_reply',
    buttonParamsJson: JSON.stringify({
      display_text: btn.title,
      id: String(btn.id)
    })
  }));

  const interactivePayload = {
    viewOnceMessage: {
      message: {
        interactiveMessage: {
          header: { title, hasMediaAttachment: false },
          body: { text },
          footer: { text: footer },
          nativeFlowMessage: {
            buttons: nativeButtons
          }
        }
      }
    }
  };

  // Build clean text fallback with emoji buttons
  const emojiDigits = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'];
  const buttonLines = buttons.map((b, i) => `${emojiDigits[i] || '👉'} *${b.title}* (किंवा '${b.id}' पाठवा)`).join('\n');
  const fallbackText = `${text}\n\n━━━━━━━━━━━━━━━━━━━━\n${buttonLines}\n\n_${footer}_`;

  return {
    isInteractive: true,
    type: 'buttons',
    text,
    footer,
    buttons,
    fallbackText,
    interactivePayload,
    toString() {
      return fallbackText;
    }
  };
}

/**
 * Construct an Interactive Single-Select List Menu Message
 * @param {object} params
 * @param {string} params.text - Main body text
 * @param {string} [params.footer] - Footer text
 * @param {string} [params.title] - Header title
 * @param {string} [params.buttonTitle] - Button text to open menu
 * @param {Array<{title: string, rows: Array<{id: string, title: string, description?: string}>}>} params.sections
 */
function buildListMenuMessage({
  text,
  footer = 'GoMate — 125 Villages of Jath',
  title = 'GoMate Menu',
  buttonTitle = '📋 पर्याय निवडा (Select Option)',
  sections = []
}) {
  const interactivePayload = {
    viewOnceMessage: {
      message: {
        interactiveMessage: {
          header: { title, hasMediaAttachment: false },
          body: { text },
          footer: { text: footer },
          nativeFlowMessage: {
            buttons: [
              {
                name: 'single_select',
                buttonParamsJson: JSON.stringify({
                  title: buttonTitle,
                  sections
                })
              }
            ]
          }
        }
      }
    }
  };

  // Build clean text fallback
  let fallbackList = '';
  sections.forEach(sec => {
    fallbackList += `\n*${sec.title}:*\n`;
    sec.rows.forEach(r => {
      fallbackList += `👉 *${r.id}* — *${r.title}*${r.description ? ` (${r.description})` : ''}\n`;
    });
  });

  const fallbackText = `${text}\n━━━━━━━━━━━━━━━━━━━━${fallbackList}\n_${footer}_`;

  return {
    isInteractive: true,
    type: 'list',
    text,
    footer,
    buttonTitle,
    sections,
    fallbackText,
    interactivePayload,
    toString() {
      return fallbackText;
    }
  };
}

/**
 * Template: Role Selection (Farmer vs Machinery Owner)
 */
function getRoleSelectInteractive(lang = 'mr') {
  if (lang === 'mr') {
    return buildButtonMessage({
      title: 'GoMate मध्ये आपले स्वागत आहे! 🚜',
      text: `कृपया तुमची भूमिका निवडा:\n\n1️⃣ *शेतकरी / ग्राहक:* ट्रॅक्टर, जेसीबी किंवा वाहतूक गाडी भाड्याने हवी आहे.\n2️⃣ *मशिनरी मालक:* ट्रॅक्टर, जेसीबी किंवा टेम्पो गोमेटवर जोडून कमाई करायची आहे.`,
      buttons: [
        { id: '1', title: '👨‍🌾 शेतकरी (उपकरण हवे)' },
        { id: '2', title: '🚜 मशिनरी मालक (कमाई)' }
      ]
    });
  } else if (lang === 'hi') {
    return buildButtonMessage({
      title: 'GoMate में आपका स्वागत है! 🚜',
      text: `कृपया अपनी भूमिका चुनें:\n\n1️⃣ *किसान / ग्राहक:* ट्रैक्टर, जेसीबी या वाहन किराए पर चाहिए।\n2️⃣ *मशीनरी मालिक:* अपनी मशीनरी जोड़कर कमाई करनी है।`,
      buttons: [
        { id: '1', title: '👨‍🌾 किसान (मशीन चाहिए)' },
        { id: '2', title: '🚜 मशीन मालिक (कमाई)' }
      ]
    });
  } else {
    return buildButtonMessage({
      title: 'Welcome to GoMate! 🚜',
      text: `Please select your role:\n\n1️⃣ *Customer / Farmer:* Rent tractors, backhoes, or trucks.\n2️⃣ *Machinery Owner:* List equipment and start earning.`,
      buttons: [
        { id: '1', title: '👨‍🌾 Farmer / Rent' },
        { id: '2', title: '🚜 Machine Owner' }
      ]
    });
  }
}

/**
 * Template: Category Selection (Agri vs Transport vs Infra)
 */
function getCategorySelectInteractive(lang = 'mr') {
  if (lang === 'mr') {
    return buildButtonMessage({
      title: 'उपकरण श्रेणी निवडा 🚜',
      text: `*कोणत्या प्रकारची मशिनरी हवी आहे?*\n\n1️⃣ *शेती कामे:* ट्रॅक्टर, रोटाव्हेटर, नांगरट, पेरणी, हार्वेस्टर\n2️⃣ *मालवाहतूक:* छोटा हत्ती, बोलेरो, 407, पाणी टँकर, डंपर\n3️⃣ *बांधकाम व चर:* जेसीबी 3DX, 4DX, पोकलेन, बुलडोझर`,
      buttons: [
        { id: '1', title: '🚜 शेती कामे' },
        { id: '2', title: '🚚 मालवाहतूक' },
        { id: '3', title: '🏗️ जेसीबी व बांधकाम' }
      ]
    });
  } else if (lang === 'hi') {
    return buildButtonMessage({
      title: 'मशीनरी श्रेणी चुनें 🚜',
      text: `*किस प्रकार की मशीनरी चाहिए?*\n\n1️⃣ *कृषि कार्य:* ट्रैक्टर, रोटावेटर, जुताई, बुवाई\n2️⃣ *माल परिवहन:* छोटा हाथी, बोलेरो पिकअप, टैंकर\n3️⃣ *निर्माण कार्य:* जेसीबी, पोकलेन, बुलडोजर`,
      buttons: [
        { id: '1', title: '🚜 कृषि कार्य' },
        { id: '2', title: '🚚 माल परिवहन' },
        { id: '3', title: '🏗️ जेसीबी/निर्माण' }
      ]
    });
  } else {
    return buildButtonMessage({
      title: 'Select Machinery Category 🚜',
      text: `*Which equipment category do you need?*\n\n1️⃣ *Agriculture:* Tractors, rotavators, tillers, harvesters\n2️⃣ *Transport:* Tata Ace, Bolero Pickups, tankers, tippers\n3️⃣ *Infrastructure:* JCB 3DX, excavators, bulldozers`,
      buttons: [
        { id: '1', title: '🚜 Agriculture' },
        { id: '2', title: '🚚 Transport' },
        { id: '3', title: '🏗️ Infrastructure' }
      ]
    });
  }
}

/**
 * Template: Owner Dispatch Interactive Alert (1-Tap Accept / Reject)
 */
function getOwnerDispatchInteractive(bookingData, lang = 'mr') {
  const {
    bookingRef,
    equipModel,
    village,
    startDate,
    startTime,
    duration,
    totalAmount,
    advanceAmount,
    remainingAmount,
    farmerName,
    mapsUrl
  } = bookingData;

  const total = totalAmount || 3000;
  const advance = advanceAmount || Math.round(total * 0.20);
  const remaining = remainingAmount || (total - advance);

  const mapsNote = mapsUrl
    ? `\n🗺️ *शेताचा थेट नकाशा (Google Maps):*\n🔗 ${mapsUrl}\n`
    : '';

  const alertText = `🚨 *GoMate नवीन मशिनरी मागणी (New Booking Request)!* 🚜
━━━━━━━━━━━━━━━━━━━━
🔖 संदर्भ: *${bookingRef}*
🚜 उपकरण: *${equipModel}*
📍 कार्यक्षेत्र/गाव: *${village || 'जत तालुका'}*${mapsNote}
📅 तारीख: *${startDate}*
⏰ वेळ: *${startTime || '08:00 AM'}*
⏱️ कामाचे प्रमाण: *${duration || 'शेड्युलनुसार'}*
💰 एकूण बिल: *₹${total.toLocaleString('en-IN')}*
💳 गोमेटवर भरलेला आगाऊ (२०% टोकन): *₹${advance.toLocaleString('en-IN')}* (Paid ✅)
💵 काम झाल्यावर थेट ग्राहकाकडून रोख/UPI घ्यायचे (८०%): *₹${remaining.toLocaleString('en-IN')}*
👤 शेतकरी/ग्राहक: *${farmerName || 'शेतकरी'}*
━━━━━━━━━━━━━━━━━━━━
⚡ *पुढील १५ मिनिटांत १-टॅप उत्तर द्या:*`;

  return buildButtonMessage({
    title: '🚨 नवीन बुकिंग मागणी',
    text: alertText,
    footer: 'GoMate 2-Way Dispatch SLA (15 Mins)',
    buttons: [
      { id: '1', title: '✅ स्वीकारा (Accept)' },
      { id: '2', title: '❌ नाकारा (Decline)' }
    ]
  });
}

/**
 * Template: Schedule Time Slot List Menu
 */
function getScheduleSlotsInteractive(lang = 'mr') {
  if (lang === 'mr') {
    return buildListMenuMessage({
      title: '📅 तारीख व वेळ स्लॉट',
      text: 'उपकरण शेतात पोहोचण्यासाठी सोयीची वेळ निवडा:',
      buttonTitle: '⏰ वेळ स्लॉट निवडा',
      sections: [
        {
          title: 'लोकप्रिय वेळ स्लॉट',
          rows: [
            { id: '1', title: 'उद्या सकाळी (८:०० AM)', description: '⭐️ सर्वाधिक पसंतीची वेळ' },
            { id: '2', title: 'उद्या दुपारी (१:०० PM)', description: 'दुपारच्या सत्रात' },
            { id: '3', title: 'आज त्वरित डिलिव्हरी', description: '⚡ पुढील २ तासांत थेट शेतात हजर' },
            { id: '4', title: 'परवा सकाळी (८:०० AM)', description: 'आगाऊ नियोजन' }
          ]
        }
      ]
    });
  } else {
    return buildListMenuMessage({
      title: '📅 Schedule Time Slot',
      text: 'Select your preferred arrival slot for the equipment:',
      buttonTitle: '⏰ Select Slot',
      sections: [
        {
          title: 'Popular Time Slots',
          rows: [
            { id: '1', title: 'Tomorrow Morning (8:00 AM)', description: '⭐️ Most popular choice' },
            { id: '2', title: 'Tomorrow Afternoon (1:00 PM)', description: 'Afternoon session' },
            { id: '3', title: 'Today Immediate Dispatch', description: '⚡ Within 2 hours direct to farm' },
            { id: '4', title: 'Day After Tomorrow (8:00 AM)', description: 'Advance schedule' }
          ]
        }
      ]
    });
  }
}

/**
 * Extract user response text or button ID from incoming Baileys message
 */
function extractInteractiveResponse(message) {
  if (!message) return '';

  let m = message;
  // Unwrap viewOnceMessage if present
  if (m.viewOnceMessage?.message) m = m.viewOnceMessage.message;
  if (m.viewOnceMessageV2?.message) m = m.viewOnceMessageV2.message;

  // 1. Direct text
  if (m.conversation) return m.conversation;
  if (m.extendedTextMessage?.text) return m.extendedTextMessage.text;

  // 2. Buttons response (Legacy Buttons)
  if (m.buttonsResponseMessage?.selectedButtonId) {
    return m.buttonsResponseMessage.selectedButtonId;
  }
  if (m.buttonsResponseMessage?.selectedDisplayText) {
    return m.buttonsResponseMessage.selectedDisplayText;
  }

  // 3. Template button response
  if (m.templateButtonReplyMessage?.selectedId) {
    return m.templateButtonReplyMessage.selectedId;
  }
  if (m.templateButtonReplyMessage?.selectedDisplayText) {
    return m.templateButtonReplyMessage.selectedDisplayText;
  }

  // 4. List response (Single Select Menu)
  if (m.listResponseMessage?.singleSelectReply?.selectedRowId) {
    return m.listResponseMessage.singleSelectReply.selectedRowId;
  }
  if (m.listResponseMessage?.title) {
    return m.listResponseMessage.title;
  }

  // 5. Modern Interactive Response (Native Flow)
  if (m.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson) {
    try {
      const parsed = JSON.parse(m.interactiveResponseMessage.nativeFlowResponseMessage.paramsJson);
      if (parsed.id) return parsed.id;
    } catch (_) {}
  }
  if (m.interactiveResponseMessage?.body?.text) {
    return m.interactiveResponseMessage.body.text;
  }

  // 6. WhatsApp GPS Location pin
  if (m.locationMessage) {
    return `GPS_LOCATION:${m.locationMessage.degreesLatitude},${m.locationMessage.degreesLongitude}`;
  }

  return '';
}

/**
 * Safely send an interactive message or fallback to clean text
 */
async function sendInteractiveWhatsApp(waSocket, jid, messageData) {
  if (!waSocket) return false;

  const isInteractive = messageData && typeof messageData === 'object' && messageData.isInteractive;
  const fallbackText = isInteractive ? messageData.fallbackText : (typeof messageData === 'string' ? messageData : String(messageData));

  if (isInteractive && messageData.interactivePayload) {
    try {
      const waMsg = generateWAMessageFromContent(jid, messageData.interactivePayload, {
        userJid: waSocket.user?.id || 'gomate@s.whatsapp.net'
      });
      await waSocket.relayMessage(jid, waMsg.message, { messageId: waMsg.key.id });
      return true;
    } catch (err) {
      console.warn('⚠️ [Interactive] Native button relay failed, falling back to text:', err.message);
    }
  }

  // Fallback to text
  await waSocket.sendMessage(jid, { text: fallbackText });
  return true;
}

module.exports = {
  buildButtonMessage,
  buildListMenuMessage,
  getRoleSelectInteractive,
  getCategorySelectInteractive,
  getOwnerDispatchInteractive,
  getScheduleSlotsInteractive,
  extractInteractiveResponse,
  sendInteractiveWhatsApp
};
