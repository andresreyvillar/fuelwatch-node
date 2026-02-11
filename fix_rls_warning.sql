-- Fix for: Table public.servicestations is public, but RLS has not been enabled.
-- Enables RLS on tables exposed to PostgREST and adds a default public read policy
-- to maintain existing behavior while satisfying the security warning.

-- 1. servicestations
ALTER TABLE public.servicestations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON public.servicestations FOR SELECT USING (true);

-- 2. historico
ALTER TABLE public.historico ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON public.historico FOR SELECT USING (true);

-- 3. favoritos
ALTER TABLE public.favoritos ENABLE ROW LEVEL SECURITY;
-- Note: 'favoritos' might contain user data. 
-- If you want this to be private per user, you should modify this policy.
-- Currently setting to public read to match previous behavior (no RLS).
CREATE POLICY "Public read access" ON public.favoritos FOR SELECT USING (true);
