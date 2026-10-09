export interface ServiceCategory {
  id: string;
  tenant_id?: string;
  name: string;
  created_at?: string;
}

export interface Service {
  id: string;
  tenant_id?: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  is_active: boolean;
  image_url?: string;
  icon_name?: string;
  category_id?: string;
  category?: ServiceCategory;
  created_at: string;
}

export type BookingConfirmationMode = 'automatic' | 'manual';
export type TenantUserRole = 'admin' | 'staff';

export interface Tenant {
  id: string;
  name: string;
  domain: string;
  logo_url?: string;
  theme_color?: string;
  whatsapp_number?: string;
  address?: string;
  business_hours?: string;
  google_maps_url?: string;
  email_notifications_active?: boolean;
  booking_confirmation_mode?: BookingConfirmationMode;
  created_at: string;
  updated_at: string;
}

export interface Barber {
  id: string;
  tenant_id?: string;
  name: string;
  email?: string;
  avatar_url?: string;
  specialty?: string;
  bio?: string;
  rating?: number;
  is_active?: boolean;
  created_at: string;
}

export interface Availability {
  id: string;
  tenant_id?: string;
  barber_id?: string;
  day_of_week: number; // 0-6 (Sunday-Saturday)
  start_time: string; // Time string HH:MM:SS
  end_time: string;   // Time string HH:MM:SS
  is_active: boolean;
}

export interface Appointment {
  id: string;
  tenant_id?: string;
  barber_id?: string;
  client_id?: string;
  client_name: string;
  phone: string;
  date: string;
  time: string;
  service_id: string;
  service_name_snapshot: string;
  price_snapshot: number;
  duration_minutes_snapshot: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'in_progress' | 'completed' | 'expired';
  created_at: string;
  
  // Relations
  service?: Service;
  barber?: Barber;
}

export interface Client {
  id: string;
  tenant_id?: string;
  name: string;
  phone: string;
  private_notes?: string;
  created_at: string;
  
  // Client Stats
  ltv?: number;
  total_visits?: number;
}

export interface BookingFormInput {
  slug: string;
  clientName: string;
  phone: string;
  date: string;
  time: string;
  serviceId: string;
  barberId: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
  reason?: 'past' | 'booked' | null;
}

export interface GalleryImage {
  id: string;
  tenant_id: string;
  image_url: string;
  caption?: string;
  created_at: string;
}
