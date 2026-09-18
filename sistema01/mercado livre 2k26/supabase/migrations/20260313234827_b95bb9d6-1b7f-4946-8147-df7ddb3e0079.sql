
CREATE TABLE public.live_visitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
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
