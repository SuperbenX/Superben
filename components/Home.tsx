
import React, { useState, useEffect } from 'react';
import { AudioItem, DailyItem } from '../types';
import { getAudioItems } from '../services/storage';

interface HomeProps {
  dailyData: DailyItem | null;
  onPlay: (item: AudioItem, skipRitual?: boolean, isDeepDive?: boolean) => void;
  onOpenHarbor: () => void;
  onEnterRipple: () => void;
}

const Home: React.FC<HomeProps> = ({ dailyData, onPlay, onOpenHarbor, onEnterRipple }) => {
  const allItems = getAudioItems();
  const [onlineCount, setOnlineCount] = useState(800 + Math.floor(Math.random() * 100));
  const [isPulsing, setIsPulsing] = useState(false);
  const [resonancePoints, setResonancePoints] = useState<number[]>(Array(40).fill(50));
  const [showNightWake, setShowNightWake] = useState(false);

  useEffect(() => {
    // 判定是否处于“深夜模式”
    const checkNightWake = () => {
      const hour = new Date().getHours();
      // 23点到凌晨5点
      if (hour >= 23 || hour < 5) {
        setShowNightWake(true);
      } else {
        setShowNightWake(false);
      }
    };

    checkNightWake();
    // 监听 Visibility Change，确保锁屏回来也能触发
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') checkNightWake();
    });

    const timer = setInterval(() => {
      setOnlineCount(prev => prev + Math.floor(Math.random() * 9) - 3);
      setResonancePoints(prev => [...prev.slice(1), 30 + Math.random() * 40]);
    }, 3000);

    return () => clearInterval(timer);
  }, []);

  const playNightWakePatch = () => {
    const targetItem = allItems.find(i => i.id === 'w1') || allItems[0];
    onPlay(targetItem, true, true);
    setShowNightWake(false);
  };

  if (!dailyData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-12">
        <div className="w-16 h-16 rounded-full border border-white/5 animate-breathe flex items-center justify-center">
          <div className="w-1 h-1 bg-white/20 rounded-full"></div>
        </div>
        <p className="mt-8 text-[9px] text-white/20 tracking-[1em] uppercase">对齐星历</p>
      </div>
    );
  }

  return (
    <div className="relative w-full flex flex-col pt-12 pb-48 animate-in fade-in duration-1000 px-8">
      
      {/* 深夜一键深潜护罩 (盲操设计) */}
      {showNightWake && (
        <div 
          className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-1000 cursor-pointer"
          onDoubleClick={playNightWakePatch}
        >
          <div className="relative w-64 h-64 flex items-center justify-center">
             <div className="absolute inset-0 border border-indigo-500/10 rounded-full animate-breathe"></div>
             <div className="absolute inset-8 border border-indigo-500/5 rounded-full animate-pulse"></div>
             <div className="text-center">
                <p className="text-[10px] text-white/10 font-bold tracking-[0.8em] uppercase mb-12">双击屏幕·立即深潜</p>
                <button 
                  onClick={() => setShowNightWake(false)}
                  className="px-6 py-2 border border-white/5 rounded-full text-[8px] text-white/5 tracking-widest uppercase"
                >
                  返回常规界面
                </button>
             </div>
          </div>
        </div>
      )}

      {/* 顶部 Header */}
      <header className="flex justify-between items-end mb-16 border-b border-white/5 pb-8">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-white/20 tracking-[0.5em] uppercase mb-2">{dailyData.monthYearText}</span>
          <div className="flex items-start gap-4">
            <span className="text-[82px] font-[200] text-white/90 leading-none tracking-tighter">{dailyData.dayNumber}</span>
            <div className="flex flex-col pt-2">
              <span className="text-[14px] font-bold text-white/60 tracking-widest">{dailyData.lunarDateText}</span>
              <span className="text-[10px] text-indigo-400/60 font-medium tracking-widest mt-1">{dailyData.conditionText}</span>
            </div>
          </div>
        </div>
        <div className="text-right flex flex-col items-end gap-2">
           <div className={`flex items-center gap-2 transition-all duration-700 opacity-40`}>
              <div className="w-1 h-1 bg-indigo-400 rounded-full animate-ping"></div>
              <span className="text-[8px] tracking-[0.2em] font-bold text-white/40 tabular-nums">
                {onlineCount.toLocaleString()} 息中
              </span>
           </div>
           <p className="text-[9px] text-white/20 font-bold tracking-widest">
            {dailyData.locationText} · {dailyData.weatherText}
           </p>
        </div>
      </header>

      <main className="space-y-16">
        <div className="relative w-full aspect-[4/5] rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl">
           <img src={dailyData.photoUrl} className="w-full h-full object-cover grayscale opacity-50 animate-breathe" alt="" />
           <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1c] via-transparent to-transparent"></div>
           <div className="absolute bottom-10 left-10 right-10 flex justify-between items-end">
              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-4">
                   <div className="w-6 h-6 rounded-full border border-indigo-400/30 flex items-center justify-center text-[10px] text-indigo-400 font-bold">宜</div>
                   <span className="text-[13px] text-white/80 tracking-[0.2em]">{dailyData.yiText}</span>
                </div>
                <div className="flex items-center gap-4">
                   <div className="w-6 h-6 rounded-full border border-red-400/30 flex items-center justify-center text-[10px] text-red-400 font-bold">忌</div>
                   <span className="text-[13px] text-white/80 tracking-[0.2em]">{dailyData.jiText}</span>
                </div>
              </div>
              <span className="text-[8px] text-white/10 tracking-[0.4em] uppercase">{dailyData.photoCredit}</span>
           </div>
        </div>

        <section className="space-y-12 px-2">
          <p className="text-[15px] leading-[2.6] text-white/70 tracking-[0.05em] font-[300] italic whitespace-pre-wrap">{dailyData.quoteText}</p>
          <p className="text-[14px] text-white/90 font-[400] tracking-widest text-right whitespace-pre-wrap leading-relaxed">{dailyData.closingText}</p>
        </section>
      </main>

      <section className="mt-24 flex flex-col items-center gap-24">
        <button onClick={onEnterRipple} className="group relative flex flex-col items-center active:scale-95 transition-all">
            <div className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center bg-white/[0.01] mb-8 glow-breathe">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M8 5V19L19 12L8 5Z" fill="#D1D1D1" fillOpacity="0.4"/></svg>
            </div>
            <h3 className="text-[11px] font-bold text-[#D1D1D1]/40 tracking-[1em] uppercase ml-[1em]">进入入梦模式</h3>
        </button>

        <button onClick={playNightWakePatch} className="flex flex-col items-center gap-6 opacity-20 hover:opacity-100 transition-all">
          <div className="w-12 h-[1px] bg-white/10"></div>
          <h4 className="text-[#666666] font-bold text-[9px] tracking-[1em] uppercase ml-[1em]">补丁模式</h4>
        </button>
      </section>
    </div>
  );
};

export default Home;
