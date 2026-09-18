
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
