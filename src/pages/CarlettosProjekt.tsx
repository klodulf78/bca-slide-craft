import { FolderOpen } from "lucide-react";

export default function CarlettosProjekt() {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Carlettos Projekt</h1>
        <p className="text-muted-foreground mt-1">Projektübersicht und Verwaltung</p>
      </div>
      <div className="flex items-center justify-center min-h-[400px] rounded-lg border border-dashed border-border bg-muted/30">
        <div className="text-center space-y-3">
          <FolderOpen className="h-12 w-12 mx-auto text-primary opacity-40" />
          <p className="font-medium text-foreground">Carlettos Projekt</p>
          <p className="text-sm text-muted-foreground">Coming soon — hier entsteht dein Projektbereich.</p>
        </div>
      </div>
    </div>
  );
}
