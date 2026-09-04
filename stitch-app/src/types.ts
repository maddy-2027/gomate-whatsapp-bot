export type Language = 'en' | 'hi' | 'mr' | 'kn';

export type ScreenTab = 'explore' | 'bookings' | 'estimator' | 'receipt' | 'owner-pro';

export interface MachineryItem {
  id: string;
  category: 'farm' | 'jcb' | 'transport';
  name: string;
  nameLocal?: string;
  rate: number;
  rateRange?: string;
  desc: string;
  specs: string[];
  imageUrl?: string;
  iconName: string;
  isPopular?: boolean;
}

export interface ReviewItem {
  id: string;
  author: string;
  role: string;
  village: string;
  initials: string;
  rating: number;
  comment: string;
  verified: boolean;
}

export interface DispatchBooking {
  id: string;
  equipment: string;
  customerName: string;
  customerPhone?: string;
  village: string;
  hours: number;
  rentalAmount: number;
  platformFee: number;
  status: 'In Progress' | 'Completed' | 'Confirmed' | 'Scheduled';
  date: string;
  operatorName: string;
  operatorPhone: string;
  operatorRating: number;
  operatorVehicle: string;
  operatorAvatar?: string;
  currentStep: number; // 1 to 4
  etaMinutes?: number;
}

export interface FAQItem {
  question: string;
  questionMr?: string;
  answer: string;
  answerMr?: string;
}
