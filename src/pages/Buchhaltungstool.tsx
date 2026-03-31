import { Calculator } from "lucide-react";

export default function Buchhaltungstool() {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Carls Buchhaltungstool</h1>
        <p className="text-muted-foreground mt-1">Einnahmen, Ausgaben und Belege verwalten</p>
      </div>
      <div className="flex items-center justify-center min-h-[400px] rounded-lg border border-dashed border-border bg-muted/30">
        <div className="text-center space-y-3">
          <Calculator className="h-12 w-12 mx-auto text-primary opacity-40" />
          <p className="font-medium text-foreground">Buchhaltungstool</p>
          <p className="text-sm text-muted-foreground">Coming soon — hier entsteht dein Buchhaltungsbereich.</p>
        </div>
      </div>
    </div>
  );
}
