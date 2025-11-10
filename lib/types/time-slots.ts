export interface TimeSlot {
  id: string;
  package_id?: string;
  day_of_week: number; // 0 = Sunday, 6 = Saturday
  start_time: string; // HH:MM format
  end_time: string; // HH:MM format
  duration_hours: number;
  max_capacity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface Booking {
  id: string;
  package_id?: string;
  time_slot_id?: string;
  booking_date: string;
  booking_time: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  price: number;
  status: "pending" | "confirmed" | "cancelled" | "refunded";
  book_status: "pending" | "confirmed" | "cancelled" | "refunded";

  payment_intent_id?: string;
  stripe_session_id?: string;
  refund_id?: string;
  refund_amount?: number;
  refund_reason?: string;
  refunded_at?: string;
  created_at: string;
  updated_at: string;
}

export const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
