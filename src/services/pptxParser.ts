import JSZip from "jszip";

export interface ParsedSlide {
  slideNumber: number;
  title: string;
  bodyText: string;
  bulletPoints: string[];
  hasImage: boolean;
  hasChart: boolean;
  layout: string;
}

export interface ParsedPresentation {
  title: string;
  totalSlides: number;
  slides: ParsedSlide[];
  rawText: string;
  fileSize: number;
  fileName: string;
}

function extractTextFromXml(xmlString: string, tagFilter?: string): string[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, "application/xml");
  const texts: string[] = [];

  if (tagFilter) {
    // Look for specific placeholder types
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

function detectLayout(xmlString: string): string {
  const hasTitlePh = /<p:ph[^>]*type="(title|ctrTitle)"/.test(xmlString);
  const hasBodyPh = /<p:ph[^>]*type="body"/.test(xmlString);
  const hasSubTitlePh = /<p:ph[^>]*type="subTitle"/.test(xmlString);

  if (hasTitlePh && hasSubTitlePh && !hasBodyPh) return "title";
  if (hasTitlePh && hasBodyPh) return "content";
  if (hasTitlePh && !hasBodyPh) return "title";
  return "content";
}

export async function parsePptx(file: File): Promise<ParsedPresentation> {
  const zip = await JSZip.loadAsync(file);

  // Find all slide files
  const slideFiles: { num: number; path: string }[] = [];
  zip.forEach((path) => {
    const match = path.match(/^ppt\/slides\/slide(\d+)\.xml$/);
    if (match) {
      slideFiles.push({ num: parseInt(match[1]), path });
    }
  });
  slideFiles.sort((a, b) => a.num - b.num);

  if (slideFiles.length === 0) {
    throw new Error("Keine Slides in der Datei gefunden.");
  }

  const slides: ParsedSlide[] = [];
  const allTexts: string[] = [];

  for (const sf of slideFiles) {
    const xmlContent = await zip.file(sf.path)!.async("string");

    const titleTexts = extractTextFromXml(xmlContent, "title");
    const bodyTexts = extractTextFromXml(xmlContent, "body");
    const allSlideTexts = extractTextFromXml(xmlContent);

    const title = titleTexts.join(" ") || "";
    const bodyText = bodyTexts.length > 0 ? bodyTexts.join("\n") : allSlideTexts.filter(t => !titleTexts.includes(t)).join("\n");

    const hasImage = /<p:pic/.test(xmlContent) || /<a:blip/.test(xmlContent);
    const hasChart = /<c:chart/.test(xmlContent) || /chart\d+\.xml/.test(xmlContent);
    const layout = detectLayout(xmlContent);

    const bulletPoints = bodyTexts.length > 1 ? bodyTexts : bodyText.split("\n").filter(Boolean);

    slides.push({
      slideNumber: sf.num,
      title,
      bodyText,
      bulletPoints,
      hasImage,
      hasChart,
      layout,
    });

    allTexts.push(`Slide ${sf.num}: ${title}\n${bodyText}`);
  }

  // Try to extract presentation title from first slide or core.xml
  let presentationTitle = slides[0]?.title || file.name.replace(/\.pptx$/, "");
  try {
    const coreXml = await zip.file("docProps/core.xml")?.async("string");
    if (coreXml) {
      const match = coreXml.match(/<dc:title>(.*?)<\/dc:title>/);
      if (match?.[1]) presentationTitle = match[1];
    }
  } catch { /* ignore */ }

  return {
    title: presentationTitle,
    totalSlides: slides.length,
    slides,
    rawText: allTexts.join("\n\n"),
    fileSize: file.size,
    fileName: file.name,
  };
}
