import { PlayLog, AppSettings, AudioItem, DailyItem } from '../types';
import { STORAGE_KEYS, MOCK_AUDIO_ITEMS } from '../constants';
import { dbGet, dbSet } from './db';

const DAILY_ITEMS_KEY = 'zenrest_v2_daily_items';

// 预设的高质量 Momements 库
const PRESET_MOMENTS: DailyItem[] = [
  {
    id: 'moment-preset-1',
    dateISO: '2025-01-01',
    dayNumber: '01',
    monthYearText: '1月, 2025',
    lunarDateText: '腊月初二',
    conditionText: '冬阳初照',
    yiText: '读书、品茗、静坐',
    jiText: '远行、喧哗、执着',
    fortuneText: '平安顺遂，宜收敛心神。',
    closingText: '星光和梦境早已在不远处的山峦后为你准备好了柔软的归宿趋势。',
    locationText: '内心世界',
    weatherText: '静谧',
    temperatureText: '26.0°C',
    photoUrl: 'https://images.unsplash.com/photo-1498598457418-36ef20772bb9?auto=format&fit=crop&q=80&w=1000',
    photoCredit: '摄影 | 息之眼',
    quoteText: '夜晚的安静并非无声，而是大自然在轻声调息。如果你能在这一刻放下对结果的追逐，你会发现，星光和梦境早已在不远处的山峦后为你准备好了柔软的归宿。',
    quoteAuthor: '瞬息',
    nextArticleTitle: '呼吸的节奏',
    nextArticleAuthor: '林间客'
  }
];

export const getDailyItems = async (): Promise<DailyItem[]> => {
  try {
    const data = await dbGet(DAILY_ITEMS_KEY);
    if (!data) return PRESET_MOMENTS;
    return data;
  } catch (e) {
    return PRESET_MOMENTS;
  }
};

// Fix: Add missing saveDailyItems to resolve error in services/cloud.ts
export const saveDailyItems = async (items: DailyItem[]) => {
  await dbSet(DAILY_ITEMS_KEY, items);
};

export const addDailyItem = async (item: DailyItem) => {
  const items = await getDailyItems();
  const filtered = items.filter(i => i.id !== item.id && i.dateISO !== item.dateISO);
  const updated = [item, ...filtered].slice(0, 30); // 增加缓存容量
  await dbSet(DAILY_ITEMS_KEY, updated);
};

export const getLogs = (): PlayLog[] => {
  const data = localStorage.getItem(STORAGE_KEYS.LOGS);
  return data ? JSON.parse(data) : [];
};

export const saveLog = (log: PlayLog) => {
  const existing = getLogs();
  const updated = [log, ...existing];
  localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(updated.slice(0, 50)));
};

// Fix: Add missing deleteLog to resolve error in components/History.tsx
export const deleteLog = (id: string) => {
  const logs = getLogs();
  const updated = logs.filter(l => l.id !== id);
  localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(updated));
};

export const getSettings = (): AppSettings => {
  const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
  const defaultSettings: AppSettings = { 
    autoShuffle: false, 
    windDownReminder: true, 
    reminderTime: '22:30',
    autoFadeMinutes: 20, 
    lastTimerMinutes: 20,
    defaultVolume: 0.5,
    favorites: [],
    lastPositions: {},
    burdenHistory: [],
    spatialAudioEnabled: true
  };
  if (!data) return defaultSettings;
  try { return { ...defaultSettings, ...JSON.parse(data) }; } catch (e) { return defaultSettings; }
};

export const saveSettings = (settings: AppSettings) => {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
};

export const getAudioItems = (): AudioItem[] => {
  const data = localStorage.getItem(STORAGE_KEYS.ITEMS);
  return data ? JSON.parse(data) : MOCK_AUDIO_ITEMS;
};

export const saveAudioItems = (items: AudioItem[]) => {
  localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
};

export const getMorningEcho = (): PlayLog | null => {
  const logs = getLogs();
  if (logs.length === 0) return null;
  const settings = getSettings();
  const today = new Date().toISOString().split('T')[0];
  if (settings.lastEchoShownDate === today) return null;
  const lastLog = logs[0];
  const lastLogDate = new Date(lastLog.playTime).toISOString().split('T')[0];
  return lastLogDate < today ? lastLog : null;
};

export const markEchoAsShown = () => {
  const settings = getSettings();
  const today = new Date().toISOString().split('T')[0];
  saveSettings({ ...settings, lastEchoShownDate: today });
};