const { getText } = require('../../services/language');
const { getBookingByRef, getBookingsByPhone } = require('../../db/bookings.repo');

async function handleStatusQuery(phone, text, session) {
  const t = text.trim().toUpperCase();
  
  if (t === 'ALL') {
    const bookings = await getBookingsByPhone(phone);
    if (!bookings.length) return "You have no bookings.";
    let res = "*Your Bookings:*\n";
    bookings.forEach(b => {
      res += `- ${b.booking_ref}: ${b.status} (₹${b.total_amount})\n`;
    });
    session.state = 'CUSTOMER_MENU';
    return res;
  }
  
  const refMatch = t.match(/GM-\w{4}/);
  if (refMatch) {
    const ref = refMatch[0];
    const booking = await getBookingByRef(ref);
    session.state = 'CUSTOMER_MENU';
    if (booking) {
      return `Booking ${ref} Status: *${booking.status.toUpperCase()}*\nTotal: ₹${booking.total_amount}`;
    }
    return getText(session.language, 'booking_not_found');
  }
  
  return getText(session.language, 'booking_status_prompt');
}

module.exports = { handleStatusQuery };
