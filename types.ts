
export interface Service {
  id: string;
  name: string;
  price: number;
  durationMin: number;
  description: string;
}

export interface WorkDay {
  dayOfWeek: number; // 0 = Domingo, 1 = Segunda, etc.
  isOpen: boolean;
  start: string; // "09:00"
  end: string;   // "18:00"
  lunchStart?: string;
  lunchEnd?: string;
}

export interface Professional {
  id: string;
  unitId?: string; // ID da unidade a qual pertence
  unitName?: string; // Nome da unidade para exibição fácil
  name: string;
  role: string;
  photoUrl: string;
  schedule?: WorkDay[];
}

export interface Review {
  id: string;
  author: string;
  rating: number; // 1-5
  comment: string;
  date: string;
}

export interface Subscription {
  id: string;
  name: string;
  price: number;
  benefits: string[];
}

export interface UnitSettings {
  unitId: string;
  webhookUrl: string;
  googleCalendarApiKey: string;
  calendarId: string;
  notificationEmail: string;
  autoConfirm: boolean;
}

export interface BarberUnit {
  id: string;
  name: string;
  address: string;
  rating: number;
  imageUrl: string;
  coordinates: { lat: number; lng: number };
  description: string;
  phone: string;
  openingHours: string;
  services: Service[];
  professionals: Professional[];
  subscriptions: Subscription[];
  reviews: Review[];
}

export interface CartItem {
  id: string;
  service: Service;
  professional: Professional | null; // null represents "Sem preferência"
  date: Date;
  time: string;
  unitName: string;
  price: number;
}

export enum ViewState {
  LANDING = 'LANDING',
  CLIENT_LIST = 'CLIENT_LIST',
  CLIENT_UNIT = 'CLIENT_UNIT',
  ADMIN = 'ADMIN',
  CART = 'CART',
  LOGIN = 'LOGIN'
}

export enum UnitTab {
  SERVICES = 'Serviços',
  DETAILS = 'Detalhes',
  PROFESSIONALS = 'Profissionais',
  SUBSCRIPTIONS = 'Assinaturas',
  REVIEWS = 'Avaliações'
}
