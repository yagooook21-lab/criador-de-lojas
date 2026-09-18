CREATE TABLE public.shipping_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric NOT NULL DEFAULT 0,
  delivery_days_min integer NOT NULL DEFAULT 1,
  delivery_days_max integer NOT NULL DEFAULT 5,
  free_shipping_min numeric DEFAULT NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.shipping_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shipping methods are publicly readable" ON public.shipping_methods FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage shipping_methods" ON public.shipping_methods FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE TABLE public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  type text NOT NULL DEFAULT 'percentage',
  value numeric NOT NULL DEFAULT 0,
  min_purchase numeric DEFAULT 0,
  max_uses integer DEFAULT NULL,
  used_count integer NOT NULL DEFAULT 0,
  free_shipping boolean NOT NULL DEFAULT false,
  expires_at timestamptz DEFAULT NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coupons are publicly readable" ON public.coupons FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage coupons" ON public.coupons FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);