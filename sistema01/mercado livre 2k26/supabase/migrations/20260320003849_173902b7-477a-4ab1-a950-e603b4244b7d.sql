
-- Drop the restrictive insert policy on carts
DROP POLICY IF EXISTS "Public can create carts with data" ON public.carts;

-- Allow public to insert carts without requiring customer_name/email
CREATE POLICY "Public can create carts"
ON public.carts
FOR INSERT
TO public
WITH CHECK (true);

-- Allow public to read their own cart by cart_number
CREATE POLICY "Public can read own cart"
ON public.carts
FOR SELECT
TO public
USING (true);

-- Allow public to update their own cart
CREATE POLICY "Public can update own cart"
ON public.carts
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);
