const PROVIDER_AUTH_CAPABILITIES = Object.freeze({
  recordplus: Object.freeze({
    browser: true,
    // The documented CTV route still needs an official protocol capture.
    // Keep it unknown instead of exposing a pairing flow we cannot complete.
    pairing: 'unknown',
    social: Object.freeze(['google', 'apple']),
  }),
  globoplay: Object.freeze({
    browser: true,
    // No official Globo pairing/device flow has been verified yet.
    pairing: 'unknown',
    social: Object.freeze(['google', 'facebook']),
  }),
});

export function getProviderAuthCapabilities(providerId) {
  return PROVIDER_AUTH_CAPABILITIES[providerId] || null;
}

export function supportsProviderBrowserAuth(providerId) {
  return getProviderAuthCapabilities(providerId)?.browser === true;
}

