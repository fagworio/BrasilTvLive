const { URL } = require('node:url');

const RECORDPLUS_ORIGIN = 'https://www.recordplus.com';

function isRecordPlusUrl(value, predicate) {
  try {
    const parsedUrl = new URL(value);
    return parsedUrl.origin === RECORDPLUS_ORIGIN && predicate(parsedUrl);
  } catch {
    return false;
  }
}

function isPlayerUrl(value) {
  return isRecordPlusUrl(value, (parsedUrl) => parsedUrl.pathname.startsWith('/player/'));
}

function isHomeUrl(value) {
  return isRecordPlusUrl(value, (parsedUrl) => ['/', '/home'].includes(parsedUrl.pathname));
}

function isLoginUrl(value) {
  return isRecordPlusUrl(value, (parsedUrl) => parsedUrl.pathname.startsWith('/login'));
}

function shouldContinuePendingChannel(providerState, navigatedUrl) {
  return providerState?.providerId === 'recordplus'
    && Boolean(providerState.channelUrl)
    && providerState.channelUrl.includes('/player/')
    && providerState.status !== 'player'
    && isHomeUrl(navigatedUrl);
}

module.exports = {
  isPlayerUrl,
  isHomeUrl,
  isLoginUrl,
  shouldContinuePendingChannel,
};
