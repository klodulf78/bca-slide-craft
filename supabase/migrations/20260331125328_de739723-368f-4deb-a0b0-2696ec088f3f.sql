
-- Presentation presets table
CREATE TABLE public.presentation_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  title text NOT NULL,
  description text,
  slides_structure jsonb NOT NULL,
  is_global boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.presentation_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view global presets" ON public.presentation_presets
  FOR SELECT USING (is_global = true);

CREATE POLICY "Temp: anyone can select own presets" ON public.presentation_presets
  FOR SELECT USING (true);

CREATE POLICY "Temp: anyone can insert presets" ON public.presentation_presets
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Temp: anyone can update presets" ON public.presentation_presets
  FOR UPDATE USING (true);

CREATE POLICY "Temp: anyone can delete presets" ON public.presentation_presets
  FOR DELETE USING (true);

-- Presentation collaborators table
CREATE TABLE public.presentation_collaborators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  presentation_id uuid REFERENCES public.presentations(id) ON DELETE CASCADE,
  user_email text NOT NULL,
  role text DEFAULT 'editor',
  added_at timestamptz DEFAULT now(),
  UNIQUE(presentation_id, user_email)
);

ALTER TABLE public.presentation_collaborators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Temp: anyone can select collaborators" ON public.presentation_collaborators
  FOR SELECT USING (true);

CREATE POLICY "Temp: anyone can insert collaborators" ON public.presentation_collaborators
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Temp: anyone can delete collaborators" ON public.presentation_collaborators
  FOR DELETE USING (true);
