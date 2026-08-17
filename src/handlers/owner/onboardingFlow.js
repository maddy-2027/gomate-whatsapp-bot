const { getText } = require('../../services/language');
const { registerOwner } = require('../../db/owners.repo');
const { upsertUser } = require('../../db/users.repo');

async function handleNameInput(phone, text, session) {
  const name = text.trim();
  session.data.ownerName = name;
  session.customerName = name;
  session.state = 'ONBOARD_DISTRICT';
  return getText(session.language, 'owner_onboard_district', { name });
}

async function handleDistrictInput(phone, text, session) {
  const district = text.trim();
  session.data.ownerDistrict = district;
  
  await registerOwner({
    phone,
    name: session.data.ownerName,
    district: district,
    language: session.language,
    subscription_status: 'trial'
  });

  await upsertUser({
    phone,
    name: session.data.ownerName,
    role: 'owner',
    language: session.language
  });
  
  session.state = 'OWNER_MENU';
  return getText(session.language, 'owner_onboard_welcome', { name: session.data.ownerName }) + '\n\n' + getText(session.language, 'owner_menu');
}

module.exports = { handleNameInput, handleDistrictInput };
