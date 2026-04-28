
import React, { useState, useRef } from 'react';
import { MOCK_STORIES } from '../constants';
import { generateSleepStory, textToSpeech } from '../geminiService';
import { decode } from '../utils/audioUtils';

const StoryPanel: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [topic, setTopic] = useState('');
  const [story, setStory] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    try {
      const result = await generateSleepStory(topic);
      setStory(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayTTS = async () => {
    if (!story) return;
    setPlaying(true);
    const base64Audio = await textToSpeech(story);
    if (base64Audio) {
      const audioData = decode(base64Audio);
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const ctx = audioContextRef.current;
      const dataInt16 = new Int16Array(audioData.buffer);
      const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
      const channelData = buffer.getChannelData(0);
      for (let i = 0; i < dataInt16.length; i++) {
        channelData[i] = dataInt16[i] / 32768.0;
      }
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.onended = () => setPlaying(false);
      source.start();
    } else {
      setPlaying(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <section>
        <h2 className="text-xl font-medium mb-6 flex items-center gap-2">
          <span className="w-1 h-6 bg-purple-500 rounded-full"></span>
          Dream Weaver AI
        </h2>
        <div className="glass-panel p-6 rounded-2xl">
          <p className="text-sm text-slate-400 mb-4">What should tonight's story be about?</p>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. A flying island, A cozy attic..."
              className="flex-1 bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-purple-500"
            />
            <button 
              onClick={handleGenerate}
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            >
              {loading ? 'Creating...' : 'Generate'}
            </button>
          </div>

          {story && (
            <div className="mt-6 p-4 bg-slate-900/80 rounded-xl border border-purple-500/20 max-h-60 overflow-y-auto italic text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
              {story}
              <div className="mt-4 flex justify-end">
                <button 
                  onClick={handlePlayTTS}
                  disabled={playing}
                  className="text-purple-400 hover:text-purple-300 text-xs font-bold uppercase tracking-widest flex items-center gap-2"
                >
                  {playing ? '🔊 Playing...' : '▶️ Narrate'}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <section>
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Library Favorites</h3>
        <div className="grid grid-cols-1 gap-4">
          {MOCK_STORIES.map(story => (
            <div key={story.id} className="glass-panel p-4 rounded-2xl flex gap-4 hover:bg-slate-800/40 transition-colors cursor-pointer group">
              <img src={story.imageUrl} alt={story.title} className="w-24 h-24 object-cover rounded-xl group-hover:scale-105 transition-transform duration-500" />
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium">{story.title}</h4>
                  <span className="text-[10px] bg-slate-800 px-2 py-1 rounded text-slate-400">{story.duration}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">{story.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default StoryPanel;
