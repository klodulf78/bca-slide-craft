import { useState, useCallback } from "react";
import { Upload, FileUp, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function UploadPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [fileName, setFileName] = useState("");

  const handleFile = (file: File) => {
    if (!file.name.endsWith(".pptx")) return;
    setFileName(file.name);
    setUploaded(true);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-heading font-bold text-foreground">Präsentation hochladen</h1>
      <p className="text-muted-foreground">Lade eine bestehende .pptx-Datei hoch</p>

      {!uploaded ? (
        <Card
          className={`border-2 border-dashed transition-colors ${
            isDragging ? "border-primary bg-primary/5" : "border-border"
          }`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <CardContent className="py-16 text-center">
            <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-foreground font-medium mb-1">
              Datei hierher ziehen
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              oder klicke um eine Datei auszuwählen
            </p>
            <label>
              <Button variant="outline" asChild>
                <span>
                  <FileUp className="h-4 w-4 mr-2" />
                  Datei auswählen
                </span>
              </Button>
              <input
                type="file"
                accept=".pptx"
                className="hidden"
                onChange={handleFileInput}
              />
            </label>
            <p className="text-xs text-muted-foreground mt-4">Akzeptiert: .pptx</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border">
          <CardContent className="py-8 text-center">
            <CheckCircle className="h-12 w-12 mx-auto text-primary mb-4" />
            <p className="text-foreground font-medium">{fileName}</p>
            <p className="text-sm text-muted-foreground mt-2">
              Datei hochgeladen. Analyse-Feature kommt in Phase 2.
            </p>
            <Button variant="outline" className="mt-4" onClick={() => { setUploaded(false); setFileName(""); }}>
              Weitere Datei hochladen
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
