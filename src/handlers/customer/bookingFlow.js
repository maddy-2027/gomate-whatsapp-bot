const { schedulePaymentVerification } = require('../../services/paymentWatcherService');
const { getText } = require('../../services/language');
const { createBooking } = require('../../db/bookings.repo');
const { createBookingPaymentLink } = require('../../services/razorpay');
const { sendWhatsAppDirect } = require('../../services/whatsappWeb');
const { sendOwnerDispatchAlert } = require('../../services/dispatchService');

/**
 * Format DD/MM/YYYY string helper
 */
function getOffsetDateString(daysOffset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  const dd = d.getDate().toString().padStart(2, '0');
  const mm = (d.getMonth() + 1).toString().padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/**
 * Step 1: Equipment Selected -> If attachments exist, prompt for service/task; otherwise prompt for Date & Time
 */
async function handleEquipmentSelect(phone, text, session) {
  const idx = parseInt(text.trim()) - 1;
  const results = session.data.searchResults;
  if (!isNaN(idx) && results && results[idx]) {
    session.data.selectedEquipment = results[idx];
    const equip = results[idx];
    const lang = session.language || 'mr';

    // Check category and present appropriate task options
    if (equip.category === 'agriculture' && (equip.type === 'Tractor' || (equip.service_rates && equip.service_rates.rotavator))) {
      session.state = 'BOOKING_SERVICE_SELECT';
      const sRates = equip.service_rates || {};
      
      let msg = '';
      if (lang === 'mr') {
        msg = `🚜 *${equip.model} — शेती कामाचा प्रकार निवडा:*
━━━━━━━━━━━━━━━━━━━━
मालकाचे तास व एकर दर (Hourly / Acre Rates):

1️⃣ *रोटाव्हेटर काम (Rotavator)* — ₹${sRates.rotavator ? sRates.rotavator.rate : 800}/तास | ₹${sRates.rotavator?.acre_rate || 950}/एकर
2️⃣ *कल्टीव्हेटर / मशागत (Cultivator)* — ₹${sRates.cultivation ? sRates.cultivation.rate : 900}/तास | ₹${sRates.cultivation?.acre_rate || 850}/एकर
3️⃣ *ट्रॉली मालवाहतूक (Trolley)* — ₹${sRates.trolley ? sRates.trolley.rate : 600}/तास
4️⃣ *नांगरट (Deep Plough)* — ₹${sRates.ploughing ? sRates.ploughing.rate : 850}/तास | ₹${sRates.ploughing?.acre_rate || 1200}/एकर
5️⃣ *पेरणी यंत्र (Seed Drill)* — ₹${sRates.seeding ? sRates.seeding.rate : 750}/तास | ₹${sRates.seeding?.acre_rate || 700}/एकर

_हव्या असलेल्या अवजाराचा क्रमांक (१-५) निवडा:_`;
      } else {
        msg = `🚜 *${equip.model} — Select Farm Attachment Task:*
━━━━━━━━━━━━━━━━━━━━
Hourly & Per Acre Rates:

1️⃣ *Rotavator Tilth* — ₹${sRates.rotavator ? sRates.rotavator.rate : 800}/hr | ₹${sRates.rotavator?.acre_rate || 950}/acre
2️⃣ *Cultivation / Weeding* — ₹${sRates.cultivation ? sRates.cultivation.rate : 900}/hr | ₹${sRates.cultivation?.acre_rate || 850}/acre
3️⃣ *Trolley Transport* — ₹${sRates.trolley ? sRates.trolley.rate : 600}/hr
4️⃣ *Deep Ploughing* — ₹${sRates.ploughing ? sRates.ploughing.rate : 850}/hr | ₹${sRates.ploughing?.acre_rate || 1200}/acre
5️⃣ *Seed Drill Sowing* — ₹${sRates.seeding ? sRates.seeding.rate : 750}/hr | ₹${sRates.seeding?.acre_rate || 700}/acre

_Reply with option number (1-5):_`;
      }
      return msg;
    } else if (equip.category === 'transport') {
      session.state = 'BOOKING_SERVICE_SELECT';
      const baseFare = equip.km_base_fare || 350;
      const perKm = equip.per_km_rate || 22;
      
      let msg = '';
      if (lang === 'mr') {
        msg = `🚚 *${equip.model} — मालवाहतूक दर निवडा:*
━━━━━━━━━━━━━━━━━━━━
किलोमीटरनुसार दर (Distance-Based Rates):

1️⃣ *स्थानिक वाहतूक (Local Haulage)* — बेस ₹${baseFare} (५ किमी) + ₹${perKm}/कि.मी.
2️⃣ *मार्केट ट्रिप / लांब पल्ला (Market Trip)* — बेस ₹400 (५ किमी) + ₹24/कि.मी.
3️⃣ *जिल्हा / इंटरसिटी वाहतूक (Intercity)* — बेस ₹600 (५ किमी) + ₹32/कि.मी.

_पर्याय क्रमांक (१-३) निवडा:_`;
      } else {
        msg = `🚚 *${equip.model} — Select Transport Option:*
━━━━━━━━━━━━━━━━━━━━
Distance-Based Kilometer Rates:

1️⃣ *Local Village Haulage* — Base ₹${baseFare} (5 km) + ₹${perKm}/km
2️⃣ *Market Produce Trip* — Base ₹400 (5 km) + ₹24/km
3️⃣ *Intercity Transport* — Base ₹600 (5 km) + ₹32/km

_Reply with option number (1-3):_`;
      }
      return msg;
    } else if (equip.category === 'infrastructure') {
      session.state = 'BOOKING_SERVICE_SELECT';
      const hourlyRate = equip.hourly_rate || 950;
      const dailyRate = equip.price_per_day || 4500;

      let msg = '';
      if (lang === 'mr') {
        msg = `🏗️ *${equip.model} — खोदकाम / बांधकाम पर्याय निवडा:*
━━━━━━━━━━━━━━━━━━━━
1️⃣ *शेततळे व चर खोदकाम (Trench & Farm Pond)* — ₹${hourlyRate}/तास
2️⃣ *जमीन सपाटीकरण (Land Leveling)* — ₹${hourlyRate}/तास
3️⃣ *पूर्ण दिवस ऑपरेटरसह (Full Day Hire)* — ₹${dailyRate.toLocaleString('en-IN')}/दिवस

_पर्याय क्रमांक (१-३) निवडा:_`;
      } else {
        msg = `🏗️ *${equip.model} — Select Earthmoving Task:*
━━━━━━━━━━━━━━━━━━━━
1️⃣ *Trench & Farm Pond Digging* — ₹${hourlyRate}/hr
2️⃣ *Land Leveling* — ₹${hourlyRate}/hr
3️⃣ *Full Day Hire with Operator* — ₹${dailyRate.toLocaleString('en-IN')}/day

_Reply with option number (1-3):_`;
      }
      return msg;
    }

    session.state = 'BOOKING_DATES';
    const rate = equip.price_per_day || 1500;
    const location = session.data.location || equip.district || 'पुणे';

    if (lang === 'mr') {
      return `📅 *GoMate आगाऊ बुकिंग शेड्युलिंग (Advance Schedule)*
━━━━━━━━━━━━━━━━━━━━
उपकरण: *${equip.model}*
दर: *₹${rate.toLocaleString('en-IN')}/दिवस*
स्थान: *${location}*

📍 *पायरी १/२: तारीख व वेळ स्लॉट निवडा:*
1️⃣ *उद्या सकाळी (८:०० AM)* ⭐️ सर्वाधिक पसंती
2️⃣ *उद्या दुपारी (१:०० PM)*
3️⃣ *आज त्वरित डिलिव्हरी (२ तासांत)*
4️⃣ *परवा सकाळी (८:०० AM)*

_किंवा तुमची तारीख व वेळ टाईप करा (उदा. 'उद्या सकाळी 9 वाजता 2 तास' किंवा '28 ऑगस्ट 8 am')_
_(मुख्य मेनूसाठी *0* पाठवा)_`;
    } else {
      return `📅 *GoMate Advance Equipment Scheduler*
━━━━━━━━━━━━━━━━━━━━
Equipment: *${equip.model}*
Daily Rate: *₹${rate.toLocaleString('en-IN')}/day*
Location: *${location}*

📍 *Step 1 of 2: Select Date & Time Slot*
1️⃣ *Tomorrow Morning (8:00 AM)* ⭐️ Most Popular
2️⃣ *Tomorrow Afternoon (1:00 PM)*
3️⃣ *Today Immediate Dispatch (within 2 hours)*
4️⃣ *Day After Tomorrow (8:00 AM)*

_Or reply with custom date & time (e.g. 'Tomorrow 9 AM for 2 hours')_
_(Reply *0* for Main Menu)_`;
    }
  }
  return getText(session.language, 'invalid_selection');
}

/**
 * Handle Service Attachment / Task Selection (Category-Aware)
 */
async function handleServiceSelect(phone, text, session) {
  const t = text.trim();
  const equip = session.data.selectedEquipment || {};
  const lang = session.language || 'mr';
  const cat = equip.category || 'agriculture';

  let serviceName = 'Base Machine Hire';
  let hourlyRate = equip.hourly_rate || 600;
  let acreRate = 950;
  let baseFare = equip.km_base_fare || 350;
  let perKm = equip.per_km_rate || 22;
  let unit = 'hr';

  if (cat === 'agriculture') {
    if (t === '1' || t.toLowerCase().includes('rotavator') || t.includes('रोटाव्हेटर')) {
      serviceName = 'Rotavator (रोटाव्हेटर)';
      hourlyRate = (equip.service_rates && equip.service_rates.rotavator && equip.service_rates.rotavator.rate) || 800;
      acreRate = (equip.service_rates && equip.service_rates.rotavator && equip.service_rates.rotavator.acre_rate) || 950;
    } else if (t === '2' || t.toLowerCase().includes('cultivator') || t.includes('कल्टीव्हेटर')) {
      serviceName = 'Cultivator (कल्टीव्हेटर / मशागत)';
      hourlyRate = (equip.service_rates && equip.service_rates.cultivation && equip.service_rates.cultivation.rate) || 900;
      acreRate = (equip.service_rates && equip.service_rates.cultivation && equip.service_rates.cultivation.acre_rate) || 850;
    } else if (t === '3' || t.toLowerCase().includes('trolley') || t.includes('ट्रॉली')) {
      serviceName = 'Hydraulic Trolley (ट्रॉली वाहतूक)';
      hourlyRate = (equip.service_rates && equip.service_rates.trolley && equip.service_rates.trolley.rate) || 600;
      acreRate = 600;
    } else if (t === '4' || t.toLowerCase().includes('plough') || t.includes('नांगरट')) {
      serviceName = 'Deep Plough (नांगरट)';
      hourlyRate = (equip.service_rates && equip.service_rates.ploughing && equip.service_rates.ploughing.rate) || 850;
      acreRate = (equip.service_rates && equip.service_rates.ploughing && equip.service_rates.ploughing.acre_rate) || 1200;
    } else if (t === '5' || t.toLowerCase().includes('seed') || t.includes('पेरणी')) {
      serviceName = 'Seed Drill (पेरणी यंत्र)';
      hourlyRate = (equip.service_rates && equip.service_rates.seeding && equip.service_rates.seeding.rate) || 750;
      acreRate = (equip.service_rates && equip.service_rates.seeding && equip.service_rates.seeding.acre_rate) || 700;
    } else {
      serviceName = 'General Tractor Day Hire';
      hourlyRate = Math.round((equip.price_per_day || 1500) / 2.5);
      acreRate = 1000;
      unit = 'day';
    }
  } else if (cat === 'transport') {
    unit = 'km';
    if (t === '1' || t.toLowerCase().includes('local') || t.includes('स्थानिक')) {
      serviceName = 'Local Village Haulage (स्थानिक वाहतूक)';
      baseFare = equip.km_base_fare || 350;
      perKm = equip.per_km_rate || 22;
    } else if (t === '2' || t.toLowerCase().includes('market') || t.includes('मार्केट')) {
      serviceName = 'Market Produce Transport (मार्केट ट्रिप)';
      baseFare = 400;
      perKm = 24;
    } else {
      serviceName = 'Intercity Goods Transport (लांब पल्ला)';
      baseFare = 600;
      perKm = 32;
    }
  } else if (cat === 'infrastructure') {
    if (t === '1' || t.includes('चर') || t.includes('शेततळे') || t.toLowerCase().includes('trench')) {
      serviceName = 'Trench & Pond Digging (शेततळे व चर)';
      hourlyRate = equip.hourly_rate || 950;
    } else if (t === '2' || t.includes('सपाटीकरण') || t.toLowerCase().includes('level')) {
      serviceName = 'Land Leveling (जमीन सपाटीकरण)';
      hourlyRate = equip.hourly_rate || 950;
    } else {
      serviceName = 'Full Day Heavy Machinery Hire';
      hourlyRate = Math.round((equip.price_per_day || 4500) / 4.5);
      unit = 'day';
    }
  }

  session.data.selectedService = {
    name: serviceName,
    hourly_rate: hourlyRate,
    acre_rate: acreRate,
    base_fare: baseFare,
    per_km: perKm,
    unit
  };

  session.state = 'BOOKING_DATES';

  let ratePreview = `₹${hourlyRate}/तास`;
  if (cat === 'agriculture') ratePreview = `₹${hourlyRate}/तास किंवा ₹${acreRate}/एकर`;
  else if (cat === 'transport') ratePreview = `बेस ₹${baseFare} (+₹${perKm}/कि.मी.)`;

  if (lang === 'mr') {
    return `✅ निवडले: *${serviceName}* (दर: *${ratePreview}*)
━━━━━━━━━━━━━━━━━━━━
📍 *आता कामाची तारीख व वेळ स्लॉट निवडा:*
1️⃣ *उद्या सकाळी (८:०० AM)* ⭐️ सर्वाधिक पसंती
2️⃣ *उद्या दुपारी (१:०० PM)*
3️⃣ *आज त्वरित डिलिव्हरी (२ तासांत)*
4️⃣ *परवा सकाळी (८:०० AM)*

_किंवा तुमची तारीख व वेळ टाईप करा (उदा. 'उद्या सकाळी 8 वाजता 2 तास' किंवा 'उद्या 2 एकर')_`;
  } else {
    return `✅ Selected: *${serviceName}* (Rate: *${ratePreview}*)
━━━━━━━━━━━━━━━━━━━━
📍 *Now Select Date & Time Slot:*
1️⃣ *Tomorrow Morning (8:00 AM)* ⭐️ Most Popular
2️⃣ *Tomorrow Afternoon (1:00 PM)*
3️⃣ *Today Immediate Dispatch (within 2 hours)*
4️⃣ *Day After Tomorrow (8:00 AM)*

_Or reply with custom date & time (e.g. 'Tomorrow 8 AM for 2 hours' or '2 acres')_`;
  }
}

/**
 * Step 2: Handle Date & Time Input (Uber-Style Slot or Natural Input)
 */
async function handleDateInput(phone, text, session) {
  const t = (text || '').trim();
  const lower = t.toLowerCase();
  const lang = session.language || 'mr';

  let startDate = getOffsetDateString(1); // default tomorrow
  let startTime = '08:00 AM';
  let duration = null;
  let quantity = 1;

  // Extract quantity if mentioned (e.g. "2 tractors", "5 JCB")
  const qtyMatch = t.match(/\b([1-9][0-9]?)\s*(tractor|tractors|ट्रॅक्टर|jcb|जेसीबी|truck|trucks|हत्ती)\b/i);
  if (qtyMatch) quantity = parseInt(qtyMatch[1]) || 1;

  // Check Option Buttons (1, 2, 3, 4)
  if (t === '1' || lower === 'tomorrow morning' || lower === 'उद्या सकाळी' || lower === 'कल सुबह') {
    startDate = getOffsetDateString(1);
    startTime = '08:00 AM';
  } else if (t === '2' || lower === 'tomorrow afternoon' || lower === 'उद्या दुपारी' || lower === 'कल दोपहर') {
    startDate = getOffsetDateString(1);
    startTime = '01:00 PM';
  } else if (t === '3' || lower === 'today' || lower === 'आज' || lower === 'immediate' || lower === 'त्वरित') {
    startDate = getOffsetDateString(0);
    startTime = 'Immediate (Within 2 hrs)';
  } else if (t === '4' || lower === 'day after' || lower === 'परवा' || lower === 'परसों') {
    startDate = getOffsetDateString(2);
    startTime = '08:00 AM';
  } else {
    // Custom natural date & time parsing
    if (lower.includes('उद्या') || lower.includes('कल') || lower.includes('tomorrow')) {
      startDate = getOffsetDateString(1);
    } else if (lower.includes('आज') || lower.includes('today')) {
      startDate = getOffsetDateString(0);
    } else if (lower.includes('परवा') || lower.includes('परसों')) {
      startDate = getOffsetDateString(2);
    } else {
      const dateMatch = t.match(/\b([0-3]?[0-9][\/\-.][0-1]?[0-9][\/\-.]?[0-9]{0,4})\b/);
      if (dateMatch) startDate = dateMatch[1];
    }

    // Extract time (e.g. "9 am", "8:30 am", "10 am", "2 pm", "९ वाजता")
    const timeMatch = t.match(/([0-1]?[0-9](?::[0-5][0-9])?)\s*(am|pm|वाजता|बजे)?/i);
    if (timeMatch && (timeMatch[2] || lower.includes('am') || lower.includes('pm') || lower.includes('वाजता') || lower.includes('बजे') || lower.includes('सकाळी') || lower.includes('सुबह'))) {
      const hr = timeMatch[1].includes(':') ? timeMatch[1] : `${timeMatch[1].padStart(2, '0')}:00`;
      const meridiem = (lower.includes('pm') || lower.includes('दुपारी') || lower.includes('दोपहर') || lower.includes('संध्याकाळी') || lower.includes('शाम')) ? 'PM' : 'AM';
      startTime = `${hr} ${meridiem}`;
    }
  }

  // Check if duration / hours was also provided in this message (e.g. "for 3 hours", "3 तास", "2 hours", "3 दिवस")
  const hourMatch = t.match(/([1-9][0-9]?)\s*(?:hour|hours|तास|घंटे|hr|hrs)/i);
  const isHourly = !!session.data.selectedService && session.data.selectedService.unit === 'hr';

  if (hourMatch) {
    duration = parseInt(hourMatch[1]);
  } else {
    const durMatch = t.match(/([1-9][0-9]?)\s*(?:day|days|दिवस|दिन|दिवसांचे|दिवसांसाठी|दिनों|वार)/i);
    if (durMatch) {
      duration = parseInt(durMatch[1]);
    } else if (lower.includes('week') || lower.includes('आठवडा') || lower.includes('हफ्ता')) {
      duration = 7;
    }
  }

  session.data.startDate = startDate;
  session.data.startTime = startTime;
  session.data.quantity = quantity;

  // If duration was already included in 1 shot, create final booking immediately!
  if (duration) {
    session.data.duration = duration;
    return await createFinalBookingAndPayment(phone, session);
  }

  // Otherwise, transition to BOOKING_DURATION step
  session.state = 'BOOKING_DURATION';
  const equip = session.data.selectedEquipment || { model: 'Mahindra 575 DI Tractor (45 HP)', hourly_rate: 750, price_per_day: 1500 };
  const selectedService = session.data.selectedService;
  const cat = equip.category || 'agriculture';
  const hourlyRate = selectedService ? (selectedService.hourly_rate || 750) : (equip.hourly_rate || Math.round((equip.price_per_day || 1500) / 2.5));
  const acreRate = (selectedService && selectedService.acre_rate) || 950;
  const baseFare = (selectedService && selectedService.base_fare) || 350;
  const perKm = (selectedService && selectedService.per_km) || 22;

  if (cat === 'agriculture') {
    if (lang === 'mr') {
      return `🌾 *पायरी २/२: कामाचे तास किंवा एकर निवडा:*
━━━━━━━━━━━━━━━━━━━━
🚜 काम: *${selectedService ? selectedService.name : equip.model}*
📅 तारीख: *${startDate}* (${startTime})
💰 दर: *₹${hourlyRate}/तास* किंवा *₹${acreRate}/एकर*

⏱️ *तासानुसार (Hourly Booking):*
1️⃣ *१ तास* (₹${hourlyRate * 1 + 49})
2️⃣ *२ तास* (₹${hourlyRate * 2 + 49}) ⭐️ शेतकरी पसंती
3️⃣ *३ तास* (₹${hourlyRate * 3 + 49})
4️⃣ *४ तास (अर्धा दिवस)* (₹${hourlyRate * 4 + 49})

🌾 *एकराप्रमाणे (Per Acre Booking):*
5️⃣ *१ एकर* (₹${acreRate * 1 + 49})
6️⃣ *२ एकर* (₹${acreRate * 2 + 49}) ⭐️ पसंती
7️⃣ *३ एकर* (₹${acreRate * 3 + 49})
8️⃣ *५ एकर* (₹${acreRate * 5 + 49})

_किंवा टाईप करा (उदा. '२ तास' किंवा '३ एकर')_
_(रद्द करण्यासाठी *0* पाठवा)_`;
    } else {
      return `🌾 *Step 2 of 2: Select Duration in Hours or Acres:*
━━━━━━━━━━━━━━━━━━━━
🚜 Task: *${selectedService ? selectedService.name : equip.model}*
📅 Date: *${startDate}* (${startTime})
💰 Rate: *₹${hourlyRate}/hr* or *₹${acreRate}/acre*

⏱️ *By Hours:*
1️⃣ *1 Hour* (₹${hourlyRate * 1 + 49})
2️⃣ *2 Hours* (₹${hourlyRate * 2 + 49}) ⭐️ Most Popular
3️⃣ *3 Hours* (₹${hourlyRate * 3 + 49})
4️⃣ *4 Hours (Half Day)* (₹${hourlyRate * 4 + 49})

🌾 *By Acres:*
5️⃣ *1 Acre* (₹${acreRate * 1 + 49})
6️⃣ *2 Acres* (₹${acreRate * 2 + 49}) ⭐️ Popular
7️⃣ *3 Acres* (₹${acreRate * 3 + 49})
8️⃣ *5 Acres* (₹${acreRate * 5 + 49})

_Or type quantity (e.g. '2 hours' or '3 acres')_
_(Reply *0* to cancel)_`;
    }
  } else if (cat === 'transport') {
    if (lang === 'mr') {
      return `🚚 *पायरी २/२: मालवाहतुकीचे अंतर (Kilometers) निवडा:*
━━━━━━━━━━━━━━━━━━━━
📦 प्रकार: *${selectedService ? selectedService.name : equip.model}*
📅 तारीख: *${startDate}* (${startTime})
💰 दर: *बेस ₹${baseFare} (पहिले ५ km)* + *₹${perKm}/कि.मी.*

1️⃣ *१० कि.मी.* (₹${baseFare + 5 * perKm + 49})
2️⃣ *१५ कि.मी.* (₹${baseFare + 10 * perKm + 49}) ⭐️ पसंती
3️⃣ *२५ कि.मी.* (₹${baseFare + 20 * perKm + 49})
4️⃣ *५० कि.मी.* (₹${baseFare + 45 * perKm + 49})

_किंवा अंतर टाईप करा (उदा. '18 km' किंवा '20 कि.मी.')_
_(रद्द करण्यासाठी *0* पाठवा)_`;
    } else {
      return `🚚 *Step 2 of 2: Select Transport Distance (Km):*
━━━━━━━━━━━━━━━━━━━━
📦 Service: *${selectedService ? selectedService.name : equip.model}*
📅 Date: *${startDate}* (${startTime})
💰 Rate: *Base ₹${baseFare} (first 5 km)* + *₹${perKm}/km*

1️⃣ *10 km* (₹${baseFare + 5 * perKm + 49})
2️⃣ *15 km* (₹${baseFare + 10 * perKm + 49}) ⭐️ Popular
3️⃣ *25 km* (₹${baseFare + 20 * perKm + 49})
4️⃣ *50 km* (₹${baseFare + 45 * perKm + 49})

_Or type distance (e.g. '18 km' or '25')_
_(Reply *0* to cancel)_`;
    }
  } else {
    // Infrastructure
    if (lang === 'mr') {
      return `⏱️ *पायरी २/२: कामाचे तास (Hours) निवडा:*
━━━━━━━━━━━━━━━━━━━━
🚜 उपकरण: *${selectedService ? `${equip.model} (${selectedService.name})` : equip.model}*
📅 तारीख: *${startDate}* (${startTime})
💰 दर: *₹${hourlyRate}/तास (Hourly Rate)*

1️⃣ *१ तास* (₹${hourlyRate * 1 + 49})
2️⃣ *२ तास* (₹${hourlyRate * 2 + 49}) ⭐️ पसंती
3️⃣ *३ तास* (₹${hourlyRate * 3 + 49})
4️⃣ *४ तास (अर्धा दिवस)* (₹${hourlyRate * 4 + 49})
5️⃣ *६ तास* (₹${hourlyRate * 6 + 49})
6️⃣ *८ तास (पूर्ण दिवस)* (₹${hourlyRate * 8 + 49})

_किंवा तासांची संख्या टाईप करा (उदा. '२ तास', '३ तास' किंवा '४')_
_(रद्द करण्यासाठी *0* पाठवा)_`;
    } else {
      return `⏱️ *Step 2 of 2: Select Duration in Hours:*
━━━━━━━━━━━━━━━━━━━━
🚜 Equipment: *${selectedService ? `${equip.model} (${selectedService.name})` : equip.model}*
📅 Scheduled: *${startDate}* (${startTime})
💰 Rate: *₹${hourlyRate}/hour (Hourly Rate)*

1️⃣ *1 Hour* (₹${hourlyRate * 1 + 49})
2️⃣ *2 Hours* (₹${hourlyRate * 2 + 49}) ⭐️ Most Popular
3️⃣ *3 Hours* (₹${hourlyRate * 3 + 49})
4️⃣ *4 Hours (Half Day)* (₹${hourlyRate * 4 + 49})
5️⃣ *6 Hours* (₹${hourlyRate * 6 + 49})
6️⃣ *8 Hours (Full Day)* (₹${hourlyRate * 8 + 49})

_Or reply with required hours (e.g. '2 hours' or '3')_
_(Reply *0* to cancel)_`;
    }
  }
}

/**
 * Step 3: Handle Duration Input (Always in Hours)
 */
async function handleDurationInput(phone, text, session) {
  const t = (text || '').trim();
  const lower = t.toLowerCase();
  const equip = session.data.selectedEquipment || {};
  const cat = equip.category || 'agriculture';

  let billingMode = 'hourly';
  let duration = 2;
  let acres = 1;
  let distanceKm = 10;

  if (cat === 'agriculture') {
    // Check for explicit acre inputs or options 5, 6, 7, 8
    const acreMatch = t.match(/([1-9][0-9]?)\s*(?:एकर|acre|acres)/i);
    if (acreMatch) {
      billingMode = 'acre';
      acres = parseInt(acreMatch[1]);
    } else if (t === '5') {
      billingMode = 'acre';
      acres = 1;
    } else if (t === '6') {
      billingMode = 'acre';
      acres = 2;
    } else if (t === '7') {
      billingMode = 'acre';
      acres = 3;
    } else if (t === '8') {
      billingMode = 'acre';
      acres = 5;
    } else {
      billingMode = 'hourly';
      if (t === '1' || lower.includes('1 तास') || lower.includes('1 hr') || lower.includes('1 hour') || lower.includes('1 घंटा')) duration = 1;
      else if (t === '2' || lower.includes('2 तास') || lower.includes('2 hr') || lower.includes('2 hours') || lower.includes('2 घंटे')) duration = 2;
      else if (t === '3' || lower.includes('3 तास') || lower.includes('3 hr') || lower.includes('3 hours') || lower.includes('3 घंटे')) duration = 3;
      else if (t === '4' || lower.includes('4 तास') || lower.includes('4 hr') || lower.includes('4 hours') || lower.includes('4 घंटे') || lower.includes('half day') || lower.includes('अर्धा दिवस')) duration = 4;
      else {
        const numMatch = t.match(/\b([1-9][0-9]?)\b/);
        if (numMatch) duration = parseInt(numMatch[1]);
      }
    }
  } else if (cat === 'transport') {
    billingMode = 'km';
    const kmMatch = t.match(/([1-9][0-9]?)\s*(?:km|किमी|कि\.मी|किलोमीटर)/i);
    if (kmMatch) {
      distanceKm = parseInt(kmMatch[1]);
    } else if (t === '1') distanceKm = 10;
    else if (t === '2') distanceKm = 15;
    else if (t === '3') distanceKm = 25;
    else if (t === '4') distanceKm = 50;
    else {
      const numMatch = t.match(/\b([1-9][0-9]?)\b/);
      if (numMatch) distanceKm = parseInt(numMatch[1]);
    }
  } else {
    // Infrastructure
    billingMode = 'hourly';
    if (t === '1' || lower.includes('1 तास') || lower.includes('1 hr')) duration = 1;
    else if (t === '2' || lower.includes('2 तास') || lower.includes('2 hr')) duration = 2;
    else if (t === '3' || lower.includes('3 तास') || lower.includes('3 hr')) duration = 3;
    else if (t === '4' || lower.includes('4 तास') || lower.includes('4 hr')) duration = 4;
    else if (t === '5' || lower.includes('6 तास') || lower.includes('6 hr')) duration = 6;
    else if (t === '6' || lower.includes('8 तास') || lower.includes('8 hr')) duration = 8;
    else {
      const numMatch = t.match(/\b([1-9][0-9]?)\b/);
      if (numMatch) duration = parseInt(numMatch[1]);
    }
  }

  session.data.billingMode = billingMode;
  session.data.duration = duration;
  session.data.acres = acres;
  session.data.distanceKm = distanceKm;

  return await createFinalBookingAndPayment(phone, session);
}

/**
 * Creates final booking record, generates Razorpay UPI payment link & returns Uber-style schedule summary
 */
async function createFinalBookingAndPayment(phone, session) {
  const equip = session.data.selectedEquipment || {
    id: 101,
    model: 'Mahindra 575 DI (45 HP)',
    price_per_day: 1500,
    hourly_rate: 600,
    district: session.data.location || 'Pune'
  };

  const selectedService = session.data.selectedService;
  const billingMode = session.data.billingMode || 'hourly';
  const quantity = session.data.quantity || 1;
  const startDate = session.data.startDate || getOffsetDateString(1);
  const startTime = session.data.startTime || '08:00 AM';
  const PLATFORM_FEE = 49;

  let duration = session.data.duration || (billingMode === 'acre' ? (session.data.acres || 1) : (billingMode === 'km' ? (session.data.distanceKm || 10) : 2));
  let rentalAmount = 0;
  let unitDesc = '';
  let durationDays = 0.125;

  if (billingMode === 'acre') {
    const acreRate = (selectedService && selectedService.acre_rate) || 950;
    const acres = session.data.acres || 1;
    rentalAmount = acreRate * acres;
    unitDesc = `${acres} एकर (₹${acreRate}/एकर)`;
    durationDays = Math.max(0.125, acres * 0.25);
  } else if (billingMode === 'km') {
    const baseFare = (selectedService && selectedService.base_fare) || (equip.km_base_fare || 350);
    const perKm = (selectedService && selectedService.per_km) || (equip.per_km_rate || 22);
    const dist = session.data.distanceKm || 10;
    const extraKm = Math.max(0, dist - 5);
    rentalAmount = baseFare + (extraKm * perKm);
    unitDesc = `${dist} कि.मी. (बेस ₹${baseFare} + ${extraKm} km × ₹${perKm}/km)`;
    durationDays = 0.125;
  } else {
    const unitRate = selectedService ? (selectedService.hourly_rate || 800) : (equip.hourly_rate || 600);
    duration = session.data.duration || 2;
    rentalAmount = unitRate * duration * quantity;
    unitDesc = `${duration} तास (₹${unitRate}/तास)`;
    durationDays = Math.max(0.125, duration / 8);
  }

  const totalAmount = rentalAmount + PLATFORM_FEE;

  session.data.totalAmount = totalAmount;
  session.data.rentalTotal = rentalAmount;
  session.data.platformFee = PLATFORM_FEE;

  const customerName = session.customerName || session.data.customerName || 'Customer';
  const modelText = quantity > 1 ? `${quantity}x ${equip.model}` : equip.model;

  // 1. Create Booking Reference (GM-XXXX)
  let booking;
  try {
    booking = await createBooking({
      customer_phone: phone,
      customer_name: customerName,
      equipment_id: equip.id || 101,
      equipment_name: `${equip.model} [${selectedService ? selectedService.name : 'Machinery'}]`,
      village: session.data.location || 'Jath',
      billing_mode: billingMode,
      hours: session.data.duration || 1,
      acres: session.data.acres || 1,
      distance_km: session.data.distanceKm || 5,
      start_date: `${startDate} at ${startTime} (${unitDesc})`,
      duration_days: durationDays,
      total_amount: totalAmount,
      status: 'pending'
    });
  } catch (err) {
    booking = { booking_ref: 'GM-' + Math.random().toString(36).substring(2, 6).toUpperCase() };
  }
  session.data.bookingRef = booking.booking_ref;

  // Schedule automated payment verification in 1-3 minutes
  schedulePaymentVerification({
    booking_ref: booking.booking_ref,
    customer_phone: phone,
    customer_name: customerName,
    equipment_name: modelText,
    village: session.data.location,
    duration,
    total_amount: totalAmount
  }, 90000);

  // 2. Generate Real / Demo UPI Payment Link
  const payObj = await createBookingPaymentLink(
    phone,
    totalAmount,
    booking.booking_ref,
    modelText
  );
  const payLink = (payObj && payObj.short_url) ? payObj.short_url : 'https://rzp.io/l/gomate-booking';
  session.data.payLink = payLink;

  // 3. Trigger 2-Way Interactive Dispatch Alert to Local Equipment Owner
  await sendOwnerDispatchAlert({
    bookingRef: booking.booking_ref,
    farmerPhone: phone,
    farmerName: customerName,
    equipModel: modelText,
    village: session.data.location,
    startDate,
    startTime,
    duration,
    rentalAmount,
    totalAmount
  }).catch(err => console.warn('Dispatch alert error:', err.message));

  // Clear active quote
  delete session.data.lastQuote;
  session.state = 'BOOKING_CONFIRM';

  const lang = session.language || 'mr';

  if (lang === 'mr') {
    return `🎉 *तुमचे उपकरण यशस्वीरित्या शेड्युल झाले आहे!* 🚜
━━━━━━━━━━━━━━━━━━━━
🚜 उपकरण / काम: *${selectedService ? `${modelText} (${selectedService.name})` : modelText}*
🔖 बुकिंग संदर्भ: *${booking.booking_ref}*
📅 शेड्युल तारीख: *${startDate}*
⏰ पोहोचण्याची वेळ: *${startTime} (अचूक वेळेत)*
⏱️ कामाचा हिशोब: *${unitDesc}*
📍 कार्यक्षेत्र: *${session.data.location || 'महाराष्ट्र शेत/साइट'}*
👤 ऑपरेटर/चालक: *व्हेरिफाइड ड्रायव्हर समाविष्ट (GoMate हमी)*
━━━━━━━━━━━━━━━━━━━━
• भाडे रक्कम: *₹${rentalAmount.toLocaleString('en-IN')}* (${unitDesc})
• गोमेट सुरक्षा व सहाय्य फी: *₹${PLATFORM_FEE}*
💰 *एकूण देय रक्कम: ₹${totalAmount.toLocaleString('en-IN')}*
━━━━━━━━━━━━━━━━━━━━

👉 *बुकिंग निश्चित करण्यासाठी UPI पेमेंट करा:*
🔗 ${payLink}
_(PhonePe, Google Pay, Paytm किंवा BHIM UPI द्वारे त्वरित पेमेंट करा)_

📋 *Uber-Style डिलिव्हरी प्रक्रिया:*
1️⃣ *UPI पेमेंट पूर्ण करा:* वरील लिंकवर क्लिक करून ₹${totalAmount.toLocaleString('en-IN')} भरा.
2️⃣ *मालक व ड्रायव्हर तपशील:* पेमेंट यशस्वी होताच मशिनरी मालक व ड्रायव्हरचा फोन नंबर व लोकेशन WhatsApp वर मिळेल.
3️⃣ *वेळेवर डिलिव्हरी:* मालक ठरलेल्या वेळेत (${startDate}, ${startTime}) उपकरण तुमच्या शेतात पोहोचवतील.
4️⃣ *१००% सुरक्षा:* काम सुरू होईपर्यंत तुमची रक्कम GoMate द्वारे सुरक्षित!

_रद्द करण्यासाठी *CANCEL* किंवा मेनूसाठी *0* पाठवा._`;
  } else if (lang === 'hi') {
    return `🎉 *आपकी मशीनरी सफलतापूर्वक शेड्यूल हो गई है!* 🚜
━━━━━━━━━━━━━━━━━━━━
🚜 मशीनरी / कार्य: *${selectedService ? `${modelText} (${selectedService.name})` : modelText}*
🔖 बुकिंग संदर्भ: *${booking.booking_ref}*
📅 निर्धारित दिनांक: *${startDate}*
⏰ पहुंचने का समय: *${startTime} (सटीक समय पर)*
⏱️ अवधि: *${duration} घंटे (Hours)*
📍 स्थान: *${session.data.location || 'खेत / साइट'}*
👤 ऑपरेटर/चालक: *सत्यापित ड्राइवर सम्मिलित (GoMate गारंटी)*
━━━━━━━━━━━━━━━━━━━━
• किराया: *₹${rentalAmount.toLocaleString('en-IN')}* (₹${unitRate}/घंटा x ${duration} घंटे)
• गोमेट सुरक्षा शुल्क: *₹${PLATFORM_FEE}*
💰 *कुल देय राशि: ₹${totalAmount.toLocaleString('en-IN')}*
━━━━━━━━━━━━━━━━━━━━

👉 *बुकिंग पक्की करने के लिए UPI भुगतान करें:*
🔗 ${payLink}
_(PhonePe, Google Pay, Paytm या BHIM UPI द्वारा तुरंत भुगतान करें)_

📋 *Uber-Style डिलीवरी प्रक्रिया:*
1️⃣ *UPI भुगतान पूरा करें:* ऊपर दिए गए लिंक पर क्लिक कर ₹${totalAmount.toLocaleString('en-IN')} का भुगतान करें।
2️⃣ *मालिक व ड्राइवर विवरण:* भुगतान के तुरंत बाद ऑपरेटर का नंबर और लोकेशन WhatsApp पर प्राप्त होगी।
3️⃣ *समय पर डिलीवरी:* मशीनरी तय समय पर (${startDate}, ${startTime}) आपके खेत पहुंचेगी।
4️⃣ *१००% सुरक्षा:* काम शुरू होने तक आपका भुगतान GoMate द्वारा सुरक्षित!

_रद्द करने के लिए *CANCEL* या मेनू के लिए *0* भेजें।_`;
  } else {
    return `🎉 *Your Equipment is Scheduled Successfully!* 🚜
━━━━━━━━━━━━━━━━━━━━
🚜 Equipment / Task: *${selectedService ? `${modelText} (${selectedService.name})` : modelText}*
🔖 Booking Reference: *${booking.booking_ref}*
📅 Scheduled Date: *${startDate}*
⏰ Arrival Time: *${startTime} (Guaranteed)*
⏱️ Dimension: *${unitDesc}*
📍 Destination: *${session.data.location || 'Farm/Site'}*
👤 Operator: *Verified Driver Included (GoMate Guarantee)*
━━━━━━━━━━━━━━━━━━━━
• Rental Charge: *₹${rentalAmount.toLocaleString('en-IN')}* (${unitDesc})
• GoMate Protection Fee: *₹${PLATFORM_FEE}*
💰 *Total Payable: ₹${totalAmount.toLocaleString('en-IN')}*
━━━━━━━━━━━━━━━━━━━━

👉 *Complete UPI Advance to Confirm Booking:*
🔗 ${payLink}
_(Instant pay via PhonePe, Google Pay, Paytm or BHIM UPI)_

📋 *Uber-Style Delivery Workflow:*
1️⃣ *Pay via UPI:* Click the link above and pay ₹${totalAmount.toLocaleString('en-IN')}.
2️⃣ *Driver Details:* You will receive the owner and driver's direct contact and live GPS location on WhatsApp.
3️⃣ *Timely Delivery:* Equipment arrives at your farm on ${startDate} at ${startTime}.
4️⃣ *100% Escrow Protection:* Your money is held safe until field work commences.

_Reply *CANCEL* to cancel or *0* for Menu._`;
  }
}

/**
 * Handle confirmation or cancellation in BOOKING_CONFIRM
 * Also auto-dispatches invoice PDF link on payment success keywords
 */
async function handleConfirmation(phone, text, session) {
  const t = (text || '').trim().toLowerCase();
  const isCancel = ['cancel', '0', 'no', 'नाही', 'रद्द', 'रद्द करा', 'nahi', 'reject'].includes(t);
  const isPaidKeyword = [
    'paid', 'done', 'pay', 'payment done', 'payment completed', 'completed',
    'पेमेंट झाले', 'पैसे दिले', 'भरले', 'झाले', 'पेड', 'success', 'ok', 'okay',
    'हो', 'हां', 'yes', 'confirm', 'confirmed'
  ].includes(t) || t.includes('paid') || t.includes('payment') || t.includes('पेमेंट');

  if (session.data) {
    delete session.data.lastQuote;
  }
  if (isCancel) {
    session.state = 'CUSTOMER_MENU';
    return getText(session.language || 'mr', 'booking_cancelled');
  }

  // If farmer confirms payment, auto-send invoice PDF link
  if (isPaidKeyword && session.data && session.data.bookingRef) {
    const bookingRef = session.data.bookingRef;
    const lang = session.language || 'mr';
    const invoiceUrl = `https://gomate-whatsapp-bot.onrender.com/api/bookings/${bookingRef}/invoice`;

    // Try to send invoice via WhatsApp
    try {
      const { sendWhatsAppDirect } = require('../../services/whatsappWeb');
      const invoiceMsg = lang === 'mr'
        ? `✅ *पेमेंट यशस्वी! तुमची अधिकृत GoMate पावती तयार आहे.* 🧾\n\n🔖 बुकिंग संदर्भ: *${bookingRef}*\n📋 *PDF पावती डाउनलोड करा:*\n🔗 ${invoiceUrl}\n\n_ही पावती WhatsApp वर सेव्ह करा किंवा शेअर करा. मशिनरी मालकाशी संपर्क लवकरच होईल._\n\n🚜 *GoMate सेवेसाठी धन्यवाद!*`
        : lang === 'hi'
          ? `✅ *भुगतान सफल! आपकी GoMate रसीद तैयार है।* 🧾\n\n🔖 बुकिंग संदर्भ: *${bookingRef}*\n📋 *PDF रसीद डाउनलोड करें:*\n🔗 ${invoiceUrl}\n\n_यह रसीद WhatsApp पर सेव करें। मशीनरी मालिक से जल्द संपर्क होगा।_\n\n🚜 *GoMate सेवा के लिए धन्यवाद!*`
          : `✅ *Payment Received! Your official GoMate Invoice is ready.* 🧾\n\n🔖 Booking Reference: *${bookingRef}*\n📋 *Download Your PDF Invoice:*\n🔗 ${invoiceUrl}\n\n_Save this invoice on WhatsApp. The machinery owner will contact you shortly._\n\n🚜 *Thank you for choosing GoMate!*`;
      await sendWhatsAppDirect(phone, invoiceMsg);
    } catch (e) {
      console.warn('[BookingFlow] Invoice dispatch warning:', e.message);
    }

    session.state = 'CUSTOMER_MENU';
    const lang2 = session.language || 'mr';
    if (lang2 === 'mr') {
      return `🎉 *बुकिंग निश्चित झाली!* \n📋 तुमची पावती (Ref: ${bookingRef}) वर WhatsApp वर पाठवली आहे.\n_मेनूसाठी *0* पाठवा._`;
    } else if (lang2 === 'hi') {
      return `🎉 *बुकिंग पक्की हो गई!*\n📋 आपकी रसीद (Ref: ${bookingRef}) WhatsApp पर भेज दी गई है।\n_मेनू के लिए *0* भेजें।_`;
    } else {
      return `🎉 *Booking Confirmed!*\n📋 Your invoice (Ref: ${bookingRef}) has been sent on WhatsApp.\n_Reply *0* for Menu._`;
    }
  }
}

/**
 * Top-Level Instant 1-Click Quote to Booking Converter
 */
async function createInstantBookingWithProcess(phone, session) {
  const quote = (session.data && session.data.lastQuote) || {};
  session.data.selectedEquipment = {
    model: quote.model || 'Mahindra 575 DI Tractor',
    price_per_day: quote.rate || 1500,
    district: session.data.location || 'Pune'
  };
  session.data.duration = quote.days || 1;
  session.data.quantity = quote.qty || 1;
  session.data.startDate = getOffsetDateString(1);
  session.data.startTime = '08:00 AM';

  return await createFinalBookingAndPayment(phone, session);
}

module.exports = {
  handleEquipmentSelect,
  handleServiceSelect,
  handleDateInput,
  handleDurationInput,
  handleConfirmation,
  createInstantBookingWithProcess
};

