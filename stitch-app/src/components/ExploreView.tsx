import React, { useState } from 'react';
import { POPULAR_MACHINERY, REVIEWS, FAQS, HERO_IMAGE, WHATSAPP_NUMBER } from '../data/mockData';
import { Language, ScreenTab } from '../types';

interface ExploreViewProps {
  currentLanguage: Language;
  onSelectMachine: (machineName: string) => void;
  onNavigateTab: (tab: ScreenTab) => void;
  onOpenWhatsAppBooking: (machineName?: string) => void;
}

export const ExploreView: React.FC<ExploreViewProps> = ({
  currentLanguage,
  onSelectMachine,
  onNavigateTab,
  onOpenWhatsAppBooking,
}) => {
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setExpandedFaqIndex(expandedFaqIndex === index ? null : index);
  };

  const getTranslatedHeadings = () => {
    switch (currentLanguage) {
      case 'mr':
        return {
          title: 'WhatsApp वर ट्रॅक्टर, जेसीबी व वाहतूक भाड्याने घ्या',
          sub: 'ग्रामीण भारतासाठी थेट मशिनरी रेंटल. मशीन निवडा, आपले गाव निवडा आणि थेट स्थानिक ऑपरेटरशी संपर्क साधा.',
          pilot: 'जत तालुका पायलट (पिन 416404)',
          villages: '125 गावे',
        };
      case 'hi':
        return {
          title: 'WhatsApp पर ट्रैक्टर, जेसीबी व ट्रांसपोर्ट किराये पर लें',
          sub: 'ग्रामीण भारत के लिए डायरेक्ट मशीनरी रेंटल। मशीन चुनें, अपना गाँव चुनें और सीधे सत्यापित ऑपरेटरों से जुड़ें।',
          pilot: 'जत तालुका पायलट (पिन 416404)',
          villages: '125 गाँव',
        };
      case 'kn':
        return {
          title: 'WhatsApp ನಲ್ಲಿ ಟ್ರ್ಯಾಕ್ಟರ್, ಜೆಸಿಬಿ ಮತ್ತು ಸಾರಿಗೆ ಬಾಡಿಗೆಗೆ ಪಡೆಯಿರಿ',
          sub: 'ಗ್ರಾಮೀಣ ಭಾರತಕ್ಕಾಗಿ ನೇರ ಯಂತ್ರೋಪಕರಣ ಬಾಡಿಗೆ. ಯಂತ್ರ ಆಯ್ಕೆಮಾಡಿ, ನಿಮ್ಮ ಗ್ರಾಮವನ್ನು ಆರಿಸಿ, ನೇರವಾಗಿ ಬುಕ್ ಮಾಡಿ.',
          pilot: 'ಜತ್ ತಾಲೂಕು ಪೈಲಟ್ (ಪಿನ್ 416404)',
          villages: '125 ಹಳ್ಳಿಗಳು',
        };
      default:
        return {
          title: 'Rent Tractors, JCBs & Transport on WhatsApp',
          sub: 'Direct machinery rental for rural India. Select machine, pick your village, and connect with verified local operators at flat hourly rates.',
          pilot: 'Jath Taluka Pilot (PIN 416404)',
          villages: '125 Villages',
        };
    }
  };

  const text = getTranslatedHeadings();

  return (
    <div className="flex flex-col w-full text-[#f5f5f5] pb-24">
      {/* Location Banner */}
      <div className="bg-[#141414] py-2.5 px-4 rounded-xl mb-4 flex items-center justify-between text-xs font-medium text-[#a3a3a3] border border-white/10 shadow-xs">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[18px] text-[#ff4e00]">location_on</span>
          <span className="font-semibold text-[#f5f5f5] uppercase tracking-wider text-[11px]">{text.pilot}</span>
        </div>
        <span className="bg-[#ff4e00] text-black px-2.5 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase">
          {text.villages}
        </span>
      </div>

      {/* Hero Section */}
      <section className="flex flex-col gap-4 mb-8">
        <div className="flex flex-col gap-2">
          <div className="inline-flex items-center gap-1.5 bg-[#ff4e00] text-black px-3 py-0.5 rounded text-[11px] font-bold uppercase tracking-widest self-start">
            <span className="material-symbols-outlined text-[15px]">verified</span>
            <span>0% Broker Commission</span>
          </div>

          <h1 className="font-display text-[#f5f5f5] text-[32px] sm:text-[38px] leading-[0.95] tracking-tight uppercase">
            {text.title}
          </h1>

          <p className="text-sm text-[#a3a3a3] font-light leading-relaxed">
            {text.sub}
          </p>

          <p className="text-xs text-[#a3a3a3] font-normal leading-relaxed bg-[#141414] p-3 rounded-xl border border-white/10">
            कोणतीही दलाल किंवा कमिशन नाही. जत तालुक्यातील प्रमाणित ट्रॅक्टर, जेसीबी व मालवाहतूक वाहने थेट WhatsApp वर मिळवा.
          </p>
        </div>

        {/* Hero Image */}
        <div className="relative w-full h-52 sm:h-56 rounded-2xl overflow-hidden shadow-lg border border-white/10 group">
          <img
            src={HERO_IMAGE}
            alt="A modern green tractor working in a sunlit agricultural field in Jath Taluka, Sangli"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/50 to-transparent flex items-end p-4">
            <div className="text-white">
              <span className="text-[10px] font-bold tracking-widest uppercase bg-[#ff4e00] text-black px-2.5 py-0.5 rounded mb-1.5 inline-block">
                Live Fleet
              </span>
              <p className="font-display text-white text-lg sm:text-xl uppercase tracking-wide drop-shadow-md">
                Fast arrival across all 125 villages
              </p>
            </div>
          </div>
        </div>

        {/* Popular Machinery Cards Carousel / Stack */}
        <div className="flex flex-col gap-3.5 mt-2">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-[#f5f5f5] text-xl uppercase tracking-wider">Popular Machinery</h2>
            <span className="text-xs text-[#ff4e00] font-semibold flex items-center gap-1 uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ff4e00]"></span>
              Direct Rates
            </span>
          </div>

          {POPULAR_MACHINERY.map((item) => (
            <div
              key={item.id}
              className="bg-[#141414] p-4 rounded-xl flex flex-col gap-3 border border-white/10 hover:border-[#ff4e00]/50 transition-all"
            >
              <div className="flex justify-between items-start gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-lg bg-[#1a1a1a] text-[#ff4e00] border border-white/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[24px]">{item.iconName}</span>
                  </div>
                  <div>
                    <h3 className="font-display text-[#f5f5f5] text-[17px] uppercase tracking-wide leading-tight">
                      {item.name}
                    </h3>
                    <p className="text-xs text-[#a3a3a3] mt-0.5">{item.desc}</p>
                  </div>
                </div>
                <span className="bg-[#ff4e00]/15 text-[#ff4e00] border border-[#ff4e00]/30 px-2.5 py-1 rounded text-xs font-bold shrink-0 font-mono">
                  {item.rateRange}
                </span>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => onOpenWhatsAppBooking(item.name)}
                  className="flex-1 bg-[#ff4e00] text-black py-2.5 px-4 rounded text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#e04500] active:scale-[0.98] transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">chat</span>
                  <span>Book on WhatsApp</span>
                </button>
                <button
                  onClick={() => {
                    onSelectMachine(item.name);
                    onNavigateTab('estimator');
                  }}
                  className="px-3 py-2.5 bg-[#1a1a1a] border border-white/10 text-[#f5f5f5] rounded text-xs font-semibold uppercase tracking-wider hover:bg-white/10 transition-colors"
                  title="Calculate rental rate"
                >
                  Calculate
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Primary CTA button */}
        <div className="flex flex-col gap-2 mt-2">
          <button
            onClick={() => onOpenWhatsAppBooking()}
            className="w-full bg-[#ff4e00] hover:bg-[#e04500] text-black py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 font-display text-lg uppercase tracking-wider shadow-lg active:scale-[0.98] transition-all"
            id="book-whatsapp-now-hero"
          >
            <span className="material-symbols-outlined text-[22px]">chat</span>
            <span>Book on WhatsApp Now</span>
          </button>
        </div>
      </section>

      {/* Trust & Reliability Section */}
      <section className="flex flex-col gap-4 mb-8">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-[#ff4e00] uppercase tracking-wider font-bold">
            Trust &amp; Reliability
          </span>
          <h2 className="font-display text-[#f5f5f5] text-2xl uppercase tracking-wide">
            Why Farmers in Jath Trust GoMate
          </h2>
          <p className="text-xs text-[#a3a3a3]">
            शेतकरी गोमेटवर विश्वास का ठेवतात? Grounded in local community relationships and honest pricing.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Feature 1 */}
          <div className="bg-[#141414] p-4 rounded-xl flex flex-col gap-2 border border-white/10 shadow-2xs">
            <div className="w-8 h-8 rounded-lg bg-[#ff4e00]/15 text-[#ff4e00] flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">group</span>
            </div>
            <h3 className="font-display text-[#f5f5f5] text-base uppercase tracking-wide">Direct Operators</h3>
            <p className="text-xs text-[#a3a3a3]">No middleman broker inflating your rental rates.</p>
          </div>

          {/* Feature 2 */}
          <div className="bg-[#141414] p-4 rounded-xl flex flex-col gap-2 border border-white/10 shadow-2xs">
            <div className="w-8 h-8 rounded-lg bg-[#ff4e00]/15 text-[#ff4e00] flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">schedule</span>
            </div>
            <h3 className="font-display text-[#f5f5f5] text-base uppercase tracking-wide">Clear Billing</h3>
            <p className="text-xs text-[#a3a3a3]">Pay only for actual hours needed (2, 3, or 4 hrs).</p>
          </div>

          {/* Feature 3 */}
          <div className="bg-[#141414] p-4 rounded-xl flex flex-col gap-2 border border-white/10 shadow-2xs">
            <div className="w-8 h-8 rounded-lg bg-[#ff4e00]/15 text-[#ff4e00] flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">percent</span>
            </div>
            <h3 className="font-display text-[#f5f5f5] text-base uppercase tracking-wide">0% Commission</h3>
            <p className="text-xs text-[#a3a3a3]">Exact owner rates plus a flat ₹49 protection fee.</p>
          </div>

          {/* Feature 4 */}
          <div className="bg-[#141414] p-4 rounded-xl flex flex-col gap-2 border border-white/10 shadow-2xs">
            <div className="w-8 h-8 rounded-lg bg-[#ff4e00]/15 text-[#ff4e00] flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">map</span>
            </div>
            <h3 className="font-display text-[#f5f5f5] text-base uppercase tracking-wide">125 Villages</h3>
            <p className="text-xs text-[#a3a3a3]">Clusters around Jath, Shegaon, Sankh &amp; Umadi.</p>
          </div>
        </div>
      </section>

      {/* Farmer Feedback Section */}
      <section className="flex flex-col gap-4 mb-8">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-[#ff4e00] uppercase tracking-wider font-bold">
            Local Feedback
          </span>
          <h2 className="font-display text-[#f5f5f5] text-2xl uppercase tracking-wide">
            What Farmers in Jath Say
          </h2>
          <p className="text-xs text-[#a3a3a3]">
            शेतकऱ्यांचे प्रत्यक्ष अनुभव from Shegaon, Sankh &amp; Umadi.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {REVIEWS.map((review) => (
            <div
              key={review.id}
              className="bg-[#141414] p-4 rounded-xl flex flex-col gap-2.5 border border-white/10 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <div className="flex text-[#ff4e00]">
                  {[...Array(review.rating)].map((_, i) => (
                    <span
                      key={i}
                      className="material-symbols-outlined text-[16px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      star
                    </span>
                  ))}
                </div>
                <span className="text-[10px] uppercase tracking-wider bg-[#10b981]/15 text-[#10b981] px-2 py-0.5 rounded font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">verified</span>
                  Verified Booking
                </span>
              </div>

              <p className="text-sm text-[#f5f5f5] italic font-light leading-relaxed">
                "{review.comment}"
              </p>

              <div className="flex items-center gap-2.5 pt-2 border-t border-white/10">
                <div className="w-8 h-8 rounded-lg bg-[#222222] border border-white/10 text-[#ff4e00] flex items-center justify-center font-bold text-xs">
                  {review.initials}
                </div>
                <div>
                  <h4 className="font-display text-[#f5f5f5] text-sm uppercase tracking-wide leading-tight">
                    {review.author}
                  </h4>
                  <p className="text-[11px] text-[#a3a3a3]">
                    {review.role} • {review.village}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Owner Banner Section */}
      <section className="bg-[#141414] border border-[#ff4e00]/40 text-white p-5 rounded-2xl flex flex-col gap-4 mb-8 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 w-32 h-32 bg-[#ff4e00]/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="flex flex-col gap-1 relative z-10">
          <span className="text-xs text-[#ff4e00] uppercase tracking-wider font-bold">
            For Machinery Owners in Jath
          </span>
          <h2 className="font-display text-white text-xl uppercase tracking-wide">
            Own a Tractor, JCB or Commercial Truck?
          </h2>
          <p className="text-xs text-[#a3a3a3] leading-relaxed">
            जत तालुक्यातील ट्रॅक्टर, जेसीबी व वाहन मालकांसाठी नोंदणी. List your fleet &amp; earn ₹25,000+/mo with 0% commission.
          </p>
        </div>

        <div className="flex flex-col gap-2 relative z-10">
          <button
            onClick={() => onNavigateTab('owner-pro')}
            className="w-full bg-[#ff4e00] hover:bg-[#e04500] text-black py-3 px-4 rounded text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.98]"
            id="register-machinery-banner-btn"
          >
            <span>Register Your Machinery</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="flex flex-col gap-4 mb-8">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-[#ff4e00] uppercase tracking-wider font-bold">
            FAQ
          </span>
          <h2 className="font-display text-[#f5f5f5] text-2xl uppercase tracking-wide">
            Frequently Asked Questions
          </h2>
          <p className="text-xs text-[#a3a3a3]">नेहमी विचारले जाणारे प्रश्न</p>
        </div>

        <div className="flex flex-col gap-2">
          {FAQS.map((faq, idx) => {
            const isExpanded = expandedFaqIndex === idx;
            return (
              <div
                key={idx}
                className="bg-[#141414] rounded-xl border border-white/10 overflow-hidden transition-all shadow-2xs"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-4 flex items-center justify-between text-left gap-2 hover:bg-white/5 transition-colors"
                >
                  <h3 className="font-display text-[#f5f5f5] text-base uppercase tracking-wide">
                    {faq.question}
                  </h3>
                  <span
                    className={`material-symbols-outlined text-[20px] text-[#ff4e00] transition-transform duration-200 ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                  >
                    expand_more
                  </span>
                </button>
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 border-t border-white/10 text-xs text-[#a3a3a3] leading-relaxed">
                    <p>{faq.answer}</p>
                    {faq.answerMr && (
                      <p className="mt-2 text-[#f5f5f5] font-medium bg-[#1a1a1a] p-2.5 rounded border border-white/5">
                        {faq.answerMr}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="flex flex-col gap-4 pt-6 pb-2 border-t border-white/10 text-[#a3a3a3]">
        <div className="flex flex-col gap-1">
          <span className="font-display text-[#ff4e00] text-2xl uppercase tracking-wider">GoMate</span>
          <p className="text-xs text-[#a3a3a3]">
            WhatsApp machinery marketplace for Jath Taluka, Sangli (PIN 416404).
          </p>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold">
          <button
            onClick={() => onNavigateTab('estimator')}
            className="text-[#ff4e00] hover:underline uppercase tracking-wider text-[11px]"
          >
            Hourly Rate Card
          </button>
          <button
            onClick={() => onNavigateTab('owner-pro')}
            className="text-[#ff4e00] hover:underline uppercase tracking-wider text-[11px]"
          >
            Owner Registration
          </button>
          <button
            onClick={() => onNavigateTab('owner-pro')}
            className="text-[#ff4e00] hover:underline uppercase tracking-wider text-[11px]"
          >
            Owner Pro Dashboard
          </button>
          <button
            onClick={() => onOpenWhatsAppBooking()}
            className="text-[#ff4e00] hover:underline uppercase tracking-wider text-[11px]"
          >
            WhatsApp Booking
          </button>
        </div>

        <div className="pt-2 text-[10px] uppercase tracking-widest text-[#a3a3a3]/60 font-mono">
          © 2026 GoMate Marketplace. Coordinates 17.0450° N, 75.2200° E
        </div>
      </footer>
    </div>
  );
};
