
CREATE TABLE public.user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE,
  first_name text,
  last_name text,
  default_team_name text DEFAULT 'BCA Projektteam',
  default_contact_email text DEFAULT 'kontakt@bca-berlin.de',
  default_website text DEFAULT 'www.bca-berlin.de',
  default_linkedin text DEFAULT 'linkedin.com/company/bca-berlin',
  default_variant text DEFAULT 'light',
  footer_text text DEFAULT 'Berlin Consulting Association e.V.',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Temp: anyone can select settings" ON public.user_settings FOR SELECT USING (true);
CREATE POLICY "Temp: anyone can insert settings" ON public.user_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Temp: anyone can update settings" ON public.user_settings FOR UPDATE USING (true);
CREATE POLICY "Temp: anyone can delete settings" ON public.user_settings FOR DELETE USING (true);
