import React from 'react';
import { Language, ScreenTab } from '../types';

interface HeaderProps {
  currentLanguage: Language;
  onLanguageChange: (lang: Language) => void;
  activeTab: ScreenTab;
  onTabChange: (tab: ScreenTab) => void;
  onOpenWhatsApp: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentLanguage,
  onLanguageChange,
  activeTab,
  onTabChange,
  onOpenWhatsApp,
}) => {
  const isOwnerPro = activeTab === 'owner-pro';

  if (isOwnerPro) {
    return (
      <header className="fixed top-0 w-full z-50 bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/10 text-[#f5f5f5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex items-center justify-between h-16">
          <div 
            className="flex items-center gap-2.5 cursor-pointer"
            onClick={() => onTabChange('explore')}
            id="owner-pro-brand"
          >
            <span className="material-symbols-outlined text-[#ff4e00] text-[28px]">agriculture</span>
            <span className="font-display text-xl tracking-[0.15em] text-[#f5f5f5] uppercase">
              GoMate <span className="text-[#ff4e00] text-sm tracking-[0.2em] font-sans font-bold">PRO</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-4">
            <button
              onClick={() => onTabChange('owner-pro')}
              className="bg-[#ff4e00] text-black font-bold uppercase tracking-wider rounded px-3.5 py-1.5 text-xs transition-all"
            >
              Fleet Management
            </button>
            <button
              onClick={() => onTabChange('bookings')}
              className="text-xs uppercase tracking-wider font-semibold text-[#a3a3a3] hover:text-[#f5f5f5] transition-colors px-3 py-1.5"
            >
              Live Dispatches
            </button>
            <button
              onClick={() => onTabChange('estimator')}
              className="text-xs uppercase tracking-wider font-semibold text-[#a3a3a3] hover:text-[#f5f5f5] transition-colors px-3 py-1.5"
            >
              Rate Estimator
            </button>
            <button
              onClick={() => onTabChange('explore')}
              className="text-xs uppercase tracking-wider font-semibold text-[#a3a3a3] hover:text-[#f5f5f5] transition-colors px-3 py-1.5"
            >
              Customer View
            </button>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onOpenWhatsApp}
              className="hidden sm:flex items-center gap-1.5 bg-[#1a1a1a] text-[#ff4e00] border border-[#ff4e00]/40 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider hover:bg-[#ff4e00] hover:text-black transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">chat</span>
              WhatsApp Bot
            </button>
            <button 
              onClick={() => onTabChange('explore')}
              className="px-3 py-1.5 rounded border border-white/20 text-xs font-bold uppercase tracking-wider text-[#f5f5f5] hover:bg-white/10 transition-colors"
              title="Return to Customer App"
            >
              Exit Pro
            </button>
            <div className="w-8 h-8 rounded-full border border-white/20 bg-[#1a1a1a] flex items-center justify-center text-[#ff4e00]">
              <span className="material-symbols-outlined text-[18px]">person</span>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-xl pt-1 border-b border-white/10 text-[#f5f5f5]">
      <div className="max-w-xl mx-auto px-4 py-2 flex flex-col gap-2">
        <div className="flex items-center justify-between h-12">
          {/* Logo & Category */}
          <div 
            className="flex items-center gap-2.5 cursor-pointer"
            onClick={() => onTabChange('explore')}
            id="brand-logo"
          >
            <span className="font-display text-2xl tracking-[0.15em] text-[#f5f5f5] uppercase">GoMate</span>
            <span className="text-[10px] bg-[#ff4e00] text-black px-2 py-0.5 font-bold uppercase tracking-widest">Rental</span>
          </div>

          {/* Top Actions */}
          <div className="flex items-center gap-2">
            <button
              aria-label="WhatsApp Booking"
              className="w-9 h-9 flex items-center justify-center bg-[#ff4e00] text-black font-bold rounded hover:opacity-90 active:scale-95 transition-all shadow-sm"
              onClick={onOpenWhatsApp}
              id="header-whatsapp-btn"
            >
              <span className="material-symbols-outlined text-[20px]">chat</span>
            </button>
            <button
              aria-label="User Profile and Owner Pro"
              className="w-9 h-9 border border-white/20 rounded bg-[#1a1a1a] flex items-center justify-center text-[#f5f5f5] hover:bg-white/10 active:scale-95 transition-all"
              onClick={() => onTabChange('owner-pro')}
              id="header-profile-btn"
              title="Go to Owner Pro Dashboard"
            >
              <span className="material-symbols-outlined text-[18px]">person</span>
            </button>
          </div>
        </div>

        {/* Multilingual Selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          <button
            onClick={() => onLanguageChange('en')}
            className={`px-3 py-1 text-[10px] uppercase tracking-wider font-semibold shrink-0 transition-colors border ${
              currentLanguage === 'en'
                ? 'bg-[#ff4e00] text-black border-[#ff4e00]'
                : 'bg-[#141414] text-[#a3a3a3] border-white/10 hover:text-white'
            }`}
          >
            English
          </button>
          <button
            onClick={() => onLanguageChange('hi')}
            className={`px-3 py-1 text-[10px] uppercase tracking-wider font-semibold shrink-0 transition-colors border ${
              currentLanguage === 'hi'
                ? 'bg-[#ff4e00] text-black border-[#ff4e00]'
                : 'bg-[#141414] text-[#a3a3a3] border-white/10 hover:text-white'
            }`}
          >
            हिंदी
          </button>
          <button
            onClick={() => onLanguageChange('mr')}
            className={`px-3 py-1 text-[10px] uppercase tracking-wider font-semibold shrink-0 transition-colors border ${
              currentLanguage === 'mr'
                ? 'bg-[#ff4e00] text-black border-[#ff4e00]'
                : 'bg-[#141414] text-[#a3a3a3] border-white/10 hover:text-white'
            }`}
          >
            मराठी
          </button>
          <button
            onClick={() => onLanguageChange('kn')}
            className={`px-3 py-1 text-[10px] uppercase tracking-wider font-semibold shrink-0 transition-colors border ${
              currentLanguage === 'kn'
                ? 'bg-[#ff4e00] text-black border-[#ff4e00]'
                : 'bg-[#141414] text-[#a3a3a3] border-white/10 hover:text-white'
            }`}
          >
            ಕನ್ನಡ
          </button>
        </div>
      </div>
    </header>
  );
};
