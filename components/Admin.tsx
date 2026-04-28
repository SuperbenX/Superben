
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CloudService, CloudBookMetadata } from '../services/cloud';
import { NotionService, NotionPageRef } from '../services/notion';
import { getSettings, saveSettings } from '../services/storage';
import { GoogleGenAI, Modality } from "@google/genai";
import { decode, decodeAudioData, encode } from '../utils/audioUtils';

const Admin: React.FC = () => {
  const [notionToken, setNotionToken] = useState("");
  const [notionPageId, setNotionPageId] = useState("");
  const [foundPages, setFoundPages] = useState<NotionPageRef[]>([]);
  const [isScanningNotion, setIsScanningNotion] = useState(false);
  const [isSyncingText, setIsSyncingText] = useState(false);
  const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0 });

  const [cloudStatus, setCloudStatus] = useState<{ok: boolean, msg: string}>({ ok: true, msg: "正在检测..." });
  const [cloudBooks, setCloudBooks] = useState<(CloudBookMetadata & { hasAudio: boolean })[]>([]);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);
  const [previewText, setPreviewText] = useState<{title: string, content: string} | null>(null);

  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [currentWeavingId, setCurrentWeavingId] = useState<string | null>(null);
  const [chunkProgress, setChunkProgress] = useState({ current: 0, total: 0 });
  const [importLog, setImportLog] = useState<{msg: string, type: 'info' | 'success' | 'error'}[]>([]);

  const stopSignal = useRef(false);

  const addLog = (msg: string, type: 'info' | 'success' | 'error' = 'info') => {
    setImportLog(prev => [{ msg, type }, ...prev.slice(0, 50)]);
  };

  const refreshCloudLibrary = useCallback(async () => {
    setIsLoadingLibrary(true);
    const res = await CloudService.checkConnection();
    setCloudStatus(res);
    try {
      const books = await CloudService.fetchAllCloudBooks();
      if (books) {
        const booksWithStatus = await Promise.all(books.map(async (b) => {
          const hasAudio = await CloudService.getAudioCache(b.id, 0, 'Kore');
          return { ...b, hasAudio: !!hasAudio };
        }));
        setCloudBooks(booksWithStatus);
      }
    } catch (e: any) {
      addLog(`刷新异常: ${e.message}`, "error");
    } finally {
      setIsLoadingLibrary(false);
    }
  }, []);

  useEffect(() => {
    const settings = getSettings();
    if (settings.notionToken) setNotionToken(settings.notionToken);
    if (settings.notionPageId) setNotionPageId(settings.notionPageId);
    refreshCloudLibrary();
  }, [refreshCloudLibrary]);

  const handleNotionScan = async () => {
    setIsScanningNotion(true);
    try {
      const pages = await NotionService.fetchChildPages(notionToken, notionPageId);
      setFoundPages(pages);
      addLog(`探测成功: 发现 ${pages.length} 本书籍`, "success");
      saveSettings({ ...getSettings(), notionToken, notionPageId });
    } catch (e: any) {
      addLog(`探测失败: ${e.message}`, "error");
    } finally {
      setIsScanningNotion(false);
    }
  };

  // --- 优化 1: 并行同步正文 (限制并发为 5) ---
  const handleSyncToSupabase = async () => {
    if (foundPages.length === 0) return addLog("请先点击探测清单", "info");
    setIsSyncingText(true);
    setSyncProgress({ current: 0, total: foundPages.length });
    
    let successCount = 0;
    const concurrency = 5;
    const queue = [...foundPages];
    
    const worker = async () => {
      while (queue.length > 0 && !stopSignal.current) {
        const page = queue.shift()!;
        try {
          const content = await NotionService.fetchPageContent(notionToken, page.id);
          if (content && content.length > 5) {
            const bookId = page.customId || `book-${page.id.slice(0,8)}`;
            await CloudService.saveLiteratureSummary(bookId, content, page.title, page.author, page.category);
            successCount++;
            setSyncProgress(prev => ({ ...prev, current: prev.current + 1 }));
            addLog(`已同步: 《${page.title}》`, "success");
          }
        } catch (e: any) {
          addLog(`同步失败: ${page.title} - ${e.message}`, "error");
        }
      }
    };

    await Promise.all(Array(concurrency).fill(null).map(worker));
    setIsSyncingText(false);
    addLog(`同步任务结束，成功写入 ${successCount} 本`, "info");
    refreshCloudLibrary();
  };

  // --- 优化 2: 分段合并织造逻辑 ---
  const splitIntoChunks = (text: string, maxLen = 500) => {
    const sentences = text.match(/[^。！？；\n]*[。！？；\n]/g) || [text];
    const chunks: string[] = [];
    let currentChunk = "";

    for (const s of sentences) {
      if ((currentChunk + s).length > maxLen && currentChunk) {
        chunks.push(currentChunk);
        currentChunk = s;
      } else {
        currentChunk += s;
      }
    }
    if (currentChunk) chunks.push(currentChunk);
    return chunks;
  };

  const handleBulkWeave = async () => {
    const ok = await window.aistudio.hasSelectedApiKey();
    if (!ok) return await window.aistudio.openSelectKey();

    const queue = cloudBooks.filter(b => !b.hasAudio && (b.contentLength || 0) > 0);
    if (queue.length === 0) return addLog("暂无待处理书籍", "info");
    
    setIsBulkProcessing(true);
    stopSignal.current = false;
    addLog("织造加速引擎启动：已开启段落合并模式...", "info");

    for (const book of queue) {
      if (stopSignal.current) break;
      setCurrentWeavingId(book.id);
      try {
        const content = await CloudService.fetchLiteratureSummary(book.id);
        if (!content) continue;
        
        // 将书籍正文切分为约 500 字的大段，极大减少请求次数
        const chunks = splitIntoChunks(content, 600); 
        setChunkProgress({ current: 0, total: chunks.length });
        
        for (let i = 0; i < chunks.length; i++) {
          if (stopSignal.current) break;
          setChunkProgress(prev => ({ ...prev, current: i + 1 }));
          
          let success = false;
          let retries = 0;

          while (!success && retries < 2 && !stopSignal.current) {
            try {
              const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
              const response = await ai.models.generateContent({
                model: "gemini-2.5-flash-preview-tts",
                contents: { parts: [{ text: chunks[i] }] },
                config: {
                  responseModalities: [Modality.AUDIO],
                  speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
                },
              });

              const base64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
              if (base64) {
                await CloudService.saveAudioCache(book.id, i, 'Kore', base64);
                success = true;
              }
            } catch (err: any) {
              if (err.message?.includes('429')) {
                addLog(`触碰频率天花板，静默等待 15s...`, "info");
                await new Promise(r => setTimeout(r, 15000));
                retries++;
              } else {
                addLog(`段落错误: ${err.message}`, "error");
                break;
              }
            }
          }
          // 既然是长段落，每段请求后等待 7 秒是安全的，且总效率极高
          await new Promise(r => setTimeout(r, 7000));
        }
        addLog(`加速完成: 《${book.title}》已生成`, "success");
      } catch (e: any) { addLog(`跳过书籍: ${e.message}`, "error"); }
    }
    
    setCurrentWeavingId(null);
    setIsBulkProcessing(false);
    refreshCloudLibrary();
  };

  const handleStop = () => { stopSignal.current = true; addLog("正在停止...", "info"); };

  return (
    <div className="pb-48 space-y-12 animate-in fade-in duration-1000">
      <header className="px-8 pt-16 flex justify-between items-end">
        <div>
          <h2 className="text-[32px] font-[100] text-white tracking-tighter">内容实验室</h2>
          <div className="flex items-center gap-2 mt-2">
            <div className={`w-1.5 h-1.5 rounded-full ${cloudStatus.ok ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`}></div>
            <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{cloudStatus.msg}</p>
          </div>
        </div>
        <button onClick={refreshCloudLibrary} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 active:scale-90 transition-all">
           <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.85.83 6.72 2.25M21 3v6h-6"/></svg>
        </button>
      </header>

      {/* Step 1 */}
      <section className="mx-8 bg-white/5 border border-white/10 rounded-[2.5rem] p-8 space-y-6">
        <h3 className="text-[10px] text-white/30 font-bold uppercase tracking-[0.4em]">Step 1: 写入云端 (5x 并行加速)</h3>
        <div className="space-y-4">
          <input type="password" placeholder="Notion Token" value={notionToken} onChange={e => setNotionToken(e.target.value)} className="w-full bg-black/20 border border-white/5 rounded-2xl px-6 py-4 text-xs text-white/80" />
          <input type="text" placeholder="Database ID" value={notionPageId} onChange={e => setNotionPageId(e.target.value)} className="w-full bg-black/20 border border-white/5 rounded-2xl px-6 py-4 text-xs text-white/80" />
        </div>
        <div className="flex gap-4">
          <button onClick={handleNotionScan} disabled={isScanningNotion} className="flex-1 py-4 bg-white/5 border border-white/10 rounded-full text-[10px] text-white/60 font-bold uppercase tracking-widest active:scale-95">探测清单</button>
          <button onClick={handleSyncToSupabase} disabled={isSyncingText} className="flex-[1.5] py-4 bg-indigo-600 text-white rounded-full text-[10px] font-bold uppercase tracking-widest active:scale-95">
            {isSyncingText ? `并行同步中 ${syncProgress.current}/${syncProgress.total}` : "启动闪电同步"}
          </button>
        </div>
      </section>

      {/* Step 2 */}
      <section className="mx-8 bg-indigo-500/5 border border-indigo-500/10 rounded-[2.5rem] p-8 space-y-8">
        <div className="flex justify-between items-center">
            <h3 className="text-[10px] text-white/30 font-bold uppercase tracking-[0.4em]">Step 2: 织造音频 (段落合并模式)</h3>
            {isBulkProcessing && <button onClick={handleStop} className="text-[9px] text-red-400 font-bold tracking-widest">停止</button>}
        </div>
        
        <button onClick={handleBulkWeave} disabled={isBulkProcessing || cloudBooks.length === 0} className="w-full py-6 bg-indigo-600 text-white rounded-full text-[12px] font-bold uppercase tracking-[0.5em] active:scale-95 shadow-xl shadow-indigo-500/20">
          {isBulkProcessing ? "正在织造..." : "启动织造引擎"}
        </button>

        <div className="grid gap-3 max-h-[300px] overflow-y-auto no-scrollbar">
          {cloudBooks.map(book => (
            <div key={book.id} className={`flex items-center justify-between p-6 bg-white/[0.02] border rounded-3xl transition-all ${currentWeavingId === book.id ? 'border-indigo-500' : 'border-white/5'}`}>
              <div className="flex flex-col gap-1">
                <span className="text-[14px] text-white/80 font-medium truncate max-w-[150px]">{book.title}</span>
                <div className="flex gap-3">
                  <span className="text-[8px] uppercase tracking-widest font-bold text-emerald-400">底稿已对齐</span>
                  <span className={`text-[8px] uppercase tracking-widest font-bold ${book.hasAudio ? 'text-indigo-400' : 'text-white/10'}`}>{book.hasAudio ? "资产已生成" : "待处理"}</span>
                </div>
              </div>
              {currentWeavingId === book.id && <span className="text-[10px] font-mono text-indigo-400">{chunkProgress.current}/{chunkProgress.total} 段</span>}
            </div>
          ))}
        </div>
      </section>

      {/* 日志 */}
      <section className="mx-8 bg-black/40 rounded-[2rem] p-6 border border-white/5 font-mono max-h-40 overflow-y-auto no-scrollbar">
        {importLog.map((log, i) => (
          <p key={i} className={`text-[9px] mb-1 tracking-widest ${log.type === 'success' ? 'text-emerald-400' : log.type === 'error' ? 'text-red-400' : 'text-white/20'}`}>
            [{new Date().toLocaleTimeString([], {hour12: false})}] {log.msg}
          </p>
        ))}
      </section>
    </div>
  );
};

export default Admin;
