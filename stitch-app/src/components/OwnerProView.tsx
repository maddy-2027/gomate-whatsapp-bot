import React, { useState, useMemo } from 'react';
import { INITIAL_DISPATCHES } from '../data/mockData';
import { DispatchBooking, ScreenTab } from '../types';

interface OwnerProViewProps {
  onNavigateTab: (tab: ScreenTab) => void;
  onViewInvoice: (booking: DispatchBooking) => void;
}

export const OwnerProView: React.FC<OwnerProViewProps> = ({
  onNavigateTab,
  onViewInvoice,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'fleet' | 'dispatches' | 'earnings' | 'settings'>('fleet');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [dispatches, setDispatches] = useState<DispatchBooking[]>(INITIAL_DISPATCHES);
  const [showAddMachineModal, setShowAddMachineModal] = useState<boolean>(false);
  const [newMachine, setNewMachine] = useState({
    name: 'Mahindra Arjun Novo 605',
    type: 'Tractor',
    hourlyRate: 550,
    villageHub: 'Shegaon, Jath',
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const filteredDispatches = useMemo(() => {
    return dispatches.filter((d) => {
      const matchesSearch =
        d.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.equipment.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.village.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' ||
        d.status.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [dispatches, searchQuery, statusFilter]);

  const itemsPerPage = 5;
  const totalPages = Math.ceil(filteredDispatches.length / itemsPerPage) || 1;
  const paginatedDispatches = filteredDispatches.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleAddMachineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowAddMachineModal(false);
    setToastMessage(`Machine "${newMachine.name}" registered successfully to Jath Taluka live fleet!`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="w-full min-h-screen bg-[#0a0a0a] text-[#f5f5f5] pb-24">
      {/* Sub-Header Navigation for Owner Pro on mobile/tablet */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-4 pb-2">
        <div className="flex items-center justify-between overflow-x-auto gap-2 pb-2 md:hidden bg-[#141414] border border-white/10 p-1.5 rounded-xl">
          <button
            onClick={() => setActiveSubTab('fleet')}
            className={`px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${
              activeSubTab === 'fleet' ? 'bg-[#ff4e00] text-black' : 'bg-transparent text-[#a3a3a3] hover:text-[#f5f5f5]'
            }`}
          >
            Fleet Management
          </button>
          <button
            onClick={() => setActiveSubTab('dispatches')}
            className={`px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${
              activeSubTab === 'dispatches' ? 'bg-[#ff4e00] text-black' : 'bg-transparent text-[#a3a3a3] hover:text-[#f5f5f5]'
            }`}
          >
            Dispatches
          </button>
          <button
            onClick={() => setActiveSubTab('earnings')}
            className={`px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${
              activeSubTab === 'earnings' ? 'bg-[#ff4e00] text-black' : 'bg-transparent text-[#a3a3a3] hover:text-[#f5f5f5]'
            }`}
          >
            Earnings
          </button>
          <button
            onClick={() => setActiveSubTab('settings')}
            className={`px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${
              activeSubTab === 'settings' ? 'bg-[#ff4e00] text-black' : 'bg-transparent text-[#a3a3a3] hover:text-[#f5f5f5]'
            }`}
          >
            Settings
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 w-full flex flex-col gap-6 sm:gap-8">
        {/* Top Summary Banner / Metric Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {/* Card 1 */}
          <div className="bg-[#141414] rounded-2xl p-5 sm:p-6 border border-white/10 flex flex-col justify-between transition-all hover:border-[#ff4e00]/50">
            <div className="flex justify-between items-start">
              <span className="text-xs text-[#ff4e00] uppercase tracking-wider font-bold">
                Active Machinery
              </span>
              <span className="material-symbols-outlined text-[#ff4e00] text-[24px]">
                agriculture
              </span>
            </div>
            <div className="mt-3 sm:mt-4 flex items-baseline gap-2">
              <span className="font-display text-2xl sm:text-3xl font-extrabold text-[#f5f5f5] font-mono">
                3 Units
              </span>
              <span className="text-[11px] text-[#10b981] bg-[#10b981]/15 border border-[#10b981]/30 px-2 py-0.5 rounded font-bold font-mono uppercase tracking-wider">
                100% Operational
              </span>
            </div>
            <div className="mt-4 text-xs text-[#a3a3a3] pt-3 border-t border-white/10 flex justify-between items-center">
              <span>2 Tractors, 1 JCB Backhoe</span>
              <button
                onClick={() => setShowAddMachineModal(true)}
                className="text-[#ff4e00] font-bold uppercase tracking-wider text-[11px] hover:underline cursor-pointer"
              >
                + Add Unit
              </button>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-[#141414] rounded-2xl p-5 sm:p-6 border border-white/10 flex flex-col justify-between transition-all hover:border-[#ff4e00]/50">
            <div className="flex justify-between items-start">
              <span className="text-xs text-[#ff4e00] uppercase tracking-wider font-bold">
                This Month Earnings
              </span>
              <span className="material-symbols-outlined text-[#ff4e00] text-[24px]">
                payments
              </span>
            </div>
            <div className="mt-3 sm:mt-4 flex items-baseline gap-2">
              <span className="font-display text-2xl sm:text-3xl font-extrabold text-[#ff4e00] font-mono">
                ₹38,500
              </span>
              <span className="text-[11px] text-[#10b981] bg-[#10b981]/15 border border-[#10b981]/30 px-2 py-0.5 rounded font-bold font-mono uppercase tracking-wider">
                +14% vs last mo
              </span>
            </div>
            <div className="mt-4 text-xs text-[#a3a3a3] pt-3 border-t border-white/10 flex justify-between items-center">
              <span>Payout processed weekly</span>
              <button
                onClick={() => onNavigateTab('receipt')}
                className="text-[#ff4e00] font-bold uppercase tracking-wider text-[11px] hover:underline cursor-pointer"
              >
                View Report
              </button>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-[#141414] rounded-2xl p-5 sm:p-6 border border-white/10 flex flex-col justify-between transition-all hover:border-[#ff4e00]/50">
            <div className="flex justify-between items-start">
              <span className="text-xs text-[#ff4e00] uppercase tracking-wider font-bold">
                Subscription Status
              </span>
              <span className="material-symbols-outlined text-[#ff4e00] text-[24px]">
                verified
              </span>
            </div>
            <div className="mt-3 sm:mt-4 flex items-baseline gap-2">
              <span className="font-display text-2xl sm:text-3xl font-extrabold text-[#f5f5f5] uppercase tracking-wide">
                Active Plan
              </span>
              <span className="text-[11px] text-[#ff4e00] bg-[#ff4e00]/15 border border-[#ff4e00]/30 px-2.5 py-0.5 rounded font-bold font-mono uppercase tracking-wider">
                Renews in 18 days
              </span>
            </div>
            <div className="mt-4 text-xs text-[#a3a3a3] pt-3 border-t border-white/10 flex justify-between items-center">
              <span>Owner Pro Tier (0% Brokerage)</span>
              <span className="text-[#ff4e00] font-bold uppercase tracking-wider text-[11px] hover:underline cursor-pointer">
                Renew Details
              </span>
            </div>
          </div>
        </section>

        {/* Main Content Section: Recent Dispatches */}
        <section className="bg-[#141414] rounded-2xl border border-white/10 p-5 sm:p-6 flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-bold uppercase tracking-wide text-[#f5f5f5]">
                Recent Booking Dispatches
              </h2>
              <p className="text-xs sm:text-sm text-[#a3a3a3]">
                Real-time tracking and invoicing for rural equipment rentals.
              </p>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto relative">
              <div className="relative flex-1 sm:flex-initial">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#a3a3a3] text-[18px]">
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search bookings..."
                  className="bg-[#1a1a1a] text-xs sm:text-sm text-[#f5f5f5] pl-9 pr-4 py-2 rounded-xl outline-none focus:ring-1 focus:ring-[#ff4e00] focus:border-[#ff4e00] border border-white/10 w-full sm:w-64 placeholder:text-[#737373]"
                  id="search-dispatches-input"
                />
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  className="bg-[#ff4e00] hover:bg-[#e04500] text-black px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 shrink-0 shadow-xs"
                  id="filter-dispatches-btn"
                >
                  <span className="material-symbols-outlined text-[16px]">filter_list</span>
                  <span>Filter</span>
                </button>

                {showFilterDropdown && (
                  <div className="absolute right-0 mt-2 w-44 bg-[#1a1a1a] rounded-xl shadow-xl border border-white/10 py-1.5 z-20 text-xs">
                    <button
                      onClick={() => {
                        setStatusFilter('all');
                        setShowFilterDropdown(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 font-medium hover:bg-white/10 ${
                        statusFilter === 'all' ? 'text-[#ff4e00] font-bold' : 'text-[#f5f5f5]'
                      }`}
                    >
                      All Statuses
                    </button>
                    <button
                      onClick={() => {
                        setStatusFilter('In Progress');
                        setShowFilterDropdown(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 font-medium hover:bg-white/10 ${
                        statusFilter === 'In Progress' ? 'text-[#ff4e00] font-bold' : 'text-[#f5f5f5]'
                      }`}
                    >
                      In Progress
                    </button>
                    <button
                      onClick={() => {
                        setStatusFilter('Completed');
                        setShowFilterDropdown(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 font-medium hover:bg-white/10 ${
                        statusFilter === 'Completed' ? 'text-[#ff4e00] font-bold' : 'text-[#f5f5f5]'
                      }`}
                    >
                      Completed
                    </button>
                    <button
                      onClick={() => {
                        setStatusFilter('Confirmed');
                        setShowFilterDropdown(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 font-medium hover:bg-white/10 ${
                        statusFilter === 'Confirmed' ? 'text-[#ff4e00] font-bold' : 'text-[#f5f5f5]'
                      }`}
                    >
                      Confirmed
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Responsive Table Container */}
          <div className="overflow-x-auto w-full border border-white/10 rounded-xl bg-[#141414]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#1a1a1a] text-[#a3a3a3] uppercase tracking-widest font-mono text-[10px] border-b border-white/10">
                  <th className="py-3 px-4 font-semibold">Booking ID</th>
                  <th className="py-3 px-4 font-semibold">Equipment</th>
                  <th className="py-3 px-4 font-semibold">Customer Name</th>
                  <th className="py-3 px-4 font-semibold">Village</th>
                  <th className="py-3 px-4 font-semibold">Hours</th>
                  <th className="py-3 px-4 font-semibold">Rental Amount</th>
                  <th className="py-3 px-4 font-semibold">Platform Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-[#f5f5f5]">
                {paginatedDispatches.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-[#a3a3a3]">
                      No dispatches found matching "{searchQuery}"
                    </td>
                  </tr>
                ) : (
                  paginatedDispatches.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-white/[0.03] transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-[#ff4e00]">
                        {row.id}
                      </td>
                      <td className="py-3.5 px-4 font-medium">{row.equipment}</td>
                      <td className="py-3.5 px-4">{row.customerName}</td>
                      <td className="py-3.5 px-4 text-[#a3a3a3]">{row.village}</td>
                      <td className="py-3.5 px-4 font-mono">{row.hours} hrs</td>
                      <td className="py-3.5 px-4 font-bold font-mono text-[#f5f5f5]">
                        ₹{row.rentalAmount.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded font-mono text-[10px] font-bold uppercase tracking-wider ${
                            row.status === 'In Progress'
                              ? 'bg-[#f59e0b]/15 border border-[#f59e0b]/30 text-[#f59e0b]'
                              : row.status === 'Completed'
                              ? 'bg-[#10b981]/15 border border-[#10b981]/30 text-[#10b981]'
                              : 'bg-[#ff4e00]/15 border border-[#ff4e00]/30 text-[#ff4e00]'
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            if (row.id === '#BK-9482') {
                              onNavigateTab('bookings');
                            } else {
                              onViewInvoice(row);
                            }
                          }}
                          className="text-[#ff4e00] hover:text-[#ff6a26] font-bold flex items-center gap-1 ml-auto cursor-pointer p-1 rounded hover:bg-white/10 font-mono text-xs"
                          title="View Invoice Receipt"
                        >
                          <span className="material-symbols-outlined text-[15px]">
                            {row.status === 'In Progress' ? 'location_on' : 'download'}
                          </span>
                          <span>{row.status === 'In Progress' ? 'Track' : 'Invoice'}</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination / Footer of table */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2 text-xs text-[#a3a3a3] font-mono">
            <span>
              Showing {paginatedDispatches.length} of {filteredDispatches.length} total dispatches
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className={`px-3 py-1 rounded border border-white/10 text-xs font-bold uppercase tracking-wider ${
                  currentPage === 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/10 text-white'
                }`}
              >
                Previous
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-7 h-7 rounded font-bold flex items-center justify-center font-mono ${
                    currentPage === i + 1
                      ? 'bg-[#ff4e00] text-black'
                      : 'bg-[#1a1a1a] text-[#f5f5f5] hover:bg-white/10'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className={`px-3 py-1 rounded border border-white/10 text-xs font-bold uppercase tracking-wider ${
                  currentPage === totalPages ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/10 text-white'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Add Machine Modal */}
      {showAddMachineModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#141414] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-white/10 flex flex-col gap-4 animate-scale-in">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg uppercase tracking-wide font-bold text-[#f5f5f5]">
                Register New Machinery
              </h3>
              <button
                onClick={() => setShowAddMachineModal(false)}
                className="w-8 h-8 rounded-full bg-[#1a1a1a] flex items-center justify-center text-[#a3a3a3] hover:text-white"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddMachineSubmit} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="font-bold text-[#a3a3a3] block mb-1 uppercase tracking-wider text-[10px]">Machine Name / Model</label>
                <input
                  type="text"
                  required
                  value={newMachine.name}
                  onChange={(e) => setNewMachine({ ...newMachine, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-white/10 bg-[#1a1a1a] text-white text-sm focus:border-[#ff4e00] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#a3a3a3] block mb-1 uppercase tracking-wider text-[10px]">Category</label>
                  <select
                    value={newMachine.type}
                    onChange={(e) => setNewMachine({ ...newMachine, type: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-white/10 bg-[#1a1a1a] text-white text-sm focus:border-[#ff4e00] outline-none"
                  >
                    <option value="Tractor">Tractor & Implements</option>
                    <option value="JCB">JCB & Earthmoving</option>
                    <option value="Transport">Commercial Transport</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-[#a3a3a3] block mb-1 uppercase tracking-wider text-[10px]">Hourly Rate (₹/hr)</label>
                  <input
                    type="number"
                    required
                    value={newMachine.hourlyRate}
                    onChange={(e) => setNewMachine({ ...newMachine, hourlyRate: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-white/10 bg-[#1a1a1a] text-white text-sm font-mono focus:border-[#ff4e00] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-[#a3a3a3] block mb-1 uppercase tracking-wider text-[10px]">Taluka Hub Location</label>
                <input
                  type="text"
                  value={newMachine.villageHub}
                  onChange={(e) => setNewMachine({ ...newMachine, villageHub: e.target.value })}
                  placeholder="e.g. Shegaon, Jath Taluka"
                  className="w-full p-2.5 rounded-xl border border-white/10 bg-[#1a1a1a] text-white text-sm focus:border-[#ff4e00] outline-none placeholder:text-[#737373]"
                />
              </div>

              <div className="p-3 bg-[#1a1a1a] border border-[#ff4e00]/30 rounded-xl text-[11px] text-[#f5f5f5]">
                ✓ <strong className="text-[#ff4e00]">0% broker margin.</strong> Your contact will receive direct WhatsApp rental requests from Jath farmers.
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddMachineModal(false)}
                  className="flex-1 py-2.5 rounded border border-white/10 text-xs font-bold uppercase tracking-wider text-[#a3a3a3] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded bg-[#ff4e00] text-black text-xs font-bold uppercase tracking-wider hover:bg-[#e04500]"
                >
                  Confirm Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-[#141414] border border-[#ff4e00] text-white px-4 py-2.5 rounded text-xs font-semibold shadow-xl z-50 animate-fade-in flex items-center gap-2">
          <span className="material-symbols-outlined text-sm text-[#ff4e00]">verified</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
