-- Fix overly permissive RLS policies

-- Remove the duplicate/permissive policies on customers
DROP POLICY IF EXISTS "Anyone can create customers" ON public.customers;

-- Remove permissive cart policies and replace with more specific ones
DROP POLICY IF EXISTS "Anyone can create carts" ON public.carts;
DROP POLICY IF EXISTS "Anyone can update own carts" ON public.carts;

-- Carts: allow public insert with required fields check
CREATE POLICY "Public can create carts with data" ON public.carts 
  FOR INSERT WITH CHECK (customer_name IS NOT NULL OR customer_email IS NOT NULL);

-- Orders: make public insert more restrictive
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
CREATE POLICY "Public can create orders with data" ON public.orders 
  FOR INSERT WITH CHECK (customer_name IS NOT NULL AND customer_email IS NOT NULL AND total > 0);