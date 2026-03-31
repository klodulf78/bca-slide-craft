import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Target, TrendingUp, Lightbulb, Search, BarChart3, Users, Shield, Globe, Zap,
  CheckCircle, DollarSign, Clock, Percent, ArrowRight, Building, Briefcase,
  FileText, PieChart, Activity, Award,
} from "lucide-react";
import { type LucideIcon } from "lucide-react";

export const BUSINESS_ICONS: Record<string, { icon: LucideIcon; label: string }> = {
  Target: { icon: Target, label: "Ziel" },
  TrendingUp: { icon: TrendingUp, label: "Trend" },
  Lightbulb: { icon: Lightbulb, label: "Idee" },
  Search: { icon: Search, label: "Analyse" },
  BarChart3: { icon: BarChart3, label: "Chart" },
  Users: { icon: Users, label: "Team" },
  Shield: { icon: Shield, label: "Schutz" },
  Globe: { icon: Globe, label: "Global" },
  Zap: { icon: Zap, label: "Energie" },
  CheckCircle: { icon: CheckCircle, label: "Check" },
  DollarSign: { icon: DollarSign, label: "Finanzen" },
  Clock: { icon: Clock, label: "Zeit" },
  Percent: { icon: Percent, label: "Prozent" },
  ArrowRight: { icon: ArrowRight, label: "Weiter" },
  Building: { icon: Building, label: "Unternehmen" },
  Briefcase: { icon: Briefcase, label: "Business" },
  FileText: { icon: FileText, label: "Dokument" },
  PieChart: { icon: PieChart, label: "Kreisdiagramm" },
  Activity: { icon: Activity, label: "Aktivität" },
  Award: { icon: Award, label: "Auszeichnung" },
};

// Unicode fallbacks for PPTX export
export const ICON_UNICODE: Record<string, string> = {
  Target: "◎", TrendingUp: "↗", Lightbulb: "💡", Search: "🔍", BarChart3: "📊",
  Users: "👥", Shield: "🛡", Globe: "🌍", Zap: "⚡", CheckCircle: "✔",
  DollarSign: "$", Clock: "⏱", Percent: "%", ArrowRight: "→", Building: "🏢",
  Briefcase: "💼", FileText: "📄", PieChart: "◉", Activity: "📈", Award: "🏆",
};

interface IconPickerProps {
  value: string | undefined;
  onChange: (value: string) => void;
  subset?: string[];
}

export function IconPicker({ value, onChange, subset }: IconPickerProps) {
  const keys = subset || Object.keys(BUSINESS_ICONS);

  return (
    <div>
      <Label>Icon (optional)</Label>
      <Select value={value || "none"} onValueChange={(v) => onChange(v === "none" ? "" : v)}>
        <SelectTrigger className="bg-[hsl(228,33%,98%)] w-full">
          <SelectValue placeholder="Kein Icon" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Kein Icon</SelectItem>
          {keys.map((key) => {
            const entry = BUSINESS_ICONS[key];
            if (!entry) return null;
            const Icon = entry.icon;
            return (
              <SelectItem key={key} value={key}>
                <span className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {entry.label}
                </span>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
