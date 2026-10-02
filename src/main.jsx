import React, { StrictMode, useEffect, useRef, useState } from 'react';
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
const RECORD_NEWS_YOUTUBE_CHANNEL_ID = 'UCuiLR4p6wQ3xLEm15pEn1Xw';
const RECORD_NEWS_YOUTUBE_EMBED_URL = `https://www.youtube.com/embed/live_stream?channel=${RECORD_NEWS_YOUTUBE_CHANNEL_ID}&autoplay=1&mute=1&playsinline=1&rel=0&controls=0&enablejsapi=1&disablekb=1&fs=0`;

const accountProviders = {
  globoplay: {
    id: 'globoplay',
    label: 'Globo / Globoplay',
    mark: 'globo',
  },
  recordplus: {
    id: 'recordplus',
    label: 'RECORD / RecordPlus',
    mark: 'record',
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

const globoRegionalCatalog = {
  'mg-bh': { label: 'Globo Minas' },
  'mg-uberlandia': { label: 'TV Integração' },
  'sp-capital': { label: 'Globo SP' },
  'rj-capital': { label: 'Globo Rio' },
};

const recordRegionalCatalog = {
  'mg-bh': { label: 'RECORD Minas', liveAvailability: 'confirmed' },
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
  playbackType: 'external',
  externalProviderLabel: 'RecordPlus',
  externalUrl: RECORDPLUS_LIVE_URL,
  sourceUrl: RECORDPLUS_LIVE_URL,
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
  mark: 'sbt',
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
    mark: 'globo',
    playbackType: 'external',
    externalUrl: GLOBO_LIVE_URL,
    externalProviderLabel: 'Globoplay',
    regionId: region.regionId,
    programs: [['Globo ao vivo', 'Disponível no Globoplay'], ['Programação local', 'Consulte no Globoplay'], ['Jornal local', 'Consulte no Globoplay']],
  };
  return [baseChannels[0], createSbtChannel(regionId), sbtNewsChannel, recordNewsChannel, createBandChannel(regionId), createRedeTvChannel(regionId), regionalGlobo, ...baseChannels.slice(1)];
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

function ChannelMark({ variant }) {
  return (
    <span className={`channel-mark ${variant}`} aria-hidden="true">
      {variant === 'tv-senado' ? <><span>tv</span><em>senado</em></> : variant === 'tv-justica' ? 'O' : variant === 'globo' ? 'G' : variant === 'sbt' ? 'SBT' : variant === 'band' ? 'BAND' : variant === 'redetv' ? 'RTV' : variant === 'record' || variant === 'record-news' ? 'R' : ''}
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

function Hero({ channel, videoRef, isWatching, isPlayerLoading, playerError, showChannelNotice, volume, isMuted, onVolumeChange, onMuteToggle, onPlaybackStarted, onPlaybackError }) {
  const [programName, programTime] = channel.programs[0];
  const isExternal = channel.playbackType === 'external';
  const isEmbed = channel.playbackType === 'embed';
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
    if (!videoRef.current || isExternal || isEmbed) return;
    videoRef.current.volume = volume;
    videoRef.current.muted = !isWatching || isMuted;
    videoRef.current.play().catch(() => {});
  }, [channel.streamUrl, isExternal, isEmbed, isWatching, isMuted, volume, videoRef]);

  return (
    <section className="hero" aria-label="Programa atual" onMouseEnter={revealControls} onMouseMove={revealControls} onMouseLeave={hideControls}>
      <div className="hero-art" />
      {isExternal ? (
        <div className="hero-external-card">
          <ChannelMark variant={channel.mark} />
          <strong>{channel.name}</strong>
          <span>{externalNotice}</span>
          <a href={channel.externalUrl} target="_blank" rel="noreferrer" aria-label={`Abrir ${externalProviderLabel} para ${channel.name}`}>Abrir no {externalProviderLabel}</a>
        </div>
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
        <div className="live-badge"><span /> {isExternal ? 'GLOBO' : isEmbed ? (channel.networkLabel || 'AO VIVO') : 'AO VIVO'}</div>
        <p className="channel-title">{channel.name}</p>
        <h1>{programName}</h1>
        <div className="program-meta"><span>{programTime}</span><i /> <span>Hoje, 15 de ago.</span></div>
        <p className="program-description">As principais notícias do Brasil e do mundo, com análises e reportagens especiais sobre política, economia, cultura e sociedade.</p>
        {channel.regionalUnavailable && <p className="regional-channel-note" role="status">{channel.regionalLabel} sem transmissão oficial regional disponível. Reproduzindo o sinal nacional da {channel.networkLabel || 'emissora'}.</p>}
      </div>
      <div className="hero-fade" />
      <div className={`watch-transition ${!isWatching || (!isPlayerLoading && !showChannelNotice && !playerError) ? 'is-hidden' : ''}`} role="status" aria-live="polite">
        <div className={`watch-transition-card ${playerError ? 'is-error' : ''}`}>
          <ChannelMark variant={channel.mark} />
          <div>
            <strong>{channel.name}</strong>
            <span>{playerError ? 'Transmissão indisponível' : isPlayerLoading ? 'Carregando canal' : 'Ao vivo'}</span>
          </div>
          {isPlayerLoading && <span className="watch-transition-spinner" aria-hidden="true" />}
        </div>
      </div>
      <div
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
      </div>
    </section>
  );
}

function Epg({ channels, isFocused, focusedRow, focusedCol, selectedProgram, onFocus, onSelect, programRefs }) {
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
                  <small>{time}</small>
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

function MobilePlayer({ channel, onChannelStep, onPlaybackReady, onPlaybackError }) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(channel.playbackType !== 'external');
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
    setIsLoading(channel.playbackType !== 'external');
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
    if (!player || channel.playbackType === 'external') return;

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
      {channel.playbackType !== 'external' && <div className="mobile-player-controls">
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

function RegionDialog({ region, regionSource, selectedRegionId, onSelectedRegionChange, onSave, onUseLocation, isLocating, locationError, onClose, isFirstAccess, providerAccounts, onConnectProvider, onDisconnectProvider, accountNotice }) {
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
          <div className="provider-account-list">
            {Object.values(accountProviders).map((provider) => <ProviderAccountCard
              key={provider.id}
              provider={provider}
              account={providerAccounts?.[provider.id]}
              onConnect={onConnectProvider}
              onDisconnect={onDisconnectProvider}
            />)}
          </div>
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

function MobileApp({ channels, activeChannelIndex, onSelectChannel, onChannelStep, onOpenRegion, onPlaybackReady, onPlaybackError }) {
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
      <MobilePlayer channel={channel} onChannelStep={onChannelStep} onPlaybackReady={onPlaybackReady} onPlaybackError={onPlaybackError} />
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
  const [activeChannelIndex, setActiveChannelIndex] = useState(0);
  const [isWatching, setIsWatching] = useState(false);
  const [isPlayerLoading, setIsPlayerLoading] = useState(false);
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
  const channels = getChannelsForRegion(region?.regionId || regionOptions[0].regionId);
  const remote = useTvRemoteController({
    channels,
    isWatching,
    onChannelStep: (direction) => channelStepRef.current?.(direction),
    onVolumeStep: (delta) => volumeStepRef.current?.(delta),
    onMuteToggle: () => muteToggleRef.current?.(),
  });
  const heroVideoRef = useRef(null);
  const activeChannel = channels[activeChannelIndex];
  const previousProgramRef = useRef(remote.selectedProgram);

  const openRegionDialog = () => {
    setRegionDraft(region?.regionId || regionOptions[0].regionId);
    setRegionSource(region?.source || 'manual');
    setLocationError(null);
    setAccountNotice(null);
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
    setAccountNotice(`O login oficial de ${provider.label} será habilitado na próxima etapa. Nenhuma credencial é armazenada pelo BrasilTvLive.`);
  };

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

  const startViewing = (channelIndex = activeChannelIndex) => {
    const selectedChannel = channels[channelIndex];
    if (selectedChannel?.playbackType === 'external') return;
    setIsWatching(true);
    setPlayerError(false);
    setShowChannelNotice(true);
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
    if (programChanged && !isMobile && channels[remote.selectedProgram.row]?.playbackType !== 'external') startViewing(remote.selectedProgram.row);
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

  const selectProgram = (row, col) => {
    setActiveChannelIndex(row);
    remote.selectProgram(row, col);
    if (!isMobile && channels[row]?.playbackType !== 'external') startViewing(row);
  };

  const selectChannel = (index) => {
    setActiveChannelIndex(index);
    remote.selectProgram(index, 0);
  };

  const stepChannel = (direction) => {
    const nextIndex = (activeChannelIndex + direction + channels.length) % channels.length;
    setActiveChannelIndex(nextIndex);
    remote.selectProgram(nextIndex, 0);
    if (!isMobile && channels[nextIndex]?.playbackType !== 'external') startViewing(nextIndex);
  };

  channelStepRef.current = stepChannel;
  volumeStepRef.current = changeVolume;
  muteToggleRef.current = toggleMute;

  useEffect(() => () => {
    window.clearTimeout(volumeNoticeTimerRef.current);
    window.clearTimeout(channelNoticeTimerRef.current);
  }, []);

  const handlePlaybackReady = (channelId) => {
    setIsAppLoading(false);
    if (isWatching && activeChannel.id === channelId) {
      setIsPlayerLoading(false);
      setPlayerError(false);
      setShowChannelNotice(true);
      hideChannelNoticeSoon();
    }
  };

  const handlePlaybackError = (channelId) => {
    setIsAppLoading(false);
    if (isWatching && activeChannel.id === channelId) {
      setIsPlayerLoading(false);
      setPlayerError(true);
      setShowChannelNotice(false);
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
      {isMobile ? <MobileApp channels={channels} activeChannelIndex={activeChannelIndex} onSelectChannel={selectChannel} onChannelStep={stepChannel} onOpenRegion={openRegionDialog} onPlaybackReady={handlePlaybackReady} onPlaybackError={handlePlaybackError} /> : (
        <main className={`tv-shell ${isWatching ? 'watching' : ''} ${isWatching && isPlayerLoading ? 'watch-loading' : ''}`}>
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
              showChannelNotice={showChannelNotice}
              volume={volume}
              isMuted={isMuted}
              onVolumeChange={setPlayerVolume}
              onMuteToggle={toggleMute}
              onPlaybackStarted={handlePlaybackReady}
              onPlaybackError={handlePlaybackError}
            />
            <Epg
              channels={channels}
              isFocused={remote.focusArea === 'epg'}
              focusedRow={remote.focusedRow}
              focusedCol={remote.focusedCol}
              selectedProgram={remote.selectedProgram}
              onFocus={remote.setFocusedProgram}
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
      />}
    </>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode><App /></StrictMode>,
);
