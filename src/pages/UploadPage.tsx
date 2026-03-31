import { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, FileUp, CheckCircle, Loader2, Sparkles, FileDown, ArrowRight, Image, BarChart3, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SlidePreview } from "@/components/slides/SlidePreview";
import { parsePptx, type ParsedPresentation } from "@/services/pptxParser";
import { generatePresentation } from "@/services/pptxExport";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface ParsedAIPresentation {
  title: string;
  total_slides: number;
  estimated_duration_minutes: number;
  slides: Array<{
    slide_number: number;
    template_id: string;
    content: Record<string, any>;
  }>;
}

type Step = "upload" | "overview" | "analysis";

export default function UploadPage() {
  const navigate = useNavigate();
  const [isDragging, setIsDragging] = useState(false);
  const [step, setStep] = useState<Step>("upload");
  const [parsing, setParsing] = useState(false);
  const [parseProgress, setParseProgress] = useState(0);
  const [parsed, setParsed] = useState<ParsedPresentation | null>(null);
  const [file, setFile] = useState<File | null>(null);

  // Analysis state
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStage, setAnalysisStage] = useState("");
  const [analysisText, setAnalysisText] = useState("");
  const [improvedPresentation, setImprovedPresentation] = useState<ParsedAIPresentation | null>(null);
  const [savingImproved, setSavingImproved] = useState(false);
  const [exportingImproved, setExportingImproved] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const MAX_FILE_SIZE = 50 * 1024 * 1024;

  const handleFile = async (f: File) => {
    if (!f.name.toLowerCase().endsWith(".pptx")) {
      toast({ title: "Ungültiges Format", description: "Nur .pptx-Dateien werden unterstützt.", variant: "destructive" });
      return;
    }
    if (f.size > MAX_FILE_SIZE) {
      toast({ title: "Datei zu groß", description: "Maximale Dateigröße: 50 MB.", variant: "destructive" });
      return;
    }

    setFile(f);
    setParsing(true);
    setParseProgress(20);

    try {
      setParseProgress(40);
      const result = await parsePptx(f);
      setParseProgress(80);

      // Upload to storage
      const filePath = `${Date.now()}_${f.name}`;
      await supabase.storage.from("uploaded-presentations").upload(filePath, f);

      setParseProgress(100);
      setParsed(result);
      setStep("overview");
    } catch (err) {
      console.error("Parse error:", err);
      toast({ title: "Fehler", description: "Die Datei konnte nicht gelesen werden. Stelle sicher, dass es eine gültige PowerPoint-Datei ist.", variant: "destructive" });
    } finally {
      setParsing(false);
      setParseProgress(0);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const resetUpload = () => {
    setStep("upload");
    setParsed(null);
    setFile(null);
    setAnalysisText("");
    setImprovedPresentation(null);
  };

  const startAnalysis = async () => {
    if (!parsed) return;
    setStep("analysis");
    setAnalyzing(true);
    setAnalysisText("");
    setImprovedPresentation(null);

    const slideDetails = parsed.slides
      .map((s) => `Slide ${s.slideNumber}: ${s.title || "(Kein Titel)"}\n${s.bodyText || "(Kein Text)"}`)
      .join("\n---\n");

    const userMessage = `Ich habe eine bestehende Präsentation hochgeladen. Hier ist der extrahierte Inhalt:\n\n---\nTitel: ${parsed.title}\nAnzahl Slides: ${parsed.totalSlides}\n\n${slideDetails}\n---\n\nBitte analysiere diese Präsentation und:\n1. Bewerte die Struktur (Reihenfolge, fehlende Slides, überflüssige Slides)\n2. Bewerte die Textqualität (Kernaussagen als Titel? Zu viel Text? Consulting-Qualität?)\n3. Schlage konkrete Verbesserungen vor\n4. Generiere eine verbesserte Version als JSON im üblichen Format\n\nGib deine Analyse als Text und die verbesserte Version als JSON-Block aus.`;

    try {
      setAnalysisStage("Inhalt wird extrahiert...");
      await new Promise((r) => setTimeout(r, 500));
      setAnalysisStage("KI analysiert die Struktur...");

      abortRef.current = new AbortController();
      const response = await supabase.functions.invoke("generate-slides", {
        body: { userMessage, conversationHistory: [] },
      });

      if (response.error) throw new Error(response.error.message);

      setAnalysisStage("Verbesserungen werden generiert...");

      // Handle streaming response
      const reader = response.data instanceof ReadableStream
        ? response.data.getReader()
        : null;

      if (reader) {
        const decoder = new TextDecoder();
        let fullText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));

          for (const line of lines) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                fullText += delta;
                setAnalysisText(fullText);
              }
            } catch { /* skip */ }
          }
        }

        // Parse JSON from complete response
        const jsonMatch = fullText.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          try {
            const p = JSON.parse(jsonMatch[1]);
            setImprovedPresentation(p.presentation || null);
          } catch { /* no valid JSON */ }
        }
      } else if (typeof response.data === "object" && response.data?.message) {
        // Non-streaming fallback
        const text = response.data.message;
        setAnalysisText(text);
        const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          try {
            const p = JSON.parse(jsonMatch[1]);
            setImprovedPresentation(p.presentation || null);
          } catch { /* no valid JSON */ }
        }
      }
    } catch (err: any) {
      console.error("Analysis error:", err);
      toast({ title: "Analyse fehlgeschlagen", description: "Bitte versuche es erneut.", variant: "destructive" });
    } finally {
      setAnalyzing(false);
      setAnalysisStage("");
    }
  };

  const adoptImproved = async () => {
    if (!improvedPresentation || !parsed) return;
    setSavingImproved(true);
    try {
      const slides = improvedPresentation.slides.map((s, i) => ({
        template_id: s.template_id,
        order: i,
        content: s.content,
      }));

      const { data, error } = await supabase.from("presentations").insert({
        title: improvedPresentation.title || parsed.title,
        description: `Verbesserte Version von "${parsed.fileName}"`,
        slides_content: slides,
        selected_templates: slides.map((s) => s.template_id),
        status: "draft",
        source: "upload",
      }).select("id").single();

      if (error) throw error;

      toast({ title: "Übernommen!", description: "Die verbesserte Präsentation wurde gespeichert." });
      navigate(`/presentation/${data.id}`);
    } catch (err) {
      toast({ title: "Fehler", description: "Konnte nicht gespeichert werden.", variant: "destructive" });
    } finally {
      setSavingImproved(false);
    }
  };

  const exportImproved = async () => {
    if (!improvedPresentation) return;
    setExportingImproved(true);
    try {
      const slides = improvedPresentation.slides.map((s, i) => ({
        template_id: s.template_id,
        order: i,
        content: s.content,
      }));
      await generatePresentation(slides, improvedPresentation.title || "Verbesserte-Präsentation");
      toast({ title: "Exportiert!", description: "Die verbesserte Präsentation wurde heruntergeladen." });
    } catch {
      toast({ title: "Export fehlgeschlagen", description: "Bitte versuche es erneut.", variant: "destructive" });
    } finally {
      setExportingImproved(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const renderAnalysisText = (text: string) => {
    // Strip JSON block for display
    const cleanText = text.replace(/```json[\s\S]*?```/g, "").trim();
    // Simple markdown-like rendering
    return cleanText.split("\n").map((line, i) => {
      if (line.startsWith("### ")) return <h3 key={i} className="text-lg font-heading font-semibold text-foreground mt-4 mb-1">{line.slice(4)}</h3>;
      if (line.startsWith("## ")) return <h2 key={i} className="text-xl font-heading font-bold text-foreground mt-4 mb-2">{line.slice(3)}</h2>;
      if (line.startsWith("# ")) return <h1 key={i} className="text-2xl font-heading font-bold text-foreground mt-4 mb-2">{line.slice(2)}</h1>;
      if (line.startsWith("- ") || line.startsWith("* ")) return <li key={i} className="text-muted-foreground ml-4 list-disc">{renderBold(line.slice(2))}</li>;
      if (/^\d+\.\s/.test(line)) return <li key={i} className="text-muted-foreground ml-4 list-decimal">{renderBold(line.replace(/^\d+\.\s/, ""))}</li>;
      if (line.trim() === "") return <br key={i} />;
      return <p key={i} className="text-muted-foreground">{renderBold(line)}</p>;
    });
  };

  const renderBold = (text: string) => {
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, i) => i % 2 === 1 ? <strong key={i} className="text-foreground font-semibold">{part}</strong> : part);
  };

  // ============ STEP 1: UPLOAD ============
  if (step === "upload") {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-heading font-bold text-foreground">Präsentation hochladen</h1>
        <p className="text-muted-foreground">Lade eine bestehende .pptx-Datei hoch zur Analyse und KI-Optimierung</p>

        {parsing ? (
          <Card className="border-border">
            <CardContent className="py-16 text-center space-y-4">
              <Loader2 className="h-12 w-12 mx-auto text-primary animate-spin" />
              <p className="text-foreground font-medium">Präsentation wird analysiert...</p>
              <Progress value={parseProgress} className="max-w-xs mx-auto" />
            </CardContent>
          </Card>
        ) : (
          <Card
            className={`border-2 border-dashed transition-colors ${isDragging ? "border-primary bg-primary/5" : "border-border"}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <CardContent className="py-16 text-center">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-foreground font-medium mb-1">Datei hierher ziehen</p>
              <p className="text-sm text-muted-foreground mb-4">oder klicke um eine Datei auszuwählen</p>
              <label>
                <Button variant="outline" asChild>
                  <span><FileUp className="h-4 w-4 mr-2" />Datei auswählen</span>
                </Button>
                <input type="file" accept=".pptx" className="hidden" onChange={handleFileInput} />
              </label>
              <p className="text-xs text-muted-foreground mt-4">Akzeptiert: .pptx · Max. 50 MB</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // ============ STEP 2: OVERVIEW ============
  if (step === "overview" && parsed) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Analyse-Übersicht</h1>
          <p className="text-muted-foreground mt-1">{parsed.fileName} · {formatFileSize(parsed.fileSize)} · {parsed.totalSlides} Slides</p>
        </div>

        <div className="space-y-3">
          {parsed.slides.map((slide) => (
            <Card key={slide.slideNumber} className="border-border">
              <CardContent className="py-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground">
                    {slide.slideNumber}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">
                      {slide.title || "Kein Titel erkannt"}
                    </p>
                    {slide.bodyText && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {slide.bodyText.slice(0, 100)}{slide.bodyText.length > 100 ? "..." : ""}
                      </p>
                    )}
                    <div className="flex gap-2 mt-2">
                      {slide.hasImage && (
                        <Badge variant="secondary" className="text-xs"><Image className="h-3 w-3 mr-1" />Bild</Badge>
                      )}
                      {slide.hasChart && (
                        <Badge variant="secondary" className="text-xs"><BarChart3 className="h-3 w-3 mr-1" />Chart</Badge>
                      )}
                      <Badge variant="outline" className="text-xs capitalize">{slide.layout}</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex gap-3">
          <Button onClick={startAnalysis}>
            <Sparkles className="h-4 w-4 mr-2" />KI-Analyse starten
          </Button>
          <Button variant="outline" onClick={resetUpload}>
            <RefreshCw className="h-4 w-4 mr-2" />Neue Datei hochladen
          </Button>
        </div>
      </div>
    );
  }

  // ============ STEP 3: ANALYSIS ============
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">KI-Analyse</h1>
        <p className="text-muted-foreground mt-1">{parsed?.fileName}</p>
      </div>

      {analyzing && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-6 flex items-center gap-4">
            <Loader2 className="h-6 w-6 text-primary animate-spin flex-shrink-0" />
            <div>
              <p className="font-medium text-foreground">{analysisStage || "Analyse läuft..."}</p>
              <p className="text-sm text-muted-foreground">Dies kann 10–20 Sekunden dauern</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis text */}
      {analysisText && (
        <Card className="border-border">
          <CardContent className="py-6">
            <div className="prose prose-sm max-w-none">
              {renderAnalysisText(analysisText)}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comparison view */}
      {improvedPresentation && parsed && (
        <div className="space-y-4">
          <h2 className="text-xl font-heading font-semibold text-foreground">Vorher / Nachher Vergleich</h2>

          <div className="grid grid-cols-2 gap-4">
            {/* Headers */}
            <div className="text-center">
              <Badge variant="secondary" className="mb-2">Original</Badge>
            </div>
            <div className="text-center">
              <Badge className="mb-2 bg-primary">KI-Optimiert</Badge>
            </div>

            {/* Side by side slides */}
            {(() => {
              const maxLen = Math.max(parsed.slides.length, improvedPresentation.slides.length);
              const rows = [];
              for (let i = 0; i < maxLen; i++) {
                const origSlide = parsed.slides[i];
                const impSlide = improvedPresentation.slides[i];
                const isNew = !origSlide;
                const isChanged = origSlide && impSlide && origSlide.title !== (impSlide.content?.title || "");

                rows.push(
                  <div key={`orig-${i}`} className="min-h-[80px]">
                    {origSlide ? (
                      <Card className="border-border h-full">
                        <CardContent className="py-3 px-4">
                          <p className="text-xs text-muted-foreground">Slide {origSlide.slideNumber}</p>
                          <p className="text-sm font-medium text-foreground">{origSlide.title || "Kein Titel"}</p>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{origSlide.bodyText?.slice(0, 80)}</p>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="h-full flex items-center justify-center text-sm text-muted-foreground italic">—</div>
                    )}
                  </div>,
                  <div key={`imp-${i}`} className="min-h-[80px]">
                    {impSlide ? (
                      <Card className={`h-full ${isNew ? "border-green-500 border-2" : isChanged ? "border-orange-500 border-2" : "border-border"}`}>
                        <CardContent className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-muted-foreground">Slide {impSlide.slide_number}</p>
                            {isNew && <Badge className="text-[10px] px-1.5 py-0 bg-green-500">Neu</Badge>}
                            {isChanged && !isNew && <Badge className="text-[10px] px-1.5 py-0 bg-orange-500">Verbessert</Badge>}
                          </div>
                          <p className="text-sm font-medium text-foreground">{impSlide.content?.title || impSlide.content?.thank_you_text || impSlide.template_id}</p>
                          <div className="mt-1">
                            <SlidePreview
                              templateId={impSlide.template_id}
                              content={impSlide.content}
                              className="w-full h-auto aspect-video"
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="h-full flex items-center justify-center text-sm text-muted-foreground italic">—</div>
                    )}
                  </div>
                );
              }
              return rows;
            })()}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <Button onClick={adoptImproved} disabled={savingImproved}>
              {savingImproved ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ArrowRight className="h-4 w-4 mr-2" />}
              Verbesserte Version übernehmen
            </Button>
            <Button variant="cta" onClick={exportImproved} disabled={exportingImproved}>
              {exportingImproved ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileDown className="h-4 w-4 mr-2" />}
              Als .pptx exportieren
            </Button>
            <Button variant="outline" onClick={resetUpload}>
              Neue Datei hochladen
            </Button>
          </div>
        </div>
      )}

      {!analyzing && !analysisText && (
        <div className="text-center py-8">
          <Button onClick={() => setStep("overview")} variant="outline">Zurück zur Übersicht</Button>
        </div>
      )}
    </div>
  );
}
