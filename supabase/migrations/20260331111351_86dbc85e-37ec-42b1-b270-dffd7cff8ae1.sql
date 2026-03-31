
-- Drop existing RLS policies on presentations
DROP POLICY IF EXISTS "Users can create own presentations" ON public.presentations;
DROP POLICY IF EXISTS "Users can delete own presentations" ON public.presentations;
DROP POLICY IF EXISTS "Users can update own presentations" ON public.presentations;
DROP POLICY IF EXISTS "Users can view own presentations" ON public.presentations;

-- Create temporary open policies
CREATE POLICY "Temp: anyone can select presentations" ON public.presentations FOR SELECT TO public USING (true);
CREATE POLICY "Temp: anyone can insert presentations" ON public.presentations FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Temp: anyone can update presentations" ON public.presentations FOR UPDATE TO public USING (true);
CREATE POLICY "Temp: anyone can delete presentations" ON public.presentations FOR DELETE TO public USING (true);

-- Make user_id nullable
ALTER TABLE public.presentations ALTER COLUMN user_id DROP NOT NULL;

-- Drop existing RLS policy on templates
DROP POLICY IF EXISTS "Templates are viewable by authenticated users" ON public.templates;

-- Create open policy for templates
CREATE POLICY "Temp: anyone can view templates" ON public.templates FOR SELECT TO public USING (true);
