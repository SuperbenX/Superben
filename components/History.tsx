
import React, { useState, useEffect } from 'react';
import { PlayLog } from '../types';
import { getLogs, deleteLog } from '../services/storage';

const History: React.FC = () => {
  const [logs, setLogs] = useState<PlayLog[]>([]);

  useEffect(() => {
    setLogs(getLogs());
  }, []);

  const handleDelete = (id: string) => {
    deleteLog(id);
    setLogs(getLogs());
  };

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-[#555555] animate-in fade-in">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mb-6 opacity-30"><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="10"/></svg>
        <p className="text-sm font-bold tracking-widest uppercase text-[#666666]">故纸堆里暂无哈欠</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in pb-12">
      <div className="flex flex-col mb-10">
        <h2 className="text-2xl font-bold text-[#bbbbbb] tracking-tighter">故纸堆里的哈欠</h2>
        <div className="text-[9px] font-bold text-[#666666] uppercase tracking-[0.2em] mt-1">
            过去 {logs.length} 次无聊的记录
        </div>
      </div>
      
      <div className="space-y-3">
        {logs.map((log) => (
          <div key={log.id} className="bg-[#242427] border border-white/5 rounded-2xl p-5 transition-all shadow-sm">
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <h3 className="text-xs font-bold text-[#aaaaaa] truncate">{log.audioTitle}</h3>
                <p className="text-[9px] text-[#555555] font-bold uppercase tracking-wider mt-1">
                  {new Date(log.playTime).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <button 
                onClick={() => handleDelete(log.id)}
                className="text-[#444444] hover:text-red-900/50 p-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default History;