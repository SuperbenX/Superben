
import React, { useState, useEffect } from 'react';

interface Bubble {
  id: string;
  text: string;
}

const MOCK_RESONANCE = [
  "今天北京下雨了，我想念那个没带伞的下午。",
  "面试失败了，但晚上的路灯好温柔。",
  "原来长大的代价，是学会静音哭泣。",
  "此刻我只想变回一棵树，在风里站一会儿。",
  "谢谢你，在世界的另一个角落也在努力呼吸。",
  "杂念很多，但这一刻，我想放过自己。",
  "明天又是新的一天，这种话听多了，但今晚是真的累了。"
];

interface HarborOverlayProps {
  onClose: () => void;
}

const HarborOverlay: React.FC<HarborOverlayProps> = ({ onClose }) => {
  const [step, setStep] = useState<'input' | 'tossing' | 'catching' | 'resonance'>('input');
  const [inputText, setInputText] = useState("");
  const [resonanceText, setResonanceText] = useState("");

  const handleToss = () => {
    if (!inputText.trim()) return;
    setStep('tossing');
    setTimeout(() => {
      setStep('catching');
      // 模拟从星空中寻找共鸣
      setTimeout(() => {
        setResonanceText(MOCK_RESONANCE[Math.floor(Math.random() * MOCK_RESONANCE.length)]);
        setStep('resonance');
      }, 2000);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[300] bg-[#0c0c0d]/95 backdrop-blur-3xl flex flex-col items-center justify-center p-12 animate-in fade-in duration-1000">
      
      {step === 'input' && (
        <div className="w-full max-w-xs space-y-12 animate-in slide-in-from-bottom-4 duration-1000">
          <header className="text-center space-y-4">
            <h3 className="text-[11px] font-bold tracking-[0.6em] text-white/40 uppercase">投掷杂念</h3>
            <div className="w-4 h-[1px] bg-white/10 mx-auto"></div>
          </header>
          
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="写下一句此刻盘旋在你脑海里的话... 它将消失在群星中。"
            className="w-full h-40 bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 text-[14px] text-white/60 placeholder-white/10 focus:outline-none focus:border-white/20 transition-all resize-none font-[300] tracking-widest leading-relaxed"
          />

          <div className="flex flex-col gap-6">
            <button 
              onClick={handleToss}
              disabled={!inputText.trim()}
              className="w-full py-5 bg-white/[0.05] border border-white/10 rounded-full text-[10px] font-bold text-white/70 uppercase tracking-[0.6em] transition-all active:scale-95 disabled:opacity-20"
            >
              投掷气泡
            </button>
            <button onClick={onClose} className="text-[9px] text-white/20 uppercase tracking-[0.4em]">取消</button>
          </div>
        </div>
      )}

      {step === 'tossing' && (
        <div className="flex flex-col items-center animate-out fade-out slide-out-to-top-[100px] duration-[1500ms]">
          <div className="w-4 h-4 rounded-full bg-white/20 blur-sm animate-ping"></div>
          <p className="mt-8 text-[10px] text-white/20 tracking-[0.8em] uppercase">正在消散...</p>
        </div>
      )}

      {step === 'catching' && (
        <div className="flex flex-col items-center animate-in fade-in duration-[2000ms]">
          <div className="relative w-24 h-24">
             <div className="absolute inset-0 border border-white/5 rounded-full animate-breathe"></div>
             <div className="absolute inset-4 border border-white/5 rounded-full animate-breathe delay-700"></div>
          </div>
          <p className="mt-12 text-[10px] text-white/30 tracking-[0.8em] uppercase">搜寻星空中的回响</p>
        </div>
      )}

      {step === 'resonance' && (
        <div className="w-full max-w-xs space-y-16 animate-in zoom-in-95 fade-in duration-1000">
           <header className="text-center space-y-4">
            <h3 className="text-[10px] font-bold tracking-[0.8em] text-white/20 uppercase">来自他人的呼吸</h3>
            <div className="w-4 h-[1px] bg-white/10 mx-auto"></div>
          </header>

          <div className="relative p-12 bg-white/[0.03] border border-white/5 rounded-[3rem] shadow-2xl">
             <div className="absolute -top-4 -left-4 w-12 h-12 bg-indigo-500/10 rounded-full blur-xl"></div>
             <p className="text-[15px] leading-[2.4] text-white/70 text-center font-[300] italic tracking-wide">
               “ {resonanceText} ”
             </p>
          </div>

          <div className="space-y-8 flex flex-col items-center">
            <p className="text-[9px] text-white/20 tracking-[0.4em] uppercase text-center leading-loose">
              此刻有 1,200+ 人与你同在<br/>你并不孤单
            </p>
            <button 
              onClick={onClose}
              className="w-full py-5 border border-white/10 rounded-full text-[10px] font-bold text-white/40 uppercase tracking-[0.8em] hover:text-white/70 transition-all active:scale-95"
            >
              共鸣闭眼
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HarborOverlay;
