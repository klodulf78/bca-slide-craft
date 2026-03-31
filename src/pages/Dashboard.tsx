import { Plus, Upload, Clock, Sparkles, ArrowUpCircle, MessageSquare, Pencil, Download, Trash2, Database } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { generatePresentation } from "@/services/pptxExport";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Presentation {
  id: string;
  title: string;
  status: string;
  created_at: string;
  slides_content: any;
  source?: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [recentPresentations, setRecentPresentations] = useState<Presentation[]>([]);
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const [presResult, settingsResult] = await Promise.all([
        supabase.from("presentations").select("id, title, status, created_at, slides_content, source").order("created_at", { ascending: false }).limit(10),
        supabase.from("user_settings").select("first_name").limit(1).maybeSingle(),
      ]);
      if (presResult.data) setRecentPresentations(presResult.data);
      if (settingsResult.data?.first_name) setFirstName(settingsResult.data.first_name);
      setLoading(false);
    };
    loadData();
  }, []);

  const handleQuickExport = async (e: React.MouseEvent, p: Presentation) => {
    e.stopPropagation();
    try {
      const slides = Array.isArray(p.slides_content) ? p.slides_content : [];
      await generatePresentation(slides, p.title);
      toast({ title: `${p.title}.pptx heruntergeladen` });
    } catch {
      toast({ title: "Export fehlgeschlagen", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from("presentations").delete().eq("id", deleteId);
    setRecentPresentations(prev => prev.filter(p => p.id !== deleteId));
    setDeleteId(null);
    toast({ title: "Präsentation gelöscht" });
  };

  const actions = [
    { title: "Neue Präsentation", description: "Starte ein neues Projekt mit Templates", icon: Plus, onClick: () => navigate("/new") },
    { title: "Upload & Analyse", description: "Lade eine .pptx-Datei zur KI-Analyse hoch", icon: Upload, onClick: () => navigate("/upload") },
    { title: "Per KI erstellen", description: "Beschreibe dein Projekt und die KI erstellt Slides", icon: MessageSquare, onClick: () => navigate("/chat") },
    { title: "Aus Projekt erstellen", description: "Nutze Daten aus eurem Projekt für Slides", icon: Database, onClick: () => navigate("/new/from-project") },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">
          {firstName ? `Willkommen, ${firstName}` : "Willkommen bei BCA Slide Studio"}
        </h1>
        <p className="text-muted-foreground mt-1">Erstelle und verwalte deine Projekt-Präsentationen</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((action) => (
          <Card
            key={action.title}
            className="cursor-pointer hover:shadow-md hover:scale-[1.01] transition-all duration-200 border-border"
            onClick={action.onClick}
          >
            <CardHeader className="p-4">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <action.icon className="h-4 w-4 text-primary" />
              </div>
              <CardTitle className="text-sm font-heading">{action.title}</CardTitle>
              <CardDescription className="text-xs">{action.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="text-xl font-heading font-semibold text-foreground mb-4">Letzte Projekte</h2>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Card key={i} className="border-border">
                <CardContent className="py-4 flex items-center gap-4">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-24 ml-auto" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : recentPresentations.length === 0 ? (
          <Card className="border-border">
            <CardContent className="py-12 text-center text-muted-foreground">
              <Clock className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium text-foreground">Noch keine Präsentationen</p>
              <p className="text-sm mt-1">Starte jetzt mit deinem ersten Projekt!</p>
              <Button className="mt-4" onClick={() => navigate("/new")}>
                <Plus className="h-4 w-4 mr-2" /> Erste Präsentation erstellen
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {recentPresentations.map((p) => (
              <Card
                key={p.id}
                className="border-border hover:shadow-md transition-all duration-200 cursor-pointer group"
                onClick={() => navigate(`/presentation/${p.id}`)}
              >
                <CardContent className="py-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">{p.title}</p>
                      {p.source === "chat" && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                          <Sparkles className="h-2.5 w-2.5" />KI
                        </span>
                      )}
                      {p.source === "upload" && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-accent text-accent-foreground">
                          <ArrowUpCircle className="h-2.5 w-2.5" />Verbessert
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(p.created_at).toLocaleDateString("de-DE")}
                      {Array.isArray(p.slides_content) && p.slides_content.length > 0 && (
                        <span className="ml-2">· {p.slides_content.length} Slides</span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="hidden group-hover:flex items-center gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); navigate(`/presentation/${p.id}/edit`); }} title="Bearbeiten">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={(e) => handleQuickExport(e, p)} title="Exportieren">
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteId(p.id); }} title="Löschen">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground capitalize group-hover:hidden">
                      {p.status === "exported" ? "Exportiert" : "Entwurf"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
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
  );
}
