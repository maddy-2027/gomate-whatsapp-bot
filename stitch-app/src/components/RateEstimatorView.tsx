import React, { useState } from 'react';
import { ESTIMATOR_MACHINERY, WHATSAPP_NUMBER } from '../data/mockData';
import { MachineryItem, ScreenTab } from '../types';

interface RateEstimatorViewProps {
  onNavigateTab: (tab: ScreenTab) => void;
  onOpenWhatsAppBooking: (machineName?: string, hours?: number, cost?: number) => void;
  preselectedMachineName?: string;
}

export const RateEstimatorView: React.FC<RateEstimatorViewProps> = ({
  onNavigateTab,
  onOpenWhatsAppBooking,
  preselectedMachineName,
}) => {
  const [category, setCategory] = useState<'farm' | 'jcb' | 'transport'>('farm');
  const [hours, setHours] = useState<number>(2);
  const [selectedId, setSelectedId] = useState<string>('f1');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const machineryList = ESTIMATOR_MACHINERY[category];
  const selectedMachine: MachineryItem =
    machineryList.find((m) => m.id === selectedId) || machineryList[0];

  const baseRateTotal = selectedMachine.rate * hours;
  const platformFee = 49;
  const grandTotal = baseRateTotal + platformFee;

  const handleCategorySwitch = (cat: 'farm' | 'jcb' | 'transport') => {
    setCategory(cat);
    setSelectedId(ESTIMATOR_MACHINERY[cat][0].id);
  };

  const handleBookOnWhatsApp = () => {
    onOpenWhatsAppBooking(selectedMachine.name, hours, grandTotal);
    setToastMessage(`Prepared WhatsApp booking for ${selectedMachine.name} (${hours} hrs, ₹${grandTotal})`);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  return (
    <div className="flex flex-col w-full pb-24 text-[#f5f5f5]">
      {/* Header */}
      <div className="flex flex-col gap-1 mb-4">
        <span className="text-xs text-[#ff4e00] uppercase tracking-wider font-bold">
          Instant Rate Estimator
        </span>
        <h2 className="text-2xl uppercase tracking-wide font-display text-[#f5f5f5]">
          Transparent Equipment Pricing
        </h2>
        <p className="text-xs text-[#a3a3a3] leading-relaxed">
          Select equipment and hours to calculate your exact rental cost with zero hidden fees.
        </p>
      </div>

      {/* Category Pills */}
      <div className="flex bg-[#141414] border border-white/10 p-1 rounded-xl mb-4 gap-1">
        <button
          onClick={() => handleCategorySwitch('farm')}
          className={`flex-1 py-2 px-3 rounded text-xs font-bold uppercase tracking-wider transition-all ${
            category === 'farm'
              ? 'bg-[#ff4e00] text-black shadow-xs'
              : 'text-[#a3a3a3] hover:text-[#f5f5f5]'
          }`}
          id="cat-farm"
        >
          Farm Machinery
        </button>
        <button
          onClick={() => handleCategorySwitch('jcb')}
          className={`flex-1 py-2 px-3 rounded text-xs font-bold uppercase tracking-wider transition-all ${
            category === 'jcb'
              ? 'bg-[#ff4e00] text-black shadow-xs'
              : 'text-[#a3a3a3] hover:text-[#f5f5f5]'
          }`}
          id="cat-jcb"
        >
          Earthmoving
        </button>
        <button
          onClick={() => handleCategorySwitch('transport')}
          className={`flex-1 py-2 px-3 rounded text-xs font-bold uppercase tracking-wider transition-all ${
            category === 'transport'
              ? 'bg-[#ff4e00] text-black shadow-xs'
              : 'text-[#a3a3a3] hover:text-[#f5f5f5]'
          }`}
          id="cat-transport"
        >
          Transport
        </button>
      </div>

      {/* Equipment List */}
      <div className="flex flex-col gap-2.5 mb-4" id="equipment-list">
        {machineryList.map((item) => {
          const isSelected = item.id === selectedMachine.id;
          return (
            <div
              key={item.id}
              onClick={() => setSelectedId(item.id)}
              className={`rounded-xl p-3.5 flex items-center justify-between cursor-pointer transition-all border ${
                isSelected
                  ? 'bg-[#1a1a1a] border-[#ff4e00] ring-1 ring-[#ff4e00]/50'
                  : 'bg-[#141414] border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${
                  isSelected ? 'bg-[#ff4e00] text-black border-[#ff4e00]' : 'bg-[#222222] text-[#ff4e00] border-white/10'
                }`}>
                  <span className="material-symbols-outlined text-[22px]">{item.iconName}</span>
                </div>
                <div>
                  <p className="font-display text-base text-[#f5f5f5] uppercase tracking-wide">{item.name}</p>
                  <p className="text-xs text-[#a3a3a3]">{item.desc}</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-base font-bold text-[#ff4e00] font-mono">₹{item.rate}</span>
                <span className="text-[10px] uppercase tracking-wider text-[#a3a3a3] block font-mono">/hr</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Required Hours Slider */}
      <div className="bg-[#141414] rounded-2xl p-4 border border-white/10 mb-4">
        <div className="flex justify-between items-center mb-3">
          <span className="font-display text-sm text-[#f5f5f5] uppercase tracking-wider">Required Hours</span>
          <span className="text-base text-[#ff4e00] font-bold font-mono">
            {hours} {hours === 1 ? 'Hour' : 'Hours'}
          </span>
        </div>

        <input
          type="range"
          min="1"
          max="8"
          step="1"
          value={hours}
          onChange={(e) => setHours(parseInt(e.target.value, 10))}
          className="w-full h-2 bg-[#222222] rounded-lg appearance-none cursor-pointer accent-[#ff4e00]"
          id="hours-slider"
        />

        <div className="flex justify-between text-[11px] text-[#a3a3a3] mt-2 font-mono">
          <span>1 hr</span>
          <span>4 hrs</span>
          <span>8 hrs (Full Day)</span>
        </div>
      </div>

      {/* Itemized Calculation Summary Card */}
      <div className="bg-[#141414] rounded-2xl p-4 border border-white/10 mb-4 flex flex-col gap-3 overflow-hidden">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-[#ff4e00] text-black font-bold flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-sm">schedule</span>
            </span>
            <div>
              <p className="font-display text-sm text-[#f5f5f5] uppercase tracking-wide">{selectedMachine.name}</p>
              <p className="text-xs text-[#a3a3a3] font-mono">
                ₹{selectedMachine.rate}/hr × {hours} hr{hours > 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <span className="text-base text-[#f5f5f5] font-bold font-mono">₹{baseRateTotal}</span>
        </div>

        <div className="flex items-center justify-between py-1 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-[#10b981]/20 text-[#10b981] flex items-center justify-center">
              <span
                className="material-symbols-outlined text-[13px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                check
              </span>
            </span>
            <span className="text-[#f5f5f5] font-medium">Diesel Fuel Included</span>
          </div>
          <span className="text-[#10b981] font-semibold uppercase tracking-wider text-[11px]">Free</span>
        </div>

        <div className="flex items-center justify-between py-1 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-[#222222] text-[#ff4e00] flex items-center justify-center">
              <span className="material-symbols-outlined text-[13px]">shield</span>
            </span>
            <span className="text-[#f5f5f5] font-medium">Platform Protection Fee</span>
          </div>
          <span className="text-[#f5f5f5] font-mono font-semibold">₹49</span>
        </div>

        {/* Total Footer Banner */}
        <div className="pt-3 bg-[#1a1a1a] -mx-4 -mb-4 p-4 rounded-b-2xl flex items-center justify-between border-t border-white/10">
          <div>
            <p className="text-[10px] text-[#a3a3a3] uppercase font-bold tracking-widest">
              Total Estimated Cost
            </p>
            <p className="text-xs text-[#ff4e00] font-medium flex items-center gap-1 mt-0.5 font-mono">
              <span
                className="material-symbols-outlined text-[14px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                bolt
              </span>
              Pay operator on arrival
            </p>
          </div>
          <span className="font-display text-[#ff4e00] text-3xl font-bold font-mono">
            ₹{grandTotal}
          </span>
        </div>
      </div>

      {/* 0% Commission Badge */}
      <div className="bg-[#ff4e00]/10 rounded-xl p-3 flex items-center gap-3 mb-5 border border-[#ff4e00]/30">
        <span className="material-symbols-outlined text-[#ff4e00] text-2xl shrink-0">
          verified_user
        </span>
        <p className="text-xs text-[#f5f5f5] font-light leading-relaxed">
          <strong className="text-[#ff4e00] font-bold">0% Broker Commission</strong> — You pay the operator directly upon arrival with transparent hourly rates.
        </p>
      </div>

      {/* WhatsApp Booking CTA */}
      <button
        onClick={handleBookOnWhatsApp}
        className="w-full py-4 bg-[#ff4e00] hover:bg-[#e04500] text-black rounded text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98]"
        id="book-this-machine-whatsapp-btn"
      >
        <span className="material-symbols-outlined text-xl">chat</span>
        <span>Book this Machine on WhatsApp →</span>
      </button>

      {/* Toast popup */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-[#141414] text-white px-4 py-2.5 rounded text-xs shadow-xl z-50 animate-fade-in flex items-center gap-2 border border-[#ff4e00]">
          <span className="material-symbols-outlined text-sm text-[#ff4e00]">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
