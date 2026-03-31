CREATE TABLE public.chat_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid DEFAULT NULL,
  title text NOT NULL DEFAULT 'Neuer Chat',
  messages jsonb DEFAULT '[]'::jsonb,
  created_presentation_id uuid REFERENCES public.presentations(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Temp: anyone can select chats" ON public.chat_conversations FOR SELECT USING (true);
CREATE POLICY "Temp: anyone can insert chats" ON public.chat_conversations FOR INSERT WITH CHECK (true);
CREATE POLICY "Temp: anyone can update chats" ON public.chat_conversations FOR UPDATE USING (true);
CREATE POLICY "Temp: anyone can delete chats" ON public.chat_conversations FOR DELETE USING (true);

CREATE TRIGGER update_chat_conversations_updated_at
  BEFORE UPDATE ON public.chat_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();