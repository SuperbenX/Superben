
import React, { useState, useEffect } from 'react';
import { AppSettings, Tab } from '../types';
import { getSettings, saveSettings } from '../services/storage';

interface SettingsProps {
  onNavigate?: (tab: Tab) => void;
}

const Settings: React.FC<SettingsProps> = ({ onNavigate }) => {
  const [config, setConfig] = useState<AppSettings>(getSettings());

  useEffect(() => {
    saveSettings(config);
  }, [config]);

  return (
    <div className="animate-in slide-in-from-bottom-4 duration-500 pb-12">
      <h2 className="text-3xl font-bold text-[#bbbbbb] mb-8">设置与偏好</h2>
      
      <div className="space-y-6">
        <section className="bg-[#242427] p-6 rounded-[2rem] border border-white/5">
          <div className="flex justify-between items-center mb-6">
            <div>
               <h4 className="text-[#aaaaaa] font-bold">自动随机播放</h4>
               <p className="text-[10px] text-[#666666]">每次入睡自动切换不同主题</p>
            </div>
            <button 
              onClick={() => setConfig({...config, autoShuffle: !config.autoShuffle})}
              className={`w-12 h-6 rounded-full transition-colors relative ${config.autoShuffle ? 'bg-[#555555]' : 'bg-[#333335]'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-[#aaaaaa] transition-all ${config.autoShuffle ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          <div className="flex justify-between items-center">
            <div>
               <h4 className="text-[#aaaaaa] font-bold">入睡准备提醒</h4>
               <p className="text-[10px] text-[#666666]">在固定时间提醒您开始放松</p>
            </div>
            <input 
               type="time" 
               value={config.reminderTime}
               onChange={(e) => setConfig({...config, reminderTime: e.target.value})}
               className="bg-[#333335] text-[#aaaaaa] text-xs px-3 py-1.5 rounded-lg border-none focus:ring-1 focus:ring-white/10"
            />
          </div>
        </section>

        <section className="bg-[#242427] p-6 rounded-[2rem] border border-white/5">
          <label className="block text-[#666666] text-[10px] font-bold uppercase tracking-[0.2em] mb-4">自动淡出 (分钟)</label>
          <input 
            type="range" min="5" max="60" step="5"
            value={config.autoFadeMinutes}
            onChange={(e) => setConfig({ ...config, autoFadeMinutes: parseInt(e.target.value) })}
            className="w-full h-1.5 bg-[#333335] rounded-lg appearance-none cursor-pointer mb-3"
          />
          <div className="flex justify-between text-xs font-bold text-[#888888]">
            <span>5 min</span>
            <span className="bg-white/5 px-2 py-0.5 rounded-md">{config.autoFadeMinutes} 分钟</span>
            <span>60 min</span>
          </div>
        </section>

        <section className="bg-[#242427] p-6 rounded-[2rem] border border-white/5">
          <label className="block text-[#666666] text-[10px] font-bold uppercase tracking-[0.2em] mb-4">播放音量</label>
          <input 
            type="range" min="0" max="1" step="0.1"
            value={config.defaultVolume}
            onChange={(e) => setConfig({ ...config, defaultVolume: parseFloat(e.target.value) })}
            className="w-full h-1.5 bg-[#333335] rounded-lg appearance-none cursor-pointer mb-3"
          />
          <div className="flex justify-between text-xs font-bold text-[#666666]">
            <span>静音</span>
            <span className="text-[#888888]">{Math.round(config.defaultVolume * 100)}%</span>
            <span>最大</span>
          </div>
        </section>

        <div className="p-10 bg-indigo-500/5 border border-indigo-500/20 rounded-[2.5rem] flex flex-col items-center gap-6">
           <h4 className="text-indigo-300 text-[10px] font-bold uppercase tracking-widest">内容创作者面板</h4>
           <button 
            onClick={() => onNavigate?.('admin')}
            className="px-8 py-4 bg-indigo-600 rounded-full text-white text-[11px] font-bold uppercase tracking-widest shadow-xl shadow-indigo-500/20 active:scale-95 transition-all"
           >
             进入内容实验室
           </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
