
import React from 'react';
import { AppView } from '../types';

interface DashboardProps {
  setView: (view: AppView) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ setView }) => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <section className="glass-panel p-8 rounded-3xl relative overflow-hidden group">
        <div className="relative z-10">
          <h2 className="text-2xl font-serif mb-2">Feeling restless?</h2>
          <p className="text-slate-400 mb-6 max-w-sm">Try our AI-guided meditation. Luna will lead you through breathing exercises designed for deep sleep.</p>
          <button 
            onClick={() => setView(AppView.LIVE_GUIDE)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-medium transition-colors shadow-lg shadow-indigo-900/40"
          >
            Start Meditation
          </button>
        </div>
        <div className="absolute top-0 right-0 p-8 text-6xl opacity-20 group-hover:scale-110 transition-transform duration-500">🧘‍♀️</div>
      </section>

      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={() => setView(AppView.SOUNDS)}
          className="glass-panel p-6 rounded-2xl text-left hover:bg-slate-800/60 transition-colors"
        >
          <div className="text-3xl mb-3">🎧</div>
          <h3 className="font-medium text-lg">Soundscapes</h3>
          <p className="text-xs text-slate-500">Rain, wind, and nature.</p>
        </button>
        <button 
          onClick={() => setView(AppView.STORIES)}
          className="glass-panel p-6 rounded-2xl text-left hover:bg-slate-800/60 transition-colors"
        >
          <div className="text-3xl mb-3">📖</div>
          <h3 className="font-medium text-lg">AI Stories</h3>
          <p className="text-xs text-slate-500">Dreamy bedtime tales.</p>
        </button>
        <button 
          onClick={() => setView(AppView.ADVICE)}
          className="glass-panel p-6 rounded-2xl text-left hover:bg-slate-800/60 transition-colors"
        >
          <div className="text-3xl mb-3">💡</div>
          <h3 className="font-medium text-lg">Sleep Tips</h3>
          <p className="text-xs text-slate-500">Scientifically proven hacks.</p>
        </button>
        <div className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center border-dashed border-slate-700">
          <div className="text-xs text-slate-600 uppercase font-bold">Today's Goal</div>
          <div className="text-2xl font-serif text-indigo-300">8h 00m</div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
