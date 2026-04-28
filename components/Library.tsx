
import React, { useState } from 'react';
import { AudioItem, Tab } from '../types';
import RipplePlayer from './RipplePlayer';

interface LibraryProps {
  onPlay: (item: AudioItem, skipRitual?: boolean, prescription?: string) => void;
  onNavigate?: (tab: Tab) => void;
}

const categories = [
  { id: 'books', name: "故纸堆里的哈欠", icon: "📖", color: "text-amber-200/40", subText: "100 Masterpieces · 智能织造" },
  { id: 'movies', name: "光影的余烬", icon: "🎬", color: "text-indigo-200/40", subText: "Cinematic Atmosphere · 沉浸素描" },
  { id: 'music', name: "琥珀色的慢板", icon: "🎻", color: "text-amber-100/40", subText: "Classic Adagio · 听觉按摩" },
  { id: 'noise', name: "无剧情放映室", icon: "🌫️", color: "text-white/20", subText: "Ambient Noise · 意识白噪声" },
  { id: 'custom', name: "流动的群星", icon: "✨", color: "text-indigo-300/40", subText: "User Library · 社区增补" }
];

const Library: React.FC<LibraryProps> = ({ onNavigate }) => {
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isSpinning, setIsSpinning] = useState<string | null>(null);

  const handleCategoryAction = (catId: string) => {
    setSelectedCategory(catId);
    setIsPlayerOpen(true);
  };

  const handleQuickRefresh = (e: React.MouseEvent, catId: string) => {
    e.stopPropagation();
    setIsSpinning(catId);
    setTimeout(() => {
      setIsSpinning(null);
      handleCategoryAction(catId);
    }, 600);
  };

  return (
    <div className="pb-40 px-8 animate-in fade-in duration-1000">
      <header className="py-20 flex flex-col items-start">
        <button 
          onClick={() => onNavigate?.('home')}
          className="group text-left transition-all duration-500 outline-none opacity-90 active:scale-95"
        >
          <div className="flex items-center gap-2 mb-2 opacity-20 group-hover:opacity-60 transition-opacity">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="m15 18-6-6 6-6"/>
            </svg>
            <span className="text-[8px] font-bold tracking-[0.4em] uppercase">回到地平线</span>
          </div>
          <h2 className="text-[36px] font-[100] text-white tracking-tighter group-hover:tracking-normal transition-all duration-700">涟漪</h2>
          <div className="h-[1px] bg-white/20 w-8 group-hover:w-full transition-all duration-700"></div>
        </button>
        <p className="text-[9px] text-white/20 uppercase tracking-[0.6em] font-bold mt-4">
          库藏内容与深度织造
        </p>
      </header>

      <div className="space-y-14">
        {categories.map((cat) => (
          <div key={cat.id} className="group">
            <div 
              onClick={() => handleCategoryAction(cat.id)}
              className="w-full flex justify-between items-center transition-all outline-none cursor-pointer"
            >
              <div className="flex items-center gap-8">
                <span className={`text-[24px] ${cat.color} opacity-30 group-hover:opacity-100 transition-opacity duration-500`}>
                  {cat.icon}
                </span>
                <div className="flex flex-col items-start">
                  <span className="text-[17px] text-white/50 font-[300] tracking-[0.2em] group-hover:text-white transition-colors duration-500">
                    {cat.name}
                  </span>
                  <span className="text-[8px] text-indigo-400/40 tracking-widest mt-1.5 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                    {cat.subText}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <button 
                  onClick={(e) => handleQuickRefresh(e, cat.id)}
                  className={`p-2 rounded-full border border-white/5 hover:bg-white/5 transition-all ${isSpinning === cat.id ? 'animate-spin opacity-100' : 'opacity-20 group-hover:opacity-60'}`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.85.83 6.72 2.25" />
                    <path d="M21 3v6h-6" />
                  </svg>
                </button>
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/20 group-hover:bg-indigo-500/60 group-hover:animate-ping"></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isPlayerOpen && selectedCategory && (
        <RipplePlayer 
          categoryId={selectedCategory} 
          onClose={() => {
            setIsPlayerOpen(false);
            setSelectedCategory(null);
          }} 
        />
      )}
    </div>
  );
};

export default Library;
