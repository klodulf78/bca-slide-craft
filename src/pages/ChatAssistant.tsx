import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, MessageSquare, Plus, Loader2, Sparkles, FileDown, ArrowRight, Trash2, FolderOpen, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SlidePreview } from "@/components/slides/SlidePreview";
import { generatePresentation } from "@/services/pptxExport";
import { toast } from "@/hooks/use-toast";
import type { Json } from "@/integrations/supabase/types";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatConversation {
  id: string;
  title: string;
  messages: Message[];
  created_presentation_id: string | null;
  created_at: string;
  updated_at: string;
}

interface ChoiceBlock {
  type: "choices";
  question: string;
  options: { label: string; description?: string; value: string }[];
  allow_multiple?: boolean;
}

interface ParsedPresentation {
  title: string;
  total_slides: number;
  estimated_duration_minutes: number;
  slides: Array<{
    slide_number: number;
    template_id: string;
    content: Record<string, any>;
  }>;
}

const SUGGESTIONS = [
  { label: "📊 Abschlusspräsentation mit Executive Summary", prompt: "Erstelle eine Abschlusspräsentation mit Executive Summary für ein BCA-Beratungsprojekt" },
  { label: "🚀 Pitch Deck", prompt: "Erstelle ein Pitch Deck für ein Startup" },
  { label: "📋 Zwischenbericht", prompt: "Erstelle einen Zwischenbericht für ein laufendes Beratungsprojekt" },
  { label: "🔍 Slide-Titel zu Action Titles verbessern", prompt: "Ich habe folgende Slide-Titel. Bitte verbessere sie zu Action Titles nach dem Pyramid Principle: 1. Marktübersicht, 2. Wettbewerbsanalyse, 3. Finanzielle Ergebnisse" },
];

const CHOICE_REGEX = /\{"type"\s*:\s*"choices"[\s\S]*?\}\s*\]/g;

function parseChoiceBlocks(text: string): ChoiceBlock[] {
  const blocks: ChoiceBlock[] = [];
  // Find JSON objects that look like choice blocks — they may appear outside code fences
  const matches = text.match(CHOICE_REGEX);
  if (!matches) return blocks;
  for (const raw of matches) {
    // The regex captures up to the last ], but we need the closing }
    const fullMatch = raw + "}";
    try {
      const parsed = JSON.parse(fullMatch);
      if (parsed.type === "choices" && Array.isArray(parsed.options)) {
        blocks.push(parsed as ChoiceBlock);
      }
    } catch {
      // Try without the extra }
      try {
        const parsed = JSON.parse(raw);
        if (parsed.type === "choices" && Array.isArray(parsed.options)) {
          blocks.push(parsed as ChoiceBlock);
        }
      } catch { /* skip */ }
    }
  }
  return blocks;
}

function getTextWithoutChoices(text: string): string {
  // Remove choice JSON blocks and surrounding whitespace
  return text.replace(/\{"type"\s*:\s*"choices"[\s\S]*?\}\s*\]\s*\}?/g, "").trim();
}

function parseJsonFromResponse(text: string): ParsedPresentation | null {
  const match = text.match(/```json\s*([\s\S]*?)\s*```/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[1]);
    return parsed.presentation || null;
  } catch {
    return null;
  }
}

function getTextWithoutJson(text: string): string {
  return text.replace(/```json\s*[\s\S]*?\s*```/, "").trim();
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Heute";
  if (diffDays === 1) return "Gestern";
  return date.toLocaleDateString("de-DE", { day: "numeric", month: "long" });
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-slides`;

export default function ChatAssistant() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [slowWarning, setSlowWarning] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load conversations
  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadConversations = async () => {
    const { data } = await supabase
      .from("chat_conversations")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(20);
    if (data) {
      setConversations(data.map(c => ({
        ...c,
        messages: (c.messages as any[] || []) as Message[],
      })));
    }
  };

  const createNewChat = async () => {
    setMessages([]);
    setActiveConversationId(null);
    setInput("");
  };

  const loadChat = (conv: ChatConversation) => {
    setActiveConversationId(conv.id);
    setMessages(conv.messages);
  };

  const deleteChat = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await supabase.from("chat_conversations").delete().eq("id", id);
    if (activeConversationId === id) {
      setActiveConversationId(null);
      setMessages([]);
    }
    loadConversations();
  };

  const saveConversation = useCallback(async (msgs: Message[], convId: string | null): Promise<string> => {
    const title = msgs.find(m => m.role === "user")?.content.slice(0, 40) || "Neuer Chat";
    if (convId) {
      await supabase
        .from("chat_conversations")
        .update({ messages: msgs as unknown as Json, title, updated_at: new Date().toISOString() })
        .eq("id", convId);
      return convId;
    } else {
      const { data } = await supabase
        .from("chat_conversations")
        .insert({ messages: msgs as unknown as Json, title })
        .select("id")
        .single();
      return data?.id || "";
    }
  }, []);

  const handleSend = async (text?: string) => {
    const messageText = (text || input).trim();
    if (!messageText || isLoading) return;

    const userMsg: Message = { role: "user", content: messageText };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);
    setSlowWarning(false);

    const slowTimer = setTimeout(() => setSlowWarning(true), 10000);

    let assistantContent = "";

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          userMessage: messageText,
          conversationHistory: messages.slice(-10),
        }),
        signal: AbortSignal.timeout(60000),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || `Fehler ${resp.status}`);
      }

      // Stream SSE
      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages([...updatedMessages, { role: "assistant", content: assistantContent }]);
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      // Flush remaining
      if (buffer.trim()) {
        for (let raw of buffer.split("\n")) {
          if (!raw || !raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) assistantContent += content;
          } catch {}
        }
      }

      const finalMessages: Message[] = [
        ...updatedMessages,
        { role: "assistant", content: assistantContent || "Entschuldigung, ich konnte keine Antwort generieren." },
      ];
      setMessages(finalMessages);

      // Save to DB
      const newId = await saveConversation(finalMessages, activeConversationId);
      if (!activeConversationId) setActiveConversationId(newId);
      loadConversations();
    } catch (err: any) {
      console.error("Chat error:", err);
      const errorMsg = err.name === "TimeoutError"
        ? "Zeitüberschreitung. Bitte versuche es erneut."
        : err.message || "Verbindung zum KI-Assistenten fehlgeschlagen.";
      toast({ title: "Fehler", description: errorMsg, variant: "destructive" });
      setMessages(updatedMessages); // remove loading state
    } finally {
      clearTimeout(slowTimer);
      setIsLoading(false);
      setSlowWarning(false);
    }
  };

  const handleAdoptPresentation = async (pres: ParsedPresentation) => {
    const slidesContent = pres.slides.map((s, i) => ({
      template_id: s.template_id,
      order: i + 1,
      content: s.content,
    }));

    const { data, error } = await supabase
      .from("presentations")
      .insert({
        title: pres.title,
        description: `KI-generiert (${pres.total_slides} Slides, ~${pres.estimated_duration_minutes} Min.)`,
        status: "draft",
        slides_content: slidesContent as unknown as Json,
        selected_templates: pres.slides.map(s => s.template_id) as unknown as Json,
      })
      .select("id")
      .single();

    if (error || !data) {
      toast({ title: "Fehler", description: "Präsentation konnte nicht erstellt werden.", variant: "destructive" });
      return;
    }

    // Link to conversation
    if (activeConversationId) {
      await supabase
        .from("chat_conversations")
        .update({ created_presentation_id: data.id })
        .eq("id", activeConversationId);
    }

    toast({ title: "Präsentation erstellt!", description: `"${pres.title}" wurde als Entwurf gespeichert.` });
    navigate(`/presentation/${data.id}/edit`);
  };

  const handleExportPresentation = async (pres: ParsedPresentation) => {
    setIsExporting(true);
    try {
      const slidesContent = pres.slides.map((s, i) => ({
        template_id: s.template_id,
        order: i + 1,
        content: s.content,
      }));
      await generatePresentation(slidesContent, pres.title);
      toast({ title: "Export erfolgreich!", description: `${pres.title}.pptx wurde heruntergeladen.` });
    } catch {
      toast({ title: "Export fehlgeschlagen", description: "Bitte versuche es erneut.", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const showSuggestions = messages.length === 0;

  return (
    <div className="flex h-[calc(100vh-5rem)] -m-6 lg:-m-8">
      {/* Sidebar */}
      <div className="w-64 border-r border-border bg-card p-4 hidden lg:flex flex-col">
        <Button variant="outline" className="mb-4 w-full justify-start gap-2" onClick={createNewChat}>
          <Plus className="h-4 w-4" /> Neuer Chat
        </Button>
        <div className="space-y-1 flex-1 overflow-y-auto">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => loadChat(conv)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors group flex items-center gap-1 ${
                activeConversationId === conv.id
                  ? "bg-muted text-foreground"
                  : "hover:bg-muted/50 text-foreground"
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{conv.title}</p>
                <p className="text-xs text-muted-foreground">{formatRelativeDate(conv.updated_at)}</p>
              </div>
              <button
                onClick={(e) => deleteChat(e, conv.id)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive transition-opacity"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {showSuggestions ? (
            <div className="flex-1 flex flex-col items-center justify-center h-full gap-6">
              <div className="text-center space-y-2">
                <Sparkles className="h-10 w-10 mx-auto text-primary opacity-60" />
                <h2 className="text-xl font-semibold text-foreground">BCA Slide-Assistent</h2>
                <p className="text-muted-foreground text-sm max-w-md">
                  Beschreibe dein Projekt und ich erstelle eine komplette Slide-Struktur für dich.
                </p>
              </div>
              <div className="grid gap-3 w-full max-w-lg">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s.label}
                    onClick={() => handleSend(s.prompt)}
                    className="text-left p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <p className="font-medium text-sm text-foreground">{s.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.prompt}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => {
                const presentation = msg.role === "assistant" ? parseJsonFromResponse(msg.content) : null;
                const rawText = msg.role === "assistant" ? getTextWithoutJson(msg.content) : msg.content;
                const choiceBlocks = msg.role === "assistant" ? parseChoiceBlocks(rawText) : [];
                const textContent = msg.role === "assistant" ? getTextWithoutChoices(rawText) : rawText;

                return (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className="max-w-[70%] space-y-3">
                      {/* Text bubble */}
                      {textContent && (
                        <div
                          className={`rounded-lg px-4 py-3 text-sm whitespace-pre-wrap ${
                            msg.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-foreground"
                          }`}
                        >
                          {msg.role === "assistant" && (
                            <MessageSquare className="h-4 w-4 mb-1 opacity-60" />
                          )}
                          {textContent}
                        </div>
                      )}

                      {/* Choice blocks */}
                      {choiceBlocks.map((choice, ci) => (
                        <div key={ci} className="space-y-2">
                          <p className="text-sm font-medium text-foreground">{choice.question}</p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {choice.options.map((opt, oi) => (
                              <button
                                key={oi}
                                onClick={() => handleSend(opt.value)}
                                disabled={isLoading}
                                className="text-left p-3 rounded-lg border border-border bg-secondary hover:border-primary hover:shadow-sm transition-all disabled:opacity-50"
                              >
                                <p className="font-semibold text-xs text-foreground" style={{ fontFamily: "Raleway, sans-serif" }}>
                                  {opt.label}
                                </p>
                                {opt.description && (
                                  <p className="text-[11px] text-muted-foreground mt-0.5">{opt.description}</p>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}

                      {/* Presentation preview card */}
                      {presentation && (
                        <div className="rounded-xl border border-border bg-card shadow-sm p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-foreground text-sm">{presentation.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {presentation.total_slides} Slides · ~{presentation.estimated_duration_minutes} Min.
                              </p>
                            </div>
                          </div>

                          {/* Slide thumbnails */}
                          <div className="flex gap-2 overflow-x-auto pb-2">
                            {presentation.slides.map((slide, idx) => (
                              <SlidePreview
                                key={idx}
                                templateId={slide.template_id}
                                content={slide.content}
                                className="flex-shrink-0"
                              />
                            ))}
                          </div>

                          {/* Action buttons */}
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleAdoptPresentation(presentation)}
                              className="gap-1"
                            >
                              <ArrowRight className="h-3 w-3" />
                              Präsentation übernehmen
                            </Button>
                            <Button
                              size="sm"
                              variant="cta"
                              onClick={() => handleExportPresentation(presentation)}
                              disabled={isExporting}
                              className="gap-1"
                            >
                              {isExporting ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <FileDown className="h-3 w-3" />
                              )}
                              Als .pptx exportieren
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Loading indicator */}
              {isLoading && !messages[messages.length - 1]?.content && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-4 py-3 text-sm text-foreground">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                      {slowWarning && (
                        <span className="text-xs text-muted-foreground">Das dauert etwas länger als erwartet...</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="border-t border-border p-4">
          <div className="flex gap-2 max-w-3xl mx-auto items-end">
            <Textarea
              ref={textareaRef}
              placeholder="Beschreibe dein Projekt..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              className="min-h-[44px] max-h-32 resize-none"
            />
            <Button onClick={() => handleSend()} size="icon" disabled={!input.trim() || isLoading} className="shrink-0">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
