import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, Users, Mail } from "lucide-react";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  presentationId: string;
}

interface Collaborator {
  id: string;
  user_email: string;
  role: string;
}

export function ShareDialog({ open, onOpenChange, presentationId }: ShareDialogProps) {
  const [email, setEmail] = useState("");
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && presentationId) {
      supabase.from("presentation_collaborators")
        .select("*")
        .eq("presentation_id", presentationId)
        .then(({ data }) => { if (data) setCollaborators(data as any[]); });
    }
  }, [open, presentationId]);

  const handleAdd = async () => {
    if (!email.trim() || !email.includes("@")) {
      toast({ title: "Bitte eine gültige E-Mail eingeben", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("presentation_collaborators").insert({
      presentation_id: presentationId,
      user_email: email.trim(),
      role: "editor",
    });
    if (error) {
      toast({ title: error.code === "23505" ? "Bereits eingeladen" : "Fehler beim Einladen", variant: "destructive" });
    } else {
      setCollaborators(prev => [...prev, { id: crypto.randomUUID(), user_email: email.trim(), role: "editor" }]);
      setEmail("");
      toast({ title: "Einladung gesendet" });
    }
    setLoading(false);
  };

  const handleRemove = async (id: string) => {
    await supabase.from("presentation_collaborators").delete().eq("id", id);
    setCollaborators(prev => prev.filter(c => c.id !== id));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" /> Präsentation teilen
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="E-Mail-Adresse eingeben"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAdd()}
              type="email"
            />
            <Button onClick={handleAdd} disabled={loading}>
              <Plus className="h-4 w-4 mr-1" /> Einladen
            </Button>
          </div>

          {collaborators.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium">Eingeladene Mitglieder</p>
              {collaborators.map(c => (
                <div key={c.id} className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/50">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    {c.user_email}
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRemove(c.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
