const { getText } = require('../../services/language');
const razorpayService = require('../../services/razorpay');

async function showStatus(phone, session) {
  session.state = 'OWNER_MENU';
  const linkObj = await razorpayService.createSubscription(phone, 'plan_mock');
  const link = linkObj ? linkObj.short_url : 'https://rzp.io/l/mock';
  
  return getText(session.language, 'subscription_status', {
    status: 'TRIAL',
    expiryDate: '2026-08-14'
  }) + '\n\n' + getText(session.language, 'subscription_payment_link', { link });
}

module.exports = { showStatus };
