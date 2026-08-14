function formatPrice(amount) {
  return '₹' + amount.toLocaleString('en-IN');
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB'); 
}

module.exports = { formatPrice, formatDate };
