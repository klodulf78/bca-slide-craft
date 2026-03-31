import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { CharCount } from "./CharCount";
import { ActionTitleHint } from "./ActionTitleHint";

interface Props {
  content: Record<string, any>;
  onChange: (content: Record<string, any>) => void;
}

export function ContentEditor({ content, onChange }: Props) {
  const update = (key: string, value: any) => onChange({ ...content, [key]: value });
  const [showSubtitle, setShowSubtitle] = useState(!!content.subtitle);

  return (
    <div className="space-y-3">
      <div>
        <Label>Section-Header</Label>
        <Input
          value={content.section_header || ""}
          onChange={(e) => update("section_header", e.target.value.slice(0, 30))}
          placeholder="z.B. MARKTANALYSE"
          className="bg-[hsl(228,33%,98%)]"
        />
        <CharCount current={content.section_header?.length || 0} max={30} />
      </div>
      <div>
        <Label>Slide-Titel / Kernaussage *</Label>
        <Input
          value={content.title || ""}
          onChange={(e) => update("title", e.target.value.slice(0, 80))}
          placeholder="Titel"
          className="bg-[hsl(228,33%,98%)]"
        />
        <CharCount current={content.title?.length || 0} max={80} />
        <ActionTitleHint title={content.title || ""} />
      </div>
      {showSubtitle ? (
        <div>
          <Label>Subtitle / Kontext</Label>
          <Input
            value={content.subtitle || ""}
            onChange={(e) => update("subtitle", e.target.value.slice(0, 100))}
            placeholder="z.B. Quelle: Statista, 2025 | DACH-Region | in Tsd. EUR"
            className="bg-[hsl(228,33%,98%)]"
          />
          <CharCount current={content.subtitle?.length || 0} max={100} />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowSubtitle(true)}
          className="text-xs text-primary hover:underline"
        >
          + Subtitle hinzufügen
        </button>
      )}
      <div>
        <Label>Body-Text</Label>
        <Textarea
          value={content.body || ""}
          onChange={(e) => update("body", e.target.value.slice(0, 600))}
          placeholder="Fließtext oder Aufzählungspunkte"
          rows={4}
          className="bg-[hsl(228,33%,98%)]"
        />
        <CharCount current={content.body?.length || 0} max={600} />
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          checked={content.as_bullets || false}
          onCheckedChange={(v) => update("as_bullets", !!v)}
          id="as-bullets"
        />
        <Label htmlFor="as-bullets" className="cursor-pointer">Als Aufzählung formatieren</Label>
      </div>
      <div>
        <Label>Key-Takeaway</Label>
        <Input
          value={content.takeaway || ""}
          onChange={(e) => update("takeaway", e.target.value.slice(0, 120))}
          placeholder="Kernaussage: ..."
          className="bg-[hsl(228,33%,98%)]"
        />
        <CharCount current={content.takeaway?.length || 0} max={120} />
      </div>
    </div>
  );
}
