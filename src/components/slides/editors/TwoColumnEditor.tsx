import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CharCount } from "./CharCount";
import { ActionTitleHint } from "./ActionTitleHint";
import { IconPicker } from "./IconPicker";

interface Props {
  content: Record<string, any>;
  onChange: (content: Record<string, any>) => void;
}

export function TwoColumnEditor({ content, onChange }: Props) {
  const update = (key: string, value: any) => onChange({ ...content, [key]: value });
  const [showSubtitle, setShowSubtitle] = useState(!!content.subtitle);

  return (
    <div className="space-y-3">
      <div>
        <Label>Section-Header</Label>
        <Input value={content.section_header || ""} onChange={(e) => update("section_header", e.target.value.slice(0, 30))} placeholder="Optional" className="bg-[hsl(228,33%,98%)]" />
      </div>
      <div>
        <Label>Slide-Titel *</Label>
        <Input value={content.title || ""} onChange={(e) => update("title", e.target.value.slice(0, 80))} placeholder="Titel" className="bg-[hsl(228,33%,98%)]" />
        <CharCount current={content.title?.length || 0} max={80} />
        <ActionTitleHint title={content.title || ""} />
      </div>
      {showSubtitle ? (
        <div>
          <Label>Subtitle / Kontext</Label>
          <Input value={content.subtitle || ""} onChange={(e) => update("subtitle", e.target.value.slice(0, 100))} placeholder="z.B. Quelle: Statista, 2025 | DACH-Region" className="bg-[hsl(228,33%,98%)]" />
          <CharCount current={content.subtitle?.length || 0} max={100} />
        </div>
      ) : (
        <button type="button" onClick={() => setShowSubtitle(true)} className="text-xs text-primary hover:underline">+ Subtitle hinzufügen</button>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <IconPicker value={content.col1_icon} onChange={(v) => update("col1_icon", v)} subset={["Target", "TrendingUp", "Lightbulb", "Search", "BarChart3", "Users", "Shield", "Globe", "Zap", "CheckCircle"]} />
          <Label>Spalte 1 – Titel</Label>
          <Input value={content.col1_title || ""} onChange={(e) => update("col1_title", e.target.value)} className="bg-[hsl(228,33%,98%)]" />
          <Label>Spalte 1 – Text</Label>
          <Textarea value={content.col1_body || ""} onChange={(e) => update("col1_body", e.target.value.slice(0, 400))} rows={3} className="bg-[hsl(228,33%,98%)]" />
          <CharCount current={content.col1_body?.length || 0} max={400} />
        </div>
        <div className="space-y-2">
          <IconPicker value={content.col2_icon} onChange={(v) => update("col2_icon", v)} subset={["Target", "TrendingUp", "Lightbulb", "Search", "BarChart3", "Users", "Shield", "Globe", "Zap", "CheckCircle"]} />
          <Label>Spalte 2 – Titel</Label>
          <Input value={content.col2_title || ""} onChange={(e) => update("col2_title", e.target.value)} className="bg-[hsl(228,33%,98%)]" />
          <Label>Spalte 2 – Text</Label>
          <Textarea value={content.col2_body || ""} onChange={(e) => update("col2_body", e.target.value.slice(0, 400))} rows={3} className="bg-[hsl(228,33%,98%)]" />
          <CharCount current={content.col2_body?.length || 0} max={400} />
        </div>
      </div>
      <div>
        <Label>Layout</Label>
        <Select value={content.layout || "symmetric"} onValueChange={(v) => update("layout", v)}>
          <SelectTrigger className="bg-[hsl(228,33%,98%)]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="symmetric">Symmetrisch</SelectItem>
            <SelectItem value="text-image">Text + Bild</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
