import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";

interface Props {
  content: Record<string, any>;
  onChange: (content: Record<string, any>) => void;
}

export function TeamEditor({ content, onChange }: Props) {
  const update = (key: string, value: any) => onChange({ ...content, [key]: value });
  const members = content.members?.length ? content.members : [
    { name: "", role: "", university: "" },
    { name: "", role: "", university: "" },
  ];

  const updateMember = (i: number, key: string, val: string) => {
    const next = [...members];
    next[i] = { ...next[i], [key]: val };
    update("members", next);
  };

  return (
    <div className="space-y-3">
      <div>
        <Label>Slide-Titel</Label>
        <Input value={content.title || "Unser Team"} onChange={(e) => update("title", e.target.value)} className="bg-[hsl(228,33%,98%)]" />
      </div>
      <Label>Teammitglieder (min. 2, max. 6)</Label>
      <div className="space-y-3">
        {members.map((m: any, i: number) => (
          <div key={i} className="p-3 bg-muted/30 rounded space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Person {i + 1}</span>
              <Button variant="ghost" size="sm" onClick={() => update("members", members.filter((_: any, j: number) => j !== i))} disabled={members.length <= 2}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Name *</Label>
                <Input value={m.name} onChange={(e) => updateMember(i, "name", e.target.value)} placeholder="Vor- und Nachname" className="bg-[hsl(228,33%,98%)]" />
              </div>
              <div>
                <Label className="text-xs">Rolle *</Label>
                <Input value={m.role} onChange={(e) => updateMember(i, "role", e.target.value)} placeholder="z.B. Projektleiter" className="bg-[hsl(228,33%,98%)]" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Universität</Label>
              <Input value={m.university || ""} onChange={(e) => updateMember(i, "university", e.target.value)} placeholder="Optional" className="bg-[hsl(228,33%,98%)]" />
            </div>
          </div>
        ))}
      </div>
      {members.length < 6 && (
        <Button variant="outline" size="sm" onClick={() => update("members", [...members, { name: "", role: "", university: "" }])}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Person hinzufügen
        </Button>
      )}
    </div>
  );
}
