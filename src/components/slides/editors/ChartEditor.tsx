import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Plus, Trash2 } from "lucide-react";
import { CharCount } from "./CharCount";

interface Props {
  content: Record<string, any>;
  onChange: (content: Record<string, any>) => void;
}

export function ChartEditor({ content, onChange }: Props) {
  const update = (key: string, value: any) => onChange({ ...content, [key]: value });
  const layout = content.layout || "kpi";
  const kpis = content.kpis || Array.from({ length: 3 }, () => ({ value: "", label: "", sublabel: "" }));
  const chartData = content.chart_data || [{ label: "", value: "" }];

  const updateKpi = (i: number, key: string, val: string) => {
    const next = [...kpis];
    next[i] = { ...next[i], [key]: val };
    update("kpis", next);
  };

  const setKpiCount = (count: number) => {
    const next = Array.from({ length: count }, (_, i) => kpis[i] || { value: "", label: "", sublabel: "" });
    onChange({ ...content, kpi_count: count, kpis: next });
  };

  const updateChartRow = (i: number, key: string, val: string) => {
    const next = [...chartData];
    next[i] = { ...next[i], [key]: val };
    update("chart_data", next);
  };

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
      </div>
      <div>
        <Label>Layout</Label>
        <RadioGroup value={layout} onValueChange={(v) => update("layout", v)} className="flex gap-4">
          <div className="flex items-center gap-2">
            <RadioGroupItem value="kpi" id="layout-kpi" />
            <Label htmlFor="layout-kpi">KPI-Karten</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="chart" id="layout-chart" />
            <Label htmlFor="layout-chart">Chart + Text</Label>
          </div>
        </RadioGroup>
      </div>

      {layout === "kpi" && (
        <div className="space-y-3">
          <div>
            <Label>Anzahl KPIs</Label>
            <Select value={(content.kpi_count || 3).toString()} onValueChange={(v) => setKpiCount(parseInt(v))}>
              <SelectTrigger className="bg-[hsl(228,33%,98%)] w-24"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
                <SelectItem value="4">4</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {kpis.slice(0, content.kpi_count || 3).map((kpi: any, i: number) => (
            <div key={i} className="grid grid-cols-3 gap-2 p-2 bg-muted/30 rounded">
              <div>
                <Label className="text-xs">Zahl</Label>
                <Input value={kpi.value} onChange={(e) => updateKpi(i, "value", e.target.value)} placeholder="42%" className="bg-[hsl(228,33%,98%)]" />
              </div>
              <div>
                <Label className="text-xs">Label</Label>
                <Input value={kpi.label} onChange={(e) => updateKpi(i, "label", e.target.value)} placeholder="Wachstum" className="bg-[hsl(228,33%,98%)]" />
              </div>
              <div>
                <Label className="text-xs">Sublabel</Label>
                <Input value={kpi.sublabel} onChange={(e) => updateKpi(i, "sublabel", e.target.value)} placeholder="YoY" className="bg-[hsl(228,33%,98%)]" />
              </div>
            </div>
          ))}
        </div>
      )}

      {layout === "chart" && (
        <div className="space-y-3">
          <div>
            <Label>Chart-Typ</Label>
            <Select value={content.chart_type || "bar"} onValueChange={(v) => update("chart_type", v)}>
              <SelectTrigger className="bg-[hsl(228,33%,98%)]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="bar">Balken</SelectItem>
                <SelectItem value="line">Linie</SelectItem>
                <SelectItem value="pie">Kreis</SelectItem>
                <SelectItem value="donut">Donut</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Datenpunkte</Label>
            {chartData.map((row: any, i: number) => (
              <div key={i} className="flex gap-2 items-center">
                <Input value={row.label} onChange={(e) => updateChartRow(i, "label", e.target.value)} placeholder="Label" className="bg-[hsl(228,33%,98%)] flex-1" />
                <Input value={row.value} onChange={(e) => updateChartRow(i, "value", e.target.value)} placeholder="Wert" className="bg-[hsl(228,33%,98%)] w-24" />
                <Button variant="ghost" size="sm" onClick={() => update("chart_data", chartData.filter((_: any, j: number) => j !== i))} disabled={chartData.length <= 1}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => update("chart_data", [...chartData, { label: "", value: "" }])}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Zeile hinzufügen
            </Button>
          </div>
          <div>
            <Label>Erläuterungstext</Label>
            <Textarea value={content.legend || ""} onChange={(e) => update("legend", e.target.value)} rows={2} className="bg-[hsl(228,33%,98%)]" />
          </div>
        </div>
      )}

      <div>
        <Label>Quellenangabe</Label>
        <Input value={content.source || ""} onChange={(e) => update("source", e.target.value)} placeholder="Optional" className="bg-[hsl(228,33%,98%)]" />
      </div>
    </div>
  );
}
