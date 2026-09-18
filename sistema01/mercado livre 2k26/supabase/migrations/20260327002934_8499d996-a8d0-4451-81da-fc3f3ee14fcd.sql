CREATE TABLE public.store_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  password TEXT NOT NULL,
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