-- Rollback of 20260423_split_pix_credentials.sql.
-- Merges the credentials row back into pix_settings, drops the protected row,
-- and restores the permissive public-read RLS policy so the anonymous
-- storefront can read gateway credentials again (required while gateway APIs
-- are called directly from the browser).

-- 1. Merge any existing pix_credentials content back into pix_settings.
UPDATE public.settings AS s
SET value = COALESCE(s.value, '{}'::jsonb) || COALESCE(c.value, '{}'::jsonb),
    updated_at = now()
FROM public.settings AS c
WHERE s.key = 'pix_settings'
  AND c.key = 'pix_credentials';

-- 1b. If pix_settings row doesn't exist yet but pix_credentials does, promote it.
INSERT INTO public.settings (key, value)
SELECT 'pix_settings', value
FROM public.settings
WHERE key = 'pix_credentials'
  AND NOT EXISTS (SELECT 1 FROM public.settings WHERE key = 'pix_settings')
ON CONFLICT (key) DO NOTHING;

-- 2. Drop the protected credentials row.
DELETE FROM public.settings WHERE key = 'pix_credentials';

-- 3. Restore the permissive public-read policy.
DROP POLICY IF EXISTS "Non-secret settings are publicly readable" ON public.settings;

CREATE POLICY "Settings are publicly readable"
  ON public.settings
  FOR SELECT
  USING (true);
