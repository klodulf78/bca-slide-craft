import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Pencil, Download, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SlidePreview } from "@/components/slides/SlidePreview";
import { toast } from "@/hooks/use-toast";
import { generatePresentation } from "@/services/pptxExport";

interface SlideContent {
  template_id: string;
  order: number;
  content: Record<string, any>;
}

export default function PresentationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [presentation, setPresentation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      const { data } = await supabase.from("presentations").select("*").eq("id", id).single();
      setPresentation(data);
      setLoading(false);
    };
    load();
  }, [id]);

  const handleDelete = async () => {
    if (!id) return;
    await supabase.from("presentations").delete().eq("id", id);
    toast({ title: "Präsentation gelöscht" });
    navigate("/");
  };

  if (loading) return <div className="max-w-5xl mx-auto py-8 text-muted-foreground">Laden...</div>;
  if (!presentation) return <div className="max-w-5xl mx-auto py-8 text-muted-foreground">Nicht gefunden.</div>;

  const slides: SlideContent[] = Array.isArray(presentation.slides_content) ? presentation.slides_content : [];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">{presentation.title}</h1>
          {presentation.description && <p className="text-muted-foreground mt-1">{presentation.description}</p>}
          <div className="flex items-center gap-3 mt-2">
            <Badge variant={presentation.status === "exported" ? "default" : "secondary"}>
              {presentation.status === "exported" ? "Exportiert" : "Entwurf"}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {new Date(presentation.created_at).toLocaleDateString("de-DE")}
            </span>
            <span className="text-sm text-muted-foreground">{slides.length} Slides</span>
          </div>
        </div>
      </div>

      {/* Slide Gallery */}
      {slides.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {slides.map((slide, i) => (
            <div key={i} className="text-center">
              <SlidePreview templateId={slide.template_id} content={slide.content || {}} />
              <p className="text-xs text-muted-foreground mt-1">Slide {slide.order}</p>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={() => navigate("/")} variant="outline">Zurück</Button>
        <Button onClick={() => toast({ title: "Export-Funktion wird in Kürze freigeschaltet" })} className="bg-orange-accent hover:bg-orange-accent/90 text-white">
          <Download className="h-4 w-4 mr-2" /> Exportieren
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive"><Trash2 className="h-4 w-4 mr-2" /> Löschen</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Präsentation löschen?</AlertDialogTitle>
              <AlertDialogDescription>Diese Aktion kann nicht rückgängig gemacht werden.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Löschen</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
