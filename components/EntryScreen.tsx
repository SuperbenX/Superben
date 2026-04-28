
import React, { useEffect, useState } from 'react';

interface EntryScreenProps {
  onComplete: () => void;
}

const EntryScreen: React.FC<EntryScreenProps> = ({ onComplete }) => {
  const [stage, setStage] = useState<'fade-in' | 'stay' | 'fade-out'>('fade-in');

  useEffect(() => {
    // 动画阶段逻辑：进入 -> 停留 -> 消失
    const timers = [
      setTimeout(() => setStage('stay'), 1200),
      setTimeout(() => setStage('fade-out'), 2800),
      setTimeout(() => onComplete(), 4000)
    ];

    return () => timers.forEach(t => clearTimeout(t));
  }, [onComplete]);

  return (
    <div 
      className={`fixed inset-0 z-[1000] bg-[#0f0f10] flex flex-col items-center justify-center transition-all duration-[1200ms] ease-in-out
      ${stage === 'fade-out' ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100'}`}
    >
      {/* 装饰性背景微光 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] bg-white/[0.01] rounded-full blur-[100px] animate-breathe"></div>
      </div>

      <div className={`flex flex-col items-center transition-all duration-[1500ms] ${stage === 'fade-in' ? 'translate-y-4 opacity-0' : 'translate-y-0 opacity-100'}`}>
        {/* 核心 Logo */}
        <div className="relative mb-12">
          <span className="text-[120px] font-[200] text-[#d1d1d1] leading-none tracking-tighter select-none">
            息
          </span>
          {/* 呼吸边框 */}
          <div className="absolute -inset-8 border border-white/[0.03] rounded-full animate-breathe"></div>
        </div>

        {/* 标语 */}
        <div className="space-y-4 text-center">
          <p className="text-[12px] text-[#666666] font-[200] tracking-[1.2em] ml-[1.2em] uppercase">
            请你好好睡觉
          </p>
          <div className="w-8 h-[1px] bg-white/10 mx-auto"></div>
        </div>
      </div>

      {/* 底部小字 */}
      <div className={`absolute bottom-16 transition-opacity duration-1000 ${stage === 'stay' ? 'opacity-30' : 'opacity-0'}`}>
        <p className="text-[9px] font-bold tracking-[0.4em] text-[#444444] uppercase">
          Zen Rest & Recovery
        </p>
      </div>
    </div>
  );
};

export default EntryScreen;
