CREATE TABLE public.project_contexts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  project_name TEXT NOT NULL,
  startup_name TEXT,
  industry TEXT,
  team_members JSONB DEFAULT '[]'::jsonb,
  presentation_type TEXT,
  slide_count INTEGER,
  last_slide_structure JSONB,
  key_findings JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_name)
);

ALTER TABLE public.project_contexts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Temp: anyone can select project contexts" ON public.project_contexts FOR SELECT USING (true);
CREATE POLICY "Temp: anyone can insert project contexts" ON public.project_contexts FOR INSERT WITH CHECK (true);
CREATE POLICY "Temp: anyone can update project contexts" ON public.project_contexts FOR UPDATE USING (true);
CREATE POLICY "Temp: anyone can delete project contexts" ON public.project_contexts FOR DELETE USING (true);