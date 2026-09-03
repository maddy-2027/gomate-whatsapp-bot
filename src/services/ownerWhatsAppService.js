/**
 * GoMate Owner Pro WhatsApp Interactive Quick Commands Engine
 * Allows machinery owners to manage their fleet, toggle availability,
 * check net monthly earnings, view pending orders, and log expenses
 * directly via WhatsApp chat.
 */

const { getEquipmentByOwner, toggleEquipmentAvailability, getAllEquipment } = require('../db/equipment.repo');
const { getBookingsByOwnerPhone, getAllBookings } = require('../db/bookings.repo');
const { getOwnerMonthlyPnl } = require('./monthlyPnlService');
const { getOwnerByPhone } = require('../db/owners.repo');

/**
 * Check if incoming text is an Owner Pro quick command
 */
function isOwnerCommand(text) {
  if (!text) return false;
  const t = text.trim().toLowerCase();

  // Fleet queries
  if (['fleet', 'my fleet', 'machines', 'machinery', 'अवजारे', 'माझी अवजारे', 'माझी वाहने', 'यंत्रे', 'माझा ट्रॅक्टर'].includes(t)) return true;

  // Pause / Resume commands
  if (t.startsWith('pause') || t === 'थांबवा' || t === 'बंद' || t === 'offline' || t.startsWith('बंद ')) return true;
  if (t.startsWith('resume') || t === 'सुरू करा' || t === 'चालू करा' || t === 'online' || t.startsWith('चालू ')) return true;

  // Earnings & P&L queries
  if (['earnings', 'earning', 'income', 'pnl', 'profit', 'कमाई', 'हिशोब', 'नफा', 'पैसे', 'माझे पैसे'].includes(t)) return true;

  // Orders & Bookings queries
  if (['orders', 'my orders', 'bookings', 'my bookings', 'कामे', 'माझी कामे', 'बुकिंग'].includes(t)) return true;

  // Owner help & menu
  if (['owner help', 'मालक मदत', 'मालक मेनू', 'owner menu'].includes(t)) return true;

  return false;
}

/**
 * Handle Owner WhatsApp Interactive Command
 */
async function handleOwnerCommand(phone, text, session) {
  const cleanPhone = String(phone || '+919822012345').trim();
  const raw = (text || '').trim();
  const t = raw.toLowerCase();

  // ── 1. FLEET COMMAND ───────────────────────────────────────────────────────
  if (['fleet', 'my fleet', 'machines', 'machinery', 'अवजारे', 'माझी अवजारे', 'माझी वाहने', 'यंत्रे', 'माझा ट्रॅक्टर'].includes(t)) {
    let equipList = await getEquipmentByOwner(cleanPhone);
    if (!equipList || !equipList.length) {
      // Fallback to top seed equipment for demo/unregistered phone
      const allEquip = await getAllEquipment();
      equipList = allEquip.slice(0, 3);
    }

    const fleetItems = equipList.map((e, idx) => {
      const isOnline = e.available !== false;
      const statusPill = isOnline ? '🟢 *सक्रिय / ऑनलाईन (Online)*' : '🔴 *थांबवले / ऑफलाईन (Paused)*';
      const rate = e.hourly_rate || Math.round((e.price_per_day || 1500) / 2.5);
      return `${idx + 1}️⃣ *${e.model || e.name}* (ID: ${e.id})\n` +
             `   • स्थिती: ${statusPill}\n` +
             `   • भाडे दर: ₹${rate}/तास\n` +
             `   • कार्यक्षेत्र: ${e.village || e.district || 'जत तालुका'}\n`;
    }).join('\n');

    return `🚜 *तुमची नोंदणीकृत अवजारे (GoMate Fleet)* 🌾\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `${fleetItems}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `💡 *थेट व्हॉट्सअ‍ॅप आज्ञा (Quick Commands):*\n` +
      `• यंत्र थांबवण्यासाठी: *PAUSE <ID>* (उदा. PAUSE ${equipList[0]?.id || 101})\n` +
      `• यंत्र सुरू करण्यासाठी: *RESUME <ID>* (उदा. RESUME ${equipList[0]?.id || 101})\n` +
      `• महिन्याची कमाई: *EARNINGS* लिहून पाठवा\n` +
      `• चालू ऑर्डर्स: *ORDERS* लिहून पाठवा\n\n` +
      `_📞 मालक सहाय्य कक्ष: +91 86054 70552_`;
  }

  // ── 2. PAUSE COMMAND ───────────────────────────────────────────────────────
  if (t.startsWith('pause') || t === 'थांबवा' || t === 'बंद' || t === 'offline' || t.startsWith('बंद ')) {
    const parts = t.split(/\s+/);
    let targetId = parts[1];

    // If no ID given, find owner's first machine
    if (!targetId || isNaN(targetId)) {
      const equipList = await getEquipmentByOwner(cleanPhone);
      targetId = (equipList && equipList[0]?.id) || '101';
    }

    await toggleEquipmentAvailability(targetId, false);

    return `🔴 *यंत्र थांबवले आहे (PAUSED / OFFLINE)* ⏸️\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🚜 उपकरण ID: *${targetId}*\n` +
      `📌 स्थिती: *ऑफलाईन (कामासाठी अनुपलब्ध)*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `आता परिसरातील शेतकऱ्यांना हे उपकरण उपलब्ध दिसणार नाही. खाजगी काम संपल्यावर पुन्हा सुरू करण्यासाठी:\n\n` +
      `👉 *RESUME ${targetId}* लिहून पाठवा.\n\n` +
      `_मेनूसाठी *0* पाठवा._`;
  }

  // ── 3. RESUME COMMAND ──────────────────────────────────────────────────────
  if (t.startsWith('resume') || t === 'सुरू करा' || t === 'चालू करा' || t === 'online' || t.startsWith('चालू ')) {
    const parts = t.split(/\s+/);
    let targetId = parts[1];

    if (!targetId || isNaN(targetId)) {
      const equipList = await getEquipmentByOwner(cleanPhone);
      targetId = (equipList && equipList[0]?.id) || '101';
    }

    await toggleEquipmentAvailability(targetId, true);

    return `🟢 *यंत्र पुन्हा सक्रिय केले आहे (ONLINE / ACTIVE)* ✅\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🚜 उपकरण ID: *${targetId}*\n` +
      `📌 स्थिती: *ऑनलाईन (बुकिंगसाठी उपलब्ध)*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `शेतकऱ्यांकडून नवीन भाडे ऑर्डर्स थेट आपल्या WhatsApp वर येतील.\n` +
      `काम थांबवण्यासाठी कधीही *PAUSE ${targetId}* पाठवू शकता.\n\n` +
      `_मेनूसाठी *0* पाठवा._`;
  }

  // ── 4. EARNINGS & P&L COMMAND ──────────────────────────────────────────────
  if (['earnings', 'earning', 'income', 'pnl', 'profit', 'कमाई', 'हिशोब', 'नफा', 'पैसे', 'माझे पैसे'].includes(t)) {
    const pnl = await getOwnerMonthlyPnl(cleanPhone);
    const statementUrl = `https://gomate-whatsapp-bot.onrender.com/api/owner/pnl/statement?phone=${encodeURIComponent(cleanPhone)}`;

    return `💰 *आपली मासिक कमाई व हिशोब (Monthly P&L)* 📊\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📅 *महिना:* ${pnl.month_label}\n` +
      `👤 *मशिनरी मालक:* ${pnl.owner_name}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🚜 पूर्ण झालेली कामे: *${pnl.total_jobs} बुकिंग्ज (${pnl.total_hours_worked} तास)*\n` +
      `💵 एकूण जमा भाडे: *₹${pnl.gross_earnings.toLocaleString('en-IN')}*\n` +
      `⛽ डिझेल खर्च: *₹${pnl.diesel_cost.toLocaleString('en-IN')}* (${pnl.diesel_litres} लिटर)\n` +
      `🔧 देखभाल व चालक: *₹${pnl.maintenance_and_wages.toLocaleString('en-IN')}*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📈 *निव्वळ नफा (Net Earnings): ₹${pnl.net_profit.toLocaleString('en-IN')}* (${pnl.profit_margin_percent}%)\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📄 *अधिकृत A4 PDF हिशोब स्टेटमेंट:*\n` +
      `🔗 ${statementUrl}\n\n` +
      `_मेनूसाठी *0* पाठवा._`;
  }

  // ── 5. ORDERS COMMAND ──────────────────────────────────────────────────────
  if (['orders', 'my orders', 'bookings', 'my bookings', 'कामे', 'माझी कामे', 'बुकिंग'].includes(t)) {
    let bookings = await getBookingsByOwnerPhone(cleanPhone);
    if (!bookings || !bookings.length) {
      const all = await getAllBookings();
      bookings = all.slice(0, 3);
    }

    const orderItems = bookings.slice(0, 4).map((b, i) => {
      const statusIcon = b.status === 'confirmed' ? '✅' : (b.status === 'completed' ? '🏁' : '⏳');
      return `${i + 1}️⃣ *Ref: ${b.booking_ref}* (${statusIcon} ${b.status.toUpperCase()})\n` +
             `   👤 शेतकरी: ${b.customer_name} (${b.customer_phone})\n` +
             `   📍 गाव: ${b.village || b.district || 'जत'}, जत\n` +
             `   🚜 उपकरण: ${b.equipment_name || 'ट्रॅक्टर'}\n` +
             `   📅 वेळ: ${b.start_date || 'उद्या'}\n` +
             `   💰 रक्कम: ₹${Number(b.total_amount || 1500).toLocaleString('en-IN')}\n`;
    }).join('\n');

    return `📋 *आपल्या मशिनरीचे शेतकरी बुकिंग्ज (Orders)* 🚜\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `${orderItems}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `_ऑर्डर स्वीकारण्यासाठी किंवा अधिक माहितीसाठी हेल्पलाइन: +91 86054 70552_`;
  }

  // ── 6. OWNER HELP / MENU ───────────────────────────────────────────────────
  return `💼 *GoMate Owner Pro — व्हॉट्सअ‍ॅप शॉर्टकट आज्ञा* 🚜\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `• *FLEET* — सर्व अवजारे व चालू स्थिती पाहा\n` +
    `• *PAUSE <ID>* — यंत्र काम तात्पुरते थांबवा (उदा. PAUSE 101)\n` +
    `• *RESUME <ID>* — यंत्र पुन्हा सुरू करा (उदा. RESUME 101)\n` +
    `• *EARNINGS* — महिन्याची कमाई व निव्वळ नफा पाहा\n` +
    `• *ORDERS* — आलेली शेतकरी बुकिंग्ज तपासा\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `_🌐 मालक वेब पोर्टल: https://gomate-whatsapp-bot.onrender.com/owner_`;
}

module.exports = {
  isOwnerCommand,
  handleOwnerCommand
};
