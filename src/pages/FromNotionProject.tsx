import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Loader2, Plus, Trash2, CalendarIcon, Lightbulb, Database, ArrowRight } from "lucide-react";
import { FileUploadZone } from "@/components/FileUploadZone";
import { formatFileContext, type ProcessedFile } from "@/services/fileParser";
import { supabase } from "@/integrations/supabase/client";
import { SlidePreview } from "@/components/slides/SlidePreview";
import { generatePresentation } from "@/services/pptxExport";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import type { Json } from "@/integrations/supabase/types";

interface TeamMember {
  name: string;
  role: string;
  university: string;
}

interface ProjectData {
  clientName: string;
  description: string;
  goals: string;
  category: string;
  services: string[];
  startDate: Date | undefined;
  endDate: Date | undefined;
  team: TeamMember[];
  contactPerson: string;
  contactEmail: string;
}

const SERVICES = [
  "Marktanalyse", "Wettbewerbsanalyse", "Geschäftsmodellentwicklung",
  "Finanzplanung", "Marketingstrategie", "Organisationsberatung",
  "Prozessoptimierung", "Digitale Transformation", "Go-to-Market",
];

interface Preset {
  id: string;
  title: string;
  description: string;
  slides_structure: any[];
}

export default function FromNotionProject() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<Preset | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generatedSlides, setGeneratedSlides] = useState<any[] | null>(null);
  const [analysisText, setAnalysisText] = useState("");
  const [data, setData] = useState<ProjectData>({
    clientName: "", description: "", goals: "", category: "",
    services: [], startDate: undefined, endDate: undefined,
    team: [{ name: "", role: "Project Lead", university: "" }],
    contactPerson: "", contactEmail: "",
  });
  const [attachedFile, setAttachedFile] = useState<ProcessedFile | null>(null);

  useEffect(() => {
    supabase.from("presentation_presets").select("*").eq("is_global", true)
      .then(({ data }) => { if (data) setPresets(data as any[]); });
  }, []);

  const toggleService = (s: string) => {
    setData(prev => ({
      ...prev,
      services: prev.services.includes(s)
        ? prev.services.filter(x => x !== s)
        : [...prev.services, s],
    }));
  };

  const addTeamMember = () => {
    setData(prev => ({ ...prev, team: [...prev.team, { name: "", role: "", university: "" }] }));
  };

  const removeTeamMember = (i: number) => {
    setData(prev => ({ ...prev, team: prev.team.filter((_, idx) => idx !== i) }));
  };

  const updateTeamMember = (i: number, field: keyof TeamMember, value: string) => {
    setData(prev => {
      const team = [...prev.team];
      team[i] = { ...team[i], [field]: value };
      return { ...prev, team };
    });
  };

  const handleGenerate = async () => {
    if (!selectedPreset) return;
    setGenerating(true);
    setAnalysisText("");
    setGeneratedSlides(null);

    const teamStr = data.team.filter(m => m.name).map(m =>
      `${m.name} (${m.role}${m.university ? `, ${m.university}` : ""})`
    ).join(", ");

    const startStr = data.startDate ? format(data.startDate, "dd.MM.yyyy") : "[TBD]";
    const endStr = data.endDate ? format(data.endDate, "dd.MM.yyyy") : "[TBD]";

    const userMessage = `Erstelle eine ${selectedPreset.title} für folgendes BCA-Projekt:

Kunde: ${data.clientName}
Projektbeschreibung: ${data.description || "[Nicht angegeben]"}
Projektziele: ${data.goals || "[Nicht angegeben]"}
Leistungskategorie: ${data.category || "[Nicht angegeben]"}
Services: ${data.services.length > 0 ? data.services.join(", ") : "[Nicht angegeben]"}
Zeitraum: ${startStr} bis ${endStr}
Team: ${teamStr || "[Nicht angegeben]"}
Kontakt: ${data.contactPerson || "[Nicht angegeben]"}, ${data.contactEmail || "[Nicht angegeben]"}

Nutze die Vorlage "${selectedPreset.title}" als Grundstruktur und fülle sie mit den Projektdaten.
Verwende echte Daten wo verfügbar und Platzhalter [in eckigen Klammern] wo Daten fehlen.`;

    try {
      const { data: fnData, error } = await supabase.functions.invoke("generate-slides", {
        body: { userMessage, conversationHistory: [] },
      });

      if (error) throw error;

      const message = fnData?.message || "";
      setAnalysisText(message);

      const jsonMatch = message.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1]);
        const slides = parsed.presentation?.slides || parsed.slides || [];
        const mapped = slides.map((s: any, i: number) => ({
          template_id: s.template_id === "title_slide" ? "title" : s.template_id === "closing" ? "contact" : s.template_id === "chart_data" ? "chart" : s.template_id === "two_column" ? "two-column" : s.template_id,
          order: i + 1,
          content: s.content || {},
        }));
        setGeneratedSlides(mapped);
      }
    } catch {
      toast({ title: "KI-Generierung fehlgeschlagen", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handleAdopt = async () => {
    if (!generatedSlides) return;
    const title = data.clientName ? `${data.clientName} — ${selectedPreset?.title}` : selectedPreset?.title || "Neue Präsentation";
    const { data: pres, error } = await supabase.from("presentations").insert({
      title,
      slides_content: generatedSlides as unknown as Json,
      source: "chat",
      status: "draft",
    }).select("id").single();

    if (pres && !error) {
      toast({ title: "Präsentation erstellt!" });
      navigate(`/presentation/${pres.id}/edit`);
    }
  };

  const handleExport = async () => {
    if (!generatedSlides) return;
    const title = data.clientName || "Präsentation";
    await generatePresentation(generatedSlides, title);
    toast({ title: `${title}.pptx heruntergeladen` });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-heading font-bold text-foreground">Aus Projekt erstellen</h1>

      {/* Step indicator */}
      <div className="flex items-center gap-2 text-sm">
        {["Projektdaten", "Vorlage wählen", "Generierung"].map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-medium ${
              step > i + 1 ? "bg-primary text-primary-foreground" : step === i + 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}>{i + 1}</div>
            <span className="text-muted-foreground">{label}</span>
            {i < 2 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
          </div>
        ))}
      </div>

      {/* Step 1: Project Data */}
      {step === 1 && (
        <div className="space-y-6">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="font-heading text-lg flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" /> Projektdaten
              </CardTitle>
              <CardDescription className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-orange-accent" />
                Tipp: Kopiere die Daten aus eurem Notion-Projekt, um Zeit zu sparen.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Kundenname *</Label>
                <Input value={data.clientName} onChange={e => setData(p => ({ ...p, clientName: e.target.value }))} placeholder="z.B. MedFlow GmbH" />
              </div>
              <div>
                <Label>Projektbeschreibung</Label>
                <Textarea value={data.description} onChange={e => setData(p => ({ ...p, description: e.target.value }))} placeholder="Was ist das Projekt?" rows={3} />
              </div>
              <div>
                <Label>Projektziele</Label>
                <Textarea value={data.goals} onChange={e => setData(p => ({ ...p, goals: e.target.value }))} placeholder="Was soll erreicht werden?" rows={3} />
              </div>
              <div>
                <Label>Leistungskategorie</Label>
                <Select value={data.category} onValueChange={v => setData(p => ({ ...p, category: v }))}>
                  <SelectTrigger><SelectValue placeholder="Wähle eine Kategorie" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Strategie">Strategie</SelectItem>
                    <SelectItem value="Finanzen">Finanzen</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Services</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {SERVICES.map(s => (
                    <label key={s} className="flex items-center gap-1.5 text-sm cursor-pointer">
                      <Checkbox checked={data.services.includes(s)} onCheckedChange={() => toggleService(s)} />
                      {s}
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Projektstart</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {data.startDate ? format(data.startDate, "dd.MM.yyyy") : "Datum wählen"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={data.startDate} onSelect={d => setData(p => ({ ...p, startDate: d }))} locale={de} /></PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label>Projektende</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {data.endDate ? format(data.endDate, "dd.MM.yyyy") : "Datum wählen"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={data.endDate} onSelect={d => setData(p => ({ ...p, endDate: d }))} locale={de} /></PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Team */}
              <div>
                <Label>Team-Mitglieder</Label>
                <div className="space-y-2 mt-2">
                  {data.team.map((m, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <Input placeholder="Name" value={m.name} onChange={e => updateTeamMember(i, "name", e.target.value)} className="flex-1" />
                      <Input placeholder="Rolle" value={m.role} onChange={e => updateTeamMember(i, "role", e.target.value)} className="flex-1" />
                      <Input placeholder="Uni" value={m.university} onChange={e => updateTeamMember(i, "university", e.target.value)} className="flex-1" />
                      {data.team.length > 1 && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeTeamMember(i)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addTeamMember}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Mitglied hinzufügen
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Ansprechpartner (Kunde)</Label>
                  <Input value={data.contactPerson} onChange={e => setData(p => ({ ...p, contactPerson: e.target.value }))} />
                </div>
                <div>
                  <Label>Kontakt-E-Mail</Label>
                  <Input value={data.contactEmail} onChange={e => setData(p => ({ ...p, contactEmail: e.target.value }))} type="email" />
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate("/")}>Abbrechen</Button>
            <Button disabled={!data.clientName.trim()} onClick={() => setStep(2)}>Weiter</Button>
          </div>
        </div>
      )}

      {/* Step 2: Choose preset */}
      {step === 2 && (
        <div className="space-y-4">
          <p className="text-muted-foreground">Wähle eine Vorlage für die Generierung</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {presets.map(p => (
              <Card
                key={p.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.01] border-2 ${
                  selectedPreset?.id === p.id ? "border-primary" : "border-border"
                }`}
                onClick={() => setSelectedPreset(p)}
              >
                <CardHeader>
                  <CardTitle className="font-heading text-base">{p.title}</CardTitle>
                  <CardDescription className="text-xs">
                    {p.description} · {Array.isArray(p.slides_structure) ? p.slides_structure.length : 0} Slides
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(1)}>Zurück</Button>
            <Button disabled={!selectedPreset} onClick={() => { setStep(3); handleGenerate(); }}>
              KI-Generierung starten
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: AI Generation */}
      {step === 3 && (
        <div className="space-y-4">
          {generating && (
            <Card className="border-border">
              <CardContent className="py-12 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="font-medium text-foreground">KI generiert deine Präsentation...</p>
                <p className="text-sm text-muted-foreground mt-1">Das kann bis zu 30 Sekunden dauern.</p>
              </CardContent>
            </Card>
          )}

          {!generating && analysisText && (
            <>
              <Card className="border-border">
                <CardContent className="py-4">
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {analysisText.replace(/```json[\s\S]*?```/g, "").trim()}
                  </p>
                </CardContent>
              </Card>

              {generatedSlides && (
                <Card className="border-border">
                  <CardHeader>
                    <CardTitle className="font-heading text-lg">
                      {data.clientName} — {selectedPreset?.title}
                    </CardTitle>
                    <CardDescription>{generatedSlides.length} Slides generiert</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-3 overflow-x-auto pb-2">
                      {generatedSlides.map((slide, i) => (
                        <div key={i} className="flex-shrink-0">
                          <SlidePreview templateId={slide.template_id} content={slide.content} />
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-3 mt-4">
                      <Button onClick={handleAdopt}>Im Editor öffnen</Button>
                      <Button variant="cta" onClick={handleExport}>Direkt exportieren (.pptx)</Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {!generatedSlides && (
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(2)}>Zurück</Button>
                  <Button onClick={handleGenerate}>Erneut versuchen</Button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
