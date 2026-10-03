const assert = require('node:assert/strict');
const test = require('node:test');

const {
  isAllowedProviderUrl,
  validateProviderRequest,
} = require('../electron/providers/registry.cjs');
const recordPlus = require('../electron/providers/recordplus.cjs');
const globoplay = require('../electron/providers/globoplay.cjs');

test('allows provider pages and their configured auth origins', () => {
  assert.equal(isAllowedProviderUrl('recordplus', 'https://www.recordplus.com/login'), true);
  assert.equal(isAllowedProviderUrl('recordplus', 'https://accounts.google.com/o/oauth2/auth'), true);
  assert.equal(isAllowedProviderUrl('globoplay', 'https://login.globo.com/login'), true);
});

test('rejects unknown, insecure, and unrelated provider URLs', () => {
  assert.equal(isAllowedProviderUrl('unknown', 'https://example.com'), false);
  assert.equal(isAllowedProviderUrl('recordplus', 'http://www.recordplus.com/login'), false);
  assert.equal(isAllowedProviderUrl('recordplus', 'https://evil.example/redirect'), false);
  assert.equal(isAllowedProviderUrl('globoplay', 'https://www.recordplus.com/player/foo'), false);
});

test('validates provider requests before creating a WebContentsView', () => {
  assert.deepEqual(validateProviderRequest({
    providerId: 'recordplus',
    url: 'https://www.recordplus.com/login',
    channelUrl: 'https://www.recordplus.com/player/record-minas',
  }), { ok: true });
  assert.equal(validateProviderRequest({
    providerId: 'recordplus',
    url: 'https://evil.example/login',
  }).reason, 'url-not-allowlisted');
  assert.equal(validateProviderRequest({
    providerId: 'globoplay',
    url: 'https://globoplay.globo.com/',
    channelUrl: 'https://evil.example/channel',
  }).reason, 'channel-url-not-allowlisted');
});

test('classifies RecordPlus navigation and resumes the selected channel after home', () => {
  assert.equal(recordPlus.isPlayerUrl('https://www.recordplus.com/player/record-minas'), true);
  assert.equal(recordPlus.isHomeUrl('https://www.recordplus.com/home'), true);
  assert.equal(recordPlus.isLoginUrl('https://www.recordplus.com/login'), true);
  const pending = {
    providerId: 'recordplus',
    channelUrl: 'https://www.recordplus.com/player/record-minas',
    status: 'auth-required',
  };
  assert.equal(recordPlus.shouldContinuePendingChannel(pending, 'https://www.recordplus.com/'), true);
  assert.equal(recordPlus.shouldContinuePendingChannel({ ...pending, status: 'player' }, 'https://www.recordplus.com/'), false);
});

test('classifies Globoplay regional player and login surfaces', () => {
  const channelUrl = 'https://globoplay.globo.com/ao-vivo/globo-minas/';
  assert.equal(globoplay.isPlayerUrl(channelUrl, channelUrl), true);
  assert.equal(globoplay.isHomeUrl('https://globoplay.globo.com/'), true);
  assert.equal(globoplay.isLoginUrl('https://login.globo.com/login'), true);
  assert.equal(globoplay.isLoginSurface({ providerId: 'globoplay', mode: 'login', channelUrl }, 'https://globoplay.globo.com/'), true);
  assert.equal(globoplay.isLoginSurface({ providerId: 'globoplay', mode: 'player', channelUrl }, 'https://globoplay.globo.com/'), false);
});
