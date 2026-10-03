(() => {
  /* ==========================================================================
     GoMate Landing Page – Marathi-first Language Switcher
     Supported:
       1. hi (Hindi / हिंदी)
       2. mr (Marathi / मराठी - Default/Primary)
       3. en (English)
     ========================================================================== */

  const VALID_LANGS = ['hi', 'mr', 'en'];

  const copy = {
    en: {
      serviceBar: 'Jath Taluka Pilot (PIN 416404): Serving all 125 villages across Sangli district via WhatsApp',
      navEquipment: 'Equipment',
      navTrust: 'Why GoMate',
      navFaq: 'FAQ',
      navRateCard: 'Rate Card',
      navOwner: 'List Machinery',
      navWaBtn: 'Book on WhatsApp',
      heroBadge: '📍 Jath Taluka • No broker commission',
      heroTitle: 'Find the right machine. <span class="text-accent">Book on WhatsApp.</span>',
      heroSubEn: 'Tell us the machine, village, and date on WhatsApp. Speak directly with a nearby owner and confirm the rate.',
      heroSubMr: 'No broker commission. The machine rate and GoMate’s ₹49 protection and support fee are shown before booking.',
      tractorTitle: 'Tractor &amp; Farm Machinery',
      tractorSub: 'Rotavator, Cultivator, Harvester, Drones',
      tractorRate: '₹450–₹600<small>/hr</small>',
      jcbTitle: 'JCB &amp; Earthmoving',
      jcbSub: '3DX Backhoe, Farm Pond, Levelling, Excavator',
      jcbRate: '₹950<small>/hr</small>',
      transportTitle: 'Transport Vehicles',
      transportSub: 'Tata Ace (Chhota Hathi), Pickup, 4-Ton Truck',
      transportRate: '₹350–₹700<small>/hr</small>',
      heroCtaPrimary: 'Book on WhatsApp →',
      heroCtaSecondary: 'View Full Rate Card',
      heroOwnerSublinkText: 'Own a Tractor, JCB, or Mini-Truck?',
      heroOwnerSublinkCta: 'List your machinery →',
      trustEyebrow: 'Trust &amp; Reliability',
      trustDesc: 'Grounded in local community relationships, verified machinery profiles, and honest pricing.',
      trust1Title: 'Direct Local Operators',
      trust1Text: 'You connect directly with machine owners and drivers residing in Jath Taluka. No middleman broker inflating rates.',
      trust2Title: 'Clear Hourly Billing',
      trust2Text: 'Pay only for actual hours needed (2, 3, or 4 hours) instead of being forced into expensive full-day commitments.',
      trust3Title: 'Clear price before booking',
      trust3Text: 'There is no broker commission. The final machine rate and ₹49 GoMate protection and support fee are shown before booking.',
      trust4Title: '125 Jath Villages Covered',
      trust4Text: 'Machinery clusters organized around Jath Centre, Shegaon, Sankh, Umadi, and Dafalapur for faster field arrival times.',
      reviewsEyebrow: 'Local Feedback',
      reviewsDesc: 'Recent feedback from agricultural producers who hired machinery via GoMate WhatsApp assistant.',
      review1Text: '“Needed a rotavator urgently ahead of sowing. Sent one message on WhatsApp and connected with a tractor owner in Shegaon within 20 minutes. Machine arrived on time at ₹450/hr.”',
      review1Loc: 'Grape &amp; Pomegranate Grower • Shegaon, Jath',
      review2Text: '“Booked 3 hours of deep ploughing for soybean sowing. Hourly rate was clear up front without any broker margin. The driver knew our soil conditions well.”',
      review2Loc: 'Soybean &amp; Bajra Farmer • Sankh, Jath',
      review3Text: '“Secured a JCB 3DX promptly for farm pond excavation. Shared village location on WhatsApp and the booking was verified immediately. Straightforward and reliable.”',
      review3Loc: 'Horticulture Producer • Umadi, Jath',
      ownerBadge: 'For Machinery Owners in Jath',
      ownerTitle: 'Own a Tractor, JCB or Commercial Truck?',
      ownerMr: 'Registration for Tractor, JCB and Vehicle Owners in Jath Taluka',
      ownerDesc: 'List your machinery and receive rental enquiries directly on WhatsApp. Start with a 7-day free trial and pay no broker commission on your earnings.',
      ownerCta: 'Register Your Machinery →',
      ownerDash: 'Owner Pro Dashboard',
      faqEyebrow: 'Answers to Common Questions',
      faqDesc: 'Learn more about renting machinery or listing your fleet on GoMate.',
      faq1q: 'How do I book equipment on WhatsApp?',
      faq1a: 'Send “Hi” to our WhatsApp number (+91 86054 70552). Choose Marathi, Hindi, or English, then share the machine type and your village. We will continue on WhatsApp.',
      faq2q: 'Is there any commission charged to farmers or renters?',
      faq2a: 'There is no broker commission. Confirm the final machine rate, availability, and arrival time on WhatsApp before booking. The ₹49 GoMate protection and support fee is shown for every confirmed booking.',
      faq3q: 'How does owner subscription work?',
      faq3a: 'Machinery owners pay a flat ₹149/month subscription to list their fleet and receive instant booking notifications directly on WhatsApp. The first 7 days are completely free. Zero commission is deducted from your rental revenue.',
      faq4q: 'Which villages in Jath Taluka are serviced?',
      faq4a: 'GoMate services all 125 villages across Jath Taluka including Jath Centre, Shegaon, Sankh, Umadi, Dafalapur, Bilur, Baj, Madgyal, Walekhindi, and surrounding clusters in Sangli district (PIN 416404).',
      footerTagline: 'WhatsApp machinery marketplace for Jath Taluka, Sangli (PIN 416404).',
      footerCopy: '© 2026 GoMate Marketplace. All rights reserved.',
      mobileStickyWa: 'Find Available Equipment on WhatsApp'
    },
    hi: {
      serviceBar: 'जत तालुका पायलट (PIN 416404): WhatsApp द्वारा सांगली जिले के सभी 125 गाँवों में सेवा उपलब्ध',
      navEquipment: 'मशीनरी',
      navTrust: 'GoMate क्यों',
      navFaq: 'प्रश्न-उत्तर',
      navRateCard: 'दर सूची',
      navOwner: 'मशीन दर्ज करें',
      navWaBtn: 'WhatsApp पर बुक करें',
      heroBadge: '📍 जत तालुका • कोई दलाल कमीशन नहीं',
      heroTitle: 'सही मशीन ढूँढें। <span class="text-accent">WhatsApp पर बुक करें।</span>',
      heroSubEn: 'WhatsApp पर मशीन, गाँव और तारीख बताइए। पास के मालिक से सीधे बात करके दर तय करें।',
      heroSubMr: 'कोई दलाल कमीशन नहीं। मशीन का किराया और GoMate की ₹49 सुरक्षा व सहायता फीस बुकिंग से पहले साफ दिखाई जाएगी।',
      tractorTitle: 'ट्रैक्टर और कृषि उपकरण',
      tractorSub: 'रोटावेटर, कल्टीवेटर, हार्वेस्टर, कृषि ड्रोन',
      tractorRate: '₹450–₹600<small>/घंटा</small>',
      jcbTitle: 'JCB और मिट्टी खुदाई',
      jcbSub: '3DX बैकहो, खेत तालाब, समतलीकरण, एक्सकेवेटर',
      jcbRate: '₹950<small>/घंटा</small>',
      transportTitle: 'माल परिवहन वाहन',
      transportSub: 'टाटा एस (छोटा हाथी), पिकअप, 4-टन ट्रक',
      transportRate: '₹350–₹700<small>/घंटा</small>',
      heroCtaPrimary: 'WhatsApp पर बुक करें →',
      heroCtaSecondary: 'पूरी दर सूची देखें',
      heroOwnerSublinkText: 'क्या आपके पास ट्रैक्टर, JCB या मिनी-ट्रक है?',
      heroOwnerSublinkCta: 'अपनी मशीनरी दर्ज करें →',
      trustEyebrow: 'विश्वास और निर्भरता',
      trustDesc: 'स्थानीय संबंधों, सत्यापित मशीनरी और पारदर्शी प्रति घंटे दरों पर आधारित।',
      trust1Title: 'सीधे स्थानीय संचालक',
      trust1Text: 'आप सीधे जत तालुका के मशीन मालिकों से जुड़ते हैं। दर बढ़ाने वाला कोई बिचौलिया दलाल नहीं।',
      trust2Title: 'स्पष्ट प्रति घंटा बिलिंग',
      trust2Text: 'जितने घंटे काम (2, 3 या 4 घंटे) केवल उतना ही भुगतान करें, पूरे दिन का अनावश्यक खर्च नहीं।',
      trust3Title: 'बुकिंग से पहले साफ कीमत',
      trust3Text: 'कोई दलाल कमीशन नहीं। अंतिम मशीन किराया और ₹49 GoMate सुरक्षा व सहायता फीस बुकिंग से पहले दिखाई जाएगी।',
      trust4Title: '125 जत गाँव सेवा क्षेत्र',
      trust4Text: 'जत सेंटर, शेगांव, संख, उमदी और डफळापुर के आसपास मशीनरी क्लस्टर ताकि मशीन जल्दी पहुंचे।',
      reviewsEyebrow: 'स्थानीय अनुभव',
      reviewsDesc: 'GoMate WhatsApp सहायक द्वारा मशीनरी किराए पर लेने वाले किसानों के अनुभव।',
      review1Text: '“बुवाई से पहले रोटावेटर तुरंत चाहिए था। WhatsApp पर एक संदेश भेजा और 20 मिनट में शेगांव के ट्रैक्टर मालिक से संपर्क हो गया। मशीन समय पर ₹450/घंटा में आ गई।”',
      review1Loc: 'अंगूर व अनार उत्पादक • शेगांव, जत',
      review2Text: '“सोयाबीन जुताई के लिए 3 घंटे बुक किए। प्रति घंटा दर पहले से तय थी, कोई बिचौलिया नहीं। चालक को हमारी जमीन की अच्छी समझ थी।”',
      review2Loc: 'सोयाबीन व बाजरा किसान • संख, जत',
      review3Text: '“खेत-तालाब खुदाई के लिए JCB 3DX तुरंत मिली। WhatsApp पर लोकेशन भेजी और बुकिंग तुरंत पक्की हो गई। भरोसेमंद सेवा।”',
      review3Loc: 'बागवानी किसान • उमदी, जत',
      ownerBadge: 'जत तालुका के मशीन मालिकों के लिए',
      ownerTitle: 'क्या आपके पास ट्रैक्टर, JCB या कमर्शियल ट्रक है?',
      ownerMr: 'जत तालुक्यातील ट्रॅक्टर, जेसीबी व वाहन मालकांसाठी नोंदणी',
      ownerDesc: 'अपनी मशीनरी दर्ज करें और WhatsApp पर सीधे किराए की पूछताछ पाएं। 7 दिन का मुफ्त ट्रायल लें और कमाई पर कोई दलाल कमीशन न दें।',
      ownerCta: 'अपनी मशीनरी दर्ज करें →',
      ownerDash: 'मालिक प्रो डैशबोर्ड',
      faqEyebrow: 'सामान्य प्रश्नों के उत्तर',
      faqDesc: 'मशीनरी किराए पर लेने या अपने वाहन को GoMate पर जोड़ने के बारे में जानें।',
      faq1q: 'WhatsApp पर मशीनरी कैसे बुक करें?',
      faq1a: 'हमारे WhatsApp नंबर (+91 86054 70552) पर “Hi” भेजें। मराठी, हिंदी या English चुनें, फिर मशीन और अपने गाँव का नाम बताएं। आगे की जानकारी WhatsApp पर मिलेगी।',
      faq2q: 'क्या किसानों या किराएदारों पर कोई कमीशन है?',
      faq2a: 'कोई दलाल कमीशन नहीं है। बुकिंग से पहले WhatsApp पर अंतिम किराया, उपलब्धता और आने का समय तय करें। हर पक्की बुकिंग पर ₹49 GoMate सुरक्षा व सहायता फीस साफ दिखाई जाएगी।',
      faq3q: 'मालिक सदस्यता कैसे काम करती है?',
      faq3a: 'मशीनरी मालिक 125 गाँवों से बुकिंग पाने के लिए ₹149/माह की फ्लैट सदस्यता लेते हैं। पहले 7 दिन पूरी तरह निःशुल्क हैं। कमाई से कोई कमीशन नहीं कटता।',
      faq4q: 'जत तालुका के कौन से गाँव सेवा में शामिल हैं?',
      faq4a: 'GoMate जत तालुका के सभी 125 गाँवों में सेवा देता है, जिसमें जत सेंटर, शेगांव, संख, उमदी, डफळापुर, बिलूर, बाज, मडग्याळ आदि शामिल हैं।',
      footerTagline: 'WhatsApp मशीनरी बाजार — जत तालुका, सांगली (PIN 416404)।',
      footerCopy: '© 2026 GoMate Marketplace. सर्वाधिकार सुरक्षित।',
      mobileStickyWa: 'WhatsApp पर उपलब्ध मशीनरी खोजें'
    }
  };

  /* Extract Marathi from DOM as default truth */
  const mr = {};
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    mr[el.dataset.i18n] = el.textContent.trim();
  });
  document.querySelectorAll('[data-i18n-html]').forEach((el) => {
    mr[el.dataset.i18nHtml] = el.innerHTML.trim();
  });
  copy.mr = mr;

  /* WhatsApp prefill message template per language */
  const whatsAppMessages = {
    hi: {
      general: 'नमस्ते GoMate! मुझे जत तालुका में मशीनरी चाहिए।\n\n• मशीन: \n• गाँव: \n• तारीख: \n• समय (घंटे): ',
      tractor: 'नमस्ते GoMate! मुझे जत तालुका में ट्रैक्टर या कृषि उपकरण चाहिए।\n\n• मशीन: ट्रैक्टर\n• गाँव: \n• तारीख: \n• समय: ',
      jcb: 'नमस्ते GoMate! मुझे जत तालुका में JCB या मिट्टी खुदाई मशीन चाहिए।\n\n• मशीन: JCB 3DX\n• गाँव: \n• काम: \n• तारीख: ',
      transport: 'नमस्ते GoMate! मुझे जत तालुका में माल परिवहन वाहन चाहिए।\n\n• वाहन: टाटा एस / पिकअप\n• गाँव: \n• तारीख: \n• सामान: '
    },
    mr: {
      general: 'नमस्कार GoMate! मला जत तालुक्यात मशिनरी भाड्याने हवी आहे.\n\n• मशिन: \n• गाव: \n• तारीख: \n• वेळ (तास): ',
      tractor: 'नमस्कार GoMate! मला जत तालुक्यात ट्रॅक्टर किंवा शेती औजार हवे आहे.\n\n• मशिन: ट्रॅक्टर\n• गाव: \n• तारीख: \n• वेळ: ',
      jcb: 'नमस्कार GoMate! मला जत तालुक्यात JCB किंवा माती कामाचे मशिन हवे आहे.\n\n• मशिन: JCB 3DX\n• गाव: \n• काम: \n• तारीख: ',
      transport: 'नमस्कार GoMate! मला जत तालुक्यात मालवाहतूक वाहन हवे आहे.\n\n• वाहन: छोटा हत्ती / पिकअप\n• गाव: \n• तारीख: \n• सामान: '
    },
    en: {
      general: 'Hi GoMate! I need to rent equipment in Jath Taluka.\n\n• Machine: \n• Village: \n• Date: \n• Duration (Hours): ',
      tractor: 'Hi GoMate! I need a Tractor or farm machine in Jath Taluka.\n\n• Machine: Tractor\n• Village: \n• Date: \n• Duration: ',
      jcb: 'Hi GoMate! I need a JCB or earthmoving machine in Jath Taluka.\n\n• Machine: JCB 3DX\n• Village: \n• Work: \n• Date: ',
      transport: 'Hi GoMate! I need a Transport vehicle in Jath Taluka.\n\n• Vehicle: Mini Truck / Pickup\n• Village: \n• Date: \n• Goods: '
    },
    kn: {
      general: 'ನಮಸ್ಕಾರ GoMate! ನನಗೆ ಜತ್ ತಾಲ್ಲೂಕಿನಲ್ಲಿ ಯಂತ್ರ ಬಾಡಿಗೆಗೆ ಬೇಕು.\n\n• ಯಂತ್ರ: \n• ಹಳ್ಳಿ: \n• ದಿನಾಂಕ: \n• ಅವಧಿ (ಗಂಟೆ): ',
      tractor: 'ನಮಸ್ಕಾರ GoMate! ನನಗೆ ಜತ್ ತಾಲ್ಲೂಕಿನಲ್ಲಿ ಟ್ರ್ಯಾಕ್ಟರ್ ಅಥವಾ ಕೃಷಿ ಯಂತ್ರ ಬೇಕು.\n\n• ಯಂತ್ರ: ಟ್ರ್ಯಾಕ್ಟರ್\n• ಹಳ್ಳಿ: \n• ದಿನಾಂಕ: \n• ಅವಧಿ: ',
      jcb: 'ನಮಸ್ಕಾರ GoMate! ನನಗೆ ಜತ್ ತಾಲ್ಲೂಕಿನಲ್ಲಿ JCB ಅಥವಾ ಮಣ್ಣು ಅಗೆಯುವ ಯಂತ್ರ ಬೇಕು.\n\n• ಯಂತ್ರ: JCB 3DX\n• ಹಳ್ಳಿ: \n• ಕೆಲಸ: \n• ದಿನಾಂಕ: ',
      transport: 'ನಮಸ್ಕಾರ GoMate! ನನಗೆ ಜತ್ ತಾಲ್ಲೂಕಿನಲ್ಲಿ ಸಾರಿಗೆ ವಾಹನ ಬೇಕು.\n\n• ವಾಹನ: ಮಿನಿ ಟ್ರಕ್ / ಪಿಕಪ್\n• ಹಳ್ಳಿ: \n• ದಿನಾಂಕ: \n• ಸರಕು: '
    }
  };

  const pageMeta = {
    hi: {
      title: 'GoMate — WhatsApp पर ट्रैक्टर, JCB और वाहन किराए पर लें | जत तालुका',
      desc: 'जत तालुका में WhatsApp पर मशीनरी खोजें। पास के मालिक से सीधे बात करें और बुकिंग से पहले कीमत साफ जानें।'
    },
    mr: {
      title: 'GoMate — जत तालुक्यात WhatsApp वर ट्रॅक्टर, जेसीबी व वाहतूक भाड्याने मिळवा',
      desc: 'जत तालुक्यात WhatsApp वर मशिनरी शोधा. जवळच्या मालकाशी थेट बोला आणि बुकिंगपूर्वी दर स्पष्ट करा.'
    },
    en: {
      title: 'GoMate — Rent Tractors, JCBs & Transport on WhatsApp | Jath Taluka',
      desc: 'Direct machinery rental marketplace for Jath Taluka (Sangli). Book verified tractors, JCBs, and trucks at hourly rates on WhatsApp.'
    },
    kn: {
      title: 'GoMate — WhatsApp ನಲ್ಲಿ ಟ್ರ್ಯಾಕ್ಟರ್, JCB ಮತ್ತು ವಾಹನ ಬಾಡಿಗೆ | ಜತ್ ತಾಲ್ಲೂಕು',
      desc: 'ಜತ್ ತಾಲ್ಲೂಕಿನ (ಸಾಂಗ್ಲಿ) 125 ಹಳ್ಳಿಗಳಿಗಾಗಿ WhatsApp ನಲ್ಲಿ ನೇರ ಯಂತ್ರ ಬಾಡಿಗೆ ಸೇವೆ. 0% ಕಮಿಷನ್, ನಿಗದಿತ ಗಂಟೆಯ ದರಗಳು.'
    }
  };

  function applyLanguage(lang) {
    if (!VALID_LANGS.includes(lang)) lang = 'mr';
    const dict = copy[lang] || copy.mr;
    const waTemplates = whatsAppMessages[lang] || whatsAppMessages.mr;

    document.documentElement.lang = lang;

    // 1. Text elements
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.dataset.i18n;
      if (dict[key] !== undefined && dict[key] !== '') {
        el.textContent = dict[key];
      }
    });

    // 2. HTML elements
    document.querySelectorAll('[data-i18n-html]').forEach((el) => {
      const key = el.dataset.i18nHtml;
      if (dict[key] !== undefined && dict[key] !== '') {
        el.innerHTML = dict[key];
      }
    });

    // 3. Update WhatsApp links
    document.querySelectorAll('[data-whatsapp]').forEach((link) => {
      const category = link.dataset.whatsapp;
      const msg = waTemplates[category] || waTemplates.general;
      link.href = 'https://wa.me/918605470552?text=' + encodeURIComponent(msg);
    });

    // Also update main hero and nav WhatsApp buttons if present
    document.querySelectorAll('.btn-hero-primary, .nav-btn-primary, .btn-sticky-wa').forEach((link) => {
      if (!link.hasAttribute('data-whatsapp')) {
        link.href = 'https://wa.me/918605470552?text=' + encodeURIComponent(waTemplates.general);
      }
    });

    // 4. Update Tab Switcher UI state
    document.querySelectorAll('.lang-tab-btn').forEach((btn) => {
      const isSelected = btn.dataset.lang === lang;
      btn.classList.toggle('active', isSelected);
      btn.setAttribute('aria-pressed', String(isSelected));
    });

    // 5. Update SEO Title & Meta
    if (pageMeta[lang]) {
      document.title = pageMeta[lang].title;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute('content', pageMeta[lang].desc);
    }

    // 6. Persist to localStorage
    try {
      localStorage.setItem('gomate-landing-language', lang);
    } catch (e) {
      /* ignore quota errors */
    }
  }

  // Wire up tab button clicks
  document.querySelectorAll('.lang-tab-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      applyLanguage(btn.dataset.lang);
    });
  });

  // Initialize from localStorage or default to Marathi
  let initial = 'mr';
  try {
    const saved = localStorage.getItem('gomate-landing-language');
    if (saved && VALID_LANGS.includes(saved)) {
      initial = saved;
    }
  } catch (e) {}

  applyLanguage(initial);
})();
