import { AlertTriangle } from "lucide-react";

export function validateActionTitle(title: string): { valid: boolean; hint: string } {
  if (!title.trim()) return { valid: true, hint: "" };
  const wordCount = title.trim().split(/\s+/).length;
  if (wordCount < 4) {
    return { valid: false, hint: "Tipp: Ein Action Title ist ein vollständiger Satz mit Kernaussage." };
  }
  const verbIndicators = [
    "ist", "sind", "wird", "werden", "hat", "haben", "kann", "können",
    "zeigt", "wächst", "steigt", "sinkt", "ermöglicht", "erfordert",
    "bietet", "führt", "erreicht", "übertrifft", "reduziert", "stärkt",
    "differenziert", "fokussiert", "adressiert", "unterstützt", "verbessert",
  ];
  const hasVerb = verbIndicators.some((v) => title.toLowerCase().includes(v));
  const hasNumber = /\d/.test(title);
  if (!hasVerb && !hasNumber) {
    return { valid: false, hint: `"${title}" klingt wie ein Thema. Formuliere eine Aussage.` };
  }
  return { valid: true, hint: "" };
}

export function ActionTitleHint({ title }: { title: string }) {
  const { valid, hint } = validateActionTitle(title);
  if (valid || !hint) return null;
  return (
    <p className="text-xs mt-1 flex items-center gap-1 text-[#FF671E]">
      <AlertTriangle className="h-3 w-3 flex-shrink-0" />
      {hint}
    </p>
  );
}
