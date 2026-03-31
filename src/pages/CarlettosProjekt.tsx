import { FolderOpen, Linkedin, Calculator } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function CarlettosProjekt() {
  const navigate = useNavigate();

  const subPages = [
    { title: "Carls LinkedIn Builder", description: "Erstelle und optimiere LinkedIn-Posts mit KI", icon: Linkedin, path: "/carlettos-projekt/linkedin" },
    { title: "Carls Buchhaltungstool", description: "Einnahmen, Ausgaben und Belege verwalten", icon: Calculator, path: "/carlettos-projekt/buchhaltung" },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Carlettos Projekt</h1>
        <p className="text-muted-foreground mt-1">Projektübersicht und Verwaltung</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {subPages.map((page) => (
          <Card
            key={page.path}
            className="cursor-pointer hover:shadow-md hover:scale-[1.01] transition-all duration-200 border-border"
            onClick={() => navigate(page.path)}
          >
            <CardHeader className="p-4">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <page.icon className="h-4 w-4 text-primary" />
              </div>
              <CardTitle className="text-sm font-heading">{page.title}</CardTitle>
              <CardDescription className="text-xs">{page.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
