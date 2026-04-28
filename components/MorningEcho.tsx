
import React from 'react';
import { PlayLog } from '../types';

interface MorningEchoProps {
  log: PlayLog;
  onDismiss: () => void;
}

const MorningEcho: React.FC<MorningEchoProps> = ({ log, onDismiss }) => {
  const durationMins = log.endTime ? Math.round((log.endTime - log.playTime) / 60000) : 0;
  const interactionMins = (log.logOffTime && log.playTime) 
    ? Math.round((log.logOffTime - log.playTime) / 60000) 
    : 0;

  return (
    <div className="fixed inset-0 z-[110] bg-[#1a1a1c]/95 backdrop-blur-3xl flex flex-col items-center justify-center p-12 text-center animate-in fade-in zoom-in duration-1000">
      <div className="max-w-xs space-y-10">
        <header>
          <h2 className="text-2xl font-bold text-[#bbbbbb] tracking-widest mb-2">Morning Echo</h2>
          <p className="text-[10px] text-[#888888] font-bold uppercase tracking-[0.4em]">晨间回响</p>
        </header>

        <div className="space-y-6 text-[#aaaaaa]">
          <div className="p-8 border border-white/10 rounded-[3rem] bg-white/[0.02]">
            <p className="text-[10px] uppercase tracking-[0.2em] mb-2 opacity-50 text-[#888888]">Last Night You Released</p>
            <p className="text-xl font-bold tracking-widest text-[#cccccc]">
              {log.burdenSelected === "Anxiety" ? "焦虑" : 
               log.burdenSelected === "Exhaustion" ? "疲惫" : 
               log.burdenSelected === "Noise" ? "喧嚣" : "一切"}
            </p>
          </div>

          <div className="space-y-4 text-[10px] uppercase tracking-[0.3em] font-medium leading-loose opacity-90 text-[#888888]">
            <p>You stayed present for <span className="text-[#bbbbbb]">{interactionMins} minutes</span></p>
            <p>Total silence followed after <span className="text-[#bbbbbb]">{durationMins} minutes</span></p>
          </div>
        </div>

        <button 
          onClick={onDismiss}
          className="w-full py-6 bg-[#2a2a2d] border border-white/10 rounded-full text-[10px] font-bold text-[#bbbbbb] uppercase tracking-[0.5em] active:scale-95 transition-transform mt-12"
        >
          Begin Today / 开始今天
        </button>
      </div>
    </div>
  );
};

export default MorningEcho;