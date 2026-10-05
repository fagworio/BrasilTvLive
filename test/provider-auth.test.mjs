import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getProviderAuthCapabilities,
  supportsProviderBrowserAuth,
} from '../src/providerAuth.js';

test('describes only verified browser capabilities for each provider', () => {
  assert.deepEqual(getProviderAuthCapabilities('recordplus'), {
    browser: true,
    pairing: 'unknown',
    social: ['google', 'apple'],
  });
  assert.deepEqual(getProviderAuthCapabilities('globoplay'), {
    browser: true,
    pairing: 'unknown',
    social: ['google'],
  });
  assert.equal(supportsProviderBrowserAuth('recordplus'), true);
  assert.equal(supportsProviderBrowserAuth('globoplay'), true);
  assert.equal(supportsProviderBrowserAuth('unknown-provider'), false);
});
