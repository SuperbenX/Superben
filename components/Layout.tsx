
import React from 'react';
import { Tab } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const navItems: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: '地平线', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M4 12H20" stroke="currentColor" strokeWidth="1.2"/><path d="M12 4C12 4 15 8 15 12C15 16 12 20 12 20" stroke="currentColor" strokeWidth="1.2" opacity="0.3"/></svg> },
    { id: 'library', label: '涟漪', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.2" strokeDasharray="2 4"/><circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.2"/></svg> },
    { id: 'deep_dive', label: '深潜', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.2" opacity="0.2"/><path d="M12 8V12L14 14" stroke="currentColor" strokeWidth="1.2" opacity="0.5"/><path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12" stroke="currentColor" strokeWidth="1.2"/></svg> },
    { id: 'qa', label: '私语', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M8 9H16M8 13H13" stroke="currentColor" strokeWidth="1.2" opacity="0.6"/><rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.2"/></svg> },
    { id: 'settings', label: '焦点', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="5" y="5" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.2" opacity="0.3"/><circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="1.2"/></svg> }
  ];

  return (
    <div className="min-h-screen flex flex-col relative transition-colors duration-[1000ms] bg-[#0f0f10]">
      <main className="flex-1 w-full max-w-md mx-auto relative z-10 scroll-container overflow-y-auto overflow-x-hidden">
        {children}
      </main>

      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-sm flex justify-around items-center backdrop-blur-3xl bg-[#1a1a1c]/40 border border-white/5 py-4 rounded-[2.5rem] z-[110] transition-all duration-[800ms] shadow-2xl text-[#555555]">
        {navItems.map(item => (
          <button 
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center gap-1 transition-all duration-500 ${activeTab === item.id ? 'text-white scale-110' : ''}`}
          >
            {item.icon}
            <span className={`text-[8px] font-bold tracking-[0.4em] uppercase transition-opacity duration-500 ${activeTab === item.id ? 'opacity-100' : 'opacity-0'}`}>
                {item.label}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Layout;
