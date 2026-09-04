import React from 'react';
import { ScreenTab } from '../types';

interface BottomNavProps {
  activeTab: ScreenTab;
  onTabChange: (tab: ScreenTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-xl border-t border-white/10 text-[#f5f5f5]">
      <div className="max-w-xl mx-auto flex justify-around items-center h-16 px-4">
        {/* Explore Tab */}
        <button
          onClick={() => onTabChange('explore')}
          className={`flex flex-col items-center justify-center gap-1 w-16 h-12 transition-all ${
            activeTab === 'explore'
              ? 'text-[#ff4e00] font-bold'
              : 'text-[#a3a3a3] hover:text-[#f5f5f5]'
          }`}
          id="nav-tab-explore"
        >
          <span 
            className={`material-symbols-outlined text-[22px] ${activeTab === 'explore' ? 'fill-current text-[#ff4e00]' : ''}`}
          >
            agriculture
          </span>
          <span className="text-[10px] uppercase tracking-wider font-semibold leading-none">Explore</span>
        </button>

        {/* Bookings / Live Tracker Tab */}
        <button
          onClick={() => onTabChange('bookings')}
          className={`flex flex-col items-center justify-center gap-1 w-16 h-12 transition-all relative ${
            activeTab === 'bookings'
              ? 'text-[#ff4e00] font-bold'
              : 'text-[#a3a3a3] hover:text-[#f5f5f5]'
          }`}
          id="nav-tab-bookings"
        >
          <span className="relative">
            <span 
              className={`material-symbols-outlined text-[22px] ${activeTab === 'bookings' ? 'fill-current text-[#ff4e00]' : ''}`}
            >
              assignment
            </span>
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#ff4e00] rounded-full animate-ping"></span>
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#ff4e00] rounded-full"></span>
          </span>
          <span className="text-[10px] uppercase tracking-wider font-semibold leading-none">Tracker</span>
        </button>

        {/* Rate Estimator Tab */}
        <button
          onClick={() => onTabChange('estimator')}
          className={`flex flex-col items-center justify-center gap-1 w-16 h-12 transition-all ${
            activeTab === 'estimator'
              ? 'text-[#ff4e00] font-bold'
              : 'text-[#a3a3a3] hover:text-[#f5f5f5]'
          }`}
          id="nav-tab-estimator"
        >
          <span 
            className={`material-symbols-outlined text-[22px] ${activeTab === 'estimator' ? 'fill-current text-[#ff4e00]' : ''}`}
          >
            calculate
          </span>
          <span className="text-[10px] uppercase tracking-wider font-semibold leading-none">Estimator</span>
        </button>

        {/* Owner Pro / Profile Tab */}
        <button
          onClick={() => onTabChange('owner-pro')}
          className={`flex flex-col items-center justify-center gap-1 w-16 h-12 transition-all ${
            activeTab === 'owner-pro'
              ? 'text-[#ff4e00] font-bold'
              : 'text-[#a3a3a3] hover:text-[#f5f5f5]'
          }`}
          id="nav-tab-profile"
        >
          <span 
            className={`material-symbols-outlined text-[22px] ${activeTab === 'owner-pro' ? 'fill-current text-[#ff4e00]' : ''}`}
          >
            account_circle
          </span>
          <span className="text-[10px] uppercase tracking-wider font-semibold leading-none">Owner Pro</span>
        </button>
      </div>
    </nav>
  );
};
