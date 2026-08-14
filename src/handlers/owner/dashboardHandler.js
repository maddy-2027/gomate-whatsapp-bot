const { getText } = require('../../services/language');

async function showDashboard(phone, session) {
  session.state = 'OWNER_MENU';
  return getText(session.language, 'dashboard_header', {
    listings: 2,
    pending: 1,
    earnings: 3000,
    bookingsList: "GM-ABCD: pending"
  });
}

module.exports = { showDashboard };
