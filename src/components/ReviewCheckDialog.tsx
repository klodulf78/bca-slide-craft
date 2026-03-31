import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertTriangle, XCircle, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SlideContent {
  template_id: string;
  order: number;
  content: Record<string, any>;
}

interface ReviewCheck {
  category: "structure" | "branding" | "content" | "quality";
  label: string;
  status: "pass" | "warn" | "fail";
  detail: string;
}

interface ReviewResult {
  score: number;
  checks: ReviewCheck[];
  summary: string;
  storyline: string[];
}

export function runReviewCheck(slides: SlideContent[]): ReviewResult {
  const checks: ReviewCheck[] = [];

  // STRUCTURE
  checks.push({
    category: "structure",
    label: "Titelslide vorhanden",
    status: slides[0]?.template_id === "title" ? "pass" : "fail",
    detail: slides[0]?.template_id === "title" ? "Erste Folie ist ein Titelslide ✓" : "Erste Folie sollte ein Titelslide sein",
  });

  const lastTpl = slides[slides.length - 1]?.template_id;
  checks.push({
    category: "structure",
    label: "Abschluss-Slide vorhanden",
    status: lastTpl === "contact" || lastTpl === "closing" ? "pass" : "fail",
    detail: lastTpl === "contact" || lastTpl === "closing" ? "Letzte Folie ist eine Abschluss-Slide ✓" : "Letzte Folie sollte eine Abschluss-Slide sein",
  });

  const hasAgenda = slides.some(s => s.template_id === "agenda");
  checks.push({
    category: "structure",
    label: "Agenda vorhanden",
    status: slides.length >= 5 ? (hasAgenda ? "pass" : "warn") : "pass",
    detail: hasAgenda ? "Agenda-Slide vorhanden ✓" : "Ab 5+ Slides wird eine Agenda empfohlen",
  });

  checks.push({
    category: "structure",
    label: "Slide-Anzahl für Dauer",
    status: slides.length <= 15 ? "pass" : "warn",
    detail: `${slides.length} Slides ≈ ${Math.round(slides.length * 1.2)} Min. Präsentationszeit`,
  });

  // BRANDING
  checks.push({
    category: "branding",
    label: "BCA-Templates verwendet",
    status: "pass",
    detail: "Alle Slides nutzen BCA-konforme Templates",
  });

  // CONTENT
  const actionTitleIssues = slides.filter(s => {
    if (["title", "agenda", "team", "contact", "closing"].includes(s.template_id)) return false;
    const title = s.content?.title || "";
    return title.trim().split(/\s+/).length < 4;
  });

  checks.push({
    category: "content",
    label: "Action Titles",
    status: actionTitleIssues.length === 0 ? "pass" : "warn",
    detail: actionTitleIssues.length === 0
      ? "Alle Titel sind als Kernaussagen formuliert ✓"
      : `${actionTitleIssues.length} Slide(s) haben möglicherweise Themen-Titel statt Action Titles`,
  });

  const chartSlides = slides.filter(s => s.template_id === "chart");
  const hasSourceOnData = chartSlides.length === 0 || chartSlides.every(s => s.content?.source);
  checks.push({
    category: "content",
    label: "Quellenangaben bei Daten",
    status: hasSourceOnData ? "pass" : "warn",
    detail: hasSourceOnData ? "Alle Daten-Slides haben Quellenangaben ✓" : "Einige Daten-Slides haben keine Quellenangabe",
  });

  // Empty content check
  const emptySlides = slides.filter(s => {
    if (["title", "agenda", "team", "contact", "closing"].includes(s.template_id)) return false;
    const title = s.content?.title || "";
    const body = s.content?.body || s.content?.situation || s.content?.col1_body || "";
    return !title.trim() && !body.trim();
  });

  checks.push({
    category: "quality",
    label: "Keine leeren Slides",
    status: emptySlides.length === 0 ? "pass" : "fail",
    detail: emptySlides.length === 0 ? "Alle Slides haben Inhalte ✓" : `${emptySlides.length} Slide(s) sind noch leer`,
  });

  const storyline = slides
    .filter(s => s.content?.title)
    .map((s, i) => `${i + 1}. "${s.content.title}"`);

  const passCount = checks.filter(c => c.status === "pass").length;
  const score = Math.round((passCount / checks.length) * 100);

  return { score, checks, summary: `${passCount}/${checks.length} Checks bestanden`, storyline };
}

const CATEGORY_LABELS: Record<string, string> = {
  structure: "Struktur",
  branding: "Branding",
  content: "Inhalt",
  quality: "Qualität",
};

const StatusIcon = ({ status }: { status: string }) => {
  if (status === "pass") return <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />;
  if (status === "warn") return <AlertTriangle className="h-4 w-4 text-[hsl(var(--orange-accent))] flex-shrink-0" />;
  return <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />;
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slides: SlideContent[];
}

export function ReviewCheckDialog({ open, onOpenChange, slides }: Props) {
  const navigate = useNavigate();
  const result = runReviewCheck(slides);

  const issueChecks = result.checks.filter(c => c.status !== "pass");
  const issueText = issueChecks.map(c => `- ${c.label}: ${c.detail}`).join("\n");

  const handleFixInChat = () => {
    onOpenChange(false);
    const msg = encodeURIComponent(`Bitte behebe folgende Probleme in meiner Präsentation:\n${issueText}`);
    navigate(`/chat?message=${msg}`);
  };

  // Group checks by category
  const grouped = result.checks.reduce((acc, check) => {
    (acc[check.category] = acc[check.category] || []).push(check);
    return acc;
  }, {} as Record<string, ReviewCheck[]>);

  // Score color
  const scoreColor = result.score >= 80 ? "text-green-600" : result.score >= 50 ? "text-[hsl(var(--orange-accent))]" : "text-destructive";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading">Review-Check</DialogTitle>
          <DialogDescription>Automatische Qualitätsprüfung deiner Präsentation</DialogDescription>
        </DialogHeader>

        {/* Score */}
        <div className="flex items-center justify-center py-4">
          <div className="relative w-24 h-24">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="hsl(var(--border))"
                strokeWidth="3"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeDasharray={`${result.score}, 100`}
                className={scoreColor}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-2xl font-bold font-heading ${scoreColor}`}>{result.score}</span>
              <span className="text-[10px] text-muted-foreground">/ 100</span>
            </div>
          </div>
        </div>

        {/* Checks by category */}
        <div className="space-y-4 max-h-64 overflow-y-auto">
          {Object.entries(grouped).map(([cat, checks]) => (
            <div key={cat}>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                {CATEGORY_LABELS[cat] || cat}
              </p>
              <div className="space-y-1">
                {checks.map((check, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <StatusIcon status={check.status} />
                    <div>
                      <span className="font-medium text-foreground">{check.label}</span>
                      <span className="text-muted-foreground ml-1">— {check.detail}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Storyline */}
        {result.storyline.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">📋 Storyline-Check</p>
            <div className="text-xs text-muted-foreground space-y-0.5 bg-secondary rounded-lg p-3">
              {result.storyline.map((line, i) => (
                <p key={i}>{line}</p>
              ))}
              <p className="mt-1 font-medium text-foreground">→ Erzählen die Titel eine logische Geschichte?</p>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          {issueChecks.length > 0 && (
            <Button variant="outline" onClick={handleFixInChat} className="gap-1">
              <ArrowRight className="h-4 w-4" /> Probleme im Chat beheben
            </Button>
          )}
          <Button onClick={() => onOpenChange(false)}>
            {issueChecks.length === 0 ? "Alles gut! Schließen" : "Export trotzdem"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
