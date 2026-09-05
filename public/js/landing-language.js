(() => {
  /* ==========================================================================
     GoMate Landing Page – 4-Language Switcher
     Supported:
       1. hi (Hindi / हिंदी)
       2. mr (Marathi / मराठी - Default/Primary)
       3. en (English)
       4. kn (Kannada / ಕನ್ನಡ)
     ========================================================================== */

  const VALID_LANGS = ['hi', 'mr', 'en', 'kn'];

  const copy = {
    en: {
      serviceBar: 'Jath Taluka Pilot (PIN 416404): Serving all 125 villages across Sangli district via WhatsApp',
      navEquipment: 'Equipment',
      navTrust: 'Why GoMate',
      navFaq: 'FAQ',
      navRateCard: 'Rate Card',
      navOwner: 'List Machinery',
      navWaBtn: 'Book on WhatsApp',
      heroBadge: '📍 Jath Taluka Pilot • 125 Villages • 0% Broker Commission',
      heroTitle: 'Hire tractors, JCBs, and transport <span class="text-accent">on WhatsApp.</span>',
      heroSubEn: 'Direct machinery rental for rural India. Select machine, pick your village, and connect with verified local operators at flat hourly rates.',
      heroSubMr: 'No brokers, no hidden commission. Verified tractors, JCBs and goods transport in Jath Taluka directly on WhatsApp.',
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
      heroOwnerSublinkCta: 'List your fleet & earn ₹25,000+/mo →',
      trustEyebrow: 'Trust &amp; Reliability',
      trustDesc: 'Grounded in local community relationships, verified machinery profiles, and honest pricing.',
      trust1Title: 'Direct Local Operators',
      trust1Text: 'You connect directly with machine owners and drivers residing in Jath Taluka. No middleman broker inflating rates.',
      trust2Title: 'Clear Hourly Billing',
      trust2Text: 'Pay only for actual hours needed (2, 3, or 4 hours) instead of being forced into expensive full-day commitments.',
      trust3Title: '0% Renter Commission',
      trust3Text: 'Farmers pay exact owner rental rates plus a flat ₹49 platform protection fee. No hidden percentage commissions.',
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
      ownerDesc: 'List your machinery on GoMate and receive verified rental inquiries directly on WhatsApp from 125 villages. 7-day free trial, flat ₹599/month subscription, and 0% commission on your earnings.',
      ownerCta: 'Register Your Machinery →',
      ownerDash: 'Owner Pro Dashboard',
      faqEyebrow: 'Answers to Common Questions',
      faqDesc: 'Learn more about renting machinery or listing your fleet on GoMate.',
      faq1q: 'How do I book equipment on WhatsApp?',
      faq1a: 'Send “Hi” to our WhatsApp number (+91 86054 70552). Select your preferred language (Marathi, Hindi, English, or Kannada), choose your machine category, and share your village name. The bot displays nearby verified units and guides you through booking in under 2 minutes.',
      faq2q: 'Is there any commission charged to farmers or renters?',
      faq2a: 'No. Customer bookings carry 0% brokerage commission. You pay the transparent hourly hire rate directly to the operator upon delivery. A nominal ₹49 platform convenience and protection fee applies per confirmed booking.',
      faq3q: 'How does owner subscription work?',
      faq3a: 'Machinery owners pay a flat ₹599/month subscription to list their fleet and receive instant booking notifications directly on WhatsApp. The first 7 days are completely free. Zero commission is deducted from your rental revenue.',
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
      heroBadge: '📍 जत तालुका पायलट • 125 गाँव • 0% दलाल शुल्क',
      heroTitle: 'ट्रैक्टर, JCB और वाहन किराए पर लें <span class="text-accent">WhatsApp पर</span>',
      heroSubEn: 'ग्रामीण भारत के लिए सीधा मशीनरी किराया। मशीन चुनें, अपना गाँव बताएं, और तय प्रति घंटे की दर पर स्थानीय संचालकों से जुड़ें।',
      heroSubMr: 'कोई दलाल या कमीशन नहीं। जत तालुका के प्रमाणित ट्रैक्टर, जेसीबी और वाहन सीधे WhatsApp पर उपलब्ध।',
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
      heroOwnerSublinkCta: 'अपनी मशीनरी जोड़ें और ₹25,000+/माह कमाएं →',
      trustEyebrow: 'विश्वास और निर्भरता',
      trustDesc: 'स्थानीय संबंधों, सत्यापित मशीनरी और पारदर्शी प्रति घंटे दरों पर आधारित।',
      trust1Title: 'सीधे स्थानीय संचालक',
      trust1Text: 'आप सीधे जत तालुका के मशीन मालिकों से जुड़ते हैं। दर बढ़ाने वाला कोई बिचौलिया दलाल नहीं।',
      trust2Title: 'स्पष्ट प्रति घंटा बिलिंग',
      trust2Text: 'जितने घंटे काम (2, 3 या 4 घंटे) केवल उतना ही भुगतान करें, पूरे दिन का अनावश्यक खर्च नहीं।',
      trust3Title: '0% किरायेदार कमीशन',
      trust3Text: 'किसान केवल मालिक की तय दर और ₹49 सुरक्षा शुल्क देते हैं। कोई छिपा कमीशन नहीं।',
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
      ownerDesc: 'GoMate पर अपनी मशीनरी दर्ज करें और 125 गाँवों से WhatsApp पर सीधे बुकिंग पाएं। 7 दिन का मुफ्त ट्रायल, केवल ₹599/माह सदस्यता, कमाई पर 0% कमीशन।',
      ownerCta: 'अपनी मशीनरी दर्ज करें →',
      ownerDash: 'मालिक प्रो डैशबोर्ड',
      faqEyebrow: 'सामान्य प्रश्नों के उत्तर',
      faqDesc: 'मशीनरी किराए पर लेने या अपने वाहन को GoMate पर जोड़ने के बारे में जानें।',
      faq1q: 'WhatsApp पर मशीनरी कैसे बुक करें?',
      faq1a: 'हमारे WhatsApp नंबर (+91 86054 70552) पर “Hi” भेजें। अपनी भाषा (मराठी, हिंदी, English, या ಕನ್ನಡ) चुनें, मशीन श्रेणी चुनें और अपने गाँव का नाम बताएं। 2 मिनट में बुकिंग हो जाएगी।',
      faq2q: 'क्या किसानों या किराएदारों पर कोई कमीशन है?',
      faq2a: 'नहीं। किसानों से 0% दलाली ली जाती है। आप काम के बाद सीधे ऑपरेटर को भुगतान करते हैं। केवल ₹49 का सुविधा व सुरक्षा शुल्क लागू होता है।',
      faq3q: 'मालिक सदस्यता कैसे काम करती है?',
      faq3a: 'मशीनरी मालिक 125 गाँवों से बुकिंग पाने के लिए ₹599/माह की फ्लैट सदस्यता लेते हैं। पहले 7 दिन पूरी तरह निःशुल्क हैं। कमाई से कोई कमीशन नहीं कटता।',
      faq4q: 'जत तालुका के कौन से गाँव सेवा में शामिल हैं?',
      faq4a: 'GoMate जत तालुका के सभी 125 गाँवों में सेवा देता है, जिसमें जत सेंटर, शेगांव, संख, उमदी, डफळापुर, बिलूर, बाज, मडग्याळ आदि शामिल हैं।',
      footerTagline: 'WhatsApp मशीनरी बाजार — जत तालुका, सांगली (PIN 416404)।',
      footerCopy: '© 2026 GoMate Marketplace. सर्वाधिकार सुरक्षित।',
      mobileStickyWa: 'WhatsApp पर उपलब्ध मशीनरी खोजें'
    },
    kn: {
      serviceBar: 'ಜತ್ ತಾಲ್ಲೂಕು ಪೈಲಟ್ (PIN 416404): WhatsApp ಮೂಲಕ ಸಾಂಗ್ಲಿ ಜಿಲ್ಲೆಯ ಎಲ್ಲಾ 125 ಹಳ್ಳಿಗಳಲ್ಲಿ ಸೇವೆ ಲಭ್ಯ',
      navEquipment: 'ಯಂತ್ರೋಪಕರಣ',
      navTrust: 'GoMate ಏಕೆ',
      navFaq: 'ಪ್ರಶ್ನೋತ್ತರ',
      navRateCard: 'ದರ ಪಟ್ಟಿ',
      navOwner: 'ಯಂತ್ರ ದಾಖಲಿಸಿ',
      navWaBtn: 'WhatsApp ನಲ್ಲಿ ಬುಕ್ ಮಾಡಿ',
      heroBadge: '📍 ಜತ್ ತಾಲ್ಲೂಕು ಪೈಲಟ್ • 125 ಹಳ್ಳಿಗಳು • 0% ದಳ್ಳಾಳಿ ಕಮಿಷನ್',
      heroTitle: 'ಟ್ರ್ಯಾಕ್ಟರ್, JCB ಮತ್ತು ವಾಹನಗಳನ್ನು ಬಾಡಿಗೆಗೆ ಪಡೆಯಿರಿ <span class="text-accent">WhatsApp ನಲ್ಲಿ</span>',
      heroSubEn: 'ಗ್ರಾಮೀಣ ರೈತರಿಗಾಗಿ ನೇರ ಯಂತ್ರ ಬಾಡಿಗೆ ಸೇವೆ. ಯಂತ್ರ ಆಯ್ಕೆಮಾಡಿ, ನಿಮ್ಮ ಹಳ್ಳಿ ತಿಳಿಸಿ, ನಿಗದಿತ ಗಂಟೆಯ ದರದಲ್ಲಿ ಸ್ಥಳೀಯ ಮಾಲೀಕರೊಂದಿಗೆ ಸಂಪರ್ಕ ಸಾಧಿಸಿ.',
      heroSubMr: 'ಯಾವುದೇ ದಲ್ಲಾಳಿ ಅಥವಾ ಕಮಿಷನ್ ಇಲ್ಲ. ಜತ್ ತಾಲ್ಲೂಕಿನ ಪರಿಶೀಲಿತ ಟ್ರ್ಯಾಕ್ಟರ್, ಜೆಸಿಬಿ ಮತ್ತು ಸರಕು ವಾಹನಗಳು ನೇರವಾಗಿ WhatsApp ನಲ್ಲಿ.',
      tractorTitle: 'ಟ್ರ್ಯಾಕ್ಟರ್ ಮತ್ತು ಕೃಷಿ ಯಂತ್ರಗಳು',
      tractorSub: 'ರೋಟಾವೇಟರ್, ಕಲ್ಟಿವೇಟರ್, ಹಾರ್ವೆಸ್ಟರ್, ಕೃಷಿ ಡ್ರೋನ್',
      tractorRate: '₹450–₹600<small>/ಗಂಟೆ</small>',
      jcbTitle: 'ಜೆಸಿಬಿ ಮತ್ತು ಮಣ್ಣು ಅಗೆಯುವ ಕೆಲಸ',
      jcbSub: '3DX ಬ್ಯಾಕ್‌ಹೋ, ಕೃಷಿ ಕೊಳ, ಭೂಮಿ ಸಮತಟ್ಟು, ಎಕ್ಸ್ಕವೇಟರ್',
      jcbRate: '₹950<small>/ಗಂಟೆ</small>',
      transportTitle: 'ಸಾರಿಗೆ ವಾಹನಗಳು',
      transportSub: 'ಟಾಟಾ ಏಸ್ (ಚೋಟಾ ಹಾತಿ), ಪಿಕಪ್, 4-ಟನ್ ಟ್ರಕ್',
      transportRate: '₹350–₹700<small>/ಗಂಟೆ</small>',
      heroCtaPrimary: 'WhatsApp ನಲ್ಲಿ ಬುಕ್ ಮಾಡಿ →',
      heroCtaSecondary: 'ಸಂಪೂರ್ಣ ದರ ಪಟ್ಟಿ ನೋಡಿ',
      heroOwnerSublinkText: 'ನಿಮ್ಮ ಬಳಿ ಟ್ರ್ಯಾಕ್ಟರ್, JCB ಅಥವಾ ಮಿನಿ-ಟ್ರಕ್ ಇದೆಯೇ?',
      heroOwnerSublinkCta: 'ನಿಮ್ಮ ವಾಹನ ನೋಂದಾಯಿಸಿ ₹25,000+/ತಿಂಗಳು ಗಳಿಸಿ →',
      trustEyebrow: 'ನಂಬಿಕೆ ಮತ್ತು ವಿಶ್ವಾಸಾರ್ಹತೆ',
      trustDesc: 'ಸ್ಥಳೀಯ ರೈತರ ಬಾಂಧವ್ಯ, ಪರಿಶೀಲಿಸಿದ ಯಂತ್ರಗಳು ಮತ್ತು ಪಾರದರ್ಶಕ ಗಂಟೆಯ ದರದ ತಳಹದಿ.',
      trust1Title: 'ನೇರ ಸ್ಥಳೀಯ ನಿರ್ವಾಹಕರು',
      trust1Text: 'ನೀವು ನೇರವಾಗಿ ಜತ್ ತಾಲ್ಲೂಕಿನ ಯಂತ್ರ ಮಾಲೀಕರೊಂದಿಗೆ ಸಂಪರ್ಕ ಸಾಧಿಸುತ್ತೀರಿ. ದರ ಹೆಚ್ಚಿಸುವ ಮಧ್ಯವರ್ತಿಗಳಿಲ್ಲ.',
      trust2Title: 'ನಿಖರ ಗಂಟೆಯ ಬಿಲ್ಲಿಂಗ್',
      trust2Text: 'ನಿಮಗೆ ಬೇಕಾದ ಗಂಟೆಗಳಿಗೆ ಮಾತ್ರ (2, 3 ಅಥವಾ 4 ಗಂಟೆ) ಹಣ ಪಾವತಿಸಿ, ಪೂರ್ಣ ದಿನದ ಅನಗತ್ಯ ವೆಚ್ಚವಿಲ್ಲ.',
      trust3Title: '0% ರೈತರ ಕಮಿಷನ್',
      trust3Text: 'ರೈತರು ಕೇವಲ ಮಾಲೀಕರ ದರ ಮತ್ತು ₹49 ರಕ್ಷಣೆ ಶುಲ್ಕ ಪಾವತಿಸುತ್ತಾರೆ. ಯಾವುದೇ ಗುಪ್ತ ಕಮಿಷನ್ ಇಲ್ಲ.',
      trust4Title: '125 ಜತ್ ಹಳ್ಳಿಗಳ ವ್ಯಾಪ್ತಿ',
      trust4Text: 'ಜತ್, ಶೆಗಾಂವ್, ಸಂಖ್, ಉಮದಿ ಮತ್ತು ಡಫಳಾಪುರ ಸುತ್ತಲೂ ಯಂತ್ರಗಳ ಕ್ಲಸ್ಟರ್ ಇರುವುದರಿಂದ ಶೀಘ್ರ ಆಗಮನ.',
      reviewsEyebrow: 'ಸ್ಥಳೀಯ ಅನುಭವಗಳು',
      reviewsDesc: 'GoMate WhatsApp ಸಹಾಯಕದ ಮೂಲಕ ಯಂತ್ರ ಬಾಡಿಗೆ ಪಡೆದ ರೈತರ ನೈಜ ಅಭಿಪ್ರಾಯಗಳು.',
      review1Text: '“ಬಿತ್ತನೆಗೆ ಮುಂಚೆ ರೋಟಾವೇಟರ್ ತುರ್ತಾಗಿ ಬೇಕಿತ್ತು. WhatsApp ನಲ್ಲಿ ಒಂದು ಸಂದೇಶ ಕಳುಹಿಸಿದ 20 ನಿಮಿಷದಲ್ಲಿ ಶೆಗಾಂವ್ ಟ್ರ್ಯಾಕ್ಟರ್ ಮಾಲೀಕರ ಸಂಪರ್ಕವಾಯಿತು. ಯಂತ್ರ ಸಮಯಕ್ಕೆ ₹450/ಗಂಟೆಗೆ ಬಂದಿತು.”',
      review1Loc: 'ದ್ರಾಕ್ಷಿ ಮತ್ತು ದಾಳಿಂಬೆ ಬೆಳೆಗಾರ • ಶೆಗಾಂವ್, ಜತ್',
      review2Text: '“ಸೋಯಾಬೀನ್ ಉಳುಮೆಗೆ 3 ಗಂಟೆ ಬುಕ್ ಮಾಡಿದ್ದೆ. ಮುಂಚಿತವಾಗಿಯೇ ಗಂಟೆಯ ದರ ಸ್ಪಷ್ಟವಾಗಿತ್ತು. ಚಾಲಕನಿಗೆ ನಮ್ಮ ಮಣ್ಣಿನ ಬಗ್ಗೆ ಚೆನ್ನಾಗಿ ತಿಳಿದಿತ್ತು.”',
      review2Loc: 'ಸೋಯಾಬೀನ್ ಮತ್ತು ಸಜ್ಜೆ ರೈತ • ಸಂಖ್, ಜತ್',
      review3Text: '“ಕೃಷಿ ಹೊಂಡ ಅಗೆಯಲು JCB 3DX ತಕ್ಷಣವೇ ಸಿಕ್ಕಿತು. WhatsApp ನಲ್ಲಿ ಸ್ಥಳ ಹಂಚಿಕೊಂಡೆ ಮತ್ತು ಬುಕಿಂಗ್ ತಕ್ಷಣ ಖಚಿತವಾಯಿತು. ವಿಶ್ವಾಸಾರ್ಹ ಸೇವೆ.”',
      review3Loc: 'ತೋಟಗಾರಿಕೆ ಬೆಳೆಗಾರ • ಉಮದಿ, ಜತ್',
      ownerBadge: 'ಜತ್ ತಾಲ್ಲೂಕಿನ ಯಂತ್ರ ಮಾಲೀಕರಿಗಾಗಿ',
      ownerTitle: 'ನಿಮ್ಮ ಬಳಿ ಟ್ರ್ಯಾಕ್ಟರ್, JCB ಅಥವಾ ಸರಕು ವಾಹನ ಇದೆಯೇ?',
      ownerMr: 'जत तालुक्यातील ट्रॅक्टर, जेसीबी व वाहन मालकांसाठी नोंदणी',
      ownerDesc: 'GoMate ನಲ್ಲಿ ನಿಮ್ಮ ಯಂತ್ರ ದಾಖಲಿಸಿ ಮತ್ತು 125 ಹಳ್ಳಿಗಳಿಂದ WhatsApp ನಲ್ಲಿ ನೇರ ಬುಕಿಂಗ್ ಪಡೆಯಿರಿ. 7 ದಿನಗಳ ಉಚಿತ ಟ್ರಯಲ್, ಕೇವಲ ₹599/ತಿಂಗಳ ಚಂದಾದಾರಿಕೆ, ಗಳಿಕೆಯ ಮೇಲೆ 0% ಕಮಿಷನ್.',
      ownerCta: 'ನಿಮ್ಮ ಯಂತ್ರ ದಾಖಲಿಸಿ →',
      ownerDash: 'ಮಾಲೀಕರ ಪ್ರೋ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
      faqEyebrow: 'ಸಾಮಾನ್ಯ ಪ್ರಶ್ನೆಗಳಿಗೆ ಉತ್ತರಗಳು',
      faqDesc: 'ಯಂತ್ರ ಬಾಡಿಗೆ ಪಡೆಯುವುದು ಅಥವಾ ನಿಮ್ಮ ವಾಹನ ದಾಖಲಿಸುವ ಬಗ್ಗೆ ವಿವರ ತಿಳಿಯಿರಿ.',
      faq1q: 'WhatsApp ನಲ್ಲಿ ಯಂತ್ರವನ್ನು ಹೇಗೆ ಬುಕ್ ಮಾಡುವುದು?',
      faq1a: 'ನಮ್ಮ WhatsApp ಸಂಖ್ಯೆಗೆ (+91 86054 70552) “Hi” ಕಳುಹಿಸಿ. ನಿಮ್ಮ ಭಾಷೆ (ಮರಾಠಿ, ಹಿಂದಿ, English, ಅಥವಾ ಕನ್ನಡ) ಆಯ್ಕೆಮಾಡಿ, ಯಂತ್ರದ ವರ್ಗ ಮತ್ತು ನಿಮ್ಮ ಹಳ್ಳಿಯ ಹೆಸರು ತಿಳಿಸಿ. 2 ನಿಮಿಷದಲ್ಲಿ ಬುಕಿಂಗ್ ಆಗುತ್ತದೆ.',
      faq2q: 'ರೈತರು ಅಥವಾ ಬಾಡಿಗೆದಾರರಿಗೆ ಯಾವುದೇ ಕಮಿಷನ್ ಇದೆಯೇ?',
      faq2a: 'ಇಲ್ಲ. ರೈತರಿಗೆ 0% ದಲ್ಲಾಳಿ ಕಮಿಷನ್. ಕೆಲಸ ಮುಗಿದ ನಂತರ ನೇರವಾಗಿ ನಿರ್ವಾಹಕರಿಗೆ ಪಾವತಿಸಿ. ಕೇವಲ ₹49 ಫ್ಲಾಟ್‌ಫಾರ್ಮ್ ಶುಲ್ಕ ಅನ್ವಯಿಸುತ್ತದೆ.',
      faq3q: 'ಮಾಲೀಕರ ಚಂದಾದಾರಿಕೆ ಹೇಗೆ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ?',
      faq3a: 'ಯಂತ್ರ ಮಾಲೀಕರು 125 ಹಳ್ಳಿಗಳಿಂದ ನೇರ ಬುಕಿಂಗ್ ಪಡೆಯಲು ₹599/ತಿಂಗಳು ಪಾವತಿಸುತ್ತಾರೆ. ಮೊದಲ 7 ದಿನಗಳು ಉಚಿತ. ನಿಮ್ಮ ಗಳಿಕೆಯಲ್ಲಿ ಯಾವುದೇ ಕಮಿಷನ್ ಕಡಿತವಿಲ್ಲ.',
      faq4q: 'ಜತ್ ತಾಲ್ಲೂಕಿನ ಯಾವ ಹಳ್ಳಿಗಳು ಸೇವೆಯಲ್ಲಿವೆ?',
      faq4a: 'GoMate ಜತ್ ತಾಲ್ಲೂಕಿನ ಎಲ್ಲಾ 125 ಹಳ್ಳಿಗಳಿಗೂ ಸೇವೆ ನೀಡುತ್ತದೆ, ಇದರಲ್ಲಿ ಜತ್ ಪಟ್ಟಣ, ಶೆಗಾಂವ್, ಸಂಖ್, ಉಮದಿ, ಡಫಳಾಪುರ, ಬಿಳೂರು ಮುಂತಾದವು ಸೇರಿವೆ.',
      footerTagline: 'WhatsApp ಯಂತ್ರೋಪಕರಣ ಮಾರುಕಟ್ಟೆ — ಜತ್ ತಾಲ್ಲೂಕು, ಸಾಂಗ್ಲಿ (PIN 416404).',
      footerCopy: '© 2026 GoMate Marketplace. ಎಲ್ಲ ಹಕ್ಕುಗಳನ್ನು ಕಾಯ್ದಿರಿಸಲಾಗಿದೆ.',
      mobileStickyWa: 'WhatsApp ನಲ್ಲಿ ಲಭ್ಯವಿರುವ ಯಂತ್ರಗಳನ್ನು ಹುಡುಕಿ'
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
      desc: 'जत तालुका (सांगली) के 125 गाँवों के लिए WhatsApp पर सीधा मशीनरी किराया। 0% दलाली, तय प्रति घंटा दर।'
    },
    mr: {
      title: 'GoMate — जत तालुक्यात WhatsApp वर ट्रॅक्टर, जेसीबी व वाहतूक भाड्याने मिळवा',
      desc: 'जत तालुक्यातील 125 गावांसाठी WhatsApp वर थेट मशिनरी भाडेतत्वावर. 0% कमिशन, पारदर्शक तासांचे दर.'
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
