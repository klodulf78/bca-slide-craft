import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { CharCount } from "./CharCount";
import { DatePickerField } from "./DatePickerField";

interface Props {
  content: Record<string, any>;
  onChange: (content: Record<string, any>) => void;
}

export function TitleSlideEditor({ content, onChange }: Props) {
  const update = (key: string, value: any) => onChange({ ...content, [key]: value });

  return (
    <div className="space-y-3">
      <div>
        <Label>Projekttitel *</Label>
        <Input
          value={content.title || ""}
          onChange={(e) => update("title", e.target.value.slice(0, 60))}
          placeholder="Projektname"
          className="bg-[hsl(228,33%,98%)]"
        />
        <CharCount current={content.title?.length || 0} max={60} />
      </div>
      <div>
        <Label>Untertitel</Label>
        <Input
          value={content.subtitle || ""}
          onChange={(e) => update("subtitle", e.target.value.slice(0, 120))}
          placeholder="Optional"
          className="bg-[hsl(228,33%,98%)]"
        />
        <CharCount current={content.subtitle?.length || 0} max={120} />
      </div>
      <DatePickerField
        label="Datum"
        value={content.date ? new Date(content.date) : new Date()}
        onChange={(d) => update("date", d?.toISOString().split("T")[0] || "")}
      />
      <div>
        <Label>Teamname</Label>
        <Input
          value={content.team_name || ""}
          onChange={(e) => update("team_name", e.target.value.slice(0, 50))}
          placeholder="Optional"
          className="bg-[hsl(228,33%,98%)]"
        />
        <CharCount current={content.team_name?.length || 0} max={50} />
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          checked={content.dark_variant || false}
          onCheckedChange={(v) => update("dark_variant", !!v)}
          id="dark-variant"
        />
        <Label htmlFor="dark-variant" className="cursor-pointer">Dunkler Hintergrund</Label>
      </div>
    </div>
  );
}
