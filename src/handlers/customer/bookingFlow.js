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
मालकाचे विविध अवजारांनुसार प्रति तास दर:

1️⃣ *रोटाव्हेटर काम (Rotavator)* — ₹${sRates.rotavator ? sRates.rotavator.rate : 800}/तास
2️⃣ *कल्टीव्हेटर / मशागत (Cultivator)* — ₹${sRates.cultivation ? sRates.cultivation.rate : 900}/तास
3️⃣ *ट्रॉली मालवाहतूक (Trolley)* — ₹${sRates.trolley ? sRates.trolley.rate : 600}/तास
4️⃣ *नांगरट (Deep Plough)* — ₹${sRates.ploughing ? sRates.ploughing.rate : 850}/तास
5️⃣ *संपूर्ण ट्रॅक्टर भाडे (General Day Hire)* — ₹${(equip.price_per_day || 1500).toLocaleString('en-IN')}/दिवस

_हव्या असलेल्या अवजाराचा क्रमांक (१-५) निवडा:_`;
      } else {
        msg = `🚜 *${equip.model} — Select Farm Attachment Task:*
━━━━━━━━━━━━━━━━━━━━
1️⃣ *Rotavator Tilth* — ₹${sRates.rotavator ? sRates.rotavator.rate : 800}/hr
2️⃣ *Cultivation / Weeding* — ₹${sRates.cultivation ? sRates.cultivation.rate : 900}/hr
3️⃣ *Trolley Transport* — ₹${sRates.trolley ? sRates.trolley.rate : 600}/hr
4️⃣ *Deep Ploughing* — ₹${sRates.ploughing ? sRates.ploughing.rate : 850}/hr
5️⃣ *General Day Hire* — ₹${(equip.price_per_day || 1500).toLocaleString('en-IN')}/day

_Reply with option number (1-5):_`;
      }
      return msg;
    } else if (equip.category === 'transport') {
      session.state = 'BOOKING_SERVICE_SELECT';
      const hourlyRate = equip.hourly_rate || 350;
      const dailyRate = equip.price_per_day || 1300;
      
      let msg = '';
      if (lang === 'mr') {
        msg = `🚚 *${equip.model} — मालवाहतूक पर्याय निवडा:*
━━━━━━━━━━━━━━━━━━━━
1️⃣ *स्थानिक मालवाहतूक (Local Village Haulage)* — ₹${hourlyRate}/तास
2️⃣ *मार्केट ट्रिप / लांब पल्ला (Market Trip)* — ₹${hourlyRate + 100}/तास
3️⃣ *पूर्ण दिवस भाडे (Full Day Transport)* — ₹${dailyRate.toLocaleString('en-IN')}/दिवस

_पर्याय क्रमांक (१-३) निवडा:_`;
      } else {
        msg = `🚚 *${equip.model} — Select Transport Option:*
━━━━━━━━━━━━━━━━━━━━
1️⃣ *Local Village Haulage* — ₹${hourlyRate}/hr
2️⃣ *Market / Long Distance Trip* — ₹${hourlyRate + 100}/hr
3️⃣ *Full Day Transport Hire* — ₹${dailyRate.toLocaleString('en-IN')}/day

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
  let unit = 'hr';

  if (cat === 'agriculture') {
    if (t === '1' || t.toLowerCase().includes('rotavator') || t.includes('रोटाव्हेटर')) {
      serviceName = 'Rotavator (रोटाव्हेटर)';
      hourlyRate = (equip.service_rates && equip.service_rates.rotavator && equip.service_rates.rotavator.rate) || 800;
    } else if (t === '2' || t.toLowerCase().includes('cultivator') || t.includes('कल्टीव्हेटर')) {
      serviceName = 'Cultivator (कल्टीव्हेटर / मशागत)';
      hourlyRate = (equip.service_rates && equip.service_rates.cultivation && equip.service_rates.cultivation.rate) || 900;
    } else if (t === '3' || t.toLowerCase().includes('trolley') || t.includes('ट्रॉली')) {
      serviceName = 'Hydraulic Trolley (ट्रॉली वाहतूक)';
      hourlyRate = (equip.service_rates && equip.service_rates.trolley && equip.service_rates.trolley.rate) || 600;
    } else if (t === '4' || t.toLowerCase().includes('plough') || t.includes('नांगरट')) {
      serviceName = 'Deep Plough (नांगरट)';
      hourlyRate = (equip.service_rates && equip.service_rates.ploughing && equip.service_rates.ploughing.rate) || 850;
    } else {
      serviceName = 'General Tractor Day Hire';
      hourlyRate = Math.round((equip.price_per_day || 1500) / 2.5);
      unit = 'day';
    }
  } else if (cat === 'transport') {
    if (t === '1' || t.toLowerCase().includes('local') || t.includes('स्थानिक')) {
      serviceName = 'Local Village Haulage (स्थानिक वाहतूक)';
      hourlyRate = equip.hourly_rate || 350;
    } else if (t === '2' || t.toLowerCase().includes('market') || t.includes('मार्केट')) {
      serviceName = 'Market Produce Transport (मार्केट ट्रिप)';
      hourlyRate = (equip.hourly_rate || 350) + 100;
    } else {
      serviceName = 'Full Day Vehicle Hire (पूर्ण दिवस भाडे)';
      hourlyRate = Math.round((equip.price_per_day || 1300) / 4);
      unit = 'day';
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
    unit
  };

  session.state = 'BOOKING_DATES';

  if (lang === 'mr') {
    return `✅ निवडले: *${serviceName}* (दर: *₹${hourlyRate}/तास*)
━━━━━━━━━━━━━━━━━━━━
📍 *आता कामाची तारीख व वेळ निवडा:*
1️⃣ *उद्या सकाळी (८:०० AM)* ⭐️ सर्वाधिक पसंती
2️⃣ *उद्या दुपारी (१:०० PM)*
3️⃣ *आज त्वरित डिलिव्हरी (२ तासांत)*
4️⃣ *परवा सकाळी (८:०० AM)*

_किंवा तुमची तारीख व वेळ टाईप करा (उदा. 'उद्या सकाळी 8 वाजता 2 तास')_`;
  } else {
    return `✅ Selected: *${serviceName}* (Rate: *₹${hourlyRate}/hr*)
━━━━━━━━━━━━━━━━━━━━
📍 *Now Select Date & Time Slot:*
1️⃣ *Tomorrow Morning (8:00 AM)* ⭐️ Most Popular
2️⃣ *Tomorrow Afternoon (1:00 PM)*
3️⃣ *Today Immediate Dispatch (within 2 hours)*
4️⃣ *Day After Tomorrow (8:00 AM)*

_Or reply with custom date & time (e.g. 'Tomorrow 8 AM for 2 hours')_`;
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

  // Check if duration was also provided in this message (e.g. "for 3 days", "3 दिवस", "2 days", "3 दिन")
  const durMatch = t.match(/([1-9][0-9]?)\s*(?:day|days|दिवस|दिन|दिवसांचे|दिवसांसाठी|दिनों|वार)/i);
  if (durMatch) {
    duration = parseInt(durMatch[1]);
  } else if (lower.includes('week') || lower.includes('आठवडा') || lower.includes('हफ्ता')) {
    duration = 7;
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
  const equip = session.data.selectedEquipment || { model: 'Mahindra 575 DI Tractor', price_per_day: 1500 };
  const dailyRate = equip.price_per_day || 1500;

  if (lang === 'mr') {
    return `⏱️ *पायरी २/२: भाडे कालावधी (दिवस) निवडा:*
━━━━━━━━━━━━━━━━━━━━
🚜 उपकरण: *${equip.model}*
📅 शेड्युल तारीख: *${startDate}*
⏰ डिलिव्हरी वेळ: *${startTime}*

1️⃣ *१ दिवस* (₹${(dailyRate * 1).toLocaleString('en-IN')} + ₹49 सुरक्षा फी)
2️⃣ *२ दिवस* (₹${(dailyRate * 2).toLocaleString('en-IN')} + ₹49 सुरक्षा फी) ⭐️ लोकप्रिय
3️⃣ *३ दिवस* (₹${(dailyRate * 3).toLocaleString('en-IN')} + ₹49 सुरक्षा फी)
4️⃣ *१ आठवडा / ७ दिवस* (₹${(dailyRate * 7).toLocaleString('en-IN')} + ₹49 सुरक्षा फी)

_किंवा दिवसांची संख्या टाईप करा (उदा. '४ दिवस' किंवा '५')_
_(रद्द करण्यासाठी *0* पाठवा)_`;
  } else if (lang === 'hi') {
    return `⏱️ *चरण २/२: किराया अवधि (दिन) चुनें:*
━━━━━━━━━━━━━━━━━━━━
🚜 मशीनरी: *${equip.model}*
📅 निर्धारित दिनांक: *${startDate}*
⏰ डिलीवरी समय: *${startTime}*

1️⃣ *१ दिन* (₹${(dailyRate * 1).toLocaleString('en-IN')} + ₹49 सुरक्षा शुल्क)
2️⃣ *२ दिन* (₹${(dailyRate * 2).toLocaleString('en-IN')} + ₹49 सुरक्षा शुल्क) ⭐️ लोकप्रिय
3️⃣ *३ दिन* (₹${(dailyRate * 3).toLocaleString('en-IN')} + ₹49 सुरक्षा शुल्क)
4️⃣ *१ सप्ताह / ७ दिन* (₹${(dailyRate * 7).toLocaleString('en-IN')} + ₹49 सुरक्षा शुल्क)

_या दिनों की संख्या लिखें (उदा. '४ दिन' या '५')_
_(रद्द करने के लिए *0* भेजें)_`;
  } else {
    return `⏱️ *Step 2 of 2: Select Rental Duration (Days)*
━━━━━━━━━━━━━━━━━━━━
🚜 Equipment: *${equip.model}*
📅 Scheduled Date: *${startDate}*
⏰ Delivery Time: *${startTime}*

1️⃣ *1 Day* (₹${(dailyRate * 1).toLocaleString('en-IN')} + ₹49 Protection Fee)
2️⃣ *2 Days* (₹${(dailyRate * 2).toLocaleString('en-IN')} + ₹49 Protection Fee) ⭐️ Most Popular
3️⃣ *3 Days* (₹${(dailyRate * 3).toLocaleString('en-IN')} + ₹49 Protection Fee)
4️⃣ *1 Week / 7 Days* (₹${(dailyRate * 7).toLocaleString('en-IN')} + ₹49 Protection Fee)

_Or reply with number of days (e.g. '4 days' or '5')_
_(Reply *0* to cancel)_`;
  }
}

/**
 * Step 3: Handle Duration Input
 */
async function handleDurationInput(phone, text, session) {
  const t = (text || '').trim();
  const lower = t.toLowerCase();

  let duration = 1;
  if (t === '1' || lower === '1 day' || lower === '१ दिवस' || lower === '1 दिन') duration = 1;
  else if (t === '2' || lower === '2 days' || lower === '२ दिवस' || lower === '2 दिन') duration = 2;
  else if (t === '3' || lower === '3 days' || lower === '३ दिवस' || lower === '3 दिन') duration = 3;
  else if (t === '4' || lower.includes('week') || lower.includes('7') || lower.includes('आठवडा') || lower.includes('सप्ताह')) duration = 7;
  else {
    const numMatch = t.match(/\b([1-9][0-9]?)\b/);
    if (numMatch) duration = parseInt(numMatch[1]);
  }

  session.data.duration = duration;
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
    district: session.data.location || 'Pune'
  };

  const duration = session.data.duration || 1;
  const quantity = session.data.quantity || 1;
  const startDate = session.data.startDate || getOffsetDateString(1);
  const startTime = session.data.startTime || '08:00 AM';
  const pricePerDay = equip.price_per_day || 1500;
  const PLATFORM_FEE = 49;
  const rentalAmount = pricePerDay * duration * quantity;
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
      start_date: `${startDate} at ${startTime}`,
      duration_days: duration,
      total_amount: totalAmount,
      status: 'pending'
    });
  } catch (err) {
    booking = { booking_ref: 'GM-' + Math.random().toString(36).substring(2, 6).toUpperCase() };
  }
  session.data.bookingRef = booking.booking_ref;

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
🚜 उपकरण: *${modelText}*
🔖 बुकिंग संदर्भ: *${booking.booking_ref}*
📅 शेड्युल तारीख: *${startDate}*
⏰ पोहोचण्याची वेळ: *${startTime} (अचूक वेळेत)*
⏱️ कालावधी: *${duration} दिवस*
📍 कार्यक्षेत्र: *${session.data.location || 'महाराष्ट्र शेत/साइट'}*
👤 ऑपरेटर/चालक: *व्हेरिफाइड ड्रायव्हर समाविष्ट (GoMate हमी)*
━━━━━━━━━━━━━━━━━━━━
• उपकरण भाडे: *₹${rentalAmount.toLocaleString('en-IN')}* (₹${pricePerDay} x ${duration} दिवस)
• गोमेट सुरक्षा व सहाय्य फी: *₹${PLATFORM_FEE}*
💰 *एकूण देय रक्कम: ₹${totalAmount.toLocaleString('en-IN')}*
━━━━━━━━━━━━━━━━━━━━

👉 *बुकिंग निश्चित करण्यासाठी UPI पेमेंट करा:*
🔗 ${payLink}
_(PhonePe, Google Pay, Paytm किंवा BHIM UPI द्वारे त्वरित पेमेंट करा)_

📋 *Uber-Style डिलिव्हरी प्रक्रिया:*
1️⃣ *UPI पेमेंट पूर्ण करा:* वरील लिंकवर क्लिक करून ₹${totalAmount.toLocaleString('en-IN')} भरा.
2️⃣ *मालक व ड्रायव्हर तपशील:* पेमेंट यशस्वी होताच मशिनरी मालक व ड्रायव्हरचा फोन नंबर व लोकेशन WhatsApp वर मिळेल.
3️⃣ *वेळेवर डिलिव्हरी:* मालक स्वतः ठरलेल्या वेळेत (${startDate}, ${startTime}) उपकरण तुमच्या शेतात पोहोचवतील.
4️⃣ *१००% सुरक्षा:* काम सुरू होईपर्यंत तुमची रक्कम GoMate द्वारे सुरक्षित!

_रद्द करण्यासाठी *CANCEL* किंवा मेनूसाठी *0* पाठवा._`;
  } else if (lang === 'hi') {
    return `🎉 *आपकी मशीनरी सफलतापूर्वक शेड्यूल हो गई है!* 🚜
━━━━━━━━━━━━━━━━━━━━
🚜 मशीनरी: *${modelText}*
🔖 बुकिंग संदर्भ: *${booking.booking_ref}*
📅 निर्धारित दिनांक: *${startDate}*
⏰ पहुंचने का समय: *${startTime} (सटीक समय पर)*
⏱️ अवधि: *${duration} दिन*
📍 स्थान: *${session.data.location || 'खेत / साइट'}*
👤 ऑपरेटर/चालक: *सत्यापित ड्राइवर सम्मिलित (GoMate गारंटी)*
━━━━━━━━━━━━━━━━━━━━
• मशीनरी किराया: *₹${rentalAmount.toLocaleString('en-IN')}* (₹${pricePerDay} x ${duration} दिन)
• गोमेट सुरक्षा शुल्क: *₹${PLATFORM_FEE}*
💰 *कुल देय राशि: ₹${totalAmount.toLocaleString('en-IN')}*
━━━━━━━━━━━━━━━━━━━━

👉 *बुकिंग पक्की करने के लिए UPI भुगतान करें:*
🔗 ${payLink}
_(PhonePe, Google Pay, Paytm या BHIM UPI द्वारा तुरंत भुगतान करें)_

📋 *Uber-Style डिलीवरी प्रक्रिया:*
1️⃣ *UPI भुगतान पूरा करें:* ऊपर दिए गए लिंक पर क्लिक कर ₹${totalAmount.toLocaleString('en-IN')} का भुगतान करें।
2️⃣ *मालिक व ड्राइवर विवरण:* भुगतान होते ही मशीन मालिक व ड्राइवर का फोन नंबर WhatsApp पर प्राप्त होगा।
3️⃣ *समय पर डिलीवरी:* मालिक निर्धारित समय (${startDate}, ${startTime}) पर मशीन आपके स्थान पर पहुंचाएंगे।
4️⃣ *१००% सुरक्षा:* काम शुरू होने तक आपका पैसा GoMate द्वारा सुरक्षित रहेगा।

_रद्द करने के लिए *CANCEL* या मेनू के लिए *0* भेजें।_`;
  } else {
    return `🎉 *Your Equipment is Scheduled (Advance Booking)!* 🚜
━━━━━━━━━━━━━━━━━━━━
🚜 Equipment: *${modelText}*
🔖 Booking Ref: *${booking.booking_ref}*
📅 Scheduled Date: *${startDate}*
⏰ Arrival / Dispatch Time: *${startTime} (Sharp)*
⏱️ Duration: *${duration} day(s)*
📍 Location: *${session.data.location || 'Local Farm/Site'}*
👤 Operator / Driver: *Verified Operator Included (100% GoMate Guarantee)*
━━━━━━━━━━━━━━━━━━━━
• Equipment Rental: *₹${rentalAmount.toLocaleString('en-IN')}* (₹${pricePerDay} x ${duration} days)
• GoMate Protection & Support Fee: *₹${PLATFORM_FEE}*
💰 *Total Amount to Pay: ₹${totalAmount.toLocaleString('en-IN')}*
━━━━━━━━━━━━━━━━━━━━

👉 *Click to Confirm Booking & Pay via UPI:*
🔗 ${payLink}
_(Pay instantly with PhonePe, Google Pay, Paytm, or Cards)_

📋 *How Uber-Style Dispatch Works:*
1️⃣ *Complete UPI Payment:* Click the link above to pay ₹${totalAmount.toLocaleString('en-IN')}.
2️⃣ *Direct Owner & Driver Connect:* Verified owner name, phone & dispatch tracking sent to WhatsApp instantly.
3️⃣ *Guaranteed On-Time Delivery:* Machinery arrives at your site on scheduled date (${startDate} at ${startTime}).
4️⃣ *100% Protected:* Payment is held safely by GoMate until equipment begins work.

_Reply *0* for Main Menu or *CANCEL* to cancel._`;
  }
}

/**
 * Handle confirmation or cancellation in BOOKING_CONFIRM
 */
async function handleConfirmation(phone, text, session) {
  const t = (text || '').trim().toLowerCase();
  const isCancel = ['cancel', '0', 'no', 'नाही', 'रद्द', 'रद्द करा', 'nahi', 'reject'].includes(t);
  if (session.data) {
    delete session.data.lastQuote;
  }
  if (isCancel) {
    session.state = 'CUSTOMER_MENU';
    return getText(session.language || 'mr', 'booking_cancelled');
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
  handleDateInput,
  handleDurationInput,
  handleConfirmation,
  createInstantBookingWithProcess
};

