import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, MessageSquare, Plus } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Beschreibe dein Projekt und ich erstelle eine Slide-Struktur für dich." },
  ]);
  const [input, setInput] = useState("");
  const [chatHistory] = useState([
    { id: "1", title: "Projekt Alpha", date: "Heute" },
    { id: "2", title: "Marktanalyse Q1", date: "Gestern" },
  ]);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages((prev) => [
      ...prev,
      { role: "user", content: input },
      { role: "assistant", content: "KI-Integration kommt in Phase 2. Aktuell kannst du über /new manuell Slides erstellen." },
    ]);
    setInput("");
  };

  return (
    <div className="flex h-[calc(100vh-5rem)] -m-6 lg:-m-8">
      {/* Sidebar */}
      <div className="w-64 border-r border-border bg-card p-4 hidden lg:flex flex-col">
        <Button variant="outline" className="mb-4 w-full justify-start gap-2">
          <Plus className="h-4 w-4" /> Neuer Chat
        </Button>
        <div className="space-y-1 flex-1">
          {chatHistory.map((chat) => (
            <button
              key={chat.id}
              className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-muted transition-colors text-foreground"
            >
              <p className="font-medium truncate">{chat.title}</p>
              <p className="text-xs text-muted-foreground">{chat.date}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[70%] rounded-lg px-4 py-3 text-sm ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              }`}>
                {msg.role === "assistant" && (
                  <MessageSquare className="h-4 w-4 mb-1 opacity-60" />
                )}
                {msg.content}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-border p-4">
          <div className="flex gap-2 max-w-3xl mx-auto">
            <Input
              placeholder="Nachricht eingeben..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <Button onClick={handleSend} size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
