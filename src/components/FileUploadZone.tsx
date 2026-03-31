import { useState, useRef, useCallback } from "react";
import { Paperclip, Upload, X, FileText, FileSpreadsheet, Presentation, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { parseFile, type ProcessedFile } from "@/services/fileParser";
import { toast } from "@/hooks/use-toast";

const ACCEPT = ".pdf,.pptx,.xlsx,.xls,.csv";
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

const FILE_ICONS: Record<string, typeof FileText> = {
  pdf: FileText,
  pptx: Presentation,
  xlsx: FileSpreadsheet,
  xls: FileSpreadsheet,
  csv: FileSpreadsheet,
};

interface FileUploadZoneProps {
  onFileProcessed: (result: ProcessedFile) => void;
  context?: "presentation" | "slide";
  compact?: boolean;
  className?: string;
}

export function FileUploadZone({ onFileProcessed, compact = false, className = "" }: FileUploadZoneProps) {
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processedFile, setProcessedFile] = useState<ProcessedFile | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    if (!["pdf", "pptx", "xlsx", "xls", "csv"].includes(ext)) {
      toast({ title: "Ungültiges Format", description: "Unterstützt: PDF, PPTX, XLSX, CSV", variant: "destructive" });
      return;
    }
    if (file.size > MAX_SIZE) {
      toast({ title: "Datei zu groß", description: "Maximale Dateigröße: 10 MB", variant: "destructive" });
      return;
    }

    setProcessing(true);
    setProgress(30);
    try {
      setProgress(60);
      const result = await parseFile(file);
      setProgress(100);
      setProcessedFile(result);
      onFileProcessed(result);
      toast({ title: "Datei verarbeitet", description: `${file.name} wurde erfolgreich eingelesen.` });
    } catch (err: any) {
      toast({ title: "Fehler beim Einlesen", description: err.message || "Datei konnte nicht verarbeitet werden.", variant: "destructive" });
    } finally {
      setProcessing(false);
      setProgress(0);
    }
  }, [onFileProcessed]);

  const removeFile = () => {
    setProcessedFile(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const ext = processedFile?.fileName.split(".").pop()?.toLowerCase() || "";
  const FileIcon = FILE_ICONS[ext] || FileText;

  // Show attached file chip
  if (processedFile) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border bg-muted text-xs text-foreground ${className}`}>
        <FileIcon className="h-3 w-3 text-primary" />
        <span className="truncate max-w-[140px]">{processedFile.fileName}</span>
        <button onClick={removeFile} className="text-muted-foreground hover:text-destructive transition-colors">
          <X className="h-3 w-3" />
        </button>
      </div>
    );
  }

  // Processing state
  if (processing) {
    return (
      <div className={`flex items-center gap-2 ${compact ? "" : "p-4 border border-border rounded-lg"} ${className}`}>
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <div className="flex-1 min-w-0">
          <Progress value={progress} className="h-1.5" />
        </div>
      </div>
    );
  }

  // Compact: paperclip button
  if (compact) {
    return (
      <div className={className}>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-muted-foreground hover:text-primary"
          onClick={() => inputRef.current?.click()}
          title="Datei anhängen (PDF, PPTX, XLSX, CSV)"
        >
          <Paperclip className="h-4 w-4" />
        </Button>
        <input ref={inputRef} type="file" accept={ACCEPT} className="hidden" onChange={onInputChange} />
      </div>
    );
  }

  // Full: drag & drop zone
  return (
    <div
      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
        isDragging ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"
      } ${className}`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
    >
      <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
      <p className="text-sm text-foreground font-medium">Datei hierher ziehen oder klicken</p>
      <p className="text-xs text-muted-foreground mt-1">PDF, PPTX, XLSX, CSV · Max. 10 MB</p>
      <input ref={inputRef} type="file" accept={ACCEPT} className="hidden" onChange={onInputChange} />
    </div>
  );
}
