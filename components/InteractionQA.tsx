
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { AudioItem, ChatMessage, QAPrescription } from '../types';
import { getAudioItems } from '../services/storage';

interface InteractionQAProps {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  prescription: QAPrescription | null;
  setPrescription: React.Dispatch<React.SetStateAction<QAPrescription | null>>;
  onPlay: (item: AudioItem, skipRitual: boolean, prescription: string) => void;
}

const InteractionQA: React.FC<InteractionQAProps> = ({ 
  messages, 
  setMessages, 
  prescription, 
  setPrescription, 
  onPlay 
}) => {
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [status, setStatus] = useState<'chatting' | 'analyzing'>('chatting');
  const [error, setError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!inputText.trim() || isTyping || status === 'analyzing') return;

    const userMsg: ChatMessage = {
      role: 'user',
      text: inputText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText("");
    setIsTyping(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      // 使用 Gemini 3 Pro 提供深度共情的回复
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: userMsg.text,
        config: {
          systemInstruction: '你叫“息”，是一个具有深度共情能力的深夜灵魂伴侣。你的回复要像电影旁白一样优美、儒雅、平和。不要说废话，要能直抵人心。保持语气温柔。',
          temperature: 0.8,
          thinkingConfig: { thinkingBudget: 16000 }
        }
      });

      const botMsg: ChatMessage = {
        role: 'model',
        text: response.text || "我在这里，听见了你的呼吸。",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (e: any) {
      setError("今晚的连接似乎有些波动。");
    } finally {
      setIsTyping(false);
    }
  };

  const handleAnalyze = async () => {
    if (messages.length < 1 || status === 'analyzing') return;
    setStatus('analyzing');
    setPrescription(null);
    try {
      const history = messages.map(m => `${m.role}: ${m.text}`).join('\n');
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `基于以下对话记录分析用户的深层情绪压力，并返回一个JSON格式的睡眠处方。
        JSON结构要求：
        {
          "category": "故纸堆里的哈欠" | "光影的余烬" | "琥珀色的慢板" | "无剧情放映室",
          "reason": "为什么推荐这个分类的治愈理由",
          "nutrition": "这段声音能提供的心理营养成分"
        }\n\n对话历史：\n${history}`,
        config: { responseMimeType: "application/json" }
      });
      
      const data = JSON.parse(response.text.trim());
      const allItems = getAudioItems();
      const filtered = allItems.filter(i => i.category === data.category);
      const item = filtered[Math.floor(Math.random() * filtered.length)] || allItems[0];

      setPrescription({
        item,
        reason: data.reason,
        categoryLabel: data.category,
        nutritionalValue: data.nutrition
      });
    } catch (e) {
      setError("织造处方时出现了一点偏差。");
    } finally {
      setStatus('chatting');
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-[88vh] relative bg-[#0f0f10] overflow-hidden">
      
      {/* 顶部标题栏 */}
      <header className="px-8 pt-10 pb-4 border-b border-white/5 backdrop-blur-xl bg-black/20 flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
             <div className="relative">
                <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                   <span className="text-lg">息</span>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-[#0f0f10] rounded-full"></div>
             </div>
             <div>
                <h2 className="text-[15px] font-bold text-white/90 tracking-widest">深夜私语</h2>
                <p className="text-[9px] text-green-500/60 uppercase tracking-widest font-bold">正在聆听中</p>
             </div>
          </div>
          <button 
            onClick={() => setMessages([])}
            className="text-[10px] text-white/20 hover:text-white/40 tracking-widest uppercase transition-colors"
          >
            清除记忆
          </button>
      </header>

      {/* 消息滚动区域 */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-6 py-8 space-y-6 no-scrollbar scroll-smooth bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] bg-fixed"
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-8 opacity-40 animate-in fade-in duration-1000">
            <div className="w-20 h-20 rounded-full border border-white/5 flex items-center justify-center bg-white/[0.02]">
                <span className="text-3xl">🌙</span>
            </div>
            <div className="space-y-3">
                <p className="text-[11px] font-bold tracking-[0.5em] text-white uppercase">此刻，请放下防备</p>
                <p className="text-[13px] text-white/40 max-w-[240px] leading-relaxed font-[300]">
                  无论今天经历了什么，这里是你的专属避风港。你可以分享任何琐碎的心事。
                </p>
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-500`}>
            <div className={`group relative max-w-[85%] px-5 py-4 rounded-[1.8rem] text-[15px] leading-relaxed tracking-wide font-[300] shadow-sm ${
              m.role === 'user' 
                ? 'bg-indigo-600/20 text-indigo-50 rounded-tr-none border border-indigo-500/20' 
                : 'bg-white/[0.05] text-white/80 rounded-tl-none border border-white/5'
            }`}>
              {m.text.split('\n').map((line, idx) => (
                <p key={idx} className={idx > 0 ? 'mt-2' : ''}>{line}</p>
              ))}
              
              <div className={`mt-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <span className="text-[8px] font-mono text-white/20">{formatTime(m.timestamp)}</span>
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-start gap-3 animate-in fade-in duration-300">
             <div className="bg-white/[0.05] border border-white/5 px-4 py-3 rounded-2xl rounded-tl-none flex gap-1.5 items-center">
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
             </div>
          </div>
        )}

        {prescription && (
          <div className="w-full animate-in fade-in zoom-in-95 duration-1000 py-6">
            <div className="p-8 bg-gradient-to-br from-indigo-500/10 to-transparent border border-indigo-500/20 rounded-[2.5rem] space-y-8 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center gap-3">
                 <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></div>
                 <span className="text-[10px] font-bold text-indigo-300 tracking-[0.4em] uppercase">星历处方</span>
              </div>
              <p className="text-[15px] text-white/80 leading-relaxed font-[300] italic">
                “ {prescription.reason} ”
              </p>
              <button 
                onClick={() => onPlay(prescription.item, true, prescription.reason)}
                className="w-full py-5 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded-full text-[12px] font-bold tracking-[0.4em] uppercase active:scale-[0.97] transition-all shadow-lg shadow-indigo-500/10"
              >
                开启：{prescription.item.title}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 底部输入区 */}
      <footer className="px-6 py-6 bg-gradient-to-t from-[#0f0f10] to-transparent">
        <div className="flex flex-col gap-4 max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            {/* 心绪诊断按钮 */}
            <button 
              onClick={handleAnalyze}
              disabled={messages.length < 1 || status === 'analyzing'}
              className={`w-12 h-12 flex-shrink-0 rounded-full flex items-center justify-center transition-all active:scale-90 ${
                messages.length < 1 || status === 'analyzing' 
                  ? 'bg-white/[0.03] text-white/10' 
                  : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
              }`}
              title="心绪诊断"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z"/><path d="M12 7v5l3 3"/>
              </svg>
            </button>

            {/* 输入框主体 */}
            <div className="flex-1 relative group">
              <input 
                type="text" 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="这一刻，你在想什么？"
                className="w-full bg-white/[0.05] border border-white/5 group-hover:border-white/10 focus:border-indigo-500/40 rounded-[1.8rem] px-6 py-4 text-[14px] text-white/90 placeholder-white/20 focus:outline-none transition-all shadow-inner"
              />
            </div>

            {/* 发送按钮 */}
            <button 
              onClick={handleSend}
              disabled={isTyping || !inputText.trim()}
              className={`w-12 h-12 flex-shrink-0 rounded-full flex items-center justify-center transition-all active:scale-90 ${
                inputText.trim() ? 'bg-indigo-600 text-white shadow-[0_0_20px_rgba(79,70,229,0.3)]' : 'bg-white/[0.03] text-white/10'
              }`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          
          <div className="px-2 flex justify-center">
            <p className="text-[9px] text-white/10 tracking-[0.4em] uppercase font-bold">
               {status === 'analyzing' ? '正在感应你的心绪脉搏...' : '息·对话模式'}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default InteractionQA;
