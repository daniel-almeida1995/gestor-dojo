export interface HistoryEntry {
  date: string;
  type: 'degree' | 'belt';
  description: string;
}

export interface Student {
  id: string;
  name: string;
  avatar: string;
  belt: string;
  beltColor: string; // Hex code or tailwind class
  modality: string;
  status: 'active' | 'pending' | 'inactive' | 'payment_issue';
  classesAttended?: number;
  phone?: string; // Added for WhatsApp integration
  degrees?: number; // Added for belt stripes/degrees (0-4)
  history?: HistoryEntry[];
  dueDay?: number; // Frontend mapped
  due_day?: number; // DB column
  monthlyFee?: number; // Frontend mapped
  monthly_fee?: number; // DB column
  lastPaymentDate?: string; // Frontend mapped
  last_payment_date?: string; // DB column
}

export interface Payment {
  id: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  payment_method?: string; // From DB column
  paymentMethod?: 'pix' | 'cash' | 'card'; // Legacy/Frontend mapping
  reference_month?: string; // DB column
  paid_at?: string; // DB column

  // Legacy fields to be maintained or optional
  studentId?: string;
  student_id?: string; // DB column
  description?: string;
  date?: string;
  type?: 'tuition' | 'product' | 'seminar';

  // Relations
  students?: {
    id: string;
    name: string;
    avatar?: string;
    belt_color?: string;
  };
  // Legacy relation prop
  student?: {
    name: string;
    avatar: string;
    beltColor?: string;
  };
}

export interface ClassSession {
  id: string;
  title: string;
  time: string;
  ampm: string;
  instructor: string;
  location: string;
  status: 'completed' | 'active' | 'upcoming' | 'waitlist';
  attendees: number;
  capacity?: number;
}

export interface Stat {
  label: string;
  value: string | number;
  change?: string;
  icon: any; // Lucide icon component
  color: string;
}

export interface OrganizationSettings {
  id: string;
  user_id: string;
  school_name: string;
  logo_url?: string;
  default_monthly_fee: number;
  default_due_day: number;
  currency_symbol: string;
}