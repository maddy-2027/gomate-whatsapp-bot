const { getText } = require('../../services/language');
const razorpayService = require('../../services/razorpay');

async function showStatus(phone, session) {
  session.state = 'OWNER_MENU';
  const ownerName = (session.data && session.data.ownerName) || 'Owner';
  const linkObj = await razorpayService.createPaymentLink(phone, ownerName);
  const link = linkObj && linkObj.short_url ? linkObj.short_url : 'https://rzp.io/i/gomate-owner-pro';
  
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 7);
  const expiryFormatted = `${expiry.getDate()}/${expiry.getMonth() + 1}/${expiry.getFullYear()}`;

  return getText(session.language, 'subscription_status', {
    status: 'TRIAL (7 Days Free)',
    expiryDate: expiryFormatted
  }) + '\n\n' + getText(session.language, 'subscription_payment_link', { link });
}


module.exports = { showStatus };
