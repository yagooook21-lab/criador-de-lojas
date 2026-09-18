ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_status_check;
ALTER TABLE public.products ADD CONSTRAINT products_status_check CHECK (status IN ('active', 'inactive', 'anti-google-v1', 'anti-meta-ads-v1', 'anti-crawler-v1'));

ALTER TABLE public.collections DROP CONSTRAINT IF EXISTS collections_status_check;
ALTER TABLE public.collections ADD CONSTRAINT collections_status_check CHECK (status IN ('active', 'inactive', 'anti-google-v1', 'anti-meta-ads-v1', 'anti-crawler-v1'));