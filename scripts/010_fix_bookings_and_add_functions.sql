-- Add missing columns to bookings table
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS confirmed_at timestamp with time zone;

-- Create function to update customer statistics
CREATE OR REPLACE FUNCTION public.update_customer_stats(p_customer_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.customers
  SET 
    total_bookings = (
      SELECT COUNT(*) 
      FROM public.bookings 
      WHERE customer_id = p_customer_id 
      AND status = 'confirmed'
    ),
    total_spent = (
      SELECT COALESCE(SUM(price), 0) 
      FROM public.bookings 
      WHERE customer_id = p_customer_id 
      AND status = 'confirmed'
    ),
    updated_at = NOW()
  WHERE id = p_customer_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.update_customer_stats(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_customer_stats(uuid) TO service_role;
