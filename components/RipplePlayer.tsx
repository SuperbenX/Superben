
import React, { useState, useEffect, useRef } from 'react';
import { LITERATURE_VAULT, LiteratureEntry } from '../constants/literature_vault';
import { MOCK_AUDIO_ITEMS } from '../constants';
import { GoogleGenAI, Modality } from "@google/genai";
import { CloudService, CloudBookMetadata } from '../services/cloud';
import { AtmosphereGenerator } from '../services/generator';
import { decode, decodeAudioData, encode } from '../utils/audioUtils';

interface RipplePlayerProps {
  initialEntry?: LiteratureEntry;
  categoryId?: string; 
  onClose: () => void;
}

interface UnifiedEntry {
  id: string;
  title: string;
  author: string;
  category: string;
  whisper: string;
}

const RipplePlayer: React.FC<RipplePlayerProps> = ({ initialEntry, categoryId = 'books', onClose }) => {
  const [entry, setEntry] = useState<UnifiedEntry | null>(null);
  const [playbackStatus, setPlaybackStatus] = useState<'idle' | 'loading' | 'playing'>('idle');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const [segments, setSegments] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  
  const [voiceName, setVoiceName] = useState<'Kore' | 'Zephyr'>('Kore'); 
  const [playSpeed, setPlaySpeed] = useState(1.0);
  const [showSettings, setShowSettings] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const stopRequested = useRef(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const getInternalCategoryName = (catId: string) => {
    switch(catId) {
      case 'books': return "故纸堆里的哈欠";
      case 'movies': return "光影的余烬";
      case 'music': return "琥珀色的慢板";
      case 'noise': return "无剧情放映室";
      case 'custom': return "流动的群星";
      default: return "故纸堆里的哈欠";
    }
  };

  useEffect(() => {
    if (initialEntry) {
      setEntry({ id: initialEntry.id, title: initialEntry.title, author: initialEntry.author, category: "故纸堆里的哈欠", whisper: initialEntry.whisper });
    } else {
      loadRandomEntry(categoryId);
    }
  }, [categoryId, initialEntry]);

  const loadRandomEntry = async (catId: string) => {
    setIsRefreshing(true);
    setLoadingText("正在检索库藏...");
    const catName = getInternalCategoryName(catId);
    try {
      const cloudItems = await CloudService.fetchCloudBooksByCategory(catName);
      let pool: UnifiedEntry[] = [];
      if (cloudItems && cloudItems.length > 0) {
        pool = cloudItems.map(c => ({ id: c.id, title: c.title, author: c.author, category: c.category || catName, whisper: "来自您的私人库藏。" }));
      } else {
        if (catId === 'books') pool = LITERATURE_VAULT.map(b => ({ id: b.id, title: b.title, author: b.author, category: catName, whisper: b.whisper }));
        else pool = MOCK_AUDIO_ITEMS.filter(i => i.category === catName).map(i => ({ id: i.id, title: i.title, author: "原声推荐", category: catName, whisper: i.description || "" }));
      }
      if (pool.length > 0) setEntry(pool[Math.floor(Math.random() * pool.length)]);
    } catch (e) { setLoadingText("云端连接波动。"); }
    finally { setIsRefreshing(false); setLoadingText(""); }
  };

  const initAudioContext = () => {
    if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    return audioContextRef.current;
  };

  const stopPlayback = () => {
    stopRequested.current = true;
    if (activeSourceRef.current) { try { activeSourceRef.current.stop(); } catch(e) {} }
    setPlaybackStatus('idle');
    setCurrentIndex(-1);
  };

  const splitTextIntoSegments = (text: string, maxLen = 600) => {
    const sentences = text.match(/[^。！？；\n]*[。！？；\n]/g) || [text];
    const segs: string[] = [];
    let current = "";
    for (const s of sentences) {
      if ((current + s).length > maxLen && current) {
        segs.push(current);
        current = s;
      } else {
        current += s;
      }
    }
    if (current) segs.push(current);
    return segs;
  };

  const startReading = async () => {
    if (!entry) return;
    stopRequested.current = false;
    setPlaybackStatus('loading');
    setLoadingText("深度载入中...");

    try {
      let content = await CloudService.fetchLiteratureSummary(entry.id);
      if (!content) return setLoadingText("未找到正文。");
      
      const parsedSegments = splitTextIntoSegments(content, 600);
      setSegments(parsedSegments);
      setPlaybackStatus('playing');
      setLoadingText("");

      for (let i = 0; i < parsedSegments.length; i++) {
        if (stopRequested.current) break;
        setCurrentIndex(i);
        
        let audioBuffer: AudioBuffer | null = null;
        const cachedB64 = await CloudService.getAudioCache(entry.id, i, voiceName);
        
        if (cachedB64) {
          audioBuffer = await decodeAudioData(decode(cachedB64), initAudioContext(), 24000, 1);
        } else {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: { parts: [{ text: parsedSegments[i] }] },
            config: {
              responseModalities: [Modality.AUDIO],
              speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } },
            },
          });
          const b64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
          if (b64) {
            CloudService.saveAudioCache(entry.id, i, voiceName, b64);
            audioBuffer = await decodeAudioData(decode(b64), initAudioContext(), 24000, 1);
          }
        }

        if (audioBuffer && !stopRequested.current) {
          await new Promise<void>((resolve) => {
            const ctx = initAudioContext();
            const source = ctx.createBufferSource();
            source.buffer = audioBuffer!;
            source.playbackRate.value = playSpeed;
            source.connect(ctx.destination);
            activeSourceRef.current = source;
            source.onended = () => resolve();
            source.start();
          });
        }
      }
    } catch (e) { setLoadingText("阅读中断。"); }
    if (!stopRequested.current) setPlaybackStatus('idle');
  };

  if (!entry) return null;

  return (
    <div className="fixed inset-0 z-[300] bg-[#09090b] flex flex-col items-center justify-between py-20 px-10 animate-in fade-in duration-1000">
      <header className="w-full flex justify-between items-center opacity-40">
        <button onClick={() => { stopPlayback(); onClose(); }} className="p-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m6 9 6 6 6-6"/></svg>
        </button>
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-bold tracking-[0.5em] uppercase text-white/60">{entry.category}</span>
        </div>
        <button onClick={() => setShowSettings(!showSettings)} className="p-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        </button>
      </header>

      <main className="w-full flex-1 flex flex-col items-center justify-center space-y-16 overflow-hidden relative">
        <div className="text-center space-y-4 px-4">
           <h2 className="text-[20px] text-white font-[100] tracking-[0.4em] uppercase leading-relaxed">《{entry.title}》</h2>
           <p className="text-[10px] text-white/20 italic tracking-widest">{entry.author}</p>
        </div>

        <div ref={scrollContainerRef} className="w-full h-[40vh] overflow-y-auto no-scrollbar px-6 space-y-10 scroll-smooth">
          <div className="h-[15vh]"></div>
          {playbackStatus === 'playing' ? (
            segments.map((s, i) => (
              <p key={i} className={`text-[15px] leading-[2.6] transition-all duration-[1500ms] text-justify tracking-wide ${i === currentIndex ? 'text-white/90' : 'text-white/5'}`}>{s}</p>
            ))
          ) : (
            <p className="text-[14px] text-white/30 text-center italic tracking-[0.2em]">{loadingText || "点击下方开启加速深读。"}</p>
          )}
          <div className="h-[15vh]"></div>
        </div>

        {showSettings && (
          <div className="absolute inset-x-0 bottom-0 bg-[#16161b]/95 p-10 rounded-t-[3rem] animate-in slide-in-from-bottom duration-500 backdrop-blur-3xl">
            <div className="space-y-6">
              <p className="text-[9px] text-white/20 uppercase tracking-[0.5em] text-center">音色偏好</p>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => { setVoiceName('Kore'); stopPlayback(); }} className={`py-4 rounded-2xl text-[10px] ${voiceName === 'Kore' ? 'bg-indigo-600 text-white' : 'bg-white/5 text-white/30'}`}>温柔女声</button>
                <button onClick={() => { setVoiceName('Zephyr'); stopPlayback(); }} className={`py-4 rounded-2xl text-[10px] ${voiceName === 'Zephyr' ? 'bg-indigo-600 text-white' : 'bg-white/5 text-white/30'}`}>儒雅男声</button>
              </div>
              <button onClick={() => setShowSettings(false)} className="w-full py-4 text-[9px] text-white/10 uppercase tracking-[0.4em]">关闭</button>
            </div>
          </div>
        )}
      </main>

      <footer className="w-full max-w-xs">
        <button 
          onClick={playbackStatus === 'playing' ? stopPlayback : startReading} 
          disabled={playbackStatus === 'loading' || isRefreshing} 
          className="w-full py-6 rounded-full text-[11px] font-bold tracking-[0.8em] uppercase border bg-indigo-600/10 border-indigo-500/30 text-indigo-200"
        >
          {playbackStatus === 'playing' ? "停止聆听" : playbackStatus === 'loading' ? "加载中..." : "开启加速深读"}
        </button>
      </footer>
    </div>
  );
};

export default RipplePlayer;
