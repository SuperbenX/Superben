import React, { useState, useRef, useEffect } from 'react';
import { DailyItem } from '../types';
import { getDailyItems } from '../services/storage';

// --- 子组件：全屏详情/沉浸模式 ---
const DailyDetailScreen: React.FC<{ item: DailyItem; onClose: () => void }> = ({ item, onClose }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // 独立白噪音：森林轻风
  const AMBIENT_SOUND = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3";

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0;
      audioRef.current.play();
      let vol = 0;
      const fade = setInterval(() => {
        if (vol < 0.12) {
          vol += 0.01;
          if (audioRef.current) audioRef.current.volume = vol;
        } else clearInterval(fade);
      }, 100);
      return () => clearInterval(fade);
    }
  }, []);

  return (
    <div 
      className="fixed inset-0 z-[500] bg-[#141416] flex flex-col items-center justify-center px-10 animate-in fade-in duration-1000"
      onClick={onClose}
    >
      <audio ref={audioRef} src={AMBIENT_SOUND} loop />
      
      <div className="w-full max-w-[320px] aspect-square rounded-[2.5rem] overflow-hidden shadow-2xl mb-16 grayscale opacity-50">
        <img src={item.photoUrl} className="w-full h-full object-cover animate-breathe" alt="" />
      </div>

      <div className="max-w-[300px] text-center space-y-10">
        <div className="w-8 h-[1px] bg-white/10 mx-auto"></div>
        <p className="text-[#999999] text-[17px] leading-[2.6] text-justify tracking-[0.1em] font-[300] italic">
          {item.quoteText}
        </p>
        <div className="pt-8 opacity-20">
          <span className="text-[10px] text-white tracking-[0.6em] uppercase font-bold">点击屏幕退出沉浸</span>
        </div>
      </div>
    </div>
  );
};

// --- 子组件：日期选择器 ---
const DatePickerModal: React.FC<{ items: DailyItem[]; currentId: string; onSelect: (index: number) => void; onClose: () => void }> = ({ items, currentId, onSelect, onClose }) => {
  return (
    <div className="fixed inset-0 z-[510] bg-black/60 backdrop-blur-md flex items-end animate-in fade-in duration-300" onClick={onClose}>
      <div className="w-full bg-[#fcfcfc] rounded-t-[3rem] p-10 space-y-8 max-h-[70vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex justify-center mb-2">
            <div className="w-12 h-1 bg-gray-200 rounded-full"></div>
        </div>
        <h4 className="text-[11px] font-bold tracking-[0.5em] text-gray-400 uppercase text-center">选择往期</h4>
        <div className="space-y-2">
          {items.map((item, idx) => (
            <button 
              key={item.id}
              onClick={() => onSelect(idx)}
              className={`w-full py-5 text-center text-sm tracking-widest border-b border-gray-50 flex justify-between items-center px-4 transition-colors ${currentId === item.id ? 'text-black font-bold' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <span className="font-mono">{item.dateISO}</span>
              {currentId === item.id && <div className="w-2 h-2 bg-black rounded-full" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- 主组件：瞬息 (Reading) ---
const Reading: React.FC = () => {
  // Fix: Handle async getDailyItems() using state and useEffect
  const [allItems, setAllItems] = useState<DailyItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isDetailMode, setIsDetailMode] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  
  useEffect(() => {
    const loadData = async () => {
      const items = await getDailyItems();
      setAllItems(items);
    };
    loadData();
  }, []);

  if (allItems.length === 0) return null;
  const currentItem = allItems[currentIndex];

  // 滑动切换逻辑
  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.targetTouches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const touchEnd = e.changedTouches[0].clientX;
    const distance = touchStart - touchEnd;
    if (distance > 70 && currentIndex < allItems.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else if (distance < -70 && currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
    setTouchStart(null);
  };

  return (
    <div className="min-h-screen bg-[#fcfcfc] flex flex-col items-center relative z-[40]">
      
      {/* 沉浸详情模式 */}
      {isDetailMode && <DailyDetailScreen item={currentItem} onClose={() => setIsDetailMode(false)} />}

      {/* 日期选择 */}
      {showDatePicker && (
        <DatePickerModal 
          items={allItems} 
          currentId={currentItem.id} 
          onSelect={(idx) => { setCurrentIndex(idx); setShowDatePicker(false); }} 
          onClose={() => setShowDatePicker(false)} 
        />
      )}

      {/* 主信息流 */}
      <div 
        className="w-full max-w-md pt-12 pb-32 px-6 space-y-10 animate-in fade-in duration-1000"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* 1. Header Row (Layout Spec 1) */}
        <header className="flex justify-between items-start">
          <div 
            className="flex items-start cursor-pointer active:opacity-60 transition-opacity"
            onClick={() => setShowDatePicker(true)}
          >
            <span className="text-[82px] font-[600] text-[#333333] leading-[0.7] tracking-tighter">
              {currentItem.dayNumber}
            </span>
            <div className="ml-3 flex flex-col justify-start">
              <div className="flex items-center gap-1 mt-1">
                <span className="text-[12px] font-bold text-[#333333] tracking-widest">{currentItem.monthYearText}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="opacity-20"><path d="M6 9l6 6 6-6"/></svg>
              </div>
              <div className="w-10 h-[1px] bg-black/10 mt-2"></div>
            </div>
          </div>
          
          <div className="pt-3 text-right">
            <p className="text-[11px] text-[#999999] font-bold tracking-[0.2em] leading-relaxed">
              {currentItem.locationText} &nbsp;{currentItem.weatherText} &nbsp;{currentItem.temperatureText}
            </p>
          </div>
        </header>

        {/* 2. Main Daily Card (Layout Spec 2) */}
        <div 
          className="bg-white rounded-[2rem] shadow-[0_30px_70px_rgba(0,0,0,0.03)] border border-gray-100 overflow-hidden cursor-pointer active:scale-[0.98] transition-all"
          onClick={() => setIsDetailMode(true)}
        >
          {/* Photo */}
          <div className="aspect-[16/9] overflow-hidden">
            <img 
              src={currentItem.photoUrl} 
              className="w-full h-full object-cover opacity-95 transition-transform duration-[10s] hover:scale-105" 
              alt="Daily Photography" 
            />
          </div>
          
          {/* Photo Credit */}
          <div className="py-5 text-center border-b border-gray-50/50">
            <span className="text-[10px] text-gray-300 font-medium tracking-[0.4em] uppercase">
              {currentItem.photoCredit}
            </span>
          </div>

          {/* Quote Block */}
          <div className="px-10 pt-10 pb-16 text-center">
            <p className="text-[16px] leading-[2.6] text-[#555555] text-justify tracking-wide font-[300]">
              {currentItem.quoteText}
            </p>
            
            <div className="mt-14 flex flex-col items-center gap-5">
              <div className="w-6 h-[1px] bg-gray-200"></div>
              <span className="text-[11px] text-gray-400 font-bold tracking-[0.6em] uppercase">
                {currentItem.quoteAuthor}
              </span>
            </div>
          </div>
        </div>

        {/* 3. Next Content Feed (Layout Spec 3) */}
        <div className="pt-6 space-y-12">
          {/* Divider */}
          <div className="flex items-center justify-center gap-6 opacity-20">
            <div className="h-[1px] flex-1 bg-gray-300"></div>
            <span className="text-[11px] font-bold tracking-[0.8em] text-gray-800 uppercase">— 阅读 —</span>
            <div className="h-[1px] flex-1 bg-gray-300"></div>
          </div>

          {/* Next Article Row */}
          <div className="group cursor-pointer pb-10">
            <h3 className="text-[19px] font-[300] text-gray-800 tracking-wide leading-relaxed group-hover:text-black transition-colors">
              {currentItem.nextArticleTitle}
            </h3>
            <p className="text-[11px] text-gray-400 font-medium tracking-widest mt-3 uppercase">
              文 / {currentItem.nextArticleAuthor}
            </p>
            
            <div className="mt-10 flex justify-between items-center opacity-30 group-hover:opacity-60 transition-opacity">
               <div className="flex gap-12">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"/></svg>
               </div>
               <span className="text-[10px] font-bold tracking-[0.3em] text-gray-400">ONE · 一个</span>
            </div>
          </div>
        </div>

        {/* 交互提示 */}
        <div className="flex flex-col items-center gap-3 opacity-10 py-10">
           <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="1.5" className="animate-bounce"><path d="M7 13l5 5 5-5M12 18V6"/></svg>
           <p className="text-[9px] font-bold tracking-[0.6em] uppercase text-black">左右滑动切换往期</p>
        </div>
      </div>
    </div>
  );
};

export default Reading;