import JSZip from "jszip";
import * as XLSX from "xlsx";
import Papa from "papaparse";

export interface ProcessedFile {
  fileName: string;
  fileType: "pptx" | "pdf" | "xlsx" | "csv";
  extractedContent: {
    text?: string;
    slides?: { slideNumber: number; title: string; bodyText: string }[];
    tableData?: any[][];
    headers?: string[];
    metadata?: {
      pageCount?: number;
      slideCount?: number;
      rowCount?: number;
    };
  };
}

function extractTextFromXml(xmlString: string, tagFilter?: string): string[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, "application/xml");
  const texts: string[] = [];
  if (tagFilter) {
    const shapes = doc.getElementsByTagName("p:sp");
    for (let i = 0; i < shapes.length; i++) {
      const shape = shapes[i];
      const phElements = shape.getElementsByTagName("p:ph");
      if (phElements.length > 0) {
        const phType = phElements[0].getAttribute("type") || "";
        if (phType === tagFilter || (tagFilter === "title" && (phType === "title" || phType === "ctrTitle"))) {
          const tElements = shape.getElementsByTagName("a:t");
          const shapeTexts: string[] = [];
          for (let j = 0; j < tElements.length; j++) {
            const t = tElements[j].textContent?.trim();
            if (t) shapeTexts.push(t);
          }
          if (shapeTexts.length > 0) texts.push(shapeTexts.join(" "));
        }
      }
    }
  } else {
    const tElements = doc.getElementsByTagName("a:t");
    for (let i = 0; i < tElements.length; i++) {
      const t = tElements[i].textContent?.trim();
      if (t) texts.push(t);
    }
  }
  return texts;
}

export async function parsePptxFile(file: File): Promise<ProcessedFile> {
  const zip = await JSZip.loadAsync(file);
  const slideFiles: { num: number; path: string }[] = [];
  zip.forEach((path) => {
    const match = path.match(/^ppt\/slides\/slide(\d+)\.xml$/);
    if (match) slideFiles.push({ num: parseInt(match[1]), path });
  });
  slideFiles.sort((a, b) => a.num - b.num);

  const slides: { slideNumber: number; title: string; bodyText: string }[] = [];
  let fullText = "";

  for (const sf of slideFiles) {
    const xml = await zip.file(sf.path)!.async("string");
    const titleTexts = extractTextFromXml(xml, "title");
    const bodyTexts = extractTextFromXml(xml, "body");
    const allTexts = extractTextFromXml(xml);
    const title = titleTexts.join(" ") || "";
    const bodyText = bodyTexts.length > 0 ? bodyTexts.join("\n") : allTexts.filter(t => !titleTexts.includes(t)).join("\n");
    slides.push({ slideNumber: sf.num, title, bodyText });
    fullText += `Slide ${sf.num}: ${title}\n${bodyText}\n\n`;
  }

  return {
    fileName: file.name,
    fileType: "pptx",
    extractedContent: {
      text: fullText,
      slides,
      metadata: { slideCount: slides.length },
    },
  };
}

export async function parsePdfFile(file: File): Promise<ProcessedFile> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map((item: any) => item.str).join(" ");
    fullText += `Seite ${i}:\n${pageText}\n\n`;
  }

  return {
    fileName: file.name,
    fileType: "pdf",
    extractedContent: {
      text: fullText,
      metadata: { pageCount: pdf.numPages },
    },
  };
}

export async function parseExcelFile(file: File): Promise<ProcessedFile> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: "array" });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];
  const headers = (jsonData[0] || []).map(String);
  const rows = jsonData.slice(1).filter(r => r.some((c: any) => c !== undefined && c !== ""));

  return {
    fileName: file.name,
    fileType: "xlsx",
    extractedContent: {
      tableData: rows,
      headers,
      metadata: { rowCount: rows.length },
    },
  };
}

export async function parseCsvFile(file: File): Promise<ProcessedFile> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      complete: (results) => {
        const data = results.data as any[][];
        const headers = (data[0] || []).map(String);
        const rows = data.slice(1).filter(r => r.some((c: any) => c !== undefined && c !== ""));
        resolve({
          fileName: file.name,
          fileType: "csv",
          extractedContent: {
            tableData: rows,
            headers,
            metadata: { rowCount: rows.length },
          },
        });
      },
      error: (err) => reject(err),
    });
  });
}

export async function parseFile(file: File): Promise<ProcessedFile> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  switch (ext) {
    case "pptx": return parsePptxFile(file);
    case "pdf": return parsePdfFile(file);
    case "xlsx":
    case "xls": return parseExcelFile(file);
    case "csv": return parseCsvFile(file);
    default: throw new Error(`Nicht unterstütztes Format: .${ext}`);
  }
}

export function formatFileContext(file: ProcessedFile): string {
  const parts: string[] = [`[Datei angehängt: ${file.fileName} (${file.fileType.toUpperCase()})]`];

  if (file.fileType === "pptx" && file.extractedContent.slides) {
    parts.push(`Präsentation mit ${file.extractedContent.metadata?.slideCount} Slides:`);
    for (const s of file.extractedContent.slides) {
      parts.push(`Slide ${s.slideNumber}: ${s.title || "(Kein Titel)"}\n${s.bodyText || "(Kein Text)"}`);
    }
  } else if (file.fileType === "pdf") {
    parts.push(`PDF mit ${file.extractedContent.metadata?.pageCount} Seiten:`);
    parts.push(file.extractedContent.text || "");
  } else if (file.fileType === "xlsx" || file.fileType === "csv") {
    const h = file.extractedContent.headers || [];
    const rows = file.extractedContent.tableData || [];
    parts.push(`Tabelle mit ${rows.length} Zeilen und ${h.length} Spalten.`);
    parts.push(`Spalten: ${h.join(" | ")}`);
    const preview = rows.slice(0, 20);
    for (const row of preview) {
      parts.push(row.map((c: any) => c ?? "").join(" | "));
    }
    if (rows.length > 20) parts.push(`... und ${rows.length - 20} weitere Zeilen`);
  }

  return parts.join("\n");
}
