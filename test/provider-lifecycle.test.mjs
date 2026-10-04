import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getProviderLayer,
  getProviderPreviewStatus,
  isCurrentProviderTarget,
  isProviderFullscreenMode,
  normalizeProviderEvent,
  shouldResumeProviderChannel,
} from '../src/providerLifecycle.js';

const target = {
  providerId: 'globoplay',
  channelUrl: 'https://globoplay.globo.com/tv-globo/ao-vivo/6120663/',
  channelName: 'Globo Minas',
  requestId: 12,
};

test('normalizes the provider lifecycle without accepting stale events', () => {
  const loading = normalizeProviderEvent({
    event: { ...target, status: 'loading' },
    target,
    handoff: { ...target, mode: 'preview', status: 'loading' },
    isWatching: false,
  });
  assert.equal(loading.status, 'loading');

  const ready = normalizeProviderEvent({
    event: { ...target, status: 'player', mode: 'preview' },
    target,
    handoff: { ...target, mode: 'preview', status: 'loading' },
    isWatching: false,
  });
  assert.equal(ready.status, 'player');

  const delayedLoading = normalizeProviderEvent({
    event: { ...target, status: 'loading' },
    target,
    handoff: { ...target, mode: 'preview', status: 'player' },
    isWatching: false,
  });
  assert.equal(delayedLoading.status, 'player');

  assert.equal(isCurrentProviderTarget({ ...target, channelName: 'Globo Nacional' }, target), true);
  assert.equal(isCurrentProviderTarget({ ...target, requestId: 11 }, target), false);
  assert.equal(isCurrentProviderTarget({ ...target, channelUrl: 'https://globoplay.globo.com/' }, target), false);
});

test('keeps the selected channel name when a same-url event arrives late', () => {
  const state = normalizeProviderEvent({
    event: { ...target, channelName: 'Globo Nacional', status: 'player', mode: 'preview' },
    target,
    handoff: { ...target, mode: 'preview', status: 'loading' },
    isWatching: false,
  });
  assert.equal(state.channelName, 'Globo Minas');
});

test('preserves the background player after Escape against a delayed loading event', () => {
  const state = normalizeProviderEvent({
    event: { providerId: 'globoplay', channelUrl: target.channelUrl, status: 'loading' },
    target,
    handoff: { ...target, mode: 'watch', status: 'player' },
    isWatching: false,
  });
  assert.equal(state.status, 'player');
  assert.equal(state.mode, 'watch');
});

test('maps provider surface and preview states to the expected user-visible layer', () => {
  assert.equal(getProviderLayer({ mode: 'preview', isWatching: false }), 'background');
  assert.equal(getProviderLayer({ mode: 'watch', isWatching: true }), 'foreground');
  assert.equal(getProviderLayer({ mode: 'login', isWatching: true }), 'foreground');
  assert.equal(getProviderLayer({ mode: 'login', isWatching: false }), 'background');
  assert.equal(getProviderLayer({ mode: 'watch', isWatching: false }), 'background');

  assert.equal(getProviderPreviewStatus({ connected: false, channelUrl: target.channelUrl, handoff: null }), 'auth-required');
  assert.equal(getProviderPreviewStatus({
    connected: true,
    channelUrl: target.channelUrl,
    handoff: { ...target, mode: 'preview', status: 'player' },
  }), 'playing');
  assert.equal(getProviderPreviewStatus({
    connected: true,
    channelUrl: target.channelUrl,
    handoff: { ...target, mode: 'preview', status: 'loading' },
  }), 'loading');
  assert.equal(isProviderFullscreenMode('watch'), true);
  assert.equal(isProviderFullscreenMode('preview'), false);
  assert.equal(shouldResumeProviderChannel({ status: 'player', reason: 'oauth-closed', channelUrl: target.channelUrl }), true);
  assert.equal(shouldResumeProviderChannel({ status: 'player', reason: 'back', channelUrl: target.channelUrl }), false);
});
