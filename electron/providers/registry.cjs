const { URL } = require('node:url');

const PROVIDER_REGISTRY = Object.freeze({
  recordplus: Object.freeze({
    primaryOrigins: Object.freeze(['https://www.recordplus.com']),
    authOrigins: Object.freeze(['https://accounts.google.com']),
  }),
  globoplay: Object.freeze({
    primaryOrigins: Object.freeze(['https://globoplay.globo.com']),
    // Globoplay owns the OIDC/PKCE parameters. The app enters through the
    // requested Globoplay channel and permits only the official hops that
    // browser navigation needs to complete that provider-managed flow.
    authOrigins: Object.freeze([
      'https://goidc.globo.com',
      'https://authx.globoid.globo.com',
      'https://conta.globo.com',
      'https://accounts.google.com',
    ]),
  }),
});

function getProviderConfig(providerId) {
  return PROVIDER_REGISTRY[providerId] || null;
}

function isAllowedProviderUrl(providerId, value, { allowBlank = false } = {}) {
  if (allowBlank && value === 'about:blank') return true;
  if (typeof value !== 'string' || !value) return false;

  let parsedUrl;
  try {
    parsedUrl = new URL(value);
  } catch {
    return false;
  }

  if (parsedUrl.protocol !== 'https:') return false;
  const config = getProviderConfig(providerId);
  if (!config) return false;
  return [...config.primaryOrigins, ...config.authOrigins].includes(parsedUrl.origin);
}

function validateProviderRequest({ providerId, url, channelUrl }) {
  if (!getProviderConfig(providerId)) return { ok: false, reason: 'unknown-provider' };
  if (!isAllowedProviderUrl(providerId, url)) return { ok: false, reason: 'url-not-allowlisted' };
  if (channelUrl && !isAllowedProviderUrl(providerId, channelUrl)) return { ok: false, reason: 'channel-url-not-allowlisted' };
  return { ok: true };
}

module.exports = {
  PROVIDER_REGISTRY,
  getProviderConfig,
  isAllowedProviderUrl,
  validateProviderRequest,
};
