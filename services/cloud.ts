
import { DailyItem, AudioItem } from '../types';
import { getDailyItems, saveDailyItems, addDailyItem, getAudioItems, saveAudioItems } from './storage';
import { createClient } from '@supabase/supabase-js';
import { dbGet, dbSet } from './db';

const SUPABASE_URL = 'https://whxqnlocjxzaibaavkep.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndoeHFubG9janh6YWliYWF2a2VwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2MDE3MzEsImV4cCI6MjA4MzE3NzczMX0.nasRVoUN4hZdCtOU8MSJpPMo6ALykuzbWlMbTSSLIk8';

let supabase: any = null;
try {
  if (SUPABASE_URL.includes('supabase.co') && SUPABASE_ANON_KEY.startsWith('eyJ')) {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
} catch (e) {
  console.error("Supabase 初始化异常:", e);
}

export interface CloudBookMetadata {
  id: string;
  title: string;
  author: string;
  category: string;
  summary?: string;
  contentLength?: number;
}

export const CloudService = {
  // 健康检查：验证表和字段是否可用
  async checkConnection(): Promise<{ok: boolean, msg: string}> {
    if (!supabase) return { ok: false, msg: "客户端连接未建立" };
    try {
      const { error } = await supabase.from('literature_summaries').select('book_id, author, summary').limit(1);
      if (error) {
        if (error.code === '42P01') return { ok: false, msg: "表不存在 (请运行 SQL)" };
        if (error.code === '42703') return { ok: false, msg: "字段缺失 (请运行 SQL)" };
        return { ok: false, msg: `数据库错误: ${error.code}` };
      }
      return { ok: true, msg: "云端连接健康" };
    } catch (e: any) {
      return { ok: false, msg: e.message };
    }
  },

  async saveLiteratureSummary(bookId: string, summary: string, title: string, author: string = "未知", category: string = "故纸堆里的哈欠"): Promise<void> {
    await dbSet(`summary_${bookId}`, summary);
    if (supabase) {
      const { error } = await supabase.from('literature_summaries').upsert({
        book_id: bookId,
        title: title,
        author: author,
        category: category,
        summary: summary,
        updated_at: new Date().toISOString()
      }, { onConflict: 'book_id' });
      
      if (error) {
        console.error("Supabase Save Error:", error);
        throw new Error(`${error.message} (${error.code})`);
      }
    }
  },

  async fetchLiteratureSummary(bookId: string): Promise<string | null> {
    const local = await dbGet(`summary_${bookId}`);
    if (local) return local;
    if (!supabase) return null;
    try {
      const { data } = await supabase.from('literature_summaries').select('summary').eq('book_id', bookId).maybeSingle();
      if (data?.summary) {
        await dbSet(`summary_${bookId}`, data.summary);
        return data.summary;
      }
    } catch (e) {}
    return null;
  },

  async fetchAllCloudBooks(): Promise<CloudBookMetadata[]> {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase.from('literature_summaries').select('book_id, title, author, category, summary');
      if (error) throw error;
      return data ? data.map((d: any) => ({
        id: d.book_id,
        title: d.title,
        author: d.author,
        category: d.category,
        contentLength: d.summary?.length || 0
      })) : [];
    } catch (e) { return []; }
  },

  async fetchCloudBooksByCategory(category: string): Promise<CloudBookMetadata[]> {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase.from('literature_summaries')
        .select('book_id, title, author, category, summary')
        .eq('category', category);
      if (error) throw error;
      return data ? data.map((d: any) => ({
        id: d.book_id,
        title: d.title,
        author: d.author,
        category: d.category,
        contentLength: d.summary?.length || 0
      })) : [];
    } catch (e) { return []; }
  },

  // 音频相关逻辑...
  async getAudioCache(bookId: string, segmentIdx: number, voiceName: string): Promise<string | null> {
    const cacheKey = `audio_${bookId}_${segmentIdx}_${voiceName}`;
    const local = await dbGet(cacheKey);
    if (local) return local;
    if (!supabase) return null;
    const { data } = await supabase.from('audio_cache').select('base64_data').eq('cache_key', cacheKey).maybeSingle();
    if (data?.base64_data) {
      await dbSet(cacheKey, data.base64_data);
      return data.base64_data;
    }
    return null;
  },

  async saveAudioCache(bookId: string, segmentIdx: number, voiceName: string, base64: string): Promise<void> {
    const cacheKey = `audio_${bookId}_${segmentIdx}_${voiceName}`;
    await dbSet(cacheKey, base64);
    if (supabase) {
      await supabase.from('audio_cache').upsert({
        cache_key: cacheKey,
        book_id: bookId,
        voice_name: voiceName,
        base64_data: base64,
        created_at: new Date().toISOString()
      }, { onConflict: 'cache_key' });
    }
  },

  async fetchMoments(): Promise<DailyItem[]> {
    if (!supabase) return await getDailyItems();
    try {
      const { data } = await supabase.from('moments').select('*').order('dateISO', { ascending: false }).limit(10);
      if (data && data.length > 0) {
        const local = await getDailyItems();
        const existingIds = new Set(local.map(l => l.id));
        const newItems = data.filter((d: DailyItem) => !existingIds.has(d.id));
        if (newItems.length > 0) await saveDailyItems([...newItems, ...local]);
        return data as DailyItem[];
      }
      return await getDailyItems();
    } catch (e) { return await getDailyItems(); }
  },

  async syncToCloud(item: DailyItem): Promise<void> {
    addDailyItem(item);
    if (supabase) {
      try { await supabase.from('moments').upsert(item, { onConflict: 'id' }); } catch (e) {}
    }
  },

  async fetchAudios(): Promise<AudioItem[]> {
    if (!supabase) return getAudioItems();
    try {
      const { data } = await supabase.from('audio_items').select('*').order('updateDate', { ascending: false });
      if (data) {
        const local = getAudioItems();
        const merged = [...data];
        local.forEach(l => { if (!merged.find(m => m.id === l.id)) merged.push(l); });
        saveAudioItems(merged);
        return merged;
      }
      return getAudioItems();
    } catch (e) { return getAudioItems(); }
  }
};
