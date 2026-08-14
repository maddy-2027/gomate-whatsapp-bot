function isValidPhone(phone) {
  return /^\+?[1-9]\d{9,14}$/.test(phone);
}

function sanitizeInput(text) {
  return text.trim().replace(/[<>]/g, '');
}

module.exports = { isValidPhone, sanitizeInput };
