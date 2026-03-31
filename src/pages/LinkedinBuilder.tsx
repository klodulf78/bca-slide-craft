import { Linkedin } from "lucide-react";

export default function LinkedinBuilder() {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Carls LinkedIn Builder</h1>
        <p className="text-muted-foreground mt-1">Erstelle und optimiere LinkedIn-Posts mit KI-Unterstützung</p>
      </div>
      <div className="flex items-center justify-center min-h-[400px] rounded-lg border border-dashed border-border bg-muted/30">
        <div className="text-center space-y-3">
          <Linkedin className="h-12 w-12 mx-auto text-primary opacity-40" />
          <p className="font-medium text-foreground">LinkedIn Builder</p>
          <p className="text-sm text-muted-foreground">Coming soon — hier entstehen deine LinkedIn-Posts.</p>
        </div>
      </div>
    </div>
  );
}
