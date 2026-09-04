import React, { useState } from 'react';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { ExploreView } from './components/ExploreView';
import { LiveTrackerView } from './components/LiveTrackerView';
import { RateEstimatorView } from './components/RateEstimatorView';
import { ReceiptView } from './components/ReceiptView';
import { OwnerProView } from './components/OwnerProView';
import { WhatsAppBookingModal } from './components/WhatsAppBookingModal';
import { Language, ScreenTab, DispatchBooking } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<ScreenTab>('explore');
  const [currentLanguage, setCurrentLanguage] = useState<Language>('en');
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState<boolean>(false);
  const [selectedMachineForBooking, setSelectedMachineForBooking] = useState<string>('Tractor & Farm Machinery');
  const [selectedHoursForBooking, setSelectedHoursForBooking] = useState<number>(2);
  const [selectedCostForBooking, setSelectedCostForBooking] = useState<number>(949);

  const handleOpenWhatsApp = (machineName?: string, hours: number = 2, cost: number = 949) => {
    if (machineName) {
      setSelectedMachineForBooking(machineName);
    }
    setSelectedHoursForBooking(hours);
    setSelectedCostForBooking(cost);
    setIsWhatsAppOpen(true);
  };

  const handleSimulateDispatch = () => {
    setActiveTab('bookings');
  };

  const handleViewInvoice = (_booking: DispatchBooking) => {
    setActiveTab('receipt');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f5] flex flex-col font-body selection:bg-[#ff4e00] selection:text-black">
      {/* Top Fixed Header */}
      <Header
        currentLanguage={currentLanguage}
        onLanguageChange={setCurrentLanguage}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenWhatsApp={() => handleOpenWhatsApp()}
      />

      {/* Main Content Area */}
      <main className={`flex-grow w-full ${
        activeTab === 'owner-pro'
          ? 'pt-16' // Desktop Owner Pro has fixed 16-height top header
          : 'pt-24 sm:pt-28' // Mobile app header includes language tabs
      }`}>
        {/* View Router */}
        {activeTab === 'owner-pro' ? (
          <OwnerProView
            onNavigateTab={setActiveTab}
            onViewInvoice={handleViewInvoice}
          />
        ) : (
          <div className="max-w-xl mx-auto px-4">
            {activeTab === 'explore' && (
              <ExploreView
                currentLanguage={currentLanguage}
                onSelectMachine={(machine) => setSelectedMachineForBooking(machine)}
                onNavigateTab={setActiveTab}
                onOpenWhatsAppBooking={(machine) => handleOpenWhatsApp(machine)}
              />
            )}

            {activeTab === 'bookings' && (
              <LiveTrackerView
                onNavigateTab={setActiveTab}
                onOpenWhatsAppChat={() => handleOpenWhatsApp()}
              />
            )}

            {activeTab === 'estimator' && (
              <RateEstimatorView
                onNavigateTab={setActiveTab}
                onOpenWhatsAppBooking={(machine, hours, cost) =>
                  handleOpenWhatsApp(machine, hours, cost)
                }
                preselectedMachineName={selectedMachineForBooking}
              />
            )}

            {activeTab === 'receipt' && (
              <ReceiptView onNavigateTab={setActiveTab} />
            )}
          </div>
        )}
      </main>

      {/* Bottom Navigation for mobile tabs */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* WhatsApp Booking Modal / Dialog */}
      <WhatsAppBookingModal
        isOpen={isWhatsAppOpen}
        onClose={() => setIsWhatsAppOpen(false)}
        preselectedMachine={selectedMachineForBooking}
        preselectedHours={selectedHoursForBooking}
        preselectedCost={selectedCostForBooking}
        onConfirmSimulation={handleSimulateDispatch}
      />
    </div>
  );
}
