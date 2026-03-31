import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2, Save } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface UserSettings {
  id?: string;
  first_name: string;
  last_name: string;
  default_team_name: string;
  default_contact_email: string;
  default_website: string;
  default_linkedin: string;
  default_variant: string;
  footer_text: string;
}

const defaults: UserSettings = {
  first_name: "",
  last_name: "",
  default_team_name: "BCA Projektteam",
  default_contact_email: "kontakt@bca-berlin.de",
  default_website: "www.bca-berlin.de",
  default_linkedin: "linkedin.com/company/bca-berlin",
  default_variant: "light",
  footer_text: "Berlin Consulting Association e.V.",
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("user_settings").select("*").limit(1).maybeSingle();
      if (data) {
        setSettings({
          id: data.id,
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          default_team_name: data.default_team_name || defaults.default_team_name,
          default_contact_email: data.default_contact_email || defaults.default_contact_email,
          default_website: data.default_website || defaults.default_website,
          default_linkedin: data.default_linkedin || defaults.default_linkedin,
          default_variant: data.default_variant || defaults.default_variant,
          footer_text: data.footer_text || defaults.footer_text,
        });
      }
      setLoading(false);
    };
    load();
  }, []);

  const update = (key: keyof UserSettings, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        first_name: settings.first_name || null,
        last_name: settings.last_name || null,
        default_team_name: settings.default_team_name,
        default_contact_email: settings.default_contact_email,
        default_website: settings.default_website,
        default_linkedin: settings.default_linkedin,
        default_variant: settings.default_variant,
        footer_text: settings.footer_text,
      };

      if (settings.id) {
        await supabase.from("user_settings").update(payload).eq("id", settings.id);
      } else {
        const { data } = await supabase.from("user_settings").insert(payload).select("id").single();
        if (data) setSettings(prev => ({ ...prev, id: data.id }));
      }
      toast({ title: "Einstellungen gespeichert" });
    } catch {
      toast({ title: "Fehler beim Speichern", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-3xl font-heading font-bold text-foreground">Einstellungen</h1>

      {/* Profile */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="font-heading text-lg">Profil</CardTitle>
          <CardDescription>Dein Name wird im Dashboard-Gruß verwendet</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Vorname</Label>
              <Input value={settings.first_name} onChange={e => update("first_name", e.target.value)} placeholder="Max" />
            </div>
            <div>
              <Label>Nachname</Label>
              <Input value={settings.last_name} onChange={e => update("last_name", e.target.value)} placeholder="Mustermann" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Defaults */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="font-heading text-lg">Standard-Werte für Präsentationen</CardTitle>
          <CardDescription>Diese Werte werden automatisch in neue Slides eingefüllt</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Standard-Teamname</Label>
            <Input value={settings.default_team_name} onChange={e => update("default_team_name", e.target.value)} />
          </div>
          <div>
            <Label>Standard-Kontakt-E-Mail</Label>
            <Input value={settings.default_contact_email} onChange={e => update("default_contact_email", e.target.value)} />
          </div>
          <div>
            <Label>Standard-Website</Label>
            <Input value={settings.default_website} onChange={e => update("default_website", e.target.value)} />
          </div>
          <div>
            <Label>Standard-LinkedIn</Label>
            <Input value={settings.default_linkedin} onChange={e => update("default_linkedin", e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* Export */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="font-heading text-lg">Exporteinstellungen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Standard-Variante</Label>
            <div className="flex gap-3 mt-2">
              {["light", "dark"].map(v => (
                <button
                  key={v}
                  onClick={() => update("default_variant", v)}
                  className={`px-4 py-2 rounded-md border text-sm font-medium transition-all ${
                    settings.default_variant === v
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-foreground hover:border-primary/50"
                  }`}
                >
                  {v === "light" ? "Hell" : "Dunkel"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>Footer-Text</Label>
            <Input value={settings.footer_text} onChange={e => update("footer_text", e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Einstellungen speichern
        </Button>
      </div>
    </div>
  );
}
