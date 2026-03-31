import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CharCount } from "./CharCount";
import { ActionTitleHint } from "./ActionTitleHint";
import { IconPicker } from "./IconPicker";

interface Props {
  content: Record<string, any>;
  onChange: (content: Record<string, any>) => void;
}

export function ExecSummaryEditor({ content, onChange }: Props) {
  const update = (key: string, value: any) => onChange({ ...content, [key]: value });

  return (
    <div className="space-y-3">
      <div>
        <Label>Action Title (Kernaussage) *</Label>
        <Input
          value={content.title || ""}
          onChange={(e) => update("title", e.target.value.slice(0, 80))}
          placeholder="z.B. TechStartup XY kann mit fokussierter GTM-Strategie 2,5 Mio. € ARR erreichen"
          className="bg-[hsl(228,33%,98%)]"
        />
        <CharCount current={content.title?.length || 0} max={80} />
        <ActionTitleHint title={content.title || ""} />
      </div>
      <div>
        <Label>Subtitle / Kontext</Label>
        <Input
          value={content.subtitle || ""}
          onChange={(e) => update("subtitle", e.target.value.slice(0, 100))}
          placeholder="z.B. Quelle: Statista, 2025 | DACH-Region"
          className="bg-[hsl(228,33%,98%)]"
        />
        <CharCount current={content.subtitle?.length || 0} max={100} />
      </div>
      <div>
        <Label>Situation (Ausgangslage) *</Label>
        <Textarea
          value={content.situation || ""}
          onChange={(e) => update("situation", e.target.value.slice(0, 300))}
          placeholder="Beschreibe den Kontext und die Ausgangssituation..."
          rows={3}
          className="bg-[hsl(228,33%,98%)]"
        />
        <CharCount current={content.situation?.length || 0} max={300} />
      </div>
      <div>
        <Label>Complication (Herausforderung) *</Label>
        <Textarea
          value={content.complication || ""}
          onChange={(e) => update("complication", e.target.value.slice(0, 300))}
          placeholder="Was ist das Problem oder die Spannung?"
          rows={3}
          className="bg-[hsl(228,33%,98%)]"
        />
        <CharCount current={content.complication?.length || 0} max={300} />
      </div>
      <div>
        <Label>Resolution (Empfehlung) *</Label>
        <Textarea
          value={content.resolution || ""}
          onChange={(e) => update("resolution", e.target.value.slice(0, 300))}
          placeholder="Was ist die Lösung oder Empfehlung?"
          rows={3}
          className="bg-[hsl(228,33%,98%)]"
        />
        <CharCount current={content.resolution?.length || 0} max={300} />
      </div>
      <div>
        <Label>Key Takeaway</Label>
        <Input
          value={content.key_takeaway || ""}
          onChange={(e) => update("key_takeaway", e.target.value.slice(0, 120))}
          placeholder="Kernaussage in einem Satz..."
          className="bg-[hsl(228,33%,98%)]"
        />
        <CharCount current={content.key_takeaway?.length || 0} max={120} />
      </div>
    </div>
  );
}
