
import React from 'react';
import { SOUNDSCAPES } from '../constants';
import { Soundscape } from '../types';

interface SoundPanelProps {
  activeSound: Soundscape | null;
  onToggle: (sound: Soundscape) => void;
}

const SoundPanel: React.FC<SoundPanelProps> = ({ activeSound, onToggle }) => {
  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
      <h2 className="text-xl font-medium mb-6 flex items-center gap-2">
        <span className="w-1 h-6 bg-indigo-500 rounded-full"></span>
        Ambient Soundscapes
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SOUNDSCAPES.map((sound) => (
          <button
            key={sound.id}
            onClick={() => onToggle(sound)}
            className={`flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 border ${
              activeSound?.id === sound.id 
                ? 'bg-indigo-900/20 border-indigo-500/50 scale-[1.02]' 
                : 'glass-panel border-transparent hover:border-slate-700'
            }`}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
              activeSound?.id === sound.id ? 'bg-indigo-500/30' : 'bg-slate-800'
            }`}>
              {sound.icon}
            </div>
            <div className="text-left flex-1">
              <h3 className="font-medium text-slate-100">{sound.name}</h3>
              <p className="text-xs text-slate-500">{sound.description}</p>
            </div>
            {activeSound?.id === sound.id && (
              <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></div>
            )}
          </button>
        ))}
      </div>

      <div className="mt-12 glass-panel p-6 rounded-2xl">
        <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Timer</h4>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {['15m', '30m', '1h', '2h', '∞'].map(time => (
            <button key={time} className="px-4 py-2 rounded-full border border-slate-700 text-xs hover:bg-indigo-500/20 transition-colors whitespace-nowrap">
              {time}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SoundPanel;
