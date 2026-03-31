export function CharCount({ current, max }: { current: number; max: number }) {
  return (
    <p className="text-xs text-muted-foreground mt-0.5 text-right">
      {current}/{max} Zeichen
    </p>
  );
}
