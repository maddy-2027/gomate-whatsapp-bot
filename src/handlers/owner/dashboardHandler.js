const { handleOwnerCommand } = require('../../services/ownerWhatsAppService');

async function showDashboard(phone, session) {
  session.state = 'OWNER_MENU';
  // Return real live fleet & earnings overview
  return await handleOwnerCommand(phone, 'FLEET', session);
}

module.exports = { showDashboard };
