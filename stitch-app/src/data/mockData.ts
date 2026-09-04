import { MachineryItem, ReviewItem, DispatchBooking, FAQItem } from '../types';

export const HERO_IMAGE = 'https://lh3.googleusercontent.com/aida-public/AB6AXuD1LVyGGQyj5p3r4TcdKQx0P-hRysbEgotZLwmMpqi1Tw7umgSO47G58ZrEXB9iq6j51WZ9cZQNTziik8aS0eyEtRvSm6WxlpO1oplqNAuxtPvGXRTfbjdqk4Sah4u-Lato5oonvUiQsEUEyrwo3vjGU8nkJFH0sNyt4u4by-EW8SC89rj0SKkpED4EsuSsoWLjSo7RK70NBGxnHfeU3xg2g0wpt8yXZfy-GZnTYSRFtOW-M_p-J56D';

export const OPERATOR_IMAGE = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAFy94-rWuQsOMf5uIQTzcAioc-Q-Z_FQuAOu8YBkeyDKRyQy8HYJy5eaFrjuq628EdnLM9gF7RpuNQfXT8whnKBpfrFY3D_qXAcpLVQ-SXGEN1lbGvhvD8jK0Kdy0SBR-6z30TS9XWuDIQCA970esZLRCMKcGFDljaMggAxrJ8K7AVJkViP08OHz3fBGYIkCQ-8E65sBB5xXaFFWDbGr8XUCnbn-qrkt0613TZbsflr_fm8yPgxHCF';

export const WHATSAPP_NUMBER = '+918605470552';

export const POPULAR_MACHINERY: MachineryItem[] = [
  {
    id: 'f1',
    category: 'farm',
    name: 'Tractor & Farm Machinery',
    nameLocal: 'ट्रॅक्टर व शेती अवजारे',
    rate: 450,
    rateRange: '₹450–₹600/hr',
    desc: 'Rotavator, Cultivator, Harvester, Drones',
    specs: ['Rotavator', 'Cultivator', 'Harvester', 'Spraying Drones'],
    iconName: 'agriculture',
    isPopular: true
  },
  {
    id: 'j1',
    category: 'jcb',
    name: 'JCB & Earthmoving',
    nameLocal: 'जेसीबी व मातीकाम',
    rate: 950,
    rateRange: '₹950/hr',
    desc: '3DX Backhoe, Farm Pond, Levelling',
    specs: ['3DX Backhoe', 'Farm Pond Excavation', 'Land Levelling'],
    iconName: 'construction',
    isPopular: true
  },
  {
    id: 't1',
    category: 'transport',
    name: 'Transport Vehicles',
    nameLocal: 'मालवाहतूक वाहने',
    rate: 450,
    rateRange: '₹350–₹700/hr',
    desc: 'Tata Ace (छोटा हत्ती), Pickup, 4-Ton Truck',
    specs: ['Tata Ace (छोटा हत्ती)', 'Bolero Pickup', '4-Ton Commercial Truck'],
    iconName: 'local_shipping',
    isPopular: true
  }
];

export const ESTIMATOR_MACHINERY: Record<'farm' | 'jcb' | 'transport', MachineryItem[]> = {
  farm: [
    {
      id: 'f1',
      category: 'farm',
      name: '50HP Tractor + Rotavator',
      rate: 450,
      desc: 'Ideal for medium tillage & puddling',
      specs: ['50 HP Engine', 'Rotavator included', 'Diesel included'],
      iconName: 'agriculture'
    },
    {
      id: 'f2',
      category: 'farm',
      name: 'Cultivator & Harrow',
      rate: 500,
      desc: 'Deep soil turning & seedbed prep',
      specs: ['9 Tyne Cultivator', 'Disc Harrow', 'Operator provided'],
      iconName: 'agriculture'
    },
    {
      id: 'f3',
      category: 'farm',
      name: 'Combine Harvester',
      rate: 600,
      desc: 'Fast grain harvesting & threshing',
      specs: ['Multi-crop cutting', 'High speed threshing'],
      iconName: 'agriculture'
    }
  ],
  jcb: [
    {
      id: 'j1',
      category: 'jcb',
      name: 'JCB 3DX Backhoe Loader',
      rate: 850,
      desc: 'Earthmoving, loading & trenching',
      specs: ['0.24 cu.m bucket', 'Heavy duty arm', 'Operator with diesel'],
      iconName: 'construction'
    },
    {
      id: 'j2',
      category: 'jcb',
      name: 'Mini Excavator (3 Ton)',
      rate: 750,
      desc: 'Precision digging in tight spaces',
      specs: ['Rubber tracks', 'Narrow canal & farm trenching'],
      iconName: 'construction'
    }
  ],
  transport: [
    {
      id: 't1',
      category: 'transport',
      name: 'Mini Tractor Trolley (3 Ton)',
      rate: 350,
      desc: 'Crop transport & manure hauling',
      specs: ['Hydraulic tipping', '3-ton payload', 'Local village transit'],
      iconName: 'local_shipping'
    },
    {
      id: 't2',
      category: 'transport',
      name: 'Mahindra Supro Cargo',
      rate: 400,
      desc: 'Fast road transport to local mandis',
      specs: ['Covered body', '1.2-ton payload', 'Mandi deliveries'],
      iconName: 'local_shipping'
    },
    {
      id: 't3',
      category: 'transport',
      name: 'Tata Ace (छोटा हत्ती)',
      rate: 450,
      desc: 'Quick village farm pickup & delivery',
      specs: ['Agile transport', '850kg capacity'],
      iconName: 'local_shipping'
    }
  ]
};

export const REVIEWS: ReviewItem[] = [
  {
    id: 'r1',
    author: 'Ramesh Patil',
    role: 'Grape & Pomegranate Grower',
    village: 'Shegaon, Jath',
    initials: 'RP',
    rating: 5,
    comment: 'Needed a rotavator urgently ahead of sowing. Sent one message on WhatsApp and connected with a tractor owner in Shegaon within 20 minutes. Machine arrived on time at ₹450/hr.',
    verified: true
  },
  {
    id: 'r2',
    author: 'Suresh Shinde',
    role: 'Soybean & Bajra Farmer',
    village: 'Sankh, Jath',
    initials: 'SS',
    rating: 5,
    comment: 'Booked 3 hours of deep ploughing for soybean sowing. Hourly rate was clear up front without any broker margin. The driver knew our soil conditions well.',
    verified: true
  },
  {
    id: 'r3',
    author: 'Tukaram Mali',
    role: 'Horticulture Producer',
    village: 'Umadi, Jath',
    initials: 'TM',
    rating: 5,
    comment: 'Secured a JCB 3DX promptly for farm pond excavation. Shared village location on WhatsApp and the booking was verified immediately. Straightforward and reliable.',
    verified: true
  }
];

export const FAQS: FAQItem[] = [
  {
    question: 'How do I book equipment on WhatsApp?',
    questionMr: 'मी WhatsApp वर मशीन कशी बुक करू शकतो?',
    answer: 'Send "Hi" to our WhatsApp number (+91 86054 70552). Select your preferred language, choose your machine category, and share your village name. The bot displays nearby verified units in under 2 minutes.',
    answerMr: 'आमच्या WhatsApp नंबरवर (+91 86054 70552) "Hi" पाठवा. भाषा निवडा, मशीनचा प्रकार सांगा आणि गावाचे नाव पाठवा. 2 मिनिटांत जवळचे उपलब्ध ऑपरेटर मिळतील.'
  },
  {
    question: 'Is there any commission charged to farmers?',
    questionMr: 'शेतकऱ्यांना काही कमिशन किंवा दलाली द्यावी लागते का?',
    answer: 'No. Customer bookings carry 0% brokerage commission. You pay the transparent hourly hire rate directly to the operator upon delivery, plus a nominal ₹49 platform protection fee.',
    answerMr: 'नाही. कोणत्याही दलाल किंवा मध्यस्थांची गरज नाही. आपण थेट ऑपरेटरला ठरलेला प्रतितास दर आणि फक्त ₹49 प्लॅटफॉर्म संरक्षण शुल्क भरता.'
  },
  {
    question: 'Which villages in Jath Taluka are serviced?',
    questionMr: 'जत तालुक्यातील कोणती गावे समाविष्ट आहेत?',
    answer: 'GoMate services all 125 villages across Jath Taluka including Jath Centre, Shegaon, Sankh, Umadi, Dafalapur, Bilur, Madgyal, and surrounding clusters in Sangli district (PIN 416404).',
    answerMr: 'गोमेट जत तालुक्यातील सर्व 125 गावांमध्ये सेवा पुरवते जसे की जत शहर, शेगाव, संख, उमदी, डफळापूर, बिलूर, मदग्याळ आणि सांगली जिल्ह्यातील सर्व ग्रामीण भाग.'
  }
];

export const INITIAL_DISPATCHES: DispatchBooking[] = [
  {
    id: '#BK-9482',
    equipment: 'Mahindra 575 DI (Tractor)',
    customerName: 'Rameshwar Prasad',
    customerPhone: '+91 94234 11029',
    village: 'Sultanpur',
    hours: 4.5,
    rentalAmount: 3600,
    platformFee: 49,
    status: 'In Progress',
    date: 'Today, 08:30 AM',
    operatorName: 'Tukaram Patil',
    operatorPhone: '+91 98765 43210',
    operatorRating: 4.9,
    operatorVehicle: 'Mahindra 575 DI • Agri Tractor',
    operatorAvatar: OPERATOR_IMAGE,
    currentStep: 2,
    etaMinutes: 18
  },
  {
    id: '#BK-9481',
    equipment: 'JCB 3DX (Backhoe)',
    customerName: 'Sukhdev Singh',
    customerPhone: '+91 98220 54123',
    village: 'Fatehpur',
    hours: 6.0,
    rentalAmount: 7200,
    platformFee: 49,
    status: 'Completed',
    date: 'Yesterday',
    operatorName: 'Suresh Shinde',
    operatorPhone: '+91 98221 78901',
    operatorRating: 4.8,
    operatorVehicle: 'JCB 3DX Backhoe Loader',
    currentStep: 4
  },
  {
    id: '#BK-9479',
    equipment: 'Swaraj 855 FE (Tractor)',
    customerName: 'Jagdish Patel',
    customerPhone: '+91 97631 89234',
    village: 'Chandpur',
    hours: 3.0,
    rentalAmount: 2400,
    platformFee: 49,
    status: 'Confirmed',
    date: 'Yesterday',
    operatorName: 'Anil Jadhav',
    operatorPhone: '+91 99223 45678',
    operatorRating: 4.9,
    operatorVehicle: 'Swaraj 855 FE',
    currentStep: 1
  },
  {
    id: '#BK-9475',
    equipment: 'Mahindra 575 DI (Tractor)',
    customerName: 'Mahesh Verma',
    customerPhone: '+91 98902 34567',
    village: 'Lalganj',
    hours: 5.0,
    rentalAmount: 4000,
    platformFee: 49,
    status: 'Completed',
    date: '2 Sep 2026',
    operatorName: 'Santosh Kadam',
    operatorPhone: '+91 98811 23456',
    operatorRating: 4.7,
    operatorVehicle: 'Mahindra 575 DI',
    currentStep: 4
  },
  {
    id: '#BK-9470',
    equipment: 'JCB 3DX (Backhoe)',
    customerName: 'Vikram Yadav',
    customerPhone: '+91 98500 87654',
    village: 'Basantpur',
    hours: 8.0,
    rentalAmount: 9600,
    platformFee: 49,
    status: 'Completed',
    date: '1 Sep 2026',
    operatorName: 'Suresh Shinde',
    operatorPhone: '+91 98221 78901',
    operatorRating: 4.8,
    operatorVehicle: 'JCB 3DX Backhoe Loader',
    currentStep: 4
  },
  {
    id: '#BK-9465',
    equipment: 'Tata Ace (छोटा हत्ती)',
    customerName: 'Hanumant Pawar',
    customerPhone: '+91 94220 99887',
    village: 'Shegaon',
    hours: 4.0,
    rentalAmount: 1800,
    platformFee: 49,
    status: 'Completed',
    date: '31 Aug 2026',
    operatorName: 'Pravin Gaikwad',
    operatorPhone: '+91 98600 11223',
    operatorRating: 4.9,
    operatorVehicle: 'Tata Ace Gold',
    currentStep: 4
  }
];

export const JATH_VILLAGES = [
  'Shegaon', 'Sankh', 'Umadi', 'Dafalapur', 'Bilur', 'Madgyal', 
  'Jath Centre', 'Daribadachi', 'Muchandi', 'Guddapur', 'Valsang', 
  'Birnal', 'Kalloti', 'Morabgi', 'Tikota Border'
];
