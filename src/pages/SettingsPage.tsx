import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-3xl font-heading font-bold text-foreground">Einstellungen</h1>
      <Card className="border-border">
        <CardContent className="py-12 text-center">
          <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-foreground font-medium">Einstellungen kommen in Phase 2</p>
          <p className="text-sm text-muted-foreground mt-1">
            Hier werden Profil, Team-Verwaltung und Export-Optionen verfügbar sein.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
