import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ChevronLeft, ChevronRight, Download, ArrowLeft, Plus, MoreVertical,
  Copy, Trash2, RefreshCw, Loader2, Save, FileText, List, AlignLeft,
  Columns2, BarChart3, Users, Phone, Check, Share2, Bookmark, CheckCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SlidePreview } from "@/components/slides/SlidePreview";
import { SlideEditorFactory } from "@/components/slides/editors/SlideEditorFactory";
import { generatePresentation } from "@/services/pptxExport";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShareDialog } from "@/components/ShareDialog";
import { Textarea } from "@/components/ui/textarea";
import type { Json } from "@/integrations/supabase/types";
import { ReviewCheckDialog } from "@/components/ReviewCheckDialog";

interface SlideContent {
  template_id: string;
  order: number;
  content: Record<string, any>;
}

const TEMPLATES = [
  { id: "title", name: "Titelslide", icon: FileText },
  { id: "agenda", name: "Agenda", icon: List },
  { id: "content", name: "Content", icon: AlignLeft },
  { id: "two-column", name: "Zwei-Spalter", icon: Columns2 },
  { id: "chart", name: "Chart / Daten", icon: BarChart3 },
  { id: "team", name: "Team", icon: Users },
  { id: "contact", name: "Kontakt / Abschluss", icon: Phone },
];

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

export default function PresentationEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [slides, setSlides] = useState<SlideContent[]>([]);
  const [title, setTitle] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [showAddSlide, setShowAddSlide] = useState(false);
  const [deleteSlideIdx, setDeleteSlideIdx] = useState<number | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showSavePreset, setShowSavePreset] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [presetTitle, setPresetTitle] = useState("");
  const [presetDesc, setPresetDesc] = useState("");
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const slideStripRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      const { data } = await supabase.from("presentations").select("*").eq("id", id).single();
      if (data) {
        setTitle(data.title);
        setSlides(Array.isArray(data.slides_content) ? (data.slides_content as any[]) : []);
      }
      setLoading(false);
    };
    load();
  }, [id]);

  const saveDraft = useCallback(async () => {
    if (!id) return;
    setSaveStatus("saving");
    setSaving(true);
    const { error } = await supabase
      .from("presentations")
      .update({
        slides_content: slides as unknown as Json,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    setSaving(false);
    if (!error) {
      setSaveStatus("saved");
      setHasChanges(false);
    }
  }, [id, slides]);

  // Auto-save every 15s when there are changes
  useEffect(() => {
    if (hasChanges) {
      setSaveStatus("unsaved");
      if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
      autoSaveRef.current = setTimeout(() => { saveDraft(); }, 15000);
    }
    return () => { if (autoSaveRef.current) clearTimeout(autoSaveRef.current); };
  }, [hasChanges, slides, saveDraft]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        saveDraft();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "e") {
        e.preventDefault();
        handleExport();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [saveDraft, slides, title]);

  // beforeunload
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasChanges) { e.preventDefault(); }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasChanges]);

  const updateSlide = (index: number, content: Record<string, any>) => {
    setSlides(prev => {
      const next = [...prev];
      next[index] = { ...next[index], content };
      return next;
    });
    setHasChanges(true);
  };

  const addSlide = (templateId: string) => {
    const newSlide: SlideContent = {
      template_id: templateId,
      order: slides.length + 1,
      content: getDefaultContent(templateId),
    };
    setSlides(prev => [...prev, newSlide]);
    setActiveIndex(slides.length);
    setShowAddSlide(false);
    setHasChanges(true);
  };

  const duplicateSlide = (index: number) => {
    const clone = JSON.parse(JSON.stringify(slides[index]));
    clone.order = slides.length + 1;
    const next = [...slides];
    next.splice(index + 1, 0, clone);
    setSlides(next.map((s, i) => ({ ...s, order: i + 1 })));
    setActiveIndex(index + 1);
    setHasChanges(true);
  };

  const deleteSlide = (index: number) => {
    if (slides.length <= 1) return;
    const next = slides.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i + 1 }));
    setSlides(next);
    setActiveIndex(Math.min(activeIndex, next.length - 1));
    setDeleteSlideIdx(null);
    setHasChanges(true);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await saveDraft();
      await generatePresentation(slides, title);
      if (id) await supabase.from("presentations").update({ status: "exported" }).eq("id", id);
      toast({ title: "Präsentation exportiert und heruntergeladen!" });
    } catch {
      toast({ title: "Export fehlgeschlagen", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  const tryNavigate = (path: string) => {
    if (hasChanges) {
      setPendingNavigation(path);
      setShowLeaveDialog(true);
    } else {
      navigate(path);
    }
  };

  const activeSlide = slides[activeIndex];

  if (loading) {
    return (
      <div className="flex flex-col h-[calc(100vh-5rem)] -m-6 lg:-m-8">
        <div className="h-12 border-b border-border flex items-center px-4 gap-3">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-48 ml-auto" />
        </div>
        <div className="flex-1 flex">
          <Skeleton className="flex-[0.65] m-4" />
          <Skeleton className="flex-[0.35] m-4" />
        </div>
        <Skeleton className="h-20 mx-4 mb-4" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] -m-6 lg:-m-8">
      {/* Toolbar */}
      <div className="h-12 border-b border-border flex items-center px-4 gap-2 flex-shrink-0 bg-card">
        <Button variant="ghost" size="sm" onClick={() => tryNavigate(`/presentation/${id}`)}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Detailseite
        </Button>
        <div className="flex-1" />
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Button variant="ghost" size="icon" className="h-8 w-8" disabled={activeIndex === 0} onClick={() => setActiveIndex(activeIndex - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span>Slide {activeIndex + 1} von {slides.length}</span>
          <Button variant="ghost" size="icon" className="h-8 w-8" disabled={activeIndex === slides.length - 1} onClick={() => setActiveIndex(activeIndex + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 flex justify-end items-center gap-2">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            {saveStatus === "saved" && <><Check className="h-3 w-3 text-green-600" /> Gespeichert</>}
            {saveStatus === "saving" && <><Loader2 className="h-3 w-3 animate-spin" /> Speichert...</>}
            {saveStatus === "unsaved" && <><Save className="h-3 w-3" /> Ungespeichert</>}
          </span>
          <Button size="sm" variant="outline" onClick={saveDraft} disabled={saving}>
            <Save className="h-4 w-4 mr-1" /> Speichern
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setShowSavePreset(true)} title="Als Vorlage speichern">
            <Bookmark className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setShowShareDialog(true)} title="Teilen">
            <Share2 className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowReview(true)} title="Review-Check">
            <CheckCircle className="h-4 w-4 mr-1" /> Review
          </Button>
          <Button size="sm" variant="cta" onClick={handleExport} disabled={exporting}>
            {exporting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Download className="h-4 w-4 mr-1" />}
            Exportieren
          </Button>
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex min-h-0 flex-col lg:flex-row">
        {/* Preview */}
        <div className="flex-[0.65] flex items-center justify-center p-4 bg-muted/30 overflow-hidden">
          {activeSlide && (
            <SlidePreview
              templateId={activeSlide.template_id}
              content={activeSlide.content}
              className="!w-full !h-auto aspect-video max-w-[700px] shadow-lg"
            />
          )}
        </div>

        {/* Properties panel */}
        <div className="flex-[0.35] border-l border-border bg-card overflow-hidden flex flex-col min-w-[280px]">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            {activeSlide && (() => {
              const tpl = TEMPLATES.find(t => t.id === activeSlide.template_id);
              return tpl ? (
                <>
                  <tpl.icon className="h-4 w-4 text-primary" />
                  <span className="font-heading font-semibold text-sm">{tpl.name}</span>
                  <span className="text-xs text-muted-foreground ml-auto">Slide {activeIndex + 1}</span>
                </>
              ) : null;
            })()}
          </div>
          <ScrollArea className="flex-1">
            <div className="p-4">
              {activeSlide && (
                <SlideEditorFactory
                  templateId={activeSlide.template_id}
                  content={activeSlide.content}
                  onChange={(c) => updateSlide(activeIndex, c)}
                />
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Slide strip */}
      <div className="h-24 border-t border-border bg-card flex items-center px-2 gap-2 flex-shrink-0 overflow-x-auto" ref={slideStripRef}>
        {slides.map((slide, i) => (
          <div key={i} className="relative group flex-shrink-0">
            <button
              onClick={() => setActiveIndex(i)}
              className={`rounded-md border-2 transition-all duration-200 overflow-hidden ${
                i === activeIndex ? "border-primary shadow-md" : "border-border hover:border-primary/40"
              }`}
            >
              <SlidePreview
                templateId={slide.template_id}
                content={slide.content}
                className="!w-[120px] !h-[67px]"
              />
            </button>
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[9px] text-muted-foreground bg-card/90 px-1 rounded-t">
              {i + 1}
            </span>

            {/* Context menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-card/90 rounded p-0.5">
                  <MoreVertical className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => duplicateSlide(i)}>
                  <Copy className="h-3 w-3 mr-2" /> Duplizieren
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setDeleteSlideIdx(i)}
                  className="text-destructive focus:text-destructive"
                  disabled={slides.length <= 1}
                >
                  <Trash2 className="h-3 w-3 mr-2" /> Löschen
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}

        {/* Add slide button */}
        <button
          onClick={() => setShowAddSlide(true)}
          className="flex-shrink-0 w-[120px] h-[67px] rounded-md border-2 border-dashed border-border hover:border-primary/50 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      {/* Add slide dialog */}
      <Dialog open={showAddSlide} onOpenChange={setShowAddSlide}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Slide hinzufügen</DialogTitle>
            <DialogDescription>Wähle ein Template für die neue Slide</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            {TEMPLATES.map(t => (
              <button
                key={t.id}
                onClick={() => addSlide(t.id)}
                className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary hover:bg-muted/50 transition-all text-left"
              >
                <t.icon className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">{t.name}</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteSlideIdx !== null} onOpenChange={() => setDeleteSlideIdx(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slide löschen?</AlertDialogTitle>
            <AlertDialogDescription>Diese Aktion kann nicht rückgängig gemacht werden.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteSlideIdx !== null && deleteSlide(deleteSlideIdx)}>Löschen</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Leave confirmation */}
      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ungespeicherte Änderungen</AlertDialogTitle>
            <AlertDialogDescription>Du hast ungespeicherte Änderungen. Was möchtest du tun?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setShowLeaveDialog(false); setPendingNavigation(null); }}>Abbrechen</AlertDialogCancel>
            <Button variant="outline" onClick={() => { setShowLeaveDialog(false); if (pendingNavigation) navigate(pendingNavigation); }}>Verwerfen</Button>
            <AlertDialogAction onClick={async () => { await saveDraft(); setShowLeaveDialog(false); if (pendingNavigation) navigate(pendingNavigation); }}>Speichern & Verlassen</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Share dialog */}
      {id && <ShareDialog open={showShareDialog} onOpenChange={setShowShareDialog} presentationId={id} />}

      {/* Save as preset dialog */}
      <Dialog open={showSavePreset} onOpenChange={setShowSavePreset}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading">Als Vorlage speichern</DialogTitle>
            <DialogDescription>Speichere die aktuelle Slide-Struktur als wiederverwendbare Vorlage.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Vorlagen-Titel" value={presetTitle} onChange={e => setPresetTitle(e.target.value)} />
            <Textarea placeholder="Beschreibung (optional)" value={presetDesc} onChange={e => setPresetDesc(e.target.value)} rows={2} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSavePreset(false)}>Abbrechen</Button>
            <Button disabled={!presetTitle.trim()} onClick={async () => {
              await supabase.from("presentation_presets").insert({
                title: presetTitle,
                description: presetDesc || null,
                slides_structure: slides as unknown as Json,
                is_global: false,
              });
              setShowSavePreset(false);
              setPresetTitle("");
              setPresetDesc("");
              toast({ title: "Vorlage gespeichert!" });
            }}>Speichern</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review check dialog */}
      <ReviewCheckDialog open={showReview} onOpenChange={setShowReview} slides={slides} />
    </div>
  );
}
