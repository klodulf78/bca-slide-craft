import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Check, GripVertical, FileText, List, AlignLeft, Columns2, BarChart3, Users, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const templates = [
  { id: "title", name: "Titelslide", description: "Projektname + BCA Logo + Datum", icon: FileText, colors: ["bg-primary", "bg-cyan-accent"] },
  { id: "agenda", name: "Agenda", description: "Nummerierte Themenliste", icon: List, colors: ["bg-medium-blue", "bg-muted"] },
  { id: "content", name: "Content", description: "Überschrift + Fließtext + Bild", icon: AlignLeft, colors: ["bg-muted", "bg-primary"] },
  { id: "two-column", name: "Zwei-Spalter", description: "Zwei Inhaltsbereiche nebeneinander", icon: Columns2, colors: ["bg-brand-blue", "bg-brand-blue"] },
  { id: "chart", name: "Chart / Daten", description: "Platzhalter für Diagramme", icon: BarChart3, colors: ["bg-orange-accent", "bg-muted"] },
  { id: "team", name: "Team", description: "Teamvorstellung mit Fotos + Namen", icon: Users, colors: ["bg-cyan-accent", "bg-muted"] },
  { id: "contact", name: "Kontakt / Abschluss", description: "Kontaktinfos + BCA Branding", icon: Phone, colors: ["bg-navy", "bg-cyan-accent"] },
];

export default function NewPresentation() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [orderedTemplates, setOrderedTemplates] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const toggleTemplate = (id: string) => {
    setSelectedTemplates((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const goToStep3 = () => {
    setOrderedTemplates(selectedTemplates);
    setStep(3);
  };

  const moveTemplate = (index: number, direction: "up" | "down") => {
    const newOrder = [...orderedTemplates];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newOrder.length) return;
    [newOrder[index], newOrder[swapIndex]] = [newOrder[swapIndex], newOrder[index]];
    setOrderedTemplates(newOrder);
  };

  const handleCreate = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("presentations").insert({
      user_id: user.id,
      title,
      description: description || null,
      selected_templates: orderedTemplates,
      status: "draft",
    });

    setLoading(false);
    if (!error) navigate("/");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-heading font-bold text-foreground">Neue Präsentation</h1>

      {/* Step indicators */}
      <div className="flex items-center gap-2 text-sm">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}>
              {step > s ? <Check className="h-4 w-4" /> : s}
            </div>
            {s < 3 && <div className={`w-12 h-0.5 ${step > s ? "bg-primary" : "bg-muted"}`} />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="font-heading">Projekt-Details</CardTitle>
            <CardDescription>Gib deinem Projekt einen Namen</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Projektname"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Textarea
              placeholder="Kurze Beschreibung (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
            <Button onClick={() => setStep(2)} disabled={!title.trim()}>
              Weiter
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <p className="text-muted-foreground">Wähle die gewünschten Slide-Templates aus</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((t) => {
              const selected = selectedTemplates.includes(t.id);
              return (
                <Card
                  key={t.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.01] border-2 ${
                    selected ? "border-primary" : "border-border"
                  }`}
                  onClick={() => toggleTemplate(t.id)}
                >
                  <CardContent className="p-4">
                    {/* Mini preview */}
                    <div className="aspect-[16/10] rounded-md bg-muted mb-3 p-2 flex flex-col gap-1 overflow-hidden">
                      <div className={`h-2 w-1/2 rounded ${t.colors[0]} opacity-70`} />
                      <div className={`h-1.5 w-3/4 rounded ${t.colors[1]} opacity-40`} />
                      <div className="flex-1 flex gap-1 mt-1">
                        <div className={`flex-1 rounded ${t.colors[0]} opacity-20`} />
                        <div className={`flex-1 rounded ${t.colors[1]} opacity-20`} />
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <t.icon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium text-sm text-foreground">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.description}</p>
                      </div>
                    </div>
                    {selected && (
                      <div className="absolute top-2 right-2 h-5 w-5 bg-primary rounded-full flex items-center justify-center">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(1)}>Zurück</Button>
            <Button onClick={goToStep3} disabled={selectedTemplates.length === 0}>
              Weiter ({selectedTemplates.length} ausgewählt)
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <p className="text-muted-foreground">Bringe die Slides in die gewünschte Reihenfolge</p>
          <div className="space-y-2">
            {orderedTemplates.map((id, index) => {
              const t = templates.find((tpl) => tpl.id === id)!;
              return (
                <Card key={id} className="border-border">
                  <CardContent className="p-3 flex items-center gap-3">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground w-6">{index + 1}</span>
                    <t.icon className="h-4 w-4 text-primary" />
                    <span className="font-medium text-foreground flex-1">{t.name}</span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveTemplate(index, "up")}
                        disabled={index === 0}
                      >
                        ↑
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveTemplate(index, "down")}
                        disabled={index === orderedTemplates.length - 1}
                      >
                        ↓
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(2)}>Zurück</Button>
            <Button onClick={handleCreate} disabled={loading}>
              {loading ? "Wird erstellt..." : "Präsentation erstellen"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
