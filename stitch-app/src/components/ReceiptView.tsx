import React, { useState } from 'react';
import { ScreenTab } from '../types';
import { WHATSAPP_NUMBER } from '../data/mockData';

interface ReceiptViewProps {
  onNavigateTab: (tab: ScreenTab) => void;
}

export const ReceiptView: React.FC<ReceiptViewProps> = ({ onNavigateTab }) => {
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);

  const handleDownloadInvoice = () => {
    setDownloadNotice('Official Invoice GM-INV-8921 generated! Opening print preview...');
    setTimeout(() => {
      window.print();
      setDownloadNotice(null);
    }, 800);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      '🚜 GoMate Digital Receipt GM-INV-8921\n' +
      'Status: Payment Confirmed (₹2,899)\n' +
      'Equipment: JCB 3DX Backhoe Loader (3 Hours)\n' +
      'Operator: Suresh Shinde (Sankh Cluster)\n' +
      'Location: Umadi, Jath Taluka (PIN 416404)\n' +
      'Verified via GoMate 0% Broker Commission Marketplace.'
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="flex flex-col w-full gap-5 pb-24 text-[#f5f5f5]">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigateTab('bookings')}
          className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-[#ff4e00] hover:underline"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>Back to Live Dispatch Tracker</span>
        </button>
        <span className="text-[11px] font-mono text-[#a3a3a3] bg-[#141414] border border-white/10 px-2 py-0.5 rounded">
          Sangli Rural PIN 416404
        </span>
      </div>

      {/* Success Animation / Header Banner */}
      <div className="flex flex-col items-center justify-center p-6 bg-[#141414] rounded-2xl relative overflow-hidden text-center border border-white/10 shadow-lg">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#ff4e00]/10 rounded-full blur-2xl"></div>

        <div className="w-16 h-16 rounded-2xl bg-[#ff4e00] text-black flex items-center justify-center mb-3 shadow-md ring-4 ring-[#ff4e00]/20">
          <span
            className="material-symbols-outlined text-[32px] font-bold"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            verified
          </span>
        </div>

        <span className="text-[11px] text-[#ff4e00] font-bold uppercase tracking-widest mb-1 font-mono">
          Receipt ID: GM-INV-8921
        </span>
        <h1 className="font-display text-[#f5f5f5] text-3xl uppercase tracking-wide mb-1">
          Payment Confirmed
        </h1>
        <span className="font-display text-[#ff4e00] text-4xl font-bold tracking-tight">
          ₹2,899
        </span>

        <div className="flex items-center gap-1.5 mt-3 px-3 py-1 bg-[#1a1a1a] border border-white/10 text-[#a3a3a3] rounded-full text-xs font-mono">
          <span
            className="material-symbols-outlined text-[14px] text-[#ff4e00]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            lock
          </span>
          <span>Secured by Razorpay • Verified Transaction</span>
        </div>
      </div>

      {/* Booking Details Card */}
      <div className="flex flex-col bg-[#141414] rounded-2xl p-5 gap-4 border border-white/10">
        <div className="flex items-center justify-between">
          <span className="font-display text-sm text-[#f5f5f5] uppercase tracking-wider">
            Booking Details
          </span>
          <span className="px-2.5 py-0.5 bg-[#10b981]/20 border border-[#10b981]/30 text-[#10b981] rounded text-[10px] font-bold uppercase tracking-wider font-mono">
            Completed
          </span>
        </div>

        <div className="flex items-start gap-3.5 pt-1">
          <div className="w-12 h-12 rounded-xl bg-[#222222] border border-white/10 flex items-center justify-center text-[#ff4e00] shrink-0">
            <span
              className="material-symbols-outlined text-[24px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              agriculture
            </span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-display text-lg text-[#f5f5f5] uppercase tracking-wide truncate">
              JCB 3DX Backhoe Loader
            </span>
            <span className="text-xs text-[#a3a3a3]">
              Farm Pond Excavation - 3 Hours
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="flex flex-col p-3 bg-[#1a1a1a] rounded-xl border border-white/10">
            <span className="text-[10px] uppercase tracking-wider text-[#a3a3a3] mb-0.5">Operator</span>
            <span className="font-display text-base text-[#f5f5f5] uppercase tracking-wide truncate">Suresh Shinde</span>
            <span className="text-xs text-[#ff4e00] font-mono">Sankh Cluster</span>
          </div>
          <div className="flex flex-col p-3 bg-[#1a1a1a] rounded-xl border border-white/10">
            <span className="text-[10px] uppercase tracking-wider text-[#a3a3a3] mb-0.5">Location</span>
            <span className="font-display text-base text-[#f5f5f5] uppercase tracking-wide truncate">Umadi, Jath</span>
            <span className="text-xs text-[#a3a3a3] font-mono">Taluka (Sangli)</span>
          </div>
        </div>
      </div>

      {/* Itemized Price Table */}
      <div className="flex flex-col bg-[#141414] rounded-2xl p-5 gap-3 border border-white/10">
        <span className="font-display text-sm text-[#f5f5f5] uppercase tracking-wider mb-1">
          Price Breakdown
        </span>

        <div className="flex justify-between items-center text-xs text-[#f5f5f5]">
          <div className="flex flex-col">
            <span className="font-semibold text-sm">Hourly Rental</span>
            <span className="text-[11px] text-[#a3a3a3] font-mono">₹950 × 3 Hours</span>
          </div>
          <span className="font-bold text-sm text-[#f5f5f5] font-mono">₹2,850</span>
        </div>

        <div className="flex justify-between items-center text-xs text-[#f5f5f5]">
          <div className="flex flex-col">
            <span className="font-semibold text-sm">Platform Convenience Fee</span>
            <span className="text-[11px] text-[#a3a3a3]">Secure booking &amp; support</span>
          </div>
          <span className="font-bold text-sm text-[#f5f5f5] font-mono">₹49</span>
        </div>

        <div className="h-[1px] bg-white/10 my-1"></div>

        <div className="flex justify-between items-center">
          <span className="font-display text-sm uppercase tracking-wider text-[#f5f5f5]">Total Paid</span>
          <span className="font-display text-[#ff4e00] text-2xl font-bold font-mono">
            ₹2,899
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 pt-1">
        <button
          onClick={handleDownloadInvoice}
          className="w-full h-12 bg-[#ff4e00] hover:bg-[#e04500] text-black rounded text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-all"
          id="download-pdf-invoice-btn"
        >
          <span className="material-symbols-outlined text-[20px]">download</span>
          <span>Download PDF Invoice</span>
        </button>

        <button
          onClick={handleShareWhatsApp}
          className="w-full h-12 bg-[#141414] border border-white/20 hover:bg-white/10 text-[#f5f5f5] rounded text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"
          id="share-whatsapp-invoice-btn"
        >
          <span
            className="material-symbols-outlined text-[20px] text-[#ff4e00]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            share
          </span>
          <span>Share on WhatsApp</span>
        </button>
      </div>

      {downloadNotice && (
        <div className="p-3 bg-[#1a1a1a] text-[#ff4e00] rounded-xl text-xs font-semibold text-center animate-fade-in border border-[#ff4e00]/40 font-mono">
          {downloadNotice}
        </div>
      )}
    </div>
  );
};
