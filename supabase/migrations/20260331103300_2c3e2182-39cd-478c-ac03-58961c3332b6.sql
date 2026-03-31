-- Create templates table
CREATE TABLE public.templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  preview_config JSONB DEFAULT '{}'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- Create presentations table
CREATE TABLE public.presentations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  selected_templates JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.presentations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- Presentations: users see only their own
CREATE POLICY "Users can view own presentations" ON public.presentations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own presentations" ON public.presentations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own presentations" ON public.presentations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own presentations" ON public.presentations FOR DELETE USING (auth.uid() = user_id);

-- Templates: readable by all authenticated users
CREATE POLICY "Templates are viewable by authenticated users" ON public.templates FOR SELECT TO authenticated USING (true);

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_presentations_updated_at
  BEFORE UPDATE ON public.presentations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed templates
INSERT INTO public.templates (name, description, category, sort_order) VALUES
  ('Titelslide', 'Projektname + BCA Logo + Datum', 'intro', 1),
  ('Agenda', 'Nummerierte Themenliste', 'intro', 2),
  ('Content', 'Überschrift + Fließtext + optionales Bild', 'content', 3),
  ('Zwei-Spalter', 'Zwei Inhaltsbereiche nebeneinander', 'content', 4),
  ('Chart / Daten', 'Platzhalter für Diagramme', 'content', 5),
  ('Team', 'Teamvorstellung mit Foto-Platzhaltern + Namen', 'content', 6),
  ('Kontakt / Abschluss', 'Kontaktinfos + BCA Branding', 'closing', 7);