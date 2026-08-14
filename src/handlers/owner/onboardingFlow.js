const { getText } = require('../../services/language');
const { registerOwner } = require('../../db/owners.repo');

async function handleNameInput(phone, text, session) {
  session.data.ownerName = text.trim();
  session.state = 'ONBOARD_DISTRICT';
  return getText(session.language, 'owner_onboard_district', { name: session.data.ownerName });
}

async function handleDistrictInput(phone, text, session) {
  session.data.ownerDistrict = text.trim();
  
  await registerOwner({
    phone,
    name: session.data.ownerName,
    district: session.data.ownerDistrict,
    language: session.language,
    subscription_status: 'trial'
  });
  
  session.state = 'OWNER_MENU';
  return getText(session.language, 'owner_onboard_welcome', { name: session.data.ownerName }) + '\n\n' + getText(session.language, 'owner_menu');
}

module.exports = { handleNameInput, handleDistrictInput };
