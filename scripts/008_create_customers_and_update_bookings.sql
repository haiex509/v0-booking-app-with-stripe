-- Create customers table to track all clients
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  total_bookings INTEGER DEFAULT 0,
  total_spent DECIMAL(10, 2) DEFAULT 0,
  notes TEXT
);

-- Update bookings table to reference customers
ALTER TABLE public.bookings 
  ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS customer_name TEXT,
  ADD COLUMN IF NOT EXISTS customer_email TEXT,
  ADD COLUMN IF NOT EXISTS customer_phone TEXT,
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
  ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

-- Create index for faster customer lookups
CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON public.bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_email ON public.bookings(customer_email);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);

-- Enable RLS on customers table
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for customers table
-- Public can insert (when making bookings)
CREATE POLICY "Anyone can create customer records" ON public.customers
  FOR INSERT
  WITH CHECK (true);

-- Authenticated users can read all customers
CREATE POLICY "Authenticated users can view customers" ON public.customers
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only admins can update/delete customers
CREATE POLICY "Admins can update customers" ON public.customers
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() 
      AND role IN ('super_admin', 'admin', 'manager')
      AND is_active = true
    )
  );

CREATE POLICY "Admins can delete customers" ON public.customers
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() 
      AND role IN ('super_admin', 'admin')
      AND is_active = true
    )
  );

-- Function to automatically create/update customer from booking
CREATE OR REPLACE FUNCTION public.upsert_customer_from_booking()
RETURNS TRIGGER AS $$
DECLARE
  v_customer_id UUID;
BEGIN
  -- Only process if we have customer email
  IF NEW.customer_email IS NOT NULL THEN
    -- Try to find existing customer
    SELECT id INTO v_customer_id
    FROM public.customers
    WHERE email = NEW.customer_email;
    
    -- If customer doesn't exist, create one
    IF v_customer_id IS NULL THEN
      INSERT INTO public.customers (email, name, phone)
      VALUES (NEW.customer_email, COALESCE(NEW.customer_name, 'Unknown'), NEW.customer_phone)
      RETURNING id INTO v_customer_id;
    ELSE
      -- Update existing customer info if provided
      UPDATE public.customers
      SET 
        name = COALESCE(NEW.customer_name, name),
        phone = COALESCE(NEW.customer_phone, phone),
        updated_at = NOW()
      WHERE id = v_customer_id;
    END IF;
    
    -- Link booking to customer
    NEW.customer_id := v_customer_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create customers from bookings
DROP TRIGGER IF EXISTS trigger_upsert_customer_from_booking ON public.bookings;
CREATE TRIGGER trigger_upsert_customer_from_booking
  BEFORE INSERT OR UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.upsert_customer_from_booking();

-- Function to update customer statistics
CREATE OR REPLACE FUNCTION public.update_customer_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update customer statistics when booking status changes
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE public.customers
    SET 
      total_bookings = (
        SELECT COUNT(*) 
        FROM public.bookings 
        WHERE customer_id = NEW.customer_id 
        AND status IN ('confirmed', 'completed')
      ),
      total_spent = (
        SELECT COALESCE(SUM(amount), 0)
        FROM public.bookings
        WHERE customer_id = NEW.customer_id
        AND status IN ('confirmed', 'completed')
      ),
      updated_at = NOW()
    WHERE id = NEW.customer_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update customer stats
DROP TRIGGER IF EXISTS trigger_update_customer_stats ON public.bookings;
CREATE TRIGGER trigger_update_customer_stats
  AFTER INSERT OR UPDATE OF status ON public.bookings
  FOR EACH ROW
  WHEN (NEW.customer_id IS NOT NULL)
  EXECUTE FUNCTION public.update_customer_stats();

-- Migrate existing bookings to create customer records
INSERT INTO public.customers (email, name, phone)
SELECT DISTINCT 
  customer_email,
  COALESCE(customer_name, 'Unknown'),
  customer_phone
FROM public.bookings
WHERE customer_email IS NOT NULL
  AND customer_email NOT IN (SELECT email FROM public.customers)
ON CONFLICT (email) DO NOTHING;

-- Link existing bookings to customers
UPDATE public.bookings b
SET customer_id = c.id
FROM public.customers c
WHERE b.customer_email = c.email
  AND b.customer_id IS NULL;

COMMENT ON TABLE public.customers IS 'Stores customer/client information for bookings';
COMMENT ON TABLE public.bookings IS 'Updated to include customer references and cancellation tracking';
