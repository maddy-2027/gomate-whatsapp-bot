import React, { useState } from 'react';
import { JATH_VILLAGES, WHATSAPP_NUMBER } from '../data/mockData';
import { ScreenTab } from '../types';

interface WhatsAppBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedMachine?: string;
  preselectedHours?: number;
  preselectedCost?: number;
  onConfirmSimulation?: () => void;
}

export const WhatsAppBookingModal: React.FC<WhatsAppBookingModalProps> = ({
  isOpen,
  onClose,
  preselectedMachine,
  preselectedHours = 2,
  preselectedCost = 949,
  onConfirmSimulation,
}) => {
  const [machine, setMachine] = useState<string>(preselectedMachine || 'Tractor & Farm Machinery');
  const [village, setVillage] = useState<string>('Shegaon');
  const [hours, setHours] = useState<number>(preselectedHours);
  const [customerName, setCustomerName] = useState<string>('Ramesh Patil');

  if (!isOpen) return null;

  const generateWhatsAppUrl = () => {
    const text = 
      `Hi GoMate, I need to rent equipment in Jath Taluka (PIN 416404).\n` +
      `• Machine: ${machine}\n` +
      `• Village: ${village}\n` +
      `• Duration: ${hours} Hours\n` +
      `• Farmer Name: ${customerName}\n` +
      `Please connect me with verified local operators at 0% broker commission.`;
    return `https://wa.me/${WHATSAPP_NUMBER.replace('+', '')}?text=${encodeURIComponent(text)}`;
  };

  const handleSimulate = () => {
    onClose();
    if (onConfirmSimulation) {
      onConfirmSimulation();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#141414] rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-white/10 flex flex-col gap-4 animate-scale-in max-h-[90vh] overflow-y-auto text-[#f5f5f5]">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-lg bg-[#ff4e00] text-black flex items-center justify-center shadow-md shrink-0">
              <span className="material-symbols-outlined text-[20px] font-bold">chat</span>
            </div>
            <div>
              <h3 className="font-display text-lg font-bold uppercase tracking-wide text-[#f5f5f5] leading-tight">
                WhatsApp Quick Booking
              </h3>
              <p className="text-xs text-[#ff4e00] font-mono">
                Jath Taluka Verified Fleet (PIN 416404)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#1a1a1a] flex items-center justify-center text-[#a3a3a3] hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Marathi hint */}
        <div className="p-2.5 bg-[#1a1a1a] rounded-xl text-[11px] text-[#a3a3a3] font-medium border border-white/10">
          WhatsApp वर फक्त 'Hi' पाठवून किंवा खालील माहिती निवडून जवळचा ट्रॅक्टर/जेसीबी 2 मिनिटांत मिळवा.
        </div>

        <div className="flex flex-col gap-3 text-xs">
          <div>
            <label className="font-bold text-[#a3a3a3] block mb-1 uppercase tracking-wider text-[10px]">Select Machinery</label>
            <select
              value={machine}
              onChange={(e) => setMachine(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-white/10 bg-[#1a1a1a] text-sm text-white focus:border-[#ff4e00] outline-none"
            >
              <option value="Tractor & Farm Machinery (Rotavator/Cultivator)">
                Tractor &amp; Farm Machinery (₹450–₹600/hr)
              </option>
              <option value="JCB & Earthmoving (3DX Backhoe)">
                JCB &amp; Earthmoving 3DX (₹950/hr)
              </option>
              <option value="Transport Vehicle (Tata Ace / Pickup)">
                Transport Vehicle (₹350–₹700/hr)
              </option>
              <option value="Combine Harvester">
                Combine Harvester (₹600/hr)
              </option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-[#a3a3a3] block mb-1 uppercase tracking-wider text-[10px]">Select Village in Jath</label>
              <select
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-white/10 bg-[#1a1a1a] text-sm text-white focus:border-[#ff4e00] outline-none"
              >
                {JATH_VILLAGES.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-bold text-[#a3a3a3] block mb-1 uppercase tracking-wider text-[10px]">Required Hours</label>
              <select
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-white/10 bg-[#1a1a1a] text-sm text-white focus:border-[#ff4e00] outline-none"
              >
                <option value={1}>1 Hour</option>
                <option value={2}>2 Hours (Recommended)</option>
                <option value={3}>3 Hours</option>
                <option value={4}>4 Hours (Half Day)</option>
                <option value={6}>6 Hours</option>
                <option value={8}>8 Hours (Full Day)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-bold text-[#a3a3a3] block mb-1 uppercase tracking-wider text-[10px]">Farmer Name</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-white/10 bg-[#1a1a1a] text-sm text-white focus:border-[#ff4e00] outline-none"
            />
          </div>
        </div>

        {/* Pricing notice */}
        <div className="flex items-center justify-between p-3 bg-[#ff4e00]/10 rounded-xl border border-[#ff4e00]/30 text-xs">
          <div>
            <span className="font-bold text-[#ff4e00] block uppercase tracking-wide">0% Brokerage Guarantee</span>
            <span className="text-[11px] text-[#a3a3a3]">Diesel fuel included • Pay upon arrival</span>
          </div>
          <span className="material-symbols-outlined text-[#ff4e00]">verified</span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 pt-1">
          <a
            href={generateWhatsAppUrl()}
            target="_blank"
            rel="noreferrer"
            className="w-full bg-[#ff4e00] hover:bg-[#e04500] text-black py-3 px-4 rounded text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98]"
            id="modal-open-whatsapp-link"
          >
            <span className="material-symbols-outlined text-[20px]">chat</span>
            <span>Open in Official WhatsApp Bot</span>
          </a>

          <button
            onClick={handleSimulate}
            className="w-full bg-[#1a1a1a] hover:bg-white/10 border border-white/10 text-[#f5f5f5] py-2.5 px-4 rounded text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px] text-[#ff4e00]">route</span>
            <span>Simulate Live Operator Dispatch (GM-4102) →</span>
          </button>
        </div>
      </div>
    </div>
  );
};
