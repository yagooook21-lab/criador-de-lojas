
-- Add new columns to products table
ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS weight numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_physical boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS condition text NOT NULL DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS checkout_type text NOT NULL DEFAULT 'native',
  ADD COLUMN IF NOT EXISTS payment_link text,
  ADD COLUMN IF NOT EXISTS fake_orders integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS pix_codes jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS boleto_codes jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS enable_pix boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pix_type text NOT NULL DEFAULT 'copypaste',
  ADD COLUMN IF NOT EXISTS enable_boleto boolean NOT NULL DEFAULT false;

-- Create product_variants table
CREATE TABLE IF NOT EXISTS public.product_variants (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  group_name text NOT NULL,
  option_name text NOT NULL,
  image text,
  price numeric NOT NULL DEFAULT 0,
  stock integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage product_variants"
  ON public.product_variants FOR ALL
  TO public
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Product variants are publicly readable"
  ON public.product_variants FOR SELECT
  TO public
  USING (true);
