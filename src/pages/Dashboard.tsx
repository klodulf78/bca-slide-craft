import { Plus, Upload, Clock } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Presentation {
  id: string;
  title: string;
  status: string;
  created_at: string;
  slides_content: any[] | null;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [recentPresentations, setRecentPresentations] = useState<Presentation[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const { data } = await supabase
        .from("presentations")
        .select("id, title, status, created_at, slides_content")
        .order("created_at", { ascending: false })
        .limit(5);

      if (data) setRecentPresentations(data);
    };
    loadData();
  }, []);

  const actions = [
    {
      title: "Neue Präsentation erstellen",
      description: "Starte ein neues Projekt mit professionellen Slide-Templates",
      icon: Plus,
      onClick: () => navigate("/new"),
    },
    {
      title: "Präsentation hochladen",
      description: "Lade eine bestehende .pptx-Datei hoch zur Analyse",
      icon: Upload,
      onClick: () => navigate("/upload"),
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">
          Willkommen bei BCA Slide Studio
        </h1>
        <p className="text-muted-foreground mt-1">
          Erstelle und verwalte deine Projekt-Präsentationen
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {actions.map((action) => (
          <Card
            key={action.title}
            className="cursor-pointer hover:shadow-md hover:scale-[1.01] transition-all duration-200 border-border"
            onClick={action.onClick}
          >
            <CardHeader>
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                <action.icon className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg font-heading">{action.title}</CardTitle>
              <CardDescription>{action.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="text-xl font-heading font-semibold text-foreground mb-4">
          Letzte Projekte
        </h2>
        {recentPresentations.length === 0 ? (
          <Card className="border-border">
            <CardContent className="py-8 text-center text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Noch keine Präsentationen erstellt</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {recentPresentations.map((p) => (
              <Card key={p.id} className="border-border hover:shadow-sm transition-shadow">
                <CardContent className="py-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">{p.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(p.created_at).toLocaleDateString("de-DE")}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground capitalize">
                    {p.status}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
