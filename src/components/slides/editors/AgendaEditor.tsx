import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { CharCount } from "./CharCount";

interface Props {
  content: Record<string, any>;
  onChange: (content: Record<string, any>) => void;
}

export function AgendaEditor({ content, onChange }: Props) {
  const items: string[] = content.items?.length ? content.items : ["", ""];
  const update = (key: string, value: any) => onChange({ ...content, [key]: value });

  const updateItem = (index: number, value: string) => {
    const next = [...items];
    next[index] = value.slice(0, 60);
    update("items", next);
  };

  const addItem = () => {
    if (items.length < 8) update("items", [...items, ""]);
  };

  const removeItem = (index: number) => {
    if (items.length > 2) update("items", items.filter((_, i) => i !== index));
  };

  const moveItem = (index: number, dir: "up" | "down") => {
    const next = [...items];
    const swap = dir === "up" ? index - 1 : index + 1;
    if (swap < 0 || swap >= next.length) return;
    [next[index], next[swap]] = [next[swap], next[index]];
    update("items", next);
  };

  return (
    <div className="space-y-3">
      <Label>Agenda-Punkte (min. 2, max. 8)</Label>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="flex flex-col">
              <button onClick={() => moveItem(i, "up")} disabled={i === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-30 text-xs">↑</button>
              <button onClick={() => moveItem(i, "down")} disabled={i === items.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-30 text-xs">↓</button>
            </div>
            <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-sm font-medium text-muted-foreground w-5">{i + 1}.</span>
            <div className="flex-1">
              <Input
                value={item}
                onChange={(e) => updateItem(i, e.target.value)}
                placeholder={`Agenda-Punkt ${i + 1}`}
                className="bg-[hsl(228,33%,98%)]"
              />
              <CharCount current={item.length} max={60} />
            </div>
            <Button variant="ghost" size="sm" onClick={() => removeItem(i)} disabled={items.length <= 2}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>
      {items.length < 8 && (
        <Button variant="outline" size="sm" onClick={addItem}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Punkt hinzufügen
        </Button>
      )}
      <div>
        <Label>Aktiver Punkt hervorheben</Label>
        <Select
          value={content.active_item?.toString() || "none"}
          onValueChange={(v) => update("active_item", v === "none" ? null : parseInt(v))}
        >
          <SelectTrigger className="bg-[hsl(228,33%,98%)]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Keiner</SelectItem>
            {items.map((_, i) => (
              <SelectItem key={i} value={(i + 1).toString()}>Punkt {i + 1}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
