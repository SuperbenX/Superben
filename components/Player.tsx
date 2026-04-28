
import React, { useState, useEffect, useRef } from 'react';
import { AudioItem, AudioType } from '../types';
import { saveLog, getSettings, saveSettings } from '../services/storage';

interface PlayerProps {
  audioItem: AudioItem;
  burden?: string;
  thought?: string;
  prescription?: string;
  isDeepDive?: boolean;
  onClose: () => void;
}

const Player: React.FC<PlayerProps> = ({ audioItem, burden, thought, prescription, isDeepDive = false, onClose }) => {
  const settings = getSettings();
  const targetVolume = settings.defaultVolume || 0.5;
  const initialPos = settings.lastPositions[audioItem.id] || 0;

  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isDimmed, setIsDimmed] = useState(isDeepDive); 
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeIntervalRef = useRef<number | null>(null);
  const wakeLockRef = useRef<any>(null);

  // 请求 Wake Lock 防止休眠
  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
      }
    } catch (err) {
      console.log('Wake Lock Request Failed:', err);
    }
  };

  useEffect(() => {
    if (audioRef.current) {
        const startPos = isDeepDive ? Math.max(0, initialPos - 30) : initialPos;
        const startVolume = isDeepDive ? 0 : targetVolume;
        
        audioRef.current.volume = startVolume;
        audioRef.current.currentTime = startPos;
        audioRef.current.play().catch(console.error);
        setIsPlaying(true);
        requestWakeLock();

        if (isDeepDive) {
            let currentVol = 0;
            const durationMs = 30000;
            const stepMs = 100;
            const step = targetVolume / (durationMs / stepMs);
            
            fadeIntervalRef.current = window.setInterval(() => {
                currentVol = Math.min(targetVolume, currentVol + step);
                if (audioRef.current) audioRef.current.volume = currentVol;
                if (currentVol >= targetVolume) {
                    if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
                }
            }, stepMs);
        }
    }
    return () => {
      if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
      if (wakeLockRef.current) wakeLockRef.current.release();
      if (audioRef.current) {
        const s = getSettings();
        saveSettings({
            ...s,
            lastPositions: { ...s.lastPositions, [audioItem.id]: audioRef.current.currentTime }
        });
      }
    };
  }, [audioItem.id, isDeepDive, targetVolume, initialPos]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setProgress((audioRef.current.currentTime / (audioRef.current.duration || 1)) * 100 || 0);
    }
  };

  const togglePlay = () => {
    if (audioRef.current) {
      const newPlaying = !isPlaying;
      newPlaying ? audioRef.current.play() : audioRef.current.pause();
      setIsPlaying(newPlaying);
      if (newPlaying) {
        setIsDimmed(false);
        requestWakeLock();
      } else if (wakeLockRef.current) {
        wakeLockRef.current.release();
      }
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[200] flex flex-col bg-[#0c0c0d] animate-in fade-in slide-in-from-bottom-full duration-[1.5s]"
      onClick={() => setIsDimmed(false)}
    >
      <div className={`absolute inset-0 bg-[#070708] z-[210] flex flex-col items-center justify-center transition-opacity duration-[3000ms] pointer-events-none ${isDimmed ? 'opacity-98' : 'opacity-0'}`}>
        <div className="text-center px-16 animate-breathe">
           <div className="w-[1px] h-12 bg-white/10 mx-auto mb-12"></div>
           <p className="text-[10px] font-[200] text-[#333333] uppercase tracking-[1em] leading-loose">
             意 识 沉 降<br/>
             安 然 入 梦
           </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col py-24 px-12 justify-between items-center relative">
        <header className="w-full flex justify-between items-center opacity-40">
           <button onClick={onClose} className="p-4"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m6 9 6 6 6-6"/></svg></button>
           <h4 className="text-[9px] font-bold tracking-[0.6em] uppercase text-white/60">Sleep Prescription</h4>
           <div className="w-10"></div>
        </header>

        <div className="flex flex-col items-center text-center space-y-12">
            <div className={`w-48 h-48 rounded-full border border-white/5 overflow-hidden transition-all duration-[5s] ${isPlaying ? 'scale-110 blur-sm opacity-20' : 'scale-100'}`}>
                <img src={audioItem.coverImage} className="w-full h-full object-cover grayscale" />
            </div>
            <div className="space-y-6 max-w-xs">
                <h2 className="text-xl font-[100] text-white/80 tracking-widest">{audioItem.title}</h2>
                {prescription && <p className="text-[13px] leading-relaxed text-[#888888] italic font-[300]">“{prescription}”</p>}
            </div>
        </div>

        <div className="w-full max-w-sm flex flex-col items-center gap-12">
            <div className="w-full px-8">
                <div className="h-[1px] w-full bg-white/5 relative mb-4">
                    <div className="absolute h-full bg-white/20 transition-all duration-1000" style={{ width: `${progress}%` }} />
                </div>
                <div className="flex justify-between text-[8px] font-mono text-white/20 tracking-widest">
                    <span>{Math.floor(currentTime / 60)}:{(Math.floor(currentTime % 60)).toString().padStart(2, '0')}</span>
                    <span>{audioItem.category}</span>
                </div>
            </div>
            <button onClick={togglePlay} className="w-20 h-20 rounded-full border border-white/10 flex items-center justify-center active:scale-90 transition-all">
                {isPlaying ? 
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-white/40"><rect x="6" y="4" width="3" height="16"/><rect x="15" y="4" width="3" height="16"/></svg> :
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-white/40 ml-1"><path d="m7 4 12 8-12 8V4z"/></svg>
                }
            </button>
        </div>
      </div>
      {/* Fix: Property 'crossorigin' does not exist on type 'DetailedHTMLProps<AudioHTMLAttributes<HTMLAudioElement>, HTMLAudioElement>'. Did you mean 'crossOrigin'? */}
      <audio ref={audioRef} src={audioItem.url} onTimeUpdate={handleTimeUpdate} loop crossOrigin="anonymous" />
    </div>
  );
};

export default Player;
