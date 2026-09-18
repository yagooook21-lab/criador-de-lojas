
-- Add images array column to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS images jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload product images"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'product-images' AND auth.uid() IS NOT NULL);

-- Allow authenticated users to delete
CREATE POLICY "Authenticated users can delete product images"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'product-images' AND auth.uid() IS NOT NULL);

-- Allow public read
CREATE POLICY "Public can read product images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');
