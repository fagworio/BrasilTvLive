import React, { StrictMode, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import Hls from 'hls.js';
import {
  Baby,
  Clapperboard,
  CircleUserRound,
  EllipsisVertical,
  Fullscreen,
  Heart,
  Home,
  Landmark,
  ListVideo,
  Menu,
  Pause,
  Play,
  Radio,
  Search,
  Settings,
  Star,
  Trophy,
  Volume1,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import './styles.css';

const navItems = [
  { label: 'Favoritos', count: '12 canais', icon: Star },
  { label: 'Ao vivo', count: '102 canais', icon: Zap, active: true },
  { label: 'Notícias', count: '28 canais', icon: ListVideo },
  { label: 'Filmes', count: '40 canais', icon: Clapperboard },
  { label: 'Esportes', count: '34 canais', icon: Trophy },
  { label: 'Infantil', count: '18 canais', icon: Baby },
  { label: 'Minas Gerais', count: '16 canais', icon: Landmark },
];

const baseChannels = [
  {
    id: 'tv-brasil',
    name: 'TV Brasil',
    mark: 'tv-brasil',
    streamUrl: 'https://tvbrasil-stream.ebc.com.br/index.m3u8',
    type: 'hls',
    programs: [
      ['Repórter Brasil', '13:00 - 14:00', 'selected'],
      ['Brasil em Pauta', '14:00 - 15:00'],
      ['Stadium', '15:00 - 16:00'],
    ],
  },
  {
    id: 'canal-gov',
    name: 'Canal Gov',
    mark: 'canal-gov',
    streamUrl: 'https://canalgov-stream.ebc.com.br/index.m3u8',
    type: 'hls',
    programs: [
      ['Brasil em Dia', '13:00 - 14:00'],
      ['Voz do Brasil', '14:00 - 15:00'],
      ['Gov em Ação', '15:00 - 16:00'],
    ],
  },
  {
    id: 'tv-camara',
    name: 'TV Câmara',
    mark: 'tv-camara',
    streamUrl: 'https://stream3.camara.gov.br/tv1/manifest.m3u8',
    type: 'hls',
    programs: [
      ['Câmara ao Vivo', '13:00 - 14:00'],
      ['Discursos Parlamentares', '14:00 - 15:00'],
      ['Comissões', '15:00 - 16:00'],
    ],
  },
  {
    id: 'tv-camara-2',
    name: 'TV Câmara 2',
    mark: 'tv-camara',
    streamUrl: 'https://stream3.camara.gov.br/tv2/manifest.m3u8',
    type: 'hls',
    programs: [
      ['Eventos Legislativos', '13:00 - 14:00'],
      ['Comissões ao Vivo', '14:00 - 15:00'],
      ['Programação da Câmara', '15:00 - 16:00'],
    ],
  },
  {
    id: 'tv-brasil-internacional',
    name: 'TV Brasil Internacional',
    mark: 'tv-brasil',
    streamUrl: 'https://tvbrasilinternacional-stream.ebc.com.br/index.m3u8',
    type: 'hls',
    programs: [
      ['Brasil no Mundo', '13:00 - 14:00'],
      ['Conexão Internacional', '14:00 - 15:00'],
      ['Janela Brasil', '15:00 - 16:00'],
    ],
  },
];

const regionOptions = [
  { regionId: 'mg-bh', country: 'BR', state: 'MG', city: 'Belo Horizonte', label: 'Belo Horizonte - MG', lat: -19.92, lon: -43.94 },
  { regionId: 'mg-uberlandia', country: 'BR', state: 'MG', city: 'Uberlândia', label: 'Uberlândia - MG', lat: -18.91, lon: -48.28 },
  { regionId: 'sp-capital', country: 'BR', state: 'SP', city: 'São Paulo', label: 'São Paulo - SP', lat: -23.55, lon: -46.63 },
  { regionId: 'rj-capital', country: 'BR', state: 'RJ', city: 'Rio de Janeiro', label: 'Rio de Janeiro - RJ', lat: -22.91, lon: -43.17 },
];

const GLOBO_LIVE_URL = 'https://globoplay.globo.com/tv-globo/ao-vivo/7832875/';
const GLOBO_REGION_CATALOG_URLS = {
  'mg-bh': 'https://globoplay.globo.com/categorias/globo-minas/',
  'mg-uberlandia': 'https://globoplay.globo.com/categorias/tv-integracao/',
  'sp-capital': 'https://globoplay.globo.com/categorias/sao-paulo/',
  'rj-capital': 'https://globoplay.globo.com/categorias/rio-de-janeiro/',
};
const SBT_OFFICIAL_LIVE_URL = 'https://www.sbt.com.br/ao-vivo';
const SBT_NEWS_LIVE_URL = 'https://my81hvqnsk.execute-api.us-east-1.amazonaws.com';
const SBT_YOUTUBE_EMBED_URL = 'https://www.youtube.com/embed/ABVQXgr2LW4?autoplay=1&mute=1&playsinline=1&rel=0&controls=0&enablejsapi=1&disablekb=1&fs=0';
const BAND_NATIONAL_SOURCE_URL = 'https://www.band.com.br/ao-vivo/band-nacional';
const BAND_PLAYER_CONTROLS = 'controls=play,fullscreen';
const BAND_NATIONAL_EMBED_URL = `https://beyond.spalla.io/player/?autoplay=1&live=019a797e-eeb8-7eda-9518-132403ccb160&muted=0&${BAND_PLAYER_CONTROLS}`;
const REDETV_OFFICIAL_LIVE_URL = 'https://www.redetv.uol.com.br/aovivo/';
const REDETV_DAILYMOTION_PLAYER_URL = 'https://geo.dailymotion.com/player/xgrus.js';
const REDETV_DAILYMOTION_VIDEO_ID = 'kYe5OYErhldJ75Azib2';
const RECORDPLUS_LIVE_URL = 'https://www.recordplus.com/';
const RECORDPLUS_NATIONAL_PLAYER_URL = 'https://www.recordplus.com/player/channel/Y2hhbm5lbCNyNy5jb20jc3A';
const RECORDPLUS_LOGIN_URL = 'https://www.recordplus.com/login?redirectTo=%2F';
const RECORD_NEWS_YOUTUBE_CHANNEL_ID = 'UCuiLR4p6wQ3xLEm15pEn1Xw';
const RECORD_NEWS_YOUTUBE_EMBED_URL = `https://www.youtube.com/embed/live_stream?channel=${RECORD_NEWS_YOUTUBE_CHANNEL_ID}&autoplay=1&mute=1&playsinline=1&rel=0&controls=0&enablejsapi=1&disablekb=1&fs=0`;

const accountProviders = {
  globoplay: {
    id: 'globoplay',
    label: 'Globo / Globoplay',
    mark: 'globo',
    fallbackUrl: GLOBO_LIVE_URL,
    desktopSurface: true,
  },
  recordplus: {
    id: 'recordplus',
    label: 'RECORD / RecordPlus',
    mark: 'record',
    embedStatus: 'blocked',
    fallbackUrl: RECORDPLUS_LOGIN_URL,
    desktopSurface: true,
  },
};

const PROVIDER_STATUS = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  EXPIRED: 'expired',
  ERROR: 'error',
};

const PROVIDER_ACCOUNTS_STORAGE_KEY = 'brasiltvlive-provider-accounts';

function getRecordPlusLoginUrl(channelUrl) {
  if (!channelUrl || !channelUrl.includes('/player/')) return RECORDPLUS_LOGIN_URL;
  try {
    const channelPath = `${new URL(channelUrl).pathname}${new URL(channelUrl).search}`;
    const loginUrl = new URL(RECORDPLUS_LOGIN_URL);
    loginUrl.searchParams.set('redirectTo', channelPath);
    return loginUrl.toString();
  } catch {
    return RECORDPLUS_LOGIN_URL;
  }
}

function getProviderLoginUrl(providerId, channelUrl) {
  if (providerId === 'recordplus') return getRecordPlusLoginUrl(channelUrl);
  if (providerId === 'globoplay') return channelUrl || GLOBO_LIVE_URL;
  return accountProviders[providerId]?.fallbackUrl || channelUrl;
}

function getProgramTimeLabel(channel, providerAccounts, time) {
  if (channel?.provider === 'globoplay' && providerAccounts?.globoplay?.status === PROVIDER_STATUS.CONNECTED) {
    return 'Ao vivo no Globoplay';
  }
  return time;
}

const globoRegionalCatalog = {
  'mg-bh': { label: 'Globo Minas', catalogUrl: GLOBO_REGION_CATALOG_URLS['mg-bh'] },
  'mg-uberlandia': { label: 'TV Integração', catalogUrl: GLOBO_REGION_CATALOG_URLS['mg-uberlandia'] },
  'sp-capital': { label: 'Globo SP', catalogUrl: GLOBO_REGION_CATALOG_URLS['sp-capital'] },
  'rj-capital': { label: 'Globo Rio', catalogUrl: GLOBO_REGION_CATALOG_URLS['rj-capital'] },
};

const globoNationalChannel = {
  id: 'globo-nacional',
  name: 'Globo Nacional',
  mark: 'globo',
  playbackType: 'provider',
  provider: 'globoplay',
  providerUrl: GLOBO_LIVE_URL,
  authRequired: true,
  sourceUrl: GLOBO_LIVE_URL,
  networkLabel: 'GLOBO',
  programs: [['Globo ao vivo', 'Requer Globo / Globoplay'], ['Programação nacional', 'Consulte no Globoplay'], ['Jornal local', 'Consulte no Globoplay']],
};

const recordRegionalCatalog = {
  'mg-bh': { label: 'RECORD Minas', liveAvailability: 'confirmed', playerUrl: 'https://www.recordplus.com/player/channel/Y2hhbm5lbCNyNy5jb20jbWc' },
  'mg-uberlandia': { label: 'TV Paranaíba RECORD', liveAvailability: 'unverified' },
  'sp-capital': { label: 'RECORD São Paulo', liveAvailability: 'confirmed' },
  'rj-capital': { label: 'RECORD Rio', liveAvailability: 'confirmed' },
};

const sbtRegionalCatalog = {
  'mg-bh': { label: 'SBT Regional · Belo Horizonte - MG', streamUrl: null, embedUrl: null },
  'mg-uberlandia': { label: 'SBT Regional · Uberlândia - MG', streamUrl: null, embedUrl: null },
  'sp-capital': { label: 'SBT Regional · São Paulo - SP', streamUrl: null, embedUrl: null },
  'rj-capital': { label: 'SBT Regional · Rio de Janeiro - RJ', streamUrl: null, embedUrl: null },
};

const bandRegionalCatalog = {
  'mg-bh': { label: 'Band Minas', sourceUrl: 'https://www.band.com.br/ao-vivo/band-minas-gerais', embedUrl: `https://beyond.spalla.io/player/?autoplay=1&live=0195cdf3-d8d8-74b6-9516-6c79c06bcec8&muted=0&${BAND_PLAYER_CONTROLS}` },
  'sp-capital': { label: 'Band São Paulo', sourceUrl: BAND_NATIONAL_SOURCE_URL, embedUrl: BAND_NATIONAL_EMBED_URL },
  'rj-capital': { label: 'Band Rio', sourceUrl: 'https://www.band.com.br/band-rio', embedUrl: `https://beyond.spalla.io/player/?autoplay=1&live=0194f211-4229-749f-a47e-58f819471024&muted=0&${BAND_PLAYER_CONTROLS}` },
};

const sbtNationalChannel = {
  id: 'sbt',
  name: 'SBT Nacional',
  mark: 'sbt',
  playbackType: 'embed',
  embedProvider: 'youtube',
  networkLabel: 'SBT',
  embedUrl: SBT_YOUTUBE_EMBED_URL,
  sourceUrl: SBT_OFFICIAL_LIVE_URL,
  programs: [['SBT Nacional Ao Vivo', 'Ao vivo'], ['SBT Brasil', 'A seguir'], ['Programação SBT', 'Confira no SBT']],
};

const bandNationalChannel = {
  id: 'band',
  name: 'Band Nacional',
  mark: 'band',
  playbackType: 'embed',
  embedProvider: 'spalla',
  networkLabel: 'BAND',
  embedUrl: BAND_NATIONAL_EMBED_URL,
  sourceUrl: BAND_NATIONAL_SOURCE_URL,
  programs: [['Band ao vivo', 'Ao vivo'], ['Jornal da Band', 'A seguir'], ['Programação Band', 'Confira na Band']],
};

const redeTvNationalChannel = {
  id: 'redetv',
  name: 'RedeTV! Nacional',
  mark: 'redetv',
  playbackType: 'embed',
  embedProvider: 'dailymotion',
  dailymotionPlayerUrl: REDETV_DAILYMOTION_PLAYER_URL,
  dailymotionVideoId: REDETV_DAILYMOTION_VIDEO_ID,
  sourceUrl: REDETV_OFFICIAL_LIVE_URL,
  programs: [['RedeTV! ao vivo', 'Ao vivo'], ['Brasil do Povo', 'A seguir'], ['TV Fama', 'Confira na RedeTV!']],
};

const recordNationalChannel = {
  id: 'record',
  name: 'RECORD Nacional',
  mark: 'record',
  playbackType: 'provider',
  provider: 'recordplus',
  providerUrl: RECORDPLUS_NATIONAL_PLAYER_URL,
  sourceUrl: RECORDPLUS_NATIONAL_PLAYER_URL,
  authRequired: true,
  networkLabel: 'RECORD',
  programs: [['RECORD Nacional', 'Ao vivo no RecordPlus'], ['Jornalismo RECORD', 'A seguir'], ['Programação RECORD', 'Confira no RecordPlus']],
};

const recordNewsChannel = {
  id: 'record-news',
  name: 'RECORD News',
  mark: 'record-news',
  playbackType: 'embed',
  embedProvider: 'youtube',
  embedUrl: RECORD_NEWS_YOUTUBE_EMBED_URL,
  sourceUrl: 'https://www.youtube.com/@recordnews/live',
  networkLabel: 'RECORD NEWS',
  programs: [['RECORD News Ao Vivo', 'Ao vivo'], ['Jornalismo 24h', 'No ar'], ['Últimas notícias', 'A seguir']],
};

const sbtNewsChannel = {
  id: 'sbt-news',
  name: 'SBT News',
  mark: 'sbt-news',
  playbackType: 'hls',
  streamUrl: SBT_NEWS_LIVE_URL,
  sourceUrl: 'https://sbtnews.sbt.com.br/',
  programs: [['SBT News Ao Vivo', 'Ao vivo'], ['Jornalismo 24h', 'No ar'], ['Últimas notícias', 'A seguir']],
};

function createSbtChannel(regionId) {
  const regional = sbtRegionalCatalog[regionId];
  const regionalChannel = {
    ...sbtNationalChannel,
    regionId,
    regionalLabel: regional?.label || 'SBT Regional',
    regionalUnavailable: !regional?.streamUrl && !regional?.embedUrl,
  };

  if (regional?.streamUrl) {
    return { ...regionalChannel, name: regional.label, playbackType: 'hls', streamUrl: regional.streamUrl, embedUrl: undefined, regionalUnavailable: false };
  }
  if (regional?.embedUrl) {
    return { ...regionalChannel, name: regional.label, playbackType: 'embed', embedUrl: regional.embedUrl, regionalUnavailable: false };
  }
  return regionalChannel;
}

function createBandChannel(regionId) {
  const regional = bandRegionalCatalog[regionId];
  const regionalChannel = {
    ...bandNationalChannel,
    regionId,
    regionalLabel: regional?.label || `Band Regional · ${getRegionOption(regionId).label}`,
    regionalUnavailable: !regional?.embedUrl,
  };

  if (!regional?.embedUrl) return regionalChannel;
  return {
    ...regionalChannel,
    name: regional.label,
    sourceUrl: regional.sourceUrl,
    embedUrl: regional.embedUrl,
    regionalUnavailable: false,
  };
}

function createRedeTvChannel(regionId) {
  const region = getRegionOption(regionId);
  return {
    ...redeTvNationalChannel,
    regionId,
    regionalLabel: `RedeTV! Regional · ${region.label}`,
    regionalUnavailable: true,
  };
}

function getRecordRegionalChannel(regionId) {
  const regional = recordRegionalCatalog[regionId];
  if (!regional) return null;
  return {
    ...recordNationalChannel,
    id: `record-${regionId}`,
    name: regional.label,
    regionId,
    regionalLabel: regional.label,
    regionalAvailability: regional.liveAvailability,
    providerUrl: regional.playerUrl || recordNationalChannel.providerUrl,
    programs: [[regional.label, 'Ao vivo no RecordPlus'], ...recordNationalChannel.programs.slice(1)],
  };
}

function getRegionalStationSummary(regionId) {
  const region = getRegionOption(regionId);
  const globo = globoRegionalCatalog[regionId];
  const record = getRecordRegionalChannel(regionId);
  const band = bandRegionalCatalog[regionId];
  return [
    { id: 'globo', name: globo?.label || 'Globo regional', detail: 'Globoplay' },
    { id: 'record-national', name: recordNationalChannel.name, detail: 'RecordPlus · cadastro/login' },
    { id: 'record-regional', name: record?.name || `RECORD Regional · ${region.label}`, detail: record?.regionalAvailability === 'unverified' ? 'RecordPlus · disponibilidade a validar' : 'RecordPlus · sinal regional confirmado' },
    { id: 'band', name: band?.label || 'Band Nacional', detail: band ? 'Player oficial integrado' : 'Sinal nacional' },
    { id: 'record-news', name: recordNewsChannel.name, detail: 'Player oficial integrado' },
  ];
}

function getRegionOption(regionId) {
  return regionOptions.find((option) => option.regionId === regionId) || regionOptions[0];
}

function getChannelsForRegion(regionId) {
  const region = getRegionOption(regionId);
  const regionalGlobo = {
    id: region.regionId === 'mg-bh' ? 'globo-minas' : `globo-${region.regionId}`,
    name: globoRegionalCatalog[region.regionId]?.label || 'Globo regional',
    mark: region.regionId === 'mg-uberlandia' ? 'tv-integracao' : 'globo',
    playbackType: 'provider',
    provider: 'globoplay',
    providerUrl: GLOBO_LIVE_URL,
    authRequired: true,
    sourceUrl: GLOBO_LIVE_URL,
    regionalCatalogUrl: globoRegionalCatalog[region.regionId]?.catalogUrl,
    networkLabel: 'GLOBO',
    regionId: region.regionId,
    programs: [['Globo ao vivo', 'Requer Globo / Globoplay'], ['Programação local', 'Consulte no Globoplay'], ['Jornal local', 'Consulte no Globoplay']],
  };
  const recordRegional = getRecordRegionalChannel(regionId);
  return [
    baseChannels[0],
    createSbtChannel(regionId),
    sbtNewsChannel,
    recordNationalChannel,
    ...(recordRegional ? [recordRegional] : []),
    recordNewsChannel,
    createBandChannel(regionId),
    createRedeTvChannel(regionId),
    globoNationalChannel,
    regionalGlobo,
    ...baseChannels.slice(1),
  ];
}

function readStoredRegion() {
  try {
    const storedRegion = JSON.parse(window.localStorage.getItem('brasiltvlive-region'));
    return storedRegion?.regionId ? storedRegion : null;
  } catch {
    return null;
  }
}

function readStoredProviderAccounts() {
  const defaultAccounts = Object.fromEntries(Object.keys(accountProviders).map((providerId) => [providerId, { status: PROVIDER_STATUS.DISCONNECTED }]));
  try {
    const storedAccounts = JSON.parse(window.localStorage.getItem(PROVIDER_ACCOUNTS_STORAGE_KEY));
    if (!storedAccounts || typeof storedAccounts !== 'object') return defaultAccounts;
    return Object.fromEntries(Object.keys(accountProviders).map((providerId) => {
      const storedAccount = storedAccounts[providerId];
      const status = Object.values(PROVIDER_STATUS).includes(storedAccount?.status) ? storedAccount.status : PROVIDER_STATUS.DISCONNECTED;
      return [providerId, {
        status,
        ...(typeof storedAccount?.lastVerifiedAt === 'string' ? { lastVerifiedAt: storedAccount.lastVerifiedAt } : {}),
      }];
    }));
  } catch {
    return defaultAccounts;
  }
}

function writeStoredProviderAccounts(accounts) {
  const safeAccounts = Object.fromEntries(Object.keys(accountProviders).map((providerId) => {
    const account = accounts[providerId] || { status: PROVIDER_STATUS.DISCONNECTED };
    return [providerId, {
      status: account.status,
      ...(account.lastVerifiedAt ? { lastVerifiedAt: account.lastVerifiedAt } : {}),
    }];
  }));
  window.localStorage.setItem(PROVIDER_ACCOUNTS_STORAGE_KEY, JSON.stringify(safeAccounts));
}

function resolveRegionFromCoordinates(latitude, longitude) {
  const closest = regionOptions.reduce((best, option) => {
    const distance = ((latitude - option.lat) ** 2) + ((longitude - option.lon) ** 2);
    return !best || distance < best.distance ? { option, distance } : best;
  }, null);
  return closest && closest.distance < 10 ? closest.option : null;
}

const MOBILE_QUERY = '(max-width: 56rem), (max-height: 40rem) and (pointer: coarse) and (hover: none)';
const PREVIEW_LOAD_TIMEOUT_MS = 15000;
const PLAYER_LOAD_TIMEOUT_MS = 20000;

function getDesktopBridge() {
  return typeof window !== 'undefined' ? window.brasilTvLiveDesktop : undefined;
}

function useStreamSource(videoRef, streamUrl, onStreamError, onStreamPlaying) {
  const errorRef = useRef(onStreamError);
  const playingRef = useRef(onStreamPlaying);

  useEffect(() => {
    errorRef.current = onStreamError;
    playingRef.current = onStreamPlaying;
  }, [onStreamError, onStreamPlaying]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;

    let hls;
    const playWhenReady = () => video.play().catch(() => {});
    const reportError = () => errorRef.current?.();
    const reportMediaError = reportError;
    const reportPlaying = () => playingRef.current?.();

    // HLS starts muted so channel changes remain autoplay-safe; the parent
    // applies the selected volume after the real `playing` event.
    video.muted = true;
    video.addEventListener('error', reportMediaError);
    video.addEventListener('playing', reportPlaying);

    const supportsNativeHls = Boolean(video.canPlayType('application/vnd.apple.mpegurl') || video.canPlayType('application/x-mpegURL'));
    if (Hls.isSupported()) {
      hls = new Hls({ enableWorker: true, backBufferLength: 30 });
      hls.loadSource(streamUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, playWhenReady);
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          reportError();
          hls.destroy();
        }
      });
    } else if (supportsNativeHls) {
      video.addEventListener('loadedmetadata', playWhenReady, { once: true });
      video.src = streamUrl;
      video.load();
      playWhenReady();
    }

    return () => {
      hls?.destroy();
      video.removeEventListener('loadedmetadata', playWhenReady);
      video.removeEventListener('error', reportMediaError);
      video.removeEventListener('playing', reportPlaying);
    };
  }, [videoRef, streamUrl]);
}

function StreamVideo({ videoRef, streamUrl, className, onStreamError, onStreamPlaying, ...props }) {
  const internalRef = useRef(null);
  const activeRef = videoRef || internalRef;
  useStreamSource(activeRef, streamUrl, onStreamError, onStreamPlaying);
  return <video ref={activeRef} className={className} {...props} />;
}

let youtubeApiPromise;

function loadYouTubeApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (youtubeApiPromise) return youtubeApiPromise;

  youtubeApiPromise = new Promise((resolve, reject) => {
    const previousReady = window.onYouTubeIframeAPIReady;
    const script = document.querySelector('script[src="https://www.youtube.com/iframe_api"]') || document.createElement('script');
    const handleReady = () => {
      previousReady?.();
      resolve(window.YT);
    };

    window.onYouTubeIframeAPIReady = handleReady;
    script.addEventListener('error', reject, { once: true });
    if (!script.src) {
      script.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(script);
    }
  });

  return youtubeApiPromise;
}

function YouTubeSurface({ channel, className, isWatching, volume, isMuted, onPlaybackStarted, onPlaybackError }) {
  const iframeRef = useRef(null);
  const playerRef = useRef(null);
  const playbackReportedRef = useRef(false);

  const applyAudioState = (player) => {
    if (!player?.setVolume) return;
    player.setVolume(Math.round(volume * 100));
    if (!isWatching || isMuted || !playbackReportedRef.current) player.mute();
    else player.unMute();
  };

  useEffect(() => {
    playbackReportedRef.current = false;
    let cancelled = false;

    loadYouTubeApi().then((YT) => {
      if (cancelled || !iframeRef.current || !YT?.Player) return;
      const player = new YT.Player(iframeRef.current, {
        events: {
          onReady: (event) => {
            playerRef.current = event.target;
            event.target.setVolume(Math.round(volume * 100));
            event.target.mute();
            event.target.playVideo?.();
            if (event.target.getPlayerState?.() === YT.PlayerState.PLAYING && !playbackReportedRef.current) {
              playbackReportedRef.current = true;
              if (isWatching && !isMuted) event.target.unMute?.();
              onPlaybackStarted?.(channel.id);
            }
          },
          onStateChange: (event) => {
            if (event.data === YT.PlayerState.PLAYING && !playbackReportedRef.current) {
              playbackReportedRef.current = true;
              if (isWatching && !isMuted) event.target.unMute?.();
              onPlaybackStarted?.(channel.id);
            }
          },
          onError: () => onPlaybackError?.(channel.id),
        },
      });
      playerRef.current = player;
    }).catch(() => onPlaybackError?.(channel.id));

    return () => {
      cancelled = true;
      playerRef.current?.destroy?.();
      playerRef.current = null;
    };
  }, [channel.id, channel.embedUrl]);

  useEffect(() => {
    applyAudioState(playerRef.current);
  }, [isWatching, isMuted, volume]);

  return (
    <iframe
      ref={iframeRef}
      className={className}
      src={channel.embedUrl}
      title={`${channel.name} ao vivo`}
      allow="autoplay; encrypted-media; picture-in-picture"
    />
  );
}

function SpallaSurface({ channel, className, isWatching, volume, isMuted, onPlaybackStarted, onPlaybackError }) {
  const iframeRef = useRef(null);
  const sendPlayerCommand = (data) => iframeRef.current?.contentWindow?.postMessage(data, '*');
  const syncPlayerAudio = () => {
    sendPlayerCommand({ action: 'volume', volume });
    sendPlayerCommand({ action: isWatching && !isMuted ? 'unmute' : 'mute' });
  };

  useEffect(() => {
    syncPlayerAudio();
  }, [isWatching, isMuted, volume]);

  return (
    <iframe
      ref={iframeRef}
      className={className}
      src={channel.embedUrl}
      title={`${channel.name} ao vivo`}
      allow="autoplay; encrypted-media; fullscreen"
      allowFullScreen
      onLoad={() => { onPlaybackStarted?.(channel.id); syncPlayerAudio(); }}
      onError={() => onPlaybackError?.(channel.id)}
    />
  );
}

function DailymotionSurface({ channel, className, isWatching, volume, isMuted, onPlaybackStarted, onPlaybackError }) {
  const playerHostRef = useRef(null);
  const playerRef = useRef(null);
  const playerReadyRef = useRef(false);
  const playbackStartedRef = useRef(onPlaybackStarted);
  const playbackErrorRef = useRef(onPlaybackError);

  useEffect(() => {
    playbackStartedRef.current = onPlaybackStarted;
    playbackErrorRef.current = onPlaybackError;
  }, [onPlaybackError, onPlaybackStarted]);

  useEffect(() => {
    const host = playerHostRef.current;
    if (!host) return undefined;

    let cancelled = false;
    let retryTimer;
    playerReadyRef.current = false;
    host.innerHTML = '';

    const reportPlaybackStarted = () => {
      playerReadyRef.current = true;
      playbackStartedRef.current?.(channel.id);
    };
    const reportPlaybackError = () => playbackErrorRef.current?.(channel.id);
    const syncAudio = (player) => {
      if (!player?.setVolume) return;
      const nextVolume = !isWatching || isMuted ? 0 : volume;
      Promise.resolve(player.setVolume(nextVolume)).catch(() => {});
    };
    const connectPlayer = async () => {
      if (cancelled || !window.dailymotion?.getPlayer) return;
      try {
        const player = await window.dailymotion.getPlayer();
        if (cancelled || !player) return;
        playerRef.current = player;
        player.on?.('PLAYER_CRITICALPATHREADY', reportPlaybackStarted);
        player.on?.('VIDEO_PLAYING', reportPlaybackStarted);
        player.on?.('PLAYER_ERROR', reportPlaybackError);
        syncAudio(player);
        Promise.resolve(player.play?.()).catch(() => {});
        reportPlaybackStarted();
      } catch {
        retryTimer = window.setTimeout(connectPlayer, 120);
      }
    };

    const script = document.createElement('script');
    script.src = channel.dailymotionPlayerUrl;
    script.dataset.video = channel.dailymotionVideoId;
    script.onload = connectPlayer;
    script.onerror = reportPlaybackError;
    host.appendChild(script);

    return () => {
      cancelled = true;
      window.clearTimeout(retryTimer);
      playerRef.current?.destroy?.();
      playerRef.current = null;
      host.innerHTML = '';
    };
  }, [channel.dailymotionPlayerUrl, channel.dailymotionVideoId, channel.id]);

  useEffect(() => {
    if (isWatching && playerReadyRef.current) playbackStartedRef.current?.(channel.id);
  }, [channel.id, isWatching]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player?.setVolume) return;
    const nextVolume = !isWatching || isMuted ? 0 : volume;
    Promise.resolve(player.setVolume(nextVolume)).catch(() => {});
    if (isWatching) Promise.resolve(player.play?.()).catch(() => {});
  }, [isMuted, isWatching, volume]);

  return (
    <div
      ref={playerHostRef}
      className={className}
      aria-label={`${channel.name} ao vivo`}
    />
  );
}

function EmbedSurface({ channel, className, isWatching, volume, isMuted, onPlaybackStarted, onPlaybackError }) {
  if (channel.embedProvider === 'youtube') {
    return <YouTubeSurface channel={channel} className={className} isWatching={isWatching} volume={volume} isMuted={isMuted} onPlaybackStarted={onPlaybackStarted} onPlaybackError={onPlaybackError} />;
  }
  if (channel.embedProvider === 'dailymotion') {
    return <DailymotionSurface channel={channel} className={className} isWatching={isWatching} volume={volume} isMuted={isMuted} onPlaybackStarted={onPlaybackStarted} onPlaybackError={onPlaybackError} />;
  }
  return <SpallaSurface channel={channel} className={className} isWatching={isWatching} volume={volume} isMuted={isMuted} onPlaybackStarted={onPlaybackStarted} onPlaybackError={onPlaybackError} />;
}

function ProviderSurface({ channel, account, className, isWatching = false, onOpenAccounts, onOpenProviderLogin, onOpenProviderChannel, providerHandoff }) {
  const surfaceRef = useRef(null);
  const provider = accountProviders[channel.provider];
  const status = account?.status || PROVIDER_STATUS.DISCONNECTED;
  const isConnected = status === PROVIDER_STATUS.CONNECTED;
  const needsReconnect = status === PROVIDER_STATUS.EXPIRED || status === PROVIDER_STATUS.ERROR;
  const isDesktopProvider = Boolean(provider?.desktopSurface && getDesktopBridge()?.isDesktop);
  const usesExternalSurface = Boolean(provider?.desktopSurface && !isDesktopProvider);
  const channelUrl = channel.providerUrl || provider?.fallbackUrl;
  const hasDirectPlayerUrl = Boolean(channelUrl);
  const isThisHandoff = providerHandoff?.providerId === channel.provider
    && providerHandoff?.channelUrl === channelUrl
    && (!providerHandoff?.channelName || providerHandoff.channelName === channel.name);
  const desktopSurfaceOpen = isDesktopProvider && isThisHandoff && ['open', 'loading', 'ready', 'player', 'auth-required'].includes(providerHandoff.status);
  const canOpenLogin = Boolean(onOpenProviderLogin || onOpenAccounts);

  useLayoutEffect(() => {
    const desktop = getDesktopBridge();
    if (!desktop?.setProviderBounds) return undefined;

    const syncBounds = () => {
      const element = surfaceRef.current;
      if (!element || !desktopSurfaceOpen) {
        desktop.setProviderBounds({ visible: false });
        return;
      }
      const rect = element.getBoundingClientRect();
      desktop.setProviderBounds({
        visible: rect.width > 0 && rect.height > 0,
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
      });
    };

    syncBounds();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(syncBounds);
    if (surfaceRef.current && observer) observer.observe(surfaceRef.current);
    window.addEventListener('resize', syncBounds);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', syncBounds);
      desktop.setProviderBounds({ visible: false });
    };
  }, [desktopSurfaceOpen, channel.id, isWatching]);

  if (!provider) return null;

  if (isDesktopProvider && desktopSurfaceOpen) {
    return <div ref={surfaceRef} className={`provider-surface ${className || ''}`} aria-label={`${channel.name} — player oficial aberto`} />;
  }

  const isDesktopLoginPreview = isDesktopProvider && !isConnected && !isWatching;
  if (isDesktopLoginPreview) {
    // Navigation mode keeps the normal BrasilTvLive hero visible. The actual
    // provider login is opened only after Enter/select, when App switches to
    // the fullscreen provider surface.
    return <div ref={surfaceRef} className={`provider-surface ${className || ''}`} aria-hidden="true" />;
  }

  if (!isConnected || usesExternalSurface || isDesktopProvider) {
    const showDesktopActions = !isDesktopProvider || !isConnected || desktopSurfaceOpen;
    return (
      <div ref={surfaceRef} className={`provider-surface ${className || ''}`}>
        <div className="provider-surface-card">
          <ChannelMark variant={channel.mark} />
          <strong>{channel.name}</strong>
          <span>{isDesktopProvider
            ? (desktopSurfaceOpen ? `A superfície oficial do ${provider.label} está aberta dentro do BrasilTvLive.` : isConnected ? 'Abrindo o canal ao vivo dentro do BrasilTvLive…' : `Conecte sua conta ${provider.label} dentro do aplicativo para abrir o live.`)
            : usesExternalSurface
              ? `O player oficial do ${provider.label} abre fora do BrasilTvLive. Use a sessão já autenticada no navegador.`
              : needsReconnect
                ? `Sua sessão ${provider.label} precisa ser reconectada.`
                : `Este canal exige uma conta ${provider.label}.`}</span>
          {usesExternalSurface || (isDesktopProvider && showDesktopActions) ? <div className="provider-handoff-actions">
            {canOpenLogin && <button type="button" onClick={(event) => {
              event.stopPropagation();
              if (!onOpenProviderLogin) {
                onOpenAccounts?.();
                return;
              }
              if (isThisHandoff && ['ready', 'player'].includes(providerHandoff.status)) {
                onOpenProviderChannel?.({ providerId: channel.provider, channelUrl, channelName: channel.name, watch: true });
                return;
              }
              if (isThisHandoff && ['open', 'loading'].includes(providerHandoff.status)) {
                onOpenProviderChannel?.({ providerId: channel.provider, channelUrl, channelName: channel.name });
                return;
              }
              onOpenProviderLogin({ providerId: channel.provider, channelUrl, channelName: channel.name });
            }}>{!onOpenProviderLogin ? 'Abrir Contas de TV' : isThisHandoff && ['open', 'loading', 'ready', 'player'].includes(providerHandoff.status) ? (isDesktopProvider ? 'Abrir player no app' : 'Abrir player no popup') : (isDesktopProvider ? (isConnected ? 'Abrir player no app' : 'Abrir login no app') : 'Abrir login no PC')}</button>}
            {(!isDesktopProvider || !isConnected) && <a className="provider-channel-link" href={channelUrl} target="_blank" rel="noreferrer">Abrir {channel.name} no {provider.label}</a>}
          </div> : <button type="button" onClick={(event) => { event.stopPropagation(); onOpenAccounts?.(); }}>{needsReconnect ? 'Reconectar conta' : 'Abrir Contas de TV'}</button>}
          {isThisHandoff && <span className="provider-handoff-note" role="status" aria-live="polite">
            {providerHandoff.status === 'open'
              ? isDesktopProvider ? `Conclua o login na Conta ${provider.label} para retornar ao canal ${channel.name}.` : `Depois de entrar na Conta ${provider.label}, abra o canal ${channel.name} novamente.`
              : providerHandoff.status === 'loading'
                ? `Carregando a superfície oficial do ${provider.label}…`
              : providerHandoff.status === 'ready'
                ? hasDirectPlayerUrl ? 'Sessão autenticada. Carregando o canal escolhido…' : 'Sessão autenticada. Este canal ainda não tem uma URL direta de player confirmada.'
              : providerHandoff.status === 'closed'
                ? isDesktopProvider ? 'A superfície foi fechada. Abra o canal novamente para continuar com a sessão persistente.' : 'A janela foi fechada. Se o login terminou, abra o player oficial para continuar.'
              : providerHandoff.status === 'player'
                  ? isDesktopProvider ? `O player oficial de ${provider.label} está aberto dentro do BrasilTvLive.` : `O player oficial de ${provider.label} foi aberto na mesma janela.`
              : providerHandoff.status === 'auth-required'
                ? `${provider.label} solicitou login nesta sessão. Conclua a autenticação para abrir o canal escolhido.`
                  : isDesktopProvider ? 'Não foi possível carregar o player oficial. Tente abrir o canal novamente.' : 'O navegador bloqueou o popup. Use o botão de login ou abra o canal diretamente.'}
          </span>}
          <small>{isDesktopProvider
            ? `A sessão fica na partição persistente de ${provider.label}. O BrasilTvLive não recebe credenciais, cookies ou tokens.`
            : usesExternalSurface
            ? 'O login, os cookies e a reprodução permanecem na superfície oficial. O BrasilTvLive não recebe essas credenciais.'
            : 'O login acontece na superfície oficial do provedor. O BrasilTvLive não armazena suas credenciais.'}</small>
        </div>
      </div>
    );
  }

  return (
    <iframe
      className={`provider-surface ${className || ''}`}
      src={channel.providerUrl}
      title={`${channel.name} — ${provider.label}`}
      allow="autoplay; encrypted-media; fullscreen"
      allowFullScreen
    />
  );
}

function ProviderLoginSurface({ providerId, onClose, onOpenProviderLogin, providerHandoff }) {
  const closeButtonRef = useRef(null);
  const provider = accountProviders[providerId];
  const providerUrl = getProviderLoginUrl(providerId);
  const [surfaceState, setSurfaceState] = useState('loading');
  const isProviderSurface = Boolean(provider?.desktopSurface);
  const isDesktopSurface = Boolean(getDesktopBridge()?.isDesktop);

  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  if (!provider) return null;

  const handleFrameLoad = (event) => {
    if (provider.embedStatus === 'blocked') {
      setSurfaceState('blocked');
      return;
    }
    try {
      const frameUrl = event.currentTarget.contentDocument?.URL || event.currentTarget.contentWindow?.location?.href || '';
      if (frameUrl.startsWith('chrome-error:') || frameUrl.includes('chromewebdata')) {
        setSurfaceState('blocked');
        return;
      }
    } catch { /* cross-origin providers intentionally keep their document private */ }
    setSurfaceState('loaded');
  };

  return (
    <div className="provider-login-surface" aria-labelledby="provider-login-title">
      <div className="provider-login-header">
        <div>
          <span className="region-dialog-kicker">Superfície oficial</span>
          <h3 id="provider-login-title">Conectar {provider.label}</h3>
        </div>
        <button ref={closeButtonRef} type="button" className="provider-login-close" onClick={onClose}>Voltar</button>
      </div>
      <div className="provider-login-frame-wrap">
        {isProviderSurface ? <div className="provider-login-handoff">
          <ChannelMark variant={provider.mark} />
          <strong>{isDesktopSurface ? `Login de ${provider.label} dentro do app` : `Login de ${provider.label} no navegador`}</strong>
          <span>{isDesktopSurface ? `A página oficial será carregada dentro do BrasilTvLive. A sessão de ${provider.label} fica persistente no desktop e não é copiada para o app.` : `O login será aberto em uma janela própria. Depois de concluir, volte para o BrasilTvLive e abra o canal oficial.`}</span>
          {onOpenProviderLogin && <button type="button" onClick={() => onOpenProviderLogin({ providerId })}>
            {providerHandoff?.providerId === providerId && ['open', 'loading'].includes(providerHandoff.status) ? (isDesktopSurface ? 'Login aberto no app' : 'Login aberto') : (isDesktopSurface ? 'Abrir login no app' : 'Abrir login em janela')}
          </button>}
          {!isDesktopSurface && <a className="provider-login-fallback" href={provider.fallbackUrl} target="_blank" rel="noreferrer">Abrir login em nova aba</a>}
          {providerHandoff?.providerId === providerId && <small role="status" aria-live="polite">
            {providerHandoff.status === 'open'
              ? isDesktopSurface ? `A superfície oficial de ${provider.label} está aberta na área do player. Conclua o login para retornar ao canal selecionado.` : `A janela de login está aberta. A sessão continua em ${provider.label}.`
              : providerHandoff.status === 'loading'
                ? 'Carregando a superfície oficial…'
              : providerHandoff.status === 'closed'
                ? isDesktopSurface ? 'A superfície foi fechada. O BrasilTvLive mantém a sessão persistente para o próximo acesso.' : 'A janela foi fechada. O BrasilTvLive não consegue verificar o login externo.'
                : 'O popup foi bloqueado; use a nova aba para continuar.'}
          </small>}
        </div> : surfaceState === 'blocked' ? <div className="provider-login-blocked" role="alert">
          <ChannelMark variant={provider.mark} />
          <strong>WEB EMBED BLOCKED</strong>
          <span>{provider.label} permite o login em uma aba própria, mas bloqueou esta superfície dentro do BrasilTvLive.</span>
          <small>Não vamos contornar CSP, X-Frame-Options, cookies de terceiros ou DRM. A autenticação permanece na superfície oficial.</small>
          <a className="provider-login-fallback" href={provider.fallbackUrl} target="_blank" rel="noreferrer">Abrir {provider.label} em nova aba</a>
        </div> : <iframe
          className="provider-login-frame"
          src={providerUrl}
          title={`Login oficial ${provider.label}`}
          allow="autoplay; encrypted-media; fullscreen"
          allowFullScreen
          onLoad={handleFrameLoad}
          onError={() => setSurfaceState('blocked')}
        />}
      </div>
      <p className="provider-login-status" role="status" aria-live="polite">
        {isProviderSurface
          ? isDesktopSurface ? `A sessão fica em persist:${providerId}, gerenciada pelo Electron. O BrasilTvLive não recebe cookies ou credenciais.` : `A sessão de ${provider.label} permanece no navegador; o BrasilTvLive não recebe cookies ou credenciais.`
          : surfaceState === 'blocked'
          ? 'O provedor não permitiu carregar a superfície dentro do BrasilTvLive.'
          : surfaceState === 'loaded'
            ? 'Superfície carregada. Faça o login diretamente no provedor, se solicitado.'
            : 'Carregando a superfície oficial…'}
      </p>
      <small className="provider-login-privacy">A senha, os cookies e a sessão permanecem no navegador do provedor. O BrasilTvLive não recebe essas credenciais.</small>
    </div>
  );
}

function useIsMobileMode() {
  const [isMobile, setIsMobile] = useState(() => window.matchMedia(MOBILE_QUERY).matches);

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_QUERY);
    const updateMode = () => setIsMobile(mediaQuery.matches);
    updateMode();
    mediaQuery.addEventListener?.('change', updateMode);
    return () => mediaQuery.removeEventListener?.('change', updateMode);
  }, []);

  return isMobile;
}

function Brand() {
  return (
    <div className="brand" aria-label="BrasilTvLive">
      <span className="brand-mark" aria-hidden="true">
        <span className="brand-mark-green" />
        <span className="brand-mark-yellow" />
      </span>
      <span className="brand-name">BrasilTv<span>Live</span></span>
    </div>
  );
}

const channelLogoSources = {
  'tv-brasil': '/channel-logos/tv-brasil.svg',
  'canal-gov': '/channel-logos/canal-gov.svg',
  'tv-camara': '/channel-logos/tv-camara.svg',
  'sbt': '/channel-logos/sbt.svg',
  'sbt-news': '/channel-logos/sbt-news.svg',
  'record': '/channel-logos/record.svg',
  'record-news': '/channel-logos/record-news.svg',
  'band': '/channel-logos/band.svg',
  'redetv': '/channel-logos/redetv.svg',
  'globo': '/channel-logos/globo.svg',
  'tv-integracao': '/channel-logos/tv-integracao.svg',
};

function ChannelMark({ variant }) {
  const logoSrc = channelLogoSources[variant];
  if (logoSrc) {
    return (
      <span className={`channel-mark ${variant}`} aria-hidden="true">
        <img src={logoSrc} alt="" draggable="false" />
      </span>
    );
  }

  return (
    <span className={`channel-mark ${variant}`} aria-hidden="true">
      {variant === 'tv-senado' ? <><span>tv</span><em>senado</em></> : variant === 'tv-justica' ? 'O' : ''}
    </span>
  );
}

function Sidebar({ focusedNav, selectedNav, onFocus, onSelect, navRefs }) {
  return (
    <aside className="sidebar">
      <Brand />
      <nav className="main-nav" aria-label="Categorias de canais">
        {navItems.map(({ label, count, icon: Icon }, index) => (
          <button
            className={`nav-item ${selectedNav === index ? 'active' : ''} ${focusedNav === index ? 'remote-focused' : ''}`}
            key={label}
            type="button"
            tabIndex={focusedNav === index ? 0 : -1}
            ref={(element) => { navRefs.current[index] = element; }}
            onFocus={() => onFocus(index)}
            onClick={() => onSelect(index)}
          >
            <Icon size={26} strokeWidth={selectedNav === index ? 2.5 : 2} />
            <span className="nav-copy">
              <span className="nav-label">{label}</span>
              <span className="nav-count">{count}</span>
            </span>
          </button>
        ))}
      </nav>
      <button
        className={`nav-item settings ${selectedNav === navItems.length ? 'active' : ''} ${focusedNav === navItems.length ? 'remote-focused' : ''}`}
        type="button"
        tabIndex={focusedNav === navItems.length ? 0 : -1}
        ref={(element) => { navRefs.current[navItems.length] = element; }}
        onFocus={() => onFocus(navItems.length)}
        onClick={() => onSelect(navItems.length)}
      >
        <Settings size={26} strokeWidth={2} />
        <span className="nav-copy"><span className="nav-label">Configurações</span></span>
      </button>
      <div className="sidebar-footnote"><CircleUserRound size={15} /> Experiência TV</div>
    </aside>
  );
}

function Hero({ channel, videoRef, isWatching, isPlayerLoading, playerError, isPreviewLoading, previewError, showChannelNotice, volume, isMuted, onVolumeChange, onMuteToggle, onPlaybackStarted, onPlaybackError, providerAccounts, onOpenAccounts, onOpenProviderLogin, onOpenProviderChannel, providerHandoff }) {
  const [programName, rawProgramTime] = channel.programs[0];
  const programTime = getProgramTimeLabel(channel, providerAccounts, rawProgramTime);
  const isExternal = channel.playbackType === 'external';
  const isProvider = channel.playbackType === 'provider';
  const isEmbed = channel.playbackType === 'embed';
  const providerAccount = isProvider ? providerAccounts?.[channel.provider] : null;
  const providerChannelUrl = isProvider ? channel.providerUrl || accountProviders[channel.provider]?.fallbackUrl : null;
  const isCurrentProviderHandoff = isProvider
    && providerHandoff?.providerId === channel.provider
    && providerHandoff?.channelUrl === providerChannelUrl
    && (!providerHandoff?.channelName || providerHandoff.channelName === channel.name);
  const isOpenProviderHandoff = isCurrentProviderHandoff
    && ['open', 'loading', 'ready', 'player', 'auth-required'].includes(providerHandoff?.status);
  const providerNeedsLogin = isProvider
    && providerAccount?.status !== PROVIDER_STATUS.CONNECTED
    && !isWatching
    && !isOpenProviderHandoff;
  const providerLabel = accountProviders[channel.provider]?.label || 'provedor';
  const externalProviderLabel = channel.externalProviderLabel || 'site oficial';
  const externalNotice = channel.authRequired
    ? `Transmissão oficial disponível no ${externalProviderLabel}. Cadastro ou login pode ser solicitado.`
    : `Transmissão oficial disponível no ${externalProviderLabel}.`;
  const [controlsVisible, setControlsVisible] = useState(false);
  const controlsTimerRef = useRef(null);
  const isInteractingRef = useRef(false);
  const isOverControlsRef = useRef(false);

  const clearControlsTimer = () => window.clearTimeout(controlsTimerRef.current);
  const scheduleControlsHide = () => {
    clearControlsTimer();
    controlsTimerRef.current = window.setTimeout(() => {
      if (!isInteractingRef.current && !isOverControlsRef.current) setControlsVisible(false);
    }, 2600);
  };
  const revealControls = () => {
    if (!isWatching) return;
    setControlsVisible(true);
    scheduleControlsHide();
  };
  const hideControls = () => {
    if (isInteractingRef.current) return;
    clearControlsTimer();
    setControlsVisible(false);
  };
  const startControlsInteraction = () => {
    isInteractingRef.current = true;
    clearControlsTimer();
    setControlsVisible(true);
  };
  const enterControls = () => {
    isOverControlsRef.current = true;
    clearControlsTimer();
    setControlsVisible(true);
  };
  const leaveControls = () => {
    isOverControlsRef.current = false;
    if (!isInteractingRef.current) scheduleControlsHide();
  };
  const finishControlsInteraction = () => {
    isInteractingRef.current = false;
    scheduleControlsHide();
  };

  useEffect(() => () => clearControlsTimer(), []);
  useEffect(() => {
    if (!isWatching) {
      clearControlsTimer();
      isOverControlsRef.current = false;
      setControlsVisible(false);
    }
  }, [isWatching]);

  useEffect(() => {
    if (!videoRef.current || isExternal || isProvider || isEmbed) return;
    videoRef.current.volume = volume;
    videoRef.current.muted = !isWatching || isMuted;
    videoRef.current.play().catch(() => {});
  }, [channel.streamUrl, isExternal, isProvider, isEmbed, isWatching, isMuted, volume, videoRef]);

  return (
    <section className={`hero ${providerNeedsLogin ? 'provider-login-layout' : ''}`} aria-label="Programa atual" onMouseEnter={revealControls} onMouseMove={revealControls} onMouseLeave={hideControls}>
      <div className="hero-art" />
      {isExternal ? (
        <div className="hero-external-card">
          <ChannelMark variant={channel.mark} />
          <strong>{channel.name}</strong>
          <span>{externalNotice}</span>
          <a href={channel.externalUrl} target="_blank" rel="noreferrer" aria-label={`Abrir ${externalProviderLabel} para ${channel.name}`}>Abrir no {externalProviderLabel}</a>
        </div>
      ) : isProvider ? (
        <ProviderSurface channel={channel} account={providerAccounts?.[channel.provider]} className="hero-provider-surface" isWatching={isWatching} onOpenAccounts={onOpenAccounts} onOpenProviderLogin={onOpenProviderLogin} onOpenProviderChannel={onOpenProviderChannel} providerHandoff={providerHandoff} />
      ) : isEmbed ? (
        <EmbedSurface
          channel={channel}
          className="hero-video hero-embed"
          isWatching={isWatching}
          volume={volume}
          isMuted={isMuted}
          onPlaybackStarted={onPlaybackStarted}
          onPlaybackError={onPlaybackError}
        />
      ) : (
        <StreamVideo
          videoRef={videoRef}
          streamUrl={channel.streamUrl}
          className="hero-video"
          autoPlay
          muted={!isWatching || isMuted}
          loop
          playsInline
          onStreamError={() => onPlaybackError(channel.id)}
          onStreamPlaying={() => onPlaybackStarted(channel.id)}
          aria-label={`Preview HLS de ${channel.name} na TV`}
        />
      )}
      <div className="hero-content">
        <div className="live-badge"><span /> {isExternal ? 'GLOBO' : isProvider ? (channel.networkLabel || 'PROVEDOR') : isEmbed ? (channel.networkLabel || 'AO VIVO') : 'AO VIVO'}</div>
        <p className="channel-title">{channel.name}</p>
        <h1>{programName}</h1>
        <div className="program-meta"><span>{programTime}</span><i /> <span>Hoje, 15 de ago.</span></div>
        <p className="program-description">As principais notícias do Brasil e do mundo, com análises e reportagens especiais sobre política, economia, cultura e sociedade.</p>
        {channel.regionalUnavailable && <p className="regional-channel-note" role="status">{channel.regionalLabel} sem transmissão oficial regional disponível. Reproduzindo o sinal nacional da {channel.networkLabel || 'emissora'}.</p>}
      </div>
      {providerNeedsLogin && <div className="provider-login-column" role="status">
        <span className="provider-login-prompt-kicker">Acesso necessário</span>
        <strong>Faça login para assistir</strong>
        <span>Conecte sua conta {providerLabel} para abrir {channel.name} ao vivo.</span>
        {onOpenProviderLogin && <button type="button" onClick={() => onOpenProviderLogin({ providerId: channel.provider, channelUrl: channel.providerUrl, channelName: channel.name })}>Entrar para assistir</button>}
      </div>}
      <div className="hero-fade" />
      <div className={`watch-transition ${(!isWatching && !isPreviewLoading && !previewError) || (isWatching && !isPlayerLoading && !showChannelNotice && !playerError) ? 'is-hidden' : ''}`} role="status" aria-live="polite">
        <div className={`watch-transition-card ${playerError || previewError ? 'is-error' : ''}`}>
          <ChannelMark variant={channel.mark} />
          <div>
            <strong>{channel.name}</strong>
            <span>{playerError || previewError ? 'Transmissão indisponível' : isPlayerLoading || isPreviewLoading ? 'Carregando canal' : 'Ao vivo'}</span>
          </div>
          {(isPlayerLoading || isPreviewLoading) && <span className="watch-transition-spinner" aria-hidden="true" />}
        </div>
      </div>
      {!isProvider && <div
        className={`desktop-player-controls ${controlsVisible || (isEmbed && isWatching) ? 'is-visible' : ''}`}
        onMouseEnter={enterControls}
        onMouseMove={revealControls}
        onMouseLeave={leaveControls}
        onPointerDown={startControlsInteraction}
        onPointerUp={finishControlsInteraction}
        onPointerCancel={finishControlsInteraction}
        aria-label="Controles de volume"
      >
        <button className="desktop-volume-button" type="button" onClick={onMuteToggle} aria-label={isMuted ? 'Ativar som' : 'Silenciar'}>
          {isMuted || volume === 0 ? <VolumeX size={19} /> : volume < 0.5 ? <Volume1 size={19} /> : <Volume2 size={19} />}
        </button>
        <input
          className="desktop-volume-slider"
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(event) => onVolumeChange(Number(event.target.value))}
          aria-label={`Volume ${Math.round(volume * 100)}%`}
        />
        <output className="desktop-volume-value">{Math.round(volume * 100)}%</output>
      </div>}
    </section>
  );
}

function Epg({ channels, providerAccounts, isFocused, focusedRow, focusedCol, selectedProgram, onFocus, onSelect, programRefs }) {
  return (
    <section className="epg" aria-label="Programação">
      <div className="epg-head">
        <span>Hoje, 15 de ago.</span>
        <span>13:00</span>
        <span>14:00</span>
        <span>15:00</span>
        <span>16:00</span>
      </div>
      <div className="epg-scroll" aria-label="Lista de canais e programação">
        <div className="epg-grid">
          <div className="time-marker"><span>13:42</span></div>
          {channels.map((channel, rowIndex) => (
            <div className="epg-row" key={channel.name}>
              <div
                className="channel-cell"
                role="button"
                tabIndex="0"
                aria-label={`Assistir ${channel.name}`}
                onClick={() => onSelect(rowIndex, 0)}
                onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(rowIndex, 0); } }}
              >
                <ChannelMark variant={channel.mark} /><span>{channel.name}</span>
              </div>
              {channel.programs.map(([name, time], colIndex) => {
                const isProgramFocused = isFocused && focusedRow === rowIndex && focusedCol === colIndex;
                const isSelected = selectedProgram.row === rowIndex && selectedProgram.col === colIndex;
                const displayTime = colIndex === 0 ? getProgramTimeLabel(channel, providerAccounts, time) : time;
                return (
                <button
                  className={`program-cell ${isSelected ? 'selected' : ''} ${isProgramFocused ? 'remote-focused' : ''}`}
                  type="button"
                  key={name}
                  tabIndex={isProgramFocused ? 0 : -1}
                  ref={(element) => { programRefs.current[`${rowIndex}-${colIndex}`] = element; }}
                  onFocus={() => onFocus(rowIndex, colIndex)}
                  onClick={() => onSelect(rowIndex, colIndex)}
                >
                  <strong>{name}</strong>
                  <small>{displayTime}</small>
                </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const TV_NAV_COUNT = navItems.length + 1;

function useTvRemoteController({ channels, isWatching = false, onChannelStep, onVolumeStep, onMuteToggle } = {}) {
  const [focusArea, setFocusArea] = useState('nav');
  const [focusedNav, setFocusedNav] = useState(1);
  const [focusedRow, setFocusedRow] = useState(0);
  const [focusedCol, setFocusedCol] = useState(0);
  const [selectedNav, setSelectedNav] = useState(1);
  const [selectedProgram, setSelectedProgram] = useState({ row: 0, col: 0 });
  const navRefs = useRef([]);
  const programRefs = useRef({});

  useEffect(() => {
    if (window.matchMedia(MOBILE_QUERY).matches) return;
    const focusTarget = focusArea === 'nav'
      ? navRefs.current[focusedNav]
      : programRefs.current[`${focusedRow}-${focusedCol}`];
    if (!focusTarget) return;
    focusTarget.focus({ preventScroll: true });
    if (focusArea === 'epg') focusTarget.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [focusArea, focusedNav, focusedRow, focusedCol]);

  useEffect(() => {
    const onRemoteKey = (event) => {
      if (window.matchMedia(MOBILE_QUERY).matches) return;

      const key = event.key;
      const isBack = key === 'Escape' || key === 'Backspace' || key === 'BrowserBack' || key === 'GoBack' || key === 'Back';
      const isOk = key === 'Enter' || key === ' ' || key === 'NumpadEnter';
      const isChannelUp = key === 'PageUp' || key === 'ChannelUp' || key === 'MediaTrackPrevious';
      const isChannelDown = key === 'PageDown' || key === 'ChannelDown' || key === 'MediaTrackNext';
      const isVolumeUp = key === 'AudioVolumeUp' || key === 'VolumeUp' || key === 'MediaVolumeUp';
      const isVolumeDown = key === 'AudioVolumeDown' || key === 'VolumeDown' || key === 'MediaVolumeDown';
      const isMute = key === 'AudioVolumeMute' || key === 'VolumeMute' || key === 'MediaVolumeMute' || key === 'Mute';
      const isKeyboardMute = key.toLowerCase() === 'm';
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key) && !isBack && !isOk && !isChannelUp && !isChannelDown && !isVolumeUp && !isVolumeDown && !isMute && !isKeyboardMute) return;
      if (!isWatching && (isVolumeUp || isVolumeDown || isMute || isKeyboardMute)) return;

      if (isWatching) {
        if (isBack) return;
        if (key === 'ArrowUp' || isChannelUp) {
          event.preventDefault();
          onChannelStep?.(-1);
          return;
        }
        if (key === 'ArrowDown' || isChannelDown) {
          event.preventDefault();
          onChannelStep?.(1);
          return;
        }
        if (key === 'ArrowLeft' || isVolumeDown) {
          event.preventDefault();
          onVolumeStep?.(-0.05);
          return;
        }
        if (key === 'ArrowRight' || isVolumeUp) {
          event.preventDefault();
          onVolumeStep?.(0.05);
          return;
        }
        if (key.toLowerCase() === 'm' || isMute) {
          event.preventDefault();
          onMuteToggle?.();
        }
        return;
      }

      event.preventDefault();

      if (isBack) {
        setFocusArea('nav');
        setFocusedNav(selectedNav);
        return;
      }

      if (isOk) {
        if (focusArea === 'nav') setSelectedNav(focusedNav);
        else setSelectedProgram({ row: focusedRow, col: focusedCol });
        return;
      }

      if (focusArea === 'nav') {
        if (key === 'ArrowDown' || isChannelDown) setFocusedNav((index) => Math.min(TV_NAV_COUNT - 1, index + 1));
        if (key === 'ArrowUp' || isChannelUp) setFocusedNav((index) => Math.max(0, index - 1));
        if (key === 'ArrowRight') setFocusArea('epg');
        return;
      }

      if (key === 'ArrowDown' || isChannelDown) setFocusedRow((row) => Math.min(channels.length - 1, row + 1));
      if (key === 'ArrowUp' || isChannelUp) {
        if (focusedRow === 0) {
          setFocusArea('nav');
          setFocusedNav(selectedNav);
        } else setFocusedRow((row) => row - 1);
      }
      if (key === 'ArrowRight') setFocusedCol((col) => Math.min(channels[focusedRow]?.programs.length - 1 || 0, col + 1));
      if (key === 'ArrowLeft') {
        if (focusedCol === 0) {
          setFocusArea('nav');
          setFocusedNav(selectedNav);
        } else setFocusedCol((col) => col - 1);
      }
    };

    window.addEventListener('keydown', onRemoteKey);
    return () => window.removeEventListener('keydown', onRemoteKey);
  }, [focusArea, focusedNav, focusedRow, focusedCol, selectedNav, isWatching, channels.length, onChannelStep, onVolumeStep, onMuteToggle]);

  return {
    focusArea,
    focusedNav,
    focusedRow,
    focusedCol,
    selectedNav,
    selectedProgram,
    navRefs,
    programRefs,
    setFocusedNav,
    setFocusedProgram: (row, col) => { setFocusArea('epg'); setFocusedRow(row); setFocusedCol(col); },
    selectNav: (index) => { setFocusArea('nav'); setFocusedNav(index); setSelectedNav(index); },
    selectProgram: (row, col) => { setFocusArea('epg'); setFocusedRow(row); setFocusedCol(col); setSelectedProgram({ row, col }); },
  };
}

const mobileCategories = ['Todos', 'Notícias', 'Esportes', 'Filmes'];

function MobileHeader() {
  return (
    <header className="mobile-header">
      <button className="mobile-icon-button" type="button" aria-label="Abrir menu"><Menu size={22} /></button>
      <div className="mobile-brand" aria-label="BrasilTvLive">
        <span className="brand-mark" aria-hidden="true"><span className="brand-mark-green" /><span className="brand-mark-yellow" /></span>
        <span className="mobile-brand-name">BrasilTv<span>Live</span></span>
      </div>
      <button className="mobile-icon-button" type="button" aria-label="Pesquisar"><Search size={21} /></button>
    </header>
  );
}

function MobilePlayer({ channel, onChannelStep, onPlaybackReady, onPlaybackError, providerAccounts, onOpenAccounts }) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(channel.playbackType !== 'external' && channel.playbackType !== 'provider');
  const [swipeFeedback, setSwipeFeedback] = useState(null);
  const playerRef = useRef(null);
  const videoRef = useRef(null);
  const touchStartRef = useRef(null);
  const suppressClickRef = useRef(false);
  const swipeFeedbackTimerRef = useRef(null);
  const externalProviderLabel = channel.externalProviderLabel || 'site oficial';
  const externalNotice = channel.authRequired
    ? `Transmissão oficial no ${externalProviderLabel}. Cadastro ou login pode ser solicitado.`
    : `Transmissão oficial disponível no ${externalProviderLabel}.`;

  const togglePlayback = async () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) await video.play();
    else video.pause();
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (video?.duration) setProgress((video.currentTime / video.duration) * 100);
  };

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(document.fullscreenElement === playerRef.current);
    const handleWebkitBeginFullscreen = () => setIsFullscreen(true);
    const handleWebkitEndFullscreen = () => setIsFullscreen(false);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    videoRef.current?.addEventListener('webkitbeginfullscreen', handleWebkitBeginFullscreen);
    videoRef.current?.addEventListener('webkitendfullscreen', handleWebkitEndFullscreen);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      videoRef.current?.removeEventListener('webkitbeginfullscreen', handleWebkitBeginFullscreen);
      videoRef.current?.removeEventListener('webkitendfullscreen', handleWebkitEndFullscreen);
    };
  }, []);

  useEffect(() => {
    setHasError(false);
    setIsLoading(channel.playbackType !== 'external' && channel.playbackType !== 'provider');
  }, [channel.id]);

  useEffect(() => () => window.clearTimeout(swipeFeedbackTimerRef.current), []);

  const showSwipeFeedback = (label) => {
    setSwipeFeedback(label);
    window.clearTimeout(swipeFeedbackTimerRef.current);
    swipeFeedbackTimerRef.current = window.setTimeout(() => setSwipeFeedback(null), 700);
  };

  const handleTouchStart = (event) => {
    if (!isFullscreen || isLoading || event.touches.length !== 1) return;
    const [touch] = event.touches;
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    suppressClickRef.current = false;
  };

  const handleTouchEnd = (event) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start || !isFullscreen || isLoading) return;

    const [touch] = event.changedTouches;
    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    const distance = Math.hypot(deltaX, deltaY);
    const isVerticalSwipe = Math.abs(deltaY) >= 64 && Math.abs(deltaY) >= Math.abs(deltaX) * 1.25;
    if (!isVerticalSwipe || distance < 64) return;

    event.preventDefault();
    suppressClickRef.current = true;
    const direction = deltaY < 0 ? 1 : -1;
    showSwipeFeedback(direction > 0 ? 'Próximo canal' : 'Canal anterior');
    onChannelStep?.(direction);
  };

  const handlePlayerClick = () => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    togglePlayback();
  };

  const toggleFullscreen = async () => {
    const player = playerRef.current;
    const video = videoRef.current;
    if (!player || channel.playbackType === 'external' || channel.playbackType === 'provider') return;

    if (document.fullscreenElement) {
      await document.exitFullscreen?.();
      if (typeof screen !== 'undefined') screen.orientation?.unlock?.();
      return;
    }

    // Inline autoplay stays muted; entering fullscreen is an explicit user gesture,
    // so the mobile player can now use the device's native media-volume controls.
    if (video) {
      video.muted = false;
      video.volume = 1;
    }

    if (player.requestFullscreen) {
      try {
        await player.requestFullscreen();
        setIsFullscreen(true);
        if (typeof screen !== 'undefined') {
          try { await screen.orientation?.lock?.('landscape'); } catch { /* optional browser capability */ }
        }
        return;
      } catch { /* fall through to the video-specific fullscreen API */ }
    }

    video?.webkitEnterFullscreen?.();
    setIsFullscreen(true);
  };

  return (
    <section
      ref={playerRef}
      className={`mobile-player ${isPlaying ? 'playing' : 'paused'} ${isFullscreen ? 'is-fullscreen' : ''}`}
      aria-label="Player do programa atual"
      onClick={handlePlayerClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="mobile-player-art" />
      {channel.playbackType === 'external' ? (
        <div className="mobile-external-card">
          <ChannelMark variant={channel.mark} />
          <strong>{channel.name}</strong>
          <span>{externalNotice}</span>
          <a href={channel.externalUrl} target="_blank" rel="noreferrer" aria-label={`Abrir ${externalProviderLabel} para ${channel.name}`}>Abrir no {externalProviderLabel}</a>
        </div>
      ) : channel.playbackType === 'provider' ? (
        <ProviderSurface channel={channel} account={providerAccounts?.[channel.provider]} className="mobile-player-provider" onOpenAccounts={onOpenAccounts} />
      ) : channel.playbackType === 'embed' ? (
        <EmbedSurface
          channel={channel}
          className="mobile-player-embed"
          isWatching={isFullscreen}
          volume={1}
          isMuted={!isFullscreen}
          onPlaybackStarted={(channelId) => { setIsLoading(false); setHasError(false); setIsPlaying(true); onPlaybackReady?.(channelId); }}
          onPlaybackError={(channelId) => { setHasError(true); setIsLoading(false); onPlaybackError?.(channelId); }}
        />
      ) : (
        <StreamVideo
          videoRef={videoRef}
          streamUrl={channel.streamUrl}
          className="mobile-player-video"
          autoPlay
          muted={!isFullscreen}
          loop
          playsInline
          preload="auto"
          onPlay={() => { setHasError(false); setIsPlaying(true); }}
          onPause={() => setIsPlaying(false)}
          onTimeUpdate={handleTimeUpdate}
          onError={() => { setHasError(true); setIsPlaying(false); onPlaybackError?.(channel.id); }}
          onStreamError={() => { setHasError(true); setIsLoading(false); setIsPlaying(false); onPlaybackError?.(channel.id); }}
          onStreamPlaying={() => { setIsLoading(false); setHasError(false); setIsPlaying(true); onPlaybackReady?.(channel.id); }}
          aria-label={`Stream HLS de ${channel.name}`}
        />
      )}
      <div className="mobile-player-scrim" />
      <div className={`mobile-player-transition ${isLoading && !hasError ? '' : 'is-hidden'}`} role="status" aria-live="polite">
        <ChannelMark variant={channel.mark} />
        <span>Carregando {channel.name}</span>
        <i aria-hidden="true" />
      </div>
      {channel.playbackType === 'embed' && isFullscreen && <div className="mobile-gesture-layer" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} aria-hidden="true" />}
      {swipeFeedback && <div className="mobile-zap-feedback" role="status" aria-live="polite">{swipeFeedback}</div>}
      {channel.playbackType !== 'external' && channel.playbackType !== 'provider' && <div className="mobile-player-controls">
        <span className="mobile-live-badge">{channel.playbackType === 'embed' ? (channel.networkLabel || 'AO VIVO') : 'AO VIVO'}</span>
        <span className="player-spacer" />
        {channel.playbackType !== 'embed' && <button className="mobile-player-button" type="button" aria-label={isPlaying ? 'Pausar' : 'Reproduzir'} onClick={(event) => { event.stopPropagation(); togglePlayback(); }}>
          {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
        </button>}
        <button className="mobile-player-button" type="button" aria-label={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'} onClick={(event) => { event.stopPropagation(); toggleFullscreen(); }}><Fullscreen size={19} /></button>
      </div>}
      {hasError && <div className="mobile-player-error">Stream de teste indisponível</div>}
      <div className="player-progress"><span style={{ width: `${progress}%` }} /></div>
    </section>
  );
}

function MobileChannelList({ channels, activeChannelIndex, onSelectChannel }) {
  const channelRefs = useRef({});

  useEffect(() => {
    channelRefs.current[activeChannelIndex]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [activeChannelIndex]);

  return (
    <div className="mobile-channel-list">
      {channels.map((channel, index) => (
        <article
          className={`mobile-channel-row ${activeChannelIndex === index ? 'active' : ''}`}
          key={channel.id}
          ref={(element) => { channelRefs.current[index] = element; }}
          role="button"
          tabIndex="0"
          aria-current={activeChannelIndex === index ? 'true' : undefined}
          onClick={() => onSelectChannel(index)}
          onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelectChannel(index); } }}
        >
          <ChannelMark variant={channel.mark} />
          <div className="mobile-channel-copy">
            <strong>{channel.name}</strong>
            <span>{channel.programs[0][0]}</span>
          </div>
          <div className="mobile-channel-status">
            {index === 0 ? <span className="row-live">Ao vivo</span> : <span className="row-progress"><i style={{ width: `${index === 1 ? 58 : 82}%` }} /></span>}
          </div>
          <button className="mobile-more" type="button" aria-label={`Mais opções de ${channel.name}`} onClick={(event) => event.stopPropagation()}><EllipsisVertical size={19} /></button>
        </article>
      ))}
    </div>
  );
}

function MobileBottomNav({ activeIndex, onSelect }) {
  return (
    <nav className="mobile-bottom-nav" aria-label="Navegação mobile">
      <button className={`mobile-bottom-item ${activeIndex === 0 ? 'active' : ''}`} type="button" aria-pressed={activeIndex === 0} onClick={() => onSelect(0)}><Home size={21} strokeWidth={2.4} /><span>Início</span></button>
      <button className={`mobile-bottom-item ${activeIndex === 1 ? 'active' : ''}`} type="button" aria-pressed={activeIndex === 1} onClick={() => onSelect(1)}><Radio size={21} /><span>Canais</span></button>
      <button className={`mobile-bottom-item ${activeIndex === 2 ? 'active' : ''}`} type="button" aria-pressed={activeIndex === 2} onClick={() => onSelect(2)}><Star size={21} /><span>Favoritos</span></button>
      <button className={`mobile-bottom-item ${activeIndex === 3 ? 'active' : ''}`} type="button" aria-pressed={activeIndex === 3} onClick={() => onSelect(3)}><EllipsisVertical size={21} /><span>Mais</span></button>
    </nav>
  );
}

function getProviderStatusLabel(status) {
  return {
    [PROVIDER_STATUS.DISCONNECTED]: 'Não conectado',
    [PROVIDER_STATUS.CONNECTING]: 'Conectando',
    [PROVIDER_STATUS.CONNECTED]: 'Conectado',
    [PROVIDER_STATUS.EXPIRED]: 'Reconexão necessária',
    [PROVIDER_STATUS.ERROR]: 'Erro de conexão',
  }[status] || 'Não conectado';
}

function ProviderAccountCard({ provider, account, onConnect, onDisconnect }) {
  const status = account?.status || PROVIDER_STATUS.DISCONNECTED;
  const isConnected = status === PROVIDER_STATUS.CONNECTED;
  const needsReconnect = status === PROVIDER_STATUS.EXPIRED || status === PROVIDER_STATUS.ERROR;
  const actionLabel = isConnected ? 'Gerenciar' : needsReconnect ? 'Reconectar' : 'Conectar';

  return (
    <article className={`provider-account-card status-${status}`}>
      <ChannelMark variant={provider.mark} />
      <div className="provider-account-copy">
        <strong>{provider.label}</strong>
        <span className="provider-account-status"><i aria-hidden="true" />{getProviderStatusLabel(status)}</span>
        {account?.lastVerifiedAt && <small>Verificado recentemente</small>}
      </div>
      {isConnected ? (
        <button type="button" className="provider-account-action secondary" onClick={() => onDisconnect(provider.id)}>Desconectar</button>
      ) : (
        <button type="button" className="provider-account-action" onClick={() => onConnect(provider.id)}>{actionLabel}</button>
      )}
    </article>
  );
}

function RegionDialog({ region, regionSource, selectedRegionId, onSelectedRegionChange, onSave, onUseLocation, isLocating, locationError, onClose, isFirstAccess, providerAccounts, onConnectProvider, onDisconnectProvider, accountNotice, activeProviderLogin, onCloseProviderLogin, onOpenProviderLogin, providerHandoff }) {
  const selectRef = useRef(null);
  const stationSummary = getRegionalStationSummary(selectedRegionId);

  useEffect(() => {
    selectRef.current?.focus();
    const handleDialogKeyDown = (event) => {
      if (event.key === 'Escape' && !isFirstAccess) onClose();
    };
    document.addEventListener('keydown', handleDialogKeyDown);
    return () => document.removeEventListener('keydown', handleDialogKeyDown);
  }, [isFirstAccess, onClose]);

  return (
    <div className="region-dialog-backdrop" role="presentation">
      <section className="region-dialog" role="dialog" aria-modal="true" aria-labelledby="region-dialog-title" aria-describedby="region-dialog-description">
        <div className="region-dialog-kicker">BrasilTvLive</div>
        <h2 id="region-dialog-title">{isFirstAccess ? 'Canais da sua região' : 'Configurações'}</h2>
        <p id="region-dialog-description">{isFirstAccess ? 'Escolha sua região para exibirmos as emissoras e afiliadas disponíveis na sua praça.' : 'Gerencie sua praça e as contas usadas pelos canais que exigem autenticação.'}</p>
        <label className="region-dialog-label" htmlFor="region-select">Região atual</label>
        <select ref={selectRef} id="region-select" value={selectedRegionId} onChange={(event) => onSelectedRegionChange(event.target.value)}>
          {regionOptions.map((option) => <option key={option.regionId} value={option.regionId}>{option.label}</option>)}
        </select>
        <div className="region-dialog-preview" aria-labelledby="region-dialog-preview-title">
          <strong id="region-dialog-preview-title">Canais disponíveis nesta praça</strong>
          <ul>
            {stationSummary.map((station) => <li key={station.id}><span>{station.name}</span><small>{station.detail}</small></li>)}
          </ul>
        </div>
        {!isFirstAccess && <section className="accounts-section" aria-labelledby="accounts-section-title">
          <div className="accounts-section-heading">
            <div>
              <h3 id="accounts-section-title">Contas de TV</h3>
              <p>As sessões pertencem aos provedores. O BrasilTvLive não armazena senhas, tokens ou cookies.</p>
            </div>
          </div>
          {activeProviderLogin ? <ProviderLoginSurface providerId={activeProviderLogin} onClose={onCloseProviderLogin} onOpenProviderLogin={onOpenProviderLogin} providerHandoff={providerHandoff} /> : <div className="provider-account-list">
            {Object.values(accountProviders).map((provider) => <ProviderAccountCard
              key={provider.id}
              provider={provider}
              account={providerAccounts?.[provider.id]}
              onConnect={onConnectProvider}
              onDisconnect={onDisconnectProvider}
            />)}
          </div>}
          {accountNotice && <p className="account-notice" role="status" aria-live="polite">{accountNotice}</p>}
        </section>}
        {locationError && <p className="region-dialog-error" role="alert">{locationError}</p>}
        <div className="region-dialog-actions">
          <button type="button" className="region-secondary-button" onClick={onUseLocation} disabled={isLocating}>{isLocating ? 'Localizando…' : 'Usar localização'}</button>
          <button type="button" className="region-primary-button" onClick={onSave}>Confirmar região</button>
        </div>
        {!isFirstAccess && <button type="button" className="region-close-button" onClick={onClose}>Cancelar</button>}
        {region && !isFirstAccess && <span className="region-dialog-current">Atual: {getRegionOption(region.regionId).label} · {regionSource === 'auto' ? 'Automática' : 'Manual'}</span>}
      </section>
    </div>
  );
}

function MobileApp({ channels, activeChannelIndex, onSelectChannel, onChannelStep, onOpenRegion, onPlaybackReady, onPlaybackError, providerAccounts, onOpenAccounts }) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [activeBottomNav, setActiveBottomNav] = useState(0);
  const channel = channels[activeChannelIndex];
  const [programName, programTime] = channel.programs[0];
  const handleBottomNav = (index) => {
    setActiveBottomNav(index);
    if (index === 3) onOpenRegion?.();
  };

  return (
    <main className="mobile-shell">
      <MobileHeader />
      <MobilePlayer channel={channel} onChannelStep={onChannelStep} onPlaybackReady={onPlaybackReady} onPlaybackError={onPlaybackError} providerAccounts={providerAccounts} onOpenAccounts={onOpenAccounts} />
      <section className="mobile-current-program" aria-label="Canal e programa atuais">
        <div className="mobile-current-channel">
          <ChannelMark variant={channel.mark} />
          <div><strong>{channel.name}</strong><span>{programName}</span></div>
          <button className={`favorite-button ${isFavorite ? 'selected' : ''}`} type="button" aria-pressed={isFavorite} aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'} onClick={() => setIsFavorite((favorite) => !favorite)}><Heart size={23} fill={isFavorite ? 'currentColor' : 'none'} /></button>
        </div>
        <h1>{programName}</h1>
        <div className="mobile-meta"><span>{programTime}</span><span className="meta-live"><span /> Ao vivo</span></div>
        <p>As principais notícias do Brasil e do mundo, com análises e reportagens especiais.</p>
        {channel.regionalUnavailable && <p className="mobile-regional-note" role="status">{channel.regionalLabel} sem transmissão regional · exibindo {channel.networkLabel || 'sinal nacional'}</p>}
      </section>
      <div className="mobile-category-strip" aria-label="Categorias">
        {mobileCategories.map((category, index) => <button className={`category-chip ${selectedCategory === index ? 'selected' : ''}`} type="button" key={category} onClick={() => setSelectedCategory(index)}>{category}</button>)}
      </div>
      <section className="mobile-channels" aria-label="Canais ao vivo">
        <div className="mobile-section-heading"><h2>Canais ao vivo</h2><span>Ver todos</span></div>
        <MobileChannelList channels={channels} activeChannelIndex={activeChannelIndex} onSelectChannel={onSelectChannel} />
      </section>
      <MobileBottomNav activeIndex={activeBottomNav} onSelect={handleBottomNav} />
    </main>
  );
}

function App() {
  const isMobile = useIsMobileMode();
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [region, setRegion] = useState(() => readStoredRegion());
  const [regionSource, setRegionSource] = useState(() => readStoredRegion()?.source || 'manual');
  const [isRegionDialogOpen, setIsRegionDialogOpen] = useState(() => !readStoredRegion());
  const [regionDraft, setRegionDraft] = useState(() => readStoredRegion()?.regionId || regionOptions[0].regionId);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [providerAccounts, setProviderAccounts] = useState(() => readStoredProviderAccounts());
  const [accountNotice, setAccountNotice] = useState(null);
  const [activeProviderLogin, setActiveProviderLogin] = useState(null);
  const [providerHandoff, setProviderHandoff] = useState(null);
  const [activeChannelIndex, setActiveChannelIndex] = useState(0);
  const [isWatching, setIsWatching] = useState(false);
  const [isPlayerLoading, setIsPlayerLoading] = useState(false);
  const [previewStatus, setPreviewStatus] = useState('loading');
  const [playerError, setPlayerError] = useState(false);
  const [showChannelNotice, setShowChannelNotice] = useState(false);
  const [volume, setVolume] = useState(0.6);
  const [isMuted, setIsMuted] = useState(false);
  const [volumeNotice, setVolumeNotice] = useState(null);
  const channelStepRef = useRef(null);
  const volumeStepRef = useRef(null);
  const muteToggleRef = useRef(null);
  const volumeRef = useRef(0.6);
  const volumeNoticeTimerRef = useRef(null);
  const channelNoticeTimerRef = useRef(null);
  const previewTimeoutRef = useRef(null);
  const playerTimeoutRef = useRef(null);
  const providerPopupTimerRef = useRef(null);
  const providerPopupRef = useRef(null);
  const providerTargetRef = useRef(null);
  const regionId = region?.regionId || regionOptions[0].regionId;
  const channels = useMemo(() => getChannelsForRegion(regionId), [regionId]);
  const remote = useTvRemoteController({
    channels,
    isWatching,
    onChannelStep: (direction) => channelStepRef.current?.(direction),
    onVolumeStep: (delta) => volumeStepRef.current?.(delta),
    onMuteToggle: () => muteToggleRef.current?.(),
  });
  const heroVideoRef = useRef(null);
  const activeChannel = channels[activeChannelIndex];
  const activeChannelRef = useRef(activeChannel);
  const isWatchingRef = useRef(isWatching);
  activeChannelRef.current = activeChannel;
  isWatchingRef.current = isWatching;
  const activeProviderStatus = activeChannel?.provider
    ? providerAccounts[activeChannel.provider]?.status
    : null;
  const previousProgramRef = useRef(remote.selectedProgram);

  const openRegionDialog = () => {
    setRegionDraft(region?.regionId || regionOptions[0].regionId);
    setRegionSource(region?.source || 'manual');
    setLocationError(null);
    setAccountNotice(null);
    setActiveProviderLogin(null);
    setIsRegionDialogOpen(true);
  };

  const saveRegion = () => {
    const selectedRegion = getRegionOption(regionDraft);
    const nextRegion = {
      country: selectedRegion.country,
      state: selectedRegion.state,
      city: selectedRegion.city,
      regionId: selectedRegion.regionId,
      source: regionSource,
    };
    window.localStorage.setItem('brasiltvlive-region', JSON.stringify(nextRegion));
    setRegion(nextRegion);
    setActiveChannelIndex(0);
    remote.selectProgram(0, 0);
    setIsRegionDialogOpen(false);
  };

  const handleProviderConnect = (providerId) => {
    const provider = accountProviders[providerId];
    if (!provider) return;
    if (provider.desktopSurface) {
      setAccountNotice(null);
      setActiveProviderLogin(providerId);
      return;
    }
    setAccountNotice(`O login oficial de ${provider.label} será habilitado na próxima etapa. Nenhuma credencial é armazenada pelo BrasilTvLive.`);
  };

  const openProviderLogin = ({ providerId, channelUrl = null, channelName = null }) => {
    const provider = accountProviders[providerId];
    if (!provider?.fallbackUrl) return;

    const desktop = getDesktopBridge();
    if (desktop?.isDesktop) {
      // A channel-triggered login is part of the viewing flow. Keep the
      // provider surface in the same fullscreen shell used by the player so
      // the login page never appears cropped inside the hero panel. Account
      // management (without a channel target) remains inside RegionDialog.
      setIsWatching(Boolean(channelUrl && channelName));
      providerTargetRef.current = { providerId, channelUrl, channelName };
      const nextHandoff = { providerId, channelUrl, channelName, mode: 'login', status: 'open', surface: 'desktop' };
      setProviderHandoff(nextHandoff);
      desktop.openProviderSurface({ providerId, url: getProviderLoginUrl(providerId, channelUrl), channelUrl, channelName, mode: 'login' })
        .then((state) => setProviderHandoff((current) => current?.providerId === providerId ? { ...current, ...state, surface: 'desktop' } : current))
        .catch(() => setProviderHandoff((current) => current?.providerId === providerId ? { ...current, status: 'error', surface: 'desktop' } : current));
      return;
    }

    window.clearInterval(providerPopupTimerRef.current);
    providerTargetRef.current = { providerId, channelUrl, channelName };
    const popup = window.open(
      getProviderLoginUrl(providerId, channelUrl),
      `brasiltvlive-${providerId}-login`,
      'popup=yes,width=520,height=760,resizable=yes,scrollbars=yes',
    );
    setProviderHandoff({
      providerId,
      channelUrl,
      channelName,
      status: popup ? 'open' : 'blocked',
    });
    if (!popup) return;

    providerPopupRef.current = popup;
    popup.focus?.();
    providerPopupTimerRef.current = window.setInterval(() => {
      if (!popup.closed) return;
      window.clearInterval(providerPopupTimerRef.current);
      providerPopupRef.current = null;
      setProviderHandoff((current) => current?.providerId === providerId
        ? { ...current, status: 'closed' }
        : current);
    }, 700);
  };

  const openProviderChannel = ({ providerId, channelUrl, channelName, watch = true }) => {
    const desktop = getDesktopBridge();
    if (desktop?.isDesktop) {
      setIsWatching(watch);
      providerTargetRef.current = { providerId, channelUrl, channelName };
      const nextHandoff = { providerId, channelUrl, channelName, mode: 'player', status: 'player', surface: 'desktop' };
      setProviderHandoff(nextHandoff);
      desktop.openProviderSurface({ providerId, url: channelUrl, channelUrl, channelName, mode: 'player' })
        .then((state) => setProviderHandoff((current) => current?.providerId === providerId ? { ...current, ...state, surface: 'desktop' } : current))
        .catch(() => setProviderHandoff((current) => current?.providerId === providerId ? { ...current, status: 'error', surface: 'desktop' } : current));
      return;
    }

    const popup = providerPopupRef.current;
    if (popup && !popup.closed) {
      providerTargetRef.current = { providerId, channelUrl, channelName };
      popup.location.href = channelUrl;
      popup.focus?.();
      setProviderHandoff((current) => current?.providerId === providerId && current?.channelUrl === channelUrl
        ? { ...current, channelName, status: 'player' }
        : current);
      return;
    }

    const playerWindow = window.open(
      channelUrl,
      `brasiltvlive-${providerId}-player`,
      'popup=yes,width=1100,height=760,resizable=yes,scrollbars=yes',
    );
    providerTargetRef.current = { providerId, channelUrl, channelName };
    setProviderHandoff({ providerId, channelUrl, channelName, status: playerWindow ? 'player' : 'blocked' });
    playerWindow?.focus?.();
  };

  const closeDesktopProviderForChannel = (nextChannel) => {
    const desktop = getDesktopBridge();
    if (!desktop?.isDesktop || providerHandoff?.surface !== 'desktop') return;
    if (nextChannel?.playbackType === 'provider' && nextChannel.provider === providerHandoff.providerId) return;
    providerTargetRef.current = null;
    desktop.closeProviderSurface?.();
    setProviderHandoff(null);
  };

  useEffect(() => {
    const desktop = getDesktopBridge();
    if (!desktop?.isDesktop || activeChannel?.playbackType !== 'provider' || activeProviderStatus !== PROVIDER_STATUS.CONNECTED) return;

    const channelUrl = activeChannel.providerUrl || accountProviders[activeChannel.provider]?.fallbackUrl;
    if (!channelUrl) return;
    const currentTarget = providerTargetRef.current;
    if (currentTarget?.providerId === activeChannel.provider
      && currentTarget.channelUrl === channelUrl
      && currentTarget.channelName === activeChannel.name) return;

    openProviderChannel({
      providerId: activeChannel.provider,
      channelUrl,
      channelName: activeChannel.name,
      watch: false,
    });
  }, [activeChannel?.id, activeChannel?.name, activeChannel?.provider, activeChannel?.providerUrl, activeChannel?.playbackType, activeProviderStatus, region?.regionId]);

  useEffect(() => {
    const desktop = getDesktopBridge();
    if (!desktop?.isDesktop || !activeChannel?.provider || !accountProviders[activeChannel.provider]?.desktopSurface) return;
    desktop.setProviderAudioMuted?.(!isWatching || isMuted);
  }, [activeChannel?.provider, isMuted, isWatching, providerHandoff?.status]);

  useEffect(() => {
    window.clearTimeout(previewTimeoutRef.current);
    const channel = activeChannel;
    if (!channel) return undefined;

    if (channel.playbackType === 'external') {
      setPreviewStatus('external');
      return undefined;
    }
    if (channel.playbackType === 'provider') {
      const connected = providerAccounts[channel.provider]?.status === PROVIDER_STATUS.CONNECTED;
      setPreviewStatus(connected ? 'loading' : 'auth-required');
      return undefined;
    }

    setPreviewStatus('loading');
    previewTimeoutRef.current = window.setTimeout(() => {
      if (activeChannelRef.current?.id === channel.id && !isWatchingRef.current) setPreviewStatus('error');
    }, PREVIEW_LOAD_TIMEOUT_MS);
    return () => window.clearTimeout(previewTimeoutRef.current);
  }, [activeChannel?.id, activeChannel?.playbackType, activeChannel?.provider, providerAccounts]);

  useEffect(() => {
    const channel = activeChannel;
    if (channel?.playbackType !== 'provider' || !providerHandoff || providerHandoff.providerId !== channel.provider) return;
    const channelUrl = channel.providerUrl || accountProviders[channel.provider]?.fallbackUrl;
    if (providerHandoff.channelUrl && providerHandoff.channelUrl !== channelUrl) return;
    if (providerHandoff.status === 'error') setPreviewStatus('error');
    if (['ready', 'player'].includes(providerHandoff.status)) setPreviewStatus('playing');
    if (['open', 'loading', 'auth-required'].includes(providerHandoff.status)) setPreviewStatus('loading');
  }, [activeChannel?.id, activeChannel?.provider, activeChannel?.providerUrl, providerHandoff?.providerId, providerHandoff?.channelUrl, providerHandoff?.status]);

  useEffect(() => {
    const desktop = getDesktopBridge();
    if (!desktop?.isDesktop || !activeChannel?.provider || !accountProviders[activeChannel.provider]?.desktopSurface || providerHandoff?.surface !== 'desktop') return;
    const isOpen = ['open', 'loading', 'ready', 'player', 'auth-required'].includes(providerHandoff.status);
    if (!isOpen) return;
    const shouldPreviewBehindApp = providerHandoff.status === 'player' && providerHandoff.mode !== 'login' && !isWatching;
    desktop.setProviderLayer?.(shouldPreviewBehindApp ? 'background' : 'foreground');
  }, [activeChannel?.provider, isWatching, providerHandoff?.status, providerHandoff?.surface]);

  const handleProviderDisconnect = (providerId) => {
    setProviderAccounts((currentAccounts) => {
      const nextAccounts = {
        ...currentAccounts,
        [providerId]: { status: PROVIDER_STATUS.DISCONNECTED },
      };
      writeStoredProviderAccounts(nextAccounts);
      return nextAccounts;
    });
    setAccountNotice(`Sessão de ${accountProviders[providerId]?.label || 'provedor'} removida deste dispositivo.`);
  };

  const useDeviceLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Este dispositivo não oferece localização automática. Escolha uma região manualmente.');
      return;
    }
    setIsLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const detectedRegion = resolveRegionFromCoordinates(coords.latitude, coords.longitude);
        setIsLocating(false);
        if (!detectedRegion) {
          setLocationError('Não encontramos uma praça demonstrável para esta localização. Escolha manualmente.');
          return;
        }
        setRegionSource('auto');
        setRegionDraft(detectedRegion.regionId);
      },
      () => {
        setIsLocating(false);
        setLocationError('Não foi possível obter sua localização. Você pode escolher a região manualmente.');
      },
      { enableHighAccuracy: false, maximumAge: 300000, timeout: 8000 },
    );
  };

  const handleNavigationSelect = (index) => {
    remote.selectNav(index);
    if (index === navItems.length) openRegionDialog();
  };

  const showVolumeNotice = (notice) => {
    setVolumeNotice(notice);
    window.clearTimeout(volumeNoticeTimerRef.current);
    volumeNoticeTimerRef.current = window.setTimeout(() => setVolumeNotice(null), 1800);
  };

  const hideChannelNoticeSoon = () => {
    window.clearTimeout(channelNoticeTimerRef.current);
    channelNoticeTimerRef.current = window.setTimeout(() => setShowChannelNotice(false), 1800);
  };

  const setPlayerVolume = (nextVolume) => {
    const normalizedVolume = Math.max(0, Math.min(1, nextVolume));
    volumeRef.current = normalizedVolume;
    setVolume(normalizedVolume);
    showVolumeNotice({ muted: false, label: `Volume ${Math.round(normalizedVolume * 100)}%` });
  };

  const changeVolume = (delta) => {
    setPlayerVolume(volumeRef.current + delta);
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    showVolumeNotice({ muted: nextMuted, label: nextMuted ? 'Mudo' : `Volume ${Math.round(volumeRef.current * 100)}%` });
  };

  const isDesktopProviderChannel = (channel) => Boolean(
    getDesktopBridge()?.isDesktop && channel?.playbackType === 'provider',
  );

  const startViewing = (channelIndex = activeChannelIndex) => {
    const selectedChannel = channels[channelIndex];
    const mainContent = document.querySelector('.main-content');
    if (mainContent) mainContent.scrollTop = 0;
    if (selectedChannel?.playbackType === 'external') return;
    if (selectedChannel?.playbackType === 'provider') {
      window.clearTimeout(playerTimeoutRef.current);
      if (!isDesktopProviderChannel(selectedChannel)) return;
      setIsPlayerLoading(false);
      setPlayerError(false);
      setShowChannelNotice(false);
      const provider = accountProviders[selectedChannel.provider];
      const channelUrl = selectedChannel.providerUrl || provider?.fallbackUrl;
      const isConnected = providerAccounts[selectedChannel.provider]?.status === PROVIDER_STATUS.CONNECTED;
      if (isConnected) {
        setIsWatching(true);
        openProviderChannel({ providerId: selectedChannel.provider, channelUrl, channelName: selectedChannel.name, watch: true });
      } else {
        setIsWatching(false);
        openProviderLogin({ providerId: selectedChannel.provider, channelUrl, channelName: selectedChannel.name });
      }
      return;
    }
    setIsWatching(true);
    setPlayerError(false);
    setShowChannelNotice(true);
    window.clearTimeout(playerTimeoutRef.current);
    playerTimeoutRef.current = window.setTimeout(() => {
      if (isWatchingRef.current && activeChannelRef.current?.id === selectedChannel.id) {
        setIsPlayerLoading(false);
        setPlayerError(true);
        setShowChannelNotice(false);
      }
    }, PLAYER_LOAD_TIMEOUT_MS);
    const video = heroVideoRef.current;
    const alreadyPlaying = channelIndex === activeChannelIndex
      && video
      && !video.paused
      && video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA;
    setIsPlayerLoading(!alreadyPlaying);
    if (video) {
      video.volume = volumeRef.current;
      video.muted = isMuted;
      video.play().catch(() => {});
    }
    if (alreadyPlaying) hideChannelNoticeSoon();
    const request = document.documentElement.requestFullscreen?.();
    request?.catch(() => {});
  };

  const stopViewing = () => {
    window.clearTimeout(playerTimeoutRef.current);
    setIsWatching(false);
    setIsPlayerLoading(false);
    setPlayerError(false);
    setShowChannelNotice(false);
    window.clearTimeout(channelNoticeTimerRef.current);
    if (heroVideoRef.current) heroVideoRef.current.muted = true;
    const exit = document.fullscreenElement ? document.exitFullscreen?.() : undefined;
    exit?.catch(() => {});
  };

  useEffect(() => {
    const previousProgram = previousProgramRef.current;
    const programChanged = previousProgram.row !== remote.selectedProgram.row || previousProgram.col !== remote.selectedProgram.col;
    previousProgramRef.current = remote.selectedProgram;
    setActiveChannelIndex(remote.selectedProgram.row);
    const selectedChannel = channels[remote.selectedProgram.row];
    if (programChanged && !isMobile && selectedChannel?.playbackType !== 'external' && (selectedChannel?.playbackType !== 'provider' || isDesktopProviderChannel(selectedChannel))) startViewing(remote.selectedProgram.row);
  }, [remote.selectedProgram.row, remote.selectedProgram.col, isMobile, region?.regionId]);

  useEffect(() => {
    if (remote.selectedNav === navItems.length) openRegionDialog();
  }, [remote.selectedNav]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isWatching) {
        setIsWatching(false);
        setIsPlayerLoading(false);
        setShowChannelNotice(false);
        if (heroVideoRef.current) heroVideoRef.current.muted = true;
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [isWatching]);

  useEffect(() => {
    if (!isWatching) return undefined;
    const handleViewingBack = (event) => {
      const isBack = event.key === 'Escape' || event.key === 'Backspace' || event.key === 'BrowserBack' || event.key === 'GoBack' || event.key === 'Back';
      if (!isBack) return;
      event.preventDefault();
      stopViewing();
    };
    window.addEventListener('keydown', handleViewingBack);
    return () => window.removeEventListener('keydown', handleViewingBack);
  }, [isWatching]);

  const focusProgram = (row, col) => {
    const focusedChannel = channels[row];
    if (focusedChannel?.id !== activeChannel?.id) {
      closeDesktopProviderForChannel(focusedChannel);
      setActiveChannelIndex(row);
    }
    remote.setFocusedProgram(row, col);
  };

  const selectProgram = (row, col) => {
    closeDesktopProviderForChannel(channels[row]);
    setActiveChannelIndex(row);
    remote.selectProgram(row, col);
    const selectedChannel = channels[row];
    if (!isMobile && selectedChannel?.playbackType !== 'external' && (selectedChannel?.playbackType !== 'provider' || isDesktopProviderChannel(selectedChannel))) startViewing(row);
  };

  const selectChannel = (index) => {
    closeDesktopProviderForChannel(channels[index]);
    setActiveChannelIndex(index);
    remote.selectProgram(index, 0);
  };

  const stepChannel = (direction) => {
    const nextIndex = (activeChannelIndex + direction + channels.length) % channels.length;
    closeDesktopProviderForChannel(channels[nextIndex]);
    setActiveChannelIndex(nextIndex);
    remote.selectProgram(nextIndex, 0);
    const selectedChannel = channels[nextIndex];
    if (!isMobile && selectedChannel?.playbackType !== 'external' && (selectedChannel?.playbackType !== 'provider' || isDesktopProviderChannel(selectedChannel))) startViewing(nextIndex);
  };

  useEffect(() => {
    const desktop = getDesktopBridge();
    if (!desktop?.onProviderState) return undefined;
    return desktop.onProviderState((event) => {
      if (event?.type === 'channel-step') {
        stepChannel(event.direction);
        return;
      }
      if (!event?.providerId) return;
      const providerTarget = providerTargetRef.current;
      const isCurrentProviderTarget = event.providerId === providerTarget?.providerId
        && (!event.channelUrl || event.channelUrl === providerTarget?.channelUrl)
        && (!event.channelName || event.channelName === providerTarget?.channelName);
      if (isCurrentProviderTarget && event.channelUrl && ['auth-required', 'loading', 'player'].includes(event.status)) {
        const requestedChannelIndex = channels.findIndex((channel) => channel.provider === event.providerId
          && (event.channelName ? channel.name === event.channelName : channel.providerUrl === event.channelUrl));
        if (requestedChannelIndex >= 0 && requestedChannelIndex !== activeChannelIndex) {
          setActiveChannelIndex(requestedChannelIndex);
          remote.selectProgram(requestedChannelIndex, 0);
        }
      }
      if (isCurrentProviderTarget && event.reason === 'oauth-closed' && providerTarget?.channelUrl) {
        openProviderChannel({
          providerId: providerTarget.providerId,
          channelUrl: providerTarget.channelUrl,
          channelName: providerTarget.channelName,
          watch: false,
        });
        return;
      }
      if (event.status === 'player') {
        setProviderAccounts((currentAccounts) => {
          const nextAccounts = {
            ...currentAccounts,
            [event.providerId]: {
              ...(currentAccounts[event.providerId] || {}),
              status: PROVIDER_STATUS.CONNECTED,
              lastVerifiedAt: new Date().toISOString(),
            },
          };
          writeStoredProviderAccounts(nextAccounts);
          return nextAccounts;
        });
      }
      if (event.status === 'auth-required') {
        setProviderAccounts((currentAccounts) => {
          const nextAccounts = {
            ...currentAccounts,
            [event.providerId]: { status: PROVIDER_STATUS.DISCONNECTED },
          };
          writeStoredProviderAccounts(nextAccounts);
          return nextAccounts;
        });
      }
      if (event.status === 'closed' || event.reason === 'back') {
        setIsWatching(false);
        setIsPlayerLoading(false);
        setShowChannelNotice(false);
        setPlayerError(false);
      }
      if (isCurrentProviderTarget && event.status === 'hidden' && event.reason === 'back') {
        setPreviewStatus('auth-required');
      }
      setProviderHandoff((current) => ({
        ...(current || {}),
        ...event,
        mode: event.status === 'player' ? 'player' : event.mode || current?.mode,
        surface: 'desktop',
      }));
    });
  }, [activeChannelIndex, channels, isMobile, region?.regionId]);

  useEffect(() => {
    const desktop = getDesktopBridge();
    if (!desktop?.setProviderBounds) return;
    const isActiveDesktopProvider = activeChannel?.playbackType === 'provider'
      && providerHandoff?.surface === 'desktop'
      && ['open', 'loading', 'ready', 'player', 'auth-required'].includes(providerHandoff.status);
    if (!isActiveDesktopProvider) desktop.setProviderBounds({ visible: false });
  }, [activeChannel?.id, activeChannel?.playbackType, providerHandoff?.surface, providerHandoff?.status]);

  channelStepRef.current = stepChannel;
  volumeStepRef.current = changeVolume;
  muteToggleRef.current = toggleMute;

  useEffect(() => () => {
    window.clearTimeout(volumeNoticeTimerRef.current);
    window.clearTimeout(channelNoticeTimerRef.current);
    window.clearTimeout(previewTimeoutRef.current);
    window.clearTimeout(playerTimeoutRef.current);
    window.clearInterval(providerPopupTimerRef.current);
  }, []);

  const handlePlaybackReady = (channelId) => {
    setIsAppLoading(false);
    if (activeChannelRef.current?.id !== channelId) return;
    window.clearTimeout(previewTimeoutRef.current);
    window.clearTimeout(playerTimeoutRef.current);
    setPreviewStatus('playing');
    if (isWatchingRef.current) {
      setIsPlayerLoading(false);
      setPlayerError(false);
      setShowChannelNotice(true);
      hideChannelNoticeSoon();
    }
  };

  const handlePlaybackError = (channelId) => {
    setIsAppLoading(false);
    if (activeChannelRef.current?.id !== channelId) return;
    window.clearTimeout(previewTimeoutRef.current);
    if (isWatchingRef.current) {
      setIsPlayerLoading(false);
      setPlayerError(true);
      setShowChannelNotice(false);
    } else {
      setPreviewStatus('error');
    }
  };

  return (
    <>
      <div className={`app-loading ${isAppLoading ? '' : 'is-hidden'}`} role="status" aria-live="polite">
        <div className="app-loading-brand">BrasilTv<span>Live</span></div>
        <span className="app-loading-spinner" aria-hidden="true" />
        <span className="app-loading-copy">Carregando transmissão</span>
      </div>
      {volumeNotice && <div className="volume-notice" role="status" aria-live="polite"><span aria-hidden="true">{volumeNotice.muted ? '🔇' : '🔊'}</span> {volumeNotice.label}</div>}
      {isMobile ? <MobileApp channels={channels} activeChannelIndex={activeChannelIndex} onSelectChannel={selectChannel} onChannelStep={stepChannel} onOpenRegion={openRegionDialog} onPlaybackReady={handlePlaybackReady} onPlaybackError={handlePlaybackError} providerAccounts={providerAccounts} onOpenAccounts={openRegionDialog} /> : (
        <main className={`tv-shell ${isWatching ? 'watching' : ''} ${isWatching && isPlayerLoading ? 'watch-loading' : ''} ${activeChannel?.playbackType === 'provider' && providerHandoff?.surface === 'desktop' && providerHandoff?.status === 'player' && !isWatching ? 'provider-preview' : ''}`}>
          <Sidebar
            focusedNav={remote.focusArea === 'nav' ? remote.focusedNav : -1}
            selectedNav={remote.selectedNav}
            onFocus={remote.setFocusedNav}
            onSelect={handleNavigationSelect}
            navRefs={remote.navRefs}
          />
          <div className="main-content">
            <Hero
              channel={activeChannel}
              videoRef={heroVideoRef}
              isWatching={isWatching}
              isPlayerLoading={isPlayerLoading}
              playerError={playerError}
              isPreviewLoading={!isWatching && previewStatus === 'loading'}
              previewError={!isWatching && previewStatus === 'error'}
              showChannelNotice={showChannelNotice}
              volume={volume}
              isMuted={isMuted}
              onVolumeChange={setPlayerVolume}
              onMuteToggle={toggleMute}
              onPlaybackStarted={handlePlaybackReady}
              onPlaybackError={handlePlaybackError}
              providerAccounts={providerAccounts}
              onOpenAccounts={openRegionDialog}
              onOpenProviderLogin={isMobile ? undefined : openProviderLogin}
              onOpenProviderChannel={isMobile ? undefined : openProviderChannel}
              providerHandoff={providerHandoff}
            />
            <Epg
              channels={channels}
              providerAccounts={providerAccounts}
              isFocused={remote.focusArea === 'epg'}
              focusedRow={remote.focusedRow}
              focusedCol={remote.focusedCol}
              selectedProgram={remote.selectedProgram}
              onFocus={focusProgram}
              onSelect={selectProgram}
              programRefs={remote.programRefs}
            />
          </div>
        </main>
      )}
      {isRegionDialogOpen && <RegionDialog
        region={region}
        regionSource={regionSource}
        selectedRegionId={regionDraft}
        onSelectedRegionChange={(regionId) => { setRegionSource('manual'); setRegionDraft(regionId); }}
        onSave={saveRegion}
        onUseLocation={useDeviceLocation}
        isLocating={isLocating}
        locationError={locationError}
        onClose={() => setIsRegionDialogOpen(false)}
        isFirstAccess={!region}
        providerAccounts={providerAccounts}
        onConnectProvider={handleProviderConnect}
        onDisconnectProvider={handleProviderDisconnect}
        accountNotice={accountNotice}
        activeProviderLogin={activeProviderLogin}
        onCloseProviderLogin={() => setActiveProviderLogin(null)}
        onOpenProviderLogin={isMobile ? undefined : openProviderLogin}
        providerHandoff={providerHandoff}
      />}
    </>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode><App /></StrictMode>,
);
