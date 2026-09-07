/**
 * Universal Base URL resolver for GoMate across Koyeb, Render, Railway, or custom domains.
 */
function getAppBaseUrl() {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/+$/, '');
  if (process.env.BASE_URL) return process.env.BASE_URL.replace(/\/+$/, '');
  if (process.env.KOYEB_PUBLIC_DOMAIN) return `https://${process.env.KOYEB_PUBLIC_DOMAIN.replace(/\/+$/, '')}`;
  if (process.env.RENDER_EXTERNAL_URL) return process.env.RENDER_EXTERNAL_URL.replace(/\/+$/, '');
  return 'http://localhost:3000';
}

module.exports = { getAppBaseUrl };
