
ALTER TABLE presentations ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual';
ALTER TABLE presentations ADD COLUMN IF NOT EXISTS original_file_url text;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('uploaded-presentations', 'uploaded-presentations', false, 52428800, ARRAY['application/vnd.openxmlformats-officedocument.presentationml.presentation'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can upload presentations" ON storage.objects
  FOR INSERT TO public WITH CHECK (bucket_id = 'uploaded-presentations');

CREATE POLICY "Anyone can read own presentations" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'uploaded-presentations');
