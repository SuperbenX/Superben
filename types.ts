
export enum AudioType {
  SLEEP = 'SLEEP',
  NIGHT_WAKE = 'NIGHT_WAKE'
}

export enum AudioStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  NEEDS_UPDATE = 'NEEDS_UPDATE'
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  SOUNDS = 'SOUNDS',
  STORIES = 'STORIES',
  ADVICE = 'ADVICE',
  LIVE_GUIDE = 'LIVE_GUIDE'
}

export enum DirectorPersona {
  WONG_KAR_WAI = 'WONG_KAR_WAI', 
  MIYAZAKI = 'MIYAZAKI',         
  TARKOVSKY = 'TARKOVSKY'        
}

export interface AudioItem {
  id: string;
  title: string;
  type: AudioType;
  category: string;
  url: string; 
  coverImage: string;
  duration: string;
  description: string;
  introText?: string;
  tags?: string[];
  variationSeed?: string;
  status: AudioStatus;
  updateDate: string;
  isAiGenerated?: boolean;
  moodColor?: string;
}

export interface Soundscape {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export interface DailyItem {
  id: string;
  dateISO: string;
  dayNumber: string;
  monthYearText: string;
  lunarDateText: string;
  conditionText: string;
  yiText: string;
  jiText: string;
  fortuneText: string;
  quoteText: string;
  closingText: string;
  photoUrl: string;
  photoCredit: string;
  locationText: string;
  weatherText: string;
  temperatureText: string;
  quoteAuthor: string;
  nextArticleTitle: string;
  nextArticleAuthor: string;
  persona?: DirectorPersona;
}

export interface PlayLog {
  id: string;
  audioId: string;
  audioTitle: string;
  playTime: number; 
  endTime?: number;
  logOffTime?: number; 
  burdenSelected?: string;
  nightWakeFlag: boolean;
  feedbackRating?: number;
  feedbackText?: string;
  prescription?: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface QAPrescription {
  item: AudioItem;
  reason: string;
  categoryLabel: string;
  nutritionalValue: string;
}

export interface BurdenHistory {
  date: string;
  burden: string;
  thought?: string;
}

export interface AppSettings {
  defaultAudioId?: string;
  autoShuffle: boolean;
  windDownReminder: boolean;
  reminderTime: string; 
  autoFadeMinutes: number;
  lastTimerMinutes?: number; 
  defaultVolume: number;
  favorites: string[];
  lastPositions: Record<string, number>; 
  lastEchoShownDate?: string;
  burdenHistory: BurdenHistory[]; 
  spatialAudioEnabled: boolean;
  notionToken?: string;
  notionPageId?: string;
}

export type Tab = 'home' | 'library' | 'deep_dive' | 'qa' | 'settings' | 'admin' | 'history';
