-- Split PIX gateway credentials out of the publicly-readable pix_settings row
-- into a protected pix_credentials row that can only be read by authenticated
-- users (admins). Edge Functions use the service role and bypass RLS.

-- 1. Copy sensitive fields into the new pix_credentials row (if any exist).
INSERT INTO public.settings (key, value)
SELECT 'pix_credentials',
       jsonb_strip_nulls(jsonb_build_object(
         'api_key',           value->>'api_key',
         'api_secret',        value->>'api_secret',
         'public_key',        value->>'public_key',
         'iron_product_hash', value->>'iron_product_hash',
         'iron_offer_hash',   value->>'iron_offer_hash'
       ))
FROM public.settings
WHERE key = 'pix_settings'
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    updated_at = now();

-- 2. Scrub credentials from pix_settings (keeps mode, gateway, account_*).
UPDATE public.settings
SET value = value - 'api_key' - 'api_secret' - 'public_key'
                - 'iron_product_hash' - 'iron_offer_hash',
    updated_at = now()
WHERE key = 'pix_settings';

-- 3. Replace the permissive public-read policy with one that excludes the
--    protected pix_credentials row. Authenticated admins keep full access
--    via the existing "Authenticated users can manage settings" policy.
DROP POLICY IF EXISTS "Settings are publicly readable" ON public.settings;

CREATE POLICY "Non-secret settings are publicly readable"
  ON public.settings
  FOR SELECT
  USING (key <> 'pix_credentials');
