import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Check, GripVertical, FileText, List, AlignLeft, Columns2, BarChart3, Users, Phone, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SlidePreview } from "@/components/slides/SlidePreview";
import { SlideEditorFactory } from "@/components/slides/editors/SlideEditorFactory";
import { toast } from "@/hooks/use-toast";
import type { Json } from "@/integrations/supabase/types";

const templates = [
  { id: "title", name: "Titelslide", description: "Projektname + BCA Logo + Datum", icon: FileText, colors: ["bg-primary", "bg-cyan-accent"] },
  { id: "agenda", name: "Agenda", description: "Nummerierte Themenliste", icon: List, colors: ["bg-medium-blue", "bg-muted"] },
  { id: "content", name: "Content", description: "Überschrift + Fließtext + Bild", icon: AlignLeft, colors: ["bg-muted", "bg-primary"] },
  { id: "two-column", name: "Zwei-Spalter", description: "Zwei Inhaltsbereiche nebeneinander", icon: Columns2, colors: ["bg-brand-blue", "bg-brand-blue"] },
  { id: "chart", name: "Chart / Daten", description: "Platzhalter für Diagramme", icon: BarChart3, colors: ["bg-orange-accent", "bg-muted"] },
  { id: "team", name: "Team", description: "Teamvorstellung mit Fotos + Namen", icon: Users, colors: ["bg-cyan-accent", "bg-muted"] },
  { id: "contact", name: "Kontakt / Abschluss", description: "Kontaktinfos + BCA Branding", icon: Phone, colors: ["bg-navy", "bg-cyan-accent"] },
];

const stepLabels = ["Details", "Templates", "Reihenfolge", "Inhalte", "Export"];

interface SlideContent {
  template_id: string;
  order: number;
  content: Record<string, any>;
}

function getRequiredFields(templateId: string): string[] {
  switch (templateId) {
    case "title": return ["title"];
    case "content": return ["title"];
    case "two-column": return ["title"];
    case "chart": return ["title"];
    default: return [];
  }
}

function isSlideComplete(templateId: string, content: Record<string, any>): boolean {
  const required = getRequiredFields(templateId);
  return required.every((f) => content[f]?.toString().trim());
}

export default function NewPresentation() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [orderedTemplates, setOrderedTemplates] = useState<string[]>([]);
  const [slidesContent, setSlidesContent] = useState<SlideContent[]>([]);
  const [loading, setLoading] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const autoSaveRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialize slides content when entering step 4
  useEffect(() => {
    if (step === 4 && slidesContent.length === 0) {
      setSlidesContent(
        orderedTemplates.map((id, i) => ({
          template_id: id,
          order: i + 1,
          content: getDefaultContent(id),
        }))
      );
    }
  }, [step, orderedTemplates, slidesContent.length]);

  // Auto-save every 30 seconds in step 4
  useEffect(() => {
    if (step === 4 && title.trim()) {
      autoSaveRef.current = setInterval(() => {
        saveDraft();
      }, 30000);
      return () => { if (autoSaveRef.current) clearInterval(autoSaveRef.current); };
    }
    return () => { if (autoSaveRef.current) clearInterval(autoSaveRef.current); };
  }, [step, title, slidesContent, savedId]);

  const saveDraft = useCallback(async () => {
    const payload = {
      title,
      description: description || null,
      selected_templates: orderedTemplates as unknown as Json,
      slides_content: slidesContent as unknown as Json,
      status: "draft",
    };

    let result;
    if (savedId) {
      result = await supabase.from("presentations").update(payload).eq("id", savedId).select().single();
    } else {
      result = await supabase.from("presentations").insert(payload).select().single();
    }

    if (result.data && !result.error) {
      if (!savedId) setSavedId(result.data.id);
      setLastSaved(new Date());
    }
    return result;
  }, [title, description, orderedTemplates, slidesContent, savedId]);

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

  const updateSlideContent = (index: number, content: Record<string, any>) => {
    setSlidesContent((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], content };
      return next;
    });
  };

  const validateStep4 = (): boolean => {
    for (const slide of slidesContent) {
      const required = getRequiredFields(slide.template_id);
      for (const f of required) {
        if (!slide.content[f]?.toString().trim()) return false;
      }
    }
    return true;
  };

  const handleExport = async () => {
    setLoading(true);
    const payload = {
      title,
      description: description || null,
      selected_templates: orderedTemplates,
      slides_content: slidesContent,
      status: "exported",
    };

    let result;
    if (savedId) {
      result = await supabase.from("presentations").update(payload).eq("id", savedId).select().single();
    } else {
      result = await supabase.from("presentations").insert(payload).select().single();
    }

    setLoading(false);
    if (!result.error) {
      toast({
        title: "Export-Funktion wird in Kürze freigeschaltet",
        description: "Deine Präsentation wurde als Entwurf gespeichert.",
      });
      navigate("/");
    }
  };

  const handleSaveDraft = async () => {
    setLoading(true);
    await saveDraft();
    setLoading(false);
    toast({ title: "Entwurf gespeichert" });
    navigate("/");
  };

  const completedSlides = slidesContent.filter((s) => isSlideComplete(s.template_id, s.content)).length;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="text-3xl font-heading font-bold text-foreground">Neue Präsentation</h1>

      {/* Stepper */}
      <div className="flex items-center gap-1 text-sm flex-wrap">
        {stepLabels.map((label, i) => {
          const s = i + 1;
          return (
            <div key={s} className="flex items-center gap-1">
              <div className="flex flex-col items-center">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>
                  {step > s ? <Check className="h-4 w-4" /> : s}
                </div>
                <span className="text-[10px] text-muted-foreground mt-0.5">{label}</span>
              </div>
              {s < 5 && <div className={`w-8 h-0.5 mb-4 ${step > s ? "bg-primary" : "bg-muted"}`} />}
            </div>
          );
        })}
        {step === 4 && (
          <div className="ml-auto text-xs text-muted-foreground">
            {completedSlides} von {slidesContent.length} Slides ausgefüllt
            {lastSaved && (
              <span className="ml-2 text-green-600">
                <Save className="h-3 w-3 inline mr-0.5" />Gespeichert ✓
              </span>
            )}
          </div>
        )}
      </div>

      {/* Step 1: Details */}
      {step === 1 && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="font-heading">Projekt-Details</CardTitle>
            <CardDescription>Gib deinem Projekt einen Namen</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input placeholder="Projektname" value={title} onChange={(e) => setTitle(e.target.value)} className="bg-[hsl(228,33%,98%)]" />
            <Textarea placeholder="Kurze Beschreibung (optional)" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="bg-[hsl(228,33%,98%)]" />
            <Button onClick={() => setStep(2)} disabled={!title.trim()}>Weiter</Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Template Selection */}
      {step === 2 && (
        <div className="space-y-4">
          <p className="text-muted-foreground">Wähle die gewünschten Slide-Templates aus</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((t) => {
              const selected = selectedTemplates.includes(t.id);
              return (
                <Card
                  key={t.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.01] border-2 relative ${
                    selected ? "border-primary" : "border-border"
                  }`}
                  onClick={() => toggleTemplate(t.id)}
                >
                  <CardContent className="p-4">
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

      {/* Step 3: Order */}
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
                      <Button variant="ghost" size="sm" onClick={() => moveTemplate(index, "up")} disabled={index === 0}>↑</Button>
                      <Button variant="ghost" size="sm" onClick={() => moveTemplate(index, "down")} disabled={index === orderedTemplates.length - 1}>↓</Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(2)}>Zurück</Button>
            <Button onClick={() => setStep(4)}>Weiter</Button>
          </div>
        </div>
      )}

      {/* Step 4: Content Editor */}
      {step === 4 && (
        <div className="space-y-6">
          <p className="text-muted-foreground">Bearbeite die Inhalte deiner Slides</p>
          {slidesContent.map((slide, index) => {
            const tpl = templates.find((t) => t.id === slide.template_id);
            const complete = isSlideComplete(slide.template_id, slide.content);
            return (
              <Card key={index} className={`border-2 ${complete ? "border-border" : "border-orange-accent/30"}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-sm font-medium text-muted-foreground">Slide {index + 1}</span>
                    {tpl && <tpl.icon className="h-4 w-4 text-primary" />}
                    <span className="font-heading font-semibold text-foreground">{tpl?.name}</span>
                    {complete && <Check className="h-4 w-4 text-green-600 ml-auto" />}
                  </div>
                  <div className="flex gap-6 flex-col lg:flex-row">
                    <div className="flex-shrink-0">
                      <SlidePreview templateId={slide.template_id} content={slide.content} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <SlideEditorFactory
                        templateId={slide.template_id}
                        content={slide.content}
                        onChange={(c) => updateSlideContent(index, c)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(3)}>Zurück</Button>
            <Button onClick={() => { if (validateStep4()) setStep(5); else toast({ title: "Pflichtfelder ausfüllen", description: "Bitte fülle alle markierten Felder aus.", variant: "destructive" }); }}>
              Weiter zur Übersicht
            </Button>
          </div>
        </div>
      )}

      {/* Step 5: Export */}
      {step === 5 && (
        <div className="space-y-6">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="font-heading">{title}</CardTitle>
              {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{slidesContent.length} Slides</p>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {slidesContent.map((slide, i) => (
                  <div key={i} className="flex-shrink-0">
                    <SlidePreview templateId={slide.template_id} content={slide.content} />
                    <p className="text-xs text-muted-foreground text-center mt-1">
                      {templates.find((t) => t.id === slide.template_id)?.name}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(4)}>Zurück</Button>
            <Button variant="secondary" onClick={handleSaveDraft} disabled={loading}>Als Entwurf speichern</Button>
            <Button onClick={handleExport} disabled={loading} className="bg-orange-accent hover:bg-orange-accent/90 text-white">
              {loading ? "Wird gespeichert..." : "Präsentation exportieren (.pptx)"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function getDefaultContent(templateId: string): Record<string, any> {
  switch (templateId) {
    case "title": return { title: "", subtitle: "", date: new Date().toISOString().split("T")[0], team_name: "", dark_variant: false };
    case "agenda": return { items: ["", ""], active_item: null };
    case "content": return { section_header: "", title: "", body: "", as_bullets: false, takeaway: "" };
    case "two-column": return { section_header: "", title: "", col1_title: "", col1_body: "", col2_title: "", col2_body: "", layout: "symmetric" };
    case "chart": return { section_header: "", title: "", layout: "kpi", kpi_count: 3, kpis: [{ value: "", label: "", sublabel: "" }, { value: "", label: "", sublabel: "" }, { value: "", label: "", sublabel: "" }], chart_type: "bar", chart_data: [{ label: "", value: "" }], legend: "", source: "" };
    case "team": return { title: "Unser Team", members: [{ name: "", role: "", university: "" }, { name: "", role: "", university: "" }] };
    case "contact": return { thanks: "Vielen Dank!", subtitle: "Wir freuen uns auf eure Fragen.", email: "kontakt@bca-berlin.de", website: "www.bca-berlin.de", linkedin: "linkedin.com/company/bca-berlin", contact_person: "", dark_variant: false };
    default: return {};
  }
}
