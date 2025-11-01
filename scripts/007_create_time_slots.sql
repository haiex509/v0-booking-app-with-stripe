-- Create time_slots table for dynamic time slot management
CREATE TABLE IF NOT EXISTS public.time_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID REFERENCES public.production_packages(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday, 6 = Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_hours DECIMAL(4,2) NOT NULL DEFAULT 1.0, -- Duration in hours (e.g., 1.5 for 1.5 hours)
  max_capacity INTEGER NOT NULL DEFAULT 3,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Ensure start_time is before end_time
  CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_time_slots_package_id ON public.time_slots(package_id);
CREATE INDEX IF NOT EXISTS idx_time_slots_day_of_week ON public.time_slots(day_of_week);
CREATE INDEX IF NOT EXISTS idx_time_slots_is_active ON public.time_slots(is_active);

-- Create bookings table to track all bookings in Supabase
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID REFERENCES public.production_packages(id) ON DELETE SET NULL,
  time_slot_id UUID REFERENCES public.time_slots(id) ON DELETE SET NULL,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  price DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'refunded')),
  payment_intent_id TEXT UNIQUE,
  stripe_session_id TEXT,
  refund_id TEXT,
  refund_amount DECIMAL(10,2),
  refund_reason TEXT,
  refunded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for bookings
CREATE INDEX IF NOT EXISTS idx_bookings_package_id ON public.bookings(package_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON public.bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_intent ON public.bookings(payment_intent_id);

-- Enable Row Level Security
ALTER TABLE public.time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for time_slots
-- Public can view active time slots
CREATE POLICY "Public can view active time slots" ON public.time_slots
  FOR SELECT
  USING (is_active = true);

-- Authenticated users can view all time slots
CREATE POLICY "Authenticated users can view all time slots" ON public.time_slots
  FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can insert time slots
CREATE POLICY "Authenticated users can insert time slots" ON public.time_slots
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Authenticated users can update time slots
CREATE POLICY "Authenticated users can update time slots" ON public.time_slots
  FOR UPDATE
  TO authenticated
  USING (true);

-- Authenticated users can delete time slots
CREATE POLICY "Authenticated users can delete time slots" ON public.time_slots
  FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for bookings
-- Public can view their own bookings by email
CREATE POLICY "Users can view own bookings" ON public.bookings
  FOR SELECT
  USING (customer_email = current_setting('request.jwt.claims', true)::json->>'email');

-- Authenticated users can view all bookings
CREATE POLICY "Authenticated users can view all bookings" ON public.bookings
  FOR SELECT
  TO authenticated
  USING (true);

-- System can insert bookings (via service role)
CREATE POLICY "System can insert bookings" ON public.bookings
  FOR INSERT
  WITH CHECK (true);

-- Authenticated users can update bookings
CREATE POLICY "Authenticated users can update bookings" ON public.bookings
  FOR UPDATE
  TO authenticated
  USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_time_slots_updated_at
  BEFORE UPDATE ON public.time_slots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default time slots (9 AM - 5 PM, Monday-Friday)
INSERT INTO public.time_slots (day_of_week, start_time, end_time, duration_hours, max_capacity, is_active)
VALUES
  -- Monday
  (1, '09:00', '17:00', 1.0, 3, true),
  -- Tuesday
  (2, '09:00', '17:00', 1.0, 3, true),
  -- Wednesday
  (3, '09:00', '17:00', 1.0, 3, true),
  -- Thursday
  (4, '09:00', '17:00', 1.0, 3, true),
  -- Friday
  (5, '09:00', '17:00', 1.0, 3, true);

COMMENT ON TABLE public.time_slots IS 'Configurable time slots for booking availability';
COMMENT ON TABLE public.bookings IS 'All bookings with payment and refund tracking';
COMMENT ON COLUMN public.time_slots.day_of_week IS '0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday';
COMMENT ON COLUMN public.time_slots.duration_hours IS 'Duration of each booking slot in hours (e.g., 1.5 for 90 minutes)';
COMMENT ON COLUMN public.bookings.refund_amount IS 'Amount refunded (can be partial)';
