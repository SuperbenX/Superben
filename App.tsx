
import React, { useState, useEffect, useCallback } from 'react';
import Layout from './components/Layout';
import Home from './components/Home';
import Library from './components/Library';
import History from './components/History';
import Settings from './components/Settings';
import Admin from './components/Admin';
import Player from './components/Player';
import RitualOverlay from './components/RitualOverlay';
import MorningEcho from './components/MorningEcho';
import EntryScreen from './components/EntryScreen';
import HarborOverlay from './components/HarborOverlay';
import RipplePlayer from './components/RipplePlayer';
import InteractionQA from './components/InteractionQA';
import DeepDive from './components/DeepDive';
import { AudioItem, PlayLog, Tab, ChatMessage, QAPrescription, DailyItem } from './types';
import { getMorningEcho, markEchoAsShown, getDailyItems } from './services/storage';
import { CloudService } from './services/cloud';
import { DailyGenerator } from './services/generator';

const App: React.FC = () => {
  const [isEntryVisible, setIsEntryVisible] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [currentAudio, setCurrentAudio] = useState<AudioItem | null>(null);
  const [isRipplePlayerVisible, setIsRipplePlayerVisible] = useState(false);
  const [isDeepDive, setIsDeepDive] = useState(false);
  const [pendingRitualItem, setPendingRitualItem] = useState<AudioItem | null>(null);
  const [isHarborVisible, setIsHarborVisible] = useState(false);
  const [prescription, setPrescription] = useState("");
  const [selectedThought, setSelectedThought] = useState<string | undefined>();
  const [morningEchoData, setMorningEchoData] = useState<PlayLog | null>(null);
  const [isSinking, setIsSinking] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // --- 全局持久化状态 (严防重复生成) ---
  const [todayMoment, setTodayMoment] = useState<DailyItem | null>(null);
  const [qaMessages, setQaMessages] = useState<ChatMessage[]>([]);
  const [qaPrescription, setQaPrescription] = useState<QAPrescription | null>(null);

  const initAppData = useCallback(async () => {
    // 1. 日期判定锁：如果已经有当日数据，立即跳过所有逻辑
    const now = new Date();
    const todayISO = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
    
    if (todayMoment && todayMoment.dateISO === todayISO) return;

    setIsSyncing(true);
    try {
      // 2. 并行同步基础内容
      await Promise.all([
        CloudService.fetchAudios(),
        CloudService.fetchMoments()
      ]);

      // 3. 由 Generator 负责内部的“查缓存/生成”逻辑
      const finalToday = await DailyGenerator.generateTodayIfNeeded();
      if (finalToday) {
        setTodayMoment(finalToday);
      }
    } catch (e) {
      console.error("数据对齐失败:", e);
    } finally {
      setIsSyncing(false);
    }
  }, [todayMoment]);

  useEffect(() => {
    const echo = getMorningEcho();
    if (echo) setMorningEchoData(echo);
    initAppData();
  }, [initAppData]);

  const handlePlay = (item: AudioItem, skipRitual = false, deepDive = false, customPrescription = "") => {
    setIsDeepDive(deepDive);
    setPrescription(customPrescription);
    if (skipRitual) {
      setCurrentAudio(item);
      return;
    }
    setPendingRitualItem(item);
  };

  const onRitualComplete = (item: AudioItem, prescriptionStr: string, thoughtStr: string) => {
    setPrescription(prescriptionStr);
    setSelectedThought(thoughtStr);
    setIsSinking(true);
    setTimeout(() => {
      setCurrentAudio(item);
      setPendingRitualItem(null);
      setIsSinking(false);
    }, 2000);
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'home': 
        return (
          <Home 
            dailyData={todayMoment}
            onPlay={handlePlay} 
            onOpenHarbor={() => setIsHarborVisible(true)} 
            onEnterRipple={() => setIsRipplePlayerVisible(true)} 
          />
        );
      case 'library': 
        return <Library onPlay={(item, skip, presc) => handlePlay(item, !!skip, false, presc || "")} onNavigate={setActiveTab} />;
      case 'deep_dive':
        return <DeepDive onPlay={handlePlay} />;
      case 'qa':
        return (
          <InteractionQA 
            messages={qaMessages}
            setMessages={setQaMessages}
            prescription={qaPrescription}
            setPrescription={setQaPrescription}
            onPlay={(item, skip, presc) => handlePlay(item, skip, false, presc)} 
          />
        );
      case 'history': 
        return <History />;
      case 'settings': 
        return <Settings onNavigate={setActiveTab} />;
      case 'admin': 
        return <Admin />;
      default: 
        return <Home dailyData={todayMoment} onPlay={handlePlay} onOpenHarbor={() => setIsHarborVisible(true)} onEnterRipple={() => setIsRipplePlayerVisible(true)} />;
    }
  };

  return (
    <>
      {isEntryVisible && <EntryScreen onComplete={() => setIsEntryVisible(false)} />}
      <div className={`sinking-transition ${isSinking ? 'sinking-active' : ''} ${isEntryVisible ? 'hidden' : ''}`}>
        <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
          
          {isSyncing && activeTab === 'home' && !todayMoment && (
            <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[150] animate-in fade-in duration-500">
              <div className="px-4 py-1.5 bg-white/5 backdrop-blur-xl border border-white/5 rounded-full flex items-center gap-3">
                 <div className="w-1 h-1 bg-indigo-400 rounded-full animate-ping"></div>
                 <span className="text-[8px] text-white/30 tracking-[0.3em] font-bold uppercase">正在对齐星历</span>
              </div>
            </div>
          )}

          <div key={activeTab} className="animate-in fade-in duration-700">
            {renderActiveTab()}
          </div>
          {morningEchoData && <MorningEcho log={morningEchoData} onDismiss={() => { setMorningEchoData(null); markEchoAsShown(); }} />}
          {pendingRitualItem && <RitualOverlay onComplete={onRitualComplete} />}
          {isHarborVisible && <HarborOverlay onClose={() => setIsHarborVisible(false)} />}
          {isRipplePlayerVisible && <RipplePlayer onClose={() => setIsRipplePlayerVisible(false)} />}
          {currentAudio && (
            <Player 
              audioItem={currentAudio} 
              isDeepDive={isDeepDive} 
              prescription={prescription}
              thought={selectedThought}
              onClose={() => { setCurrentAudio(null); setPrescription(""); setIsDeepDive(false); }} 
            />
          )}
        </Layout>
      </div>
    </>
  );
};

export default App;
