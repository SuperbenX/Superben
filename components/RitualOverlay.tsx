
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { AudioItem, BurdenHistory } from '../types';
import { getAudioItems, getSettings, saveSettings } from '../services/storage';

interface RitualOverlayProps {
  onComplete: (item: AudioItem, prescription: string, thought: string) => void;
}

const RitualOverlay: React.FC<RitualOverlayProps> = ({ onComplete }) => {
  const [thought, setThought] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const options = [
    { id: "Overthinking", label: "脑子停不下来", cat: "无剧情放映室" },
    { id: "Anxiety", label: "焦虑感", cat: "琥珀色的慢板" },
    { id: "Loneliness", label: "孤独感", cat: "故纸堆里的哈欠" },
    { id: "Pain", label: "生理疲惫", cat: "光影的余烬" }
  ];

  const handleChoice = async (choiceId: string, category: string) => {
    setIsProcessing(true);
    
    // 保存到情感记忆系统
    const settings = getSettings();
    const newEntry: BurdenHistory = {
      date: new Date().toISOString(),
      burden: choiceId,
      thought: thought
    };
    const updatedHistory = [newEntry, ...(settings.burdenHistory || [])].slice(0, 10);
    saveSettings({ ...settings, burdenHistory: updatedHistory });

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      // 提示词增加历史参考逻辑（如果存在历史）
      const lastBurden = settings.burdenHistory?.[0]?.burden;
      const historyContext = lastBurden ? `用户上次的负担是${lastBurden}。` : "";
      
      const prompt = `
        ${historyContext}
        用户目前的心理负担是：${choiceId}。
        杂念描述：${thought || '无'}。
        请作为睡眠治疗师，给出一句30字以内的极简“深夜处方”，语气要冷静、专业且温柔。
      `;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      const prescription = response.text || "把所有的念头交给今晚的雨声。";
      
      const allItems = getAudioItems();
      const filtered = allItems.filter(i => i.category === category);
      const selectedItem = filtered[Math.floor(Math.random() * filtered.length)] || allItems[0];

      onComplete(selectedItem, prescription, thought);
    } catch (e) {
      console.error(e);
      const allItems = getAudioItems();
      onComplete(allItems[0], "放轻松，今晚属于你。", thought);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] bg-[#0c0c0d] flex flex-col items-center justify-center p-10 animate-in fade-in duration-[1.5s]">
      <div className="w-full max-w-xs space-y-16">
        <header className="text-center space-y-4 opacity-60">
          <h2 className="text-sm font-bold tracking-[0.5em] text-white uppercase">Brain Dump / 意识卸载</h2>
          <div className="w-4 h-[1px] bg-white/10 mx-auto"></div>
        </header>

        <textarea
          value={thought}
          onChange={(e) => setThought(e.target.value)}
          placeholder="有什么杂念？写下来，然后忘掉..."
          className="w-full h-32 bg-white/[0.02] border border-white/5 rounded-[2rem] p-8 text-xs text-white/40 placeholder-white/10 focus:outline-none focus:border-white/10 transition-all resize-none"
        />

        <div className="space-y-8">
          <p className="text-[10px] font-bold text-white/20 tracking-[0.4em] uppercase text-center">选择你此刻的负担</p>
          <div className="grid grid-cols-2 gap-4">
            {options.map(opt => (
              <button
                key={opt.id}
                disabled={isProcessing}
                onClick={() => handleChoice(opt.id, opt.cat)}
                className="py-6 border border-white/5 bg-white/[0.03] rounded-[1.5rem] text-[10px] font-bold text-white/40 uppercase tracking-widest transition-all active:scale-95 disabled:opacity-20"
              >
                {isProcessing ? '...' : opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RitualOverlay;
