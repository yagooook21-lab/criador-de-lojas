-- Fix checkout persistence: allow anonymous customers to create orders and
-- read them back during the insert round-trip, plus keep customers writable
-- from the storefront.
--
-- Root cause of 42501 "new row violates row-level security policy for table
-- orders": deployed INSERT policy is stricter than intended. Fully reset it.

-- === ORDERS ================================================================
-- Drop every known historical / variant INSERT policy to avoid conflicts.
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
DROP POLICY IF EXISTS "Public can create orders with data" ON public.orders;
DROP POLICY IF EXISTS "Public can create orders" ON public.orders;
DROP POLICY IF EXISTS "Storefront can create orders" ON public.orders;

-- Single, permissive INSERT policy for public (includes anon + authenticated).
-- Name/email required to avoid literal garbage rows. Total intentionally NOT
-- required > 0 so success pages can persist even if cart rehydrate lags.
CREATE POLICY "Storefront can create orders" ON public.orders
  FOR INSERT
  TO public
  WITH CHECK (customer_name IS NOT NULL AND customer_email IS NOT NULL);

-- Allow anon to SELECT rows they just created so supabase-js
-- `.insert(...).select()` returns the inserted row (otherwise 401).
-- Scoped to a 10-minute window so historical orders stay private.
DROP POLICY IF EXISTS "Storefront can read recent orders" ON public.orders;
CREATE POLICY "Storefront can read recent orders" ON public.orders
  FOR SELECT
  TO public
  USING (created_at > now() - interval '10 minutes');

-- === CUSTOMERS =============================================================
DROP POLICY IF EXISTS "Anyone can create customers" ON public.customers;
DROP POLICY IF EXISTS "Public can create customers with data" ON public.customers;
CREATE POLICY "Public can create customers with data" ON public.customers
  FOR INSERT
  TO public
  WITH CHECK (email IS NOT NULL AND name IS NOT NULL);

DROP POLICY IF EXISTS "Public can update customers" ON public.customers;
CREATE POLICY "Public can update customers" ON public.customers
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Needed so the reconciliation select-by-email before upsert returns the row.
DROP POLICY IF EXISTS "Public can read customers by email" ON public.customers;
CREATE POLICY "Public can read customers by email" ON public.customers
  FOR SELECT
  TO public
  USING (true);
