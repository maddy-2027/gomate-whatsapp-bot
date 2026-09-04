import React, { useState } from 'react';
import { OPERATOR_IMAGE, WHATSAPP_NUMBER } from '../data/mockData';
import { ScreenTab } from '../types';

interface LiveTrackerViewProps {
  onNavigateTab: (tab: ScreenTab) => void;
  onOpenWhatsAppChat?: () => void;
}

export const LiveTrackerView: React.FC<LiveTrackerViewProps> = ({
  onNavigateTab,
  onOpenWhatsAppChat,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(2);
  const [callingState, setCallingState] = useState<boolean>(false);
  const [etaMinutes, setEtaMinutes] = useState<number>(18);

  const handleCall = () => {
    setCallingState(true);
    setTimeout(() => {
      setCallingState(false);
    }, 4000);
  };

  const advanceStep = () => {
    if (currentStep < 4) {
      const next = currentStep + 1;
      setCurrentStep(next);
      if (next === 3) setEtaMinutes(0);
      if (next === 4) onNavigateTab('receipt');
    }
  };

  return (
    <div className="flex flex-col w-full gap-5 pb-24 text-[#f5f5f5]">
      {/* Top Context Bar */}
      <div className="flex items-center justify-between bg-[#141414] p-4 rounded-xl border border-white/10 shadow-xs">
        <div className="flex flex-col">
          <span className="text-[10px] text-[#a3a3a3] uppercase tracking-[0.2em] font-bold">
            Live Dispatch Tracker
          </span>
          <span className="text-xl font-display tracking-widest text-[#ff4e00] font-mono">GM-4102</span>
        </div>
        <div className="flex flex-col items-end text-right">
          <span className="text-[10px] text-[#a3a3a3] uppercase tracking-wider">Customer</span>
          <span className="text-sm font-bold text-[#f5f5f5]">Ramesh Patil</span>
          <span className="text-xs text-[#a3a3a3] font-mono">Shegaon, Jath</span>
        </div>
      </div>

      {/* Top Status Card: En Route Banner & Driver Details */}
      <div className="flex flex-col bg-[#141414] text-[#f5f5f5] p-5 rounded-2xl border border-[#ff4e00]/40 shadow-lg gap-4 relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-[#ff4e00]/10 rounded-full blur-xl pointer-events-none"></div>

        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff4e00] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#ff4e00]"></span>
            </span>
            <span className="text-xs font-bold tracking-widest text-[#ff4e00] uppercase font-mono">
              {currentStep === 1 && 'Booking Requested'}
              {currentStep === 2 && 'Tractor En Route'}
              {currentStep === 3 && 'Tillage Work In Progress'}
              {currentStep === 4 && 'Work Completed & Billed'}
            </span>
          </div>
          <span className="bg-[#ff4e00] text-black px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider shadow-xs">
            {currentStep === 2 ? `Arriving in ${etaMinutes} mins` : currentStep === 3 ? 'Active in Field' : 'Completed'}
          </span>
        </div>

        {/* Driver Card Inside Status */}
        <div className="bg-[#1a1a1a] p-4 rounded-xl flex items-center justify-between border border-white/10 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#222222] flex items-center justify-center text-white font-bold shadow-inner overflow-hidden shrink-0 border-2 border-white/20">
              <img
                className="w-full h-full object-cover"
                src={OPERATOR_IMAGE}
                alt="Tukaram Patil portrait"
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-display text-base text-white uppercase tracking-wide">Tukaram Patil</span>
                <span className="bg-[#ff4e00] text-black text-[10px] px-1.5 py-0.5 rounded flex items-center gap-0.5 font-bold uppercase">
                  <span
                    className="material-symbols-outlined text-[12px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    star
                  </span>{' '}
                  4.9
                </span>
              </div>
              <span className="text-xs text-[#a3a3a3] mt-0.5 font-light">
                Mahindra 575 DI • Agri Tractor
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-[#222222] border border-white/10 px-2.5 py-1 rounded shrink-0">
            <span className="material-symbols-outlined text-[16px] text-[#ff4e00]">verified</span>
            <span className="text-[10px] text-white font-bold uppercase tracking-wider">Verified</span>
          </div>
        </div>

        {/* Simulator controls helper */}
        <div className="flex items-center justify-between pt-1 text-xs text-[#a3a3a3] border-t border-white/10">
          <span className="font-mono text-[11px]">Taluka Village: Shegaon (Cluster 4)</span>
          <button
            onClick={advanceStep}
            className="text-[10px] bg-[#ff4e00]/15 hover:bg-[#ff4e00] text-[#ff4e00] hover:text-black border border-[#ff4e00]/30 px-2 py-0.5 rounded font-bold uppercase tracking-wider transition-colors"
          >
            {currentStep < 4 ? 'Simulate Next Step →' : 'View Final Invoice →'}
          </button>
        </div>
      </div>

      {/* Calling Notification Modal/Toast */}
      {callingState && (
        <div className="bg-[#141414] text-white p-4 rounded-xl flex items-center justify-between shadow-xl border border-[#ff4e00] animate-fade-in">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#ff4e00] text-2xl animate-bounce">
              call
            </span>
            <div>
              <p className="text-sm font-bold uppercase tracking-wide">Calling Tukaram Patil...</p>
              <p className="text-xs text-[#a3a3a3] font-mono">+91 98765 43210 • Jath Hub Operator</p>
            </div>
          </div>
          <button
            onClick={() => setCallingState(false)}
            className="text-xs bg-red-600 px-3 py-1 rounded font-bold uppercase tracking-wider hover:bg-red-700"
          >
            End
          </button>
        </div>
      )}

      {/* Interactive Timeline */}
      <div className="bg-[#141414] p-5 rounded-2xl border border-white/10 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="font-display text-base text-[#f5f5f5] uppercase tracking-wider">Dispatch Milestone</span>
          <span className="text-xs text-[#ff4e00] font-bold bg-[#ff4e00]/15 border border-[#ff4e00]/30 px-2.5 py-0.5 rounded font-mono">
            Step {currentStep} of 4
          </span>
        </div>

        <div className="flex flex-col relative pl-6 gap-6 pt-2">
          {/* Vertical Connecting Line */}
          <div className="absolute left-2.5 top-3 bottom-3 w-0.5 bg-white/10"></div>

          {/* Step 1 */}
          <div className="flex items-start relative gap-3">
            <div className="absolute -left-6 w-5 h-5 rounded-full bg-[#ff4e00] text-black flex items-center justify-center font-bold shadow-xs">
              <span className="material-symbols-outlined text-[14px]">check</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-[#f5f5f5] uppercase tracking-wide">Requested on WhatsApp</span>
              <span className="text-[11px] text-[#a3a3a3] font-mono">Completed at 08:30 AM</span>
            </div>
          </div>

          {/* Step 2 (Active in initial screenshot) */}
          <div className="flex items-start relative gap-3">
            {currentStep >= 2 ? (
              currentStep === 2 ? (
                <div className="absolute -left-7 w-7 h-7 rounded-full bg-[#ff4e00]/20 border-2 border-[#ff4e00] flex items-center justify-center animate-pulse">
                  <div className="w-3 h-3 rounded-full bg-[#ff4e00]"></div>
                </div>
              ) : (
                <div className="absolute -left-6 w-5 h-5 rounded-full bg-[#ff4e00] text-black flex items-center justify-center font-bold shadow-xs">
                  <span className="material-symbols-outlined text-[14px]">check</span>
                </div>
              )
            ) : (
              <div className="absolute -left-6 w-5 h-5 rounded-full bg-[#222222] text-[#a3a3a3] flex items-center justify-center text-xs font-bold border border-white/10">
                2
              </div>
            )}
            <div className="flex flex-col bg-[#1a1a1a] p-3 rounded-xl w-full border border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#ff4e00] uppercase tracking-wide">Operator Dispatched</span>
                <span className="text-[10px] text-[#ff4e00] font-bold uppercase tracking-wider bg-[#ff4e00]/15 border border-[#ff4e00]/30 px-2 py-0.5 rounded">
                  {currentStep === 2 ? 'In Progress' : 'Completed'}
                </span>
              </div>
              <span className="text-xs text-[#a3a3a3] mt-0.5">
                Machine is en route from Jath hub (PIN 416404)
              </span>
            </div>
          </div>

          {/* Step 3 */}
          <div className={`flex items-start relative gap-3 ${currentStep < 3 ? 'opacity-40' : ''}`}>
            {currentStep >= 3 ? (
              currentStep === 3 ? (
                <div className="absolute -left-7 w-7 h-7 rounded-full bg-[#ff4e00]/20 border-2 border-[#ff4e00] flex items-center justify-center animate-pulse">
                  <div className="w-3 h-3 rounded-full bg-[#ff4e00]"></div>
                </div>
              ) : (
                <div className="absolute -left-6 w-5 h-5 rounded-full bg-[#ff4e00] text-black flex items-center justify-center font-bold shadow-xs">
                  <span className="material-symbols-outlined text-[14px]">check</span>
                </div>
              )
            ) : (
              <div className="absolute -left-6 w-5 h-5 rounded-full bg-[#222222] text-[#a3a3a3] flex items-center justify-center text-xs font-bold border border-white/10">
                3
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-xs font-bold text-[#f5f5f5] uppercase tracking-wide">Hourly Work Started</span>
              <span className="text-[11px] text-[#a3a3a3]">
                {currentStep >= 3 ? 'Tractor running in farmer plot' : 'Pending arrival'}
              </span>
            </div>
          </div>

          {/* Step 4 */}
          <div className={`flex items-start relative gap-3 ${currentStep < 4 ? 'opacity-40' : ''}`}>
            {currentStep === 4 ? (
              <div className="absolute -left-6 w-5 h-5 rounded-full bg-[#ff4e00] text-black flex items-center justify-center font-bold shadow-xs">
                <span className="material-symbols-outlined text-[14px]">check</span>
              </div>
            ) : (
              <div className="absolute -left-6 w-5 h-5 rounded-full bg-[#222222] text-[#a3a3a3] flex items-center justify-center text-xs font-bold border border-white/10">
                4
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-xs font-bold text-[#f5f5f5] uppercase tracking-wide">Work Completed &amp; Digital Receipt</span>
              <span className="text-[11px] text-[#a3a3a3]">
                {currentStep === 4 ? 'Payment finalized & Invoice ready' : 'Pending execution'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Hourly Rental Meter & Cost Breakdown */}
      <div className="bg-[#141414] p-5 rounded-2xl border border-white/10 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="font-display text-base text-[#f5f5f5] uppercase tracking-wider">Cost Breakdown</span>
          <span className="bg-[#222222] border border-white/10 text-[#ff4e00] text-xs px-2.5 py-1 rounded font-bold uppercase tracking-wider font-mono">
            Hourly Rate
          </span>
        </div>

        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-xs text-[#a3a3a3]">
            <span>Tractor Rental Rate (Mahindra 575 DI)</span>
            <span className="font-bold text-[#f5f5f5] font-mono">₹450 / hr</span>
          </div>
          <div className="flex items-center justify-between text-xs text-[#a3a3a3]">
            <span>Estimated Duration</span>
            <span className="font-bold text-[#f5f5f5] font-mono">2 hrs</span>
          </div>
          <div className="flex items-center justify-between text-xs text-[#a3a3a3]">
            <span>Flat Platform &amp; Logistics Fee</span>
            <span className="font-bold text-[#f5f5f5] font-mono">₹49</span>
          </div>

          <div className="w-full h-px bg-white/10 my-1"></div>

          <div className="flex items-center justify-between bg-[#1a1a1a] p-3.5 rounded-xl border border-[#ff4e00]/30">
            <div className="flex flex-col">
              <span className="text-xs font-bold uppercase tracking-wider text-[#f5f5f5]">Total Estimated</span>
              <span className="text-[11px] text-[#a3a3a3]">Payable after work completion</span>
            </div>
            <span className="font-display text-[#ff4e00] text-3xl font-bold tracking-tight">₹949</span>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="flex flex-col gap-3 pt-1">
        <button
          onClick={handleCall}
          className="w-full bg-[#ff4e00] hover:bg-[#e04500] text-black py-3.5 px-4 rounded text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98]"
          id="call-operator-btn"
        >
          <span
            className="material-symbols-outlined text-[20px]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            call
          </span>
          <span>Call Operator Now</span>
        </button>

        <a
          href={`https://wa.me/${WHATSAPP_NUMBER.replace('+', '')}?text=${encodeURIComponent(
            'Hi Tukaram Patil, I am tracking booking GM-4102 in Shegaon, Jath. How soon will you arrive?'
          )}`}
          target="_blank"
          rel="noreferrer"
          className="w-full bg-[#141414] text-[#f5f5f5] border border-white/20 hover:bg-white/10 py-3.5 px-4 rounded text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          id="open-operator-whatsapp-btn"
        >
          <span
            className="material-symbols-outlined text-[20px] text-[#ff4e00]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            chat
          </span>
          <span>Open in WhatsApp</span>
        </a>

        {/* Shortcut to view confirmed invoice */}
        <button
          onClick={() => onNavigateTab('receipt')}
          className="w-full py-2 text-xs text-[#ff4e00] font-semibold uppercase tracking-wider hover:underline text-center"
        >
          View Sample Digital Receipt (GM-INV-8921) →
        </button>
      </div>
    </div>
  );
};
