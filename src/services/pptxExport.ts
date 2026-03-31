import PptxGenJS from 'pptxgenjs';
import { BCA_COLORS, BCA_FONTS } from '@/constants/brand';

interface SlideContent {
  template_id: string;
  order: number;
  content: Record<string, any>;
}

// ── Footer ──────────────────────────────────────────────
function addFooter(slide: PptxGenJS.Slide, slideNumber: number, totalSlides: number) {
  slide.addShape('line', { x: 0.5, y: 5.2, w: 9.0, h: 0, line: { color: BCA_COLORS.divider, width: 0.75 } });
  slide.addText('BCA Slide Studio', { x: 0.5, y: 5.25, w: 4, h: 0.25, fontSize: 8, fontFace: BCA_FONTS.body, color: BCA_COLORS.textSecondary });
  slide.addText(`${slideNumber} / ${totalSlides}`, { x: 7.5, y: 5.25, w: 2.0, h: 0.25, fontSize: 8, fontFace: BCA_FONTS.body, color: BCA_COLORS.textSecondary, align: 'right' });
}

// ── Section header + title + cyan line (shared) ─────────
function addSectionHeader(slide: PptxGenJS.Slide, content: Record<string, any>) {
  let titleY = 0.5;
  if (content.section_header?.trim()) {
    slide.addText(content.section_header.toUpperCase(), { x: 0.5, y: 0.5, w: 9.0, h: 0.35, fontSize: 11, fontFace: BCA_FONTS.heading, color: BCA_COLORS.blue, bold: true });
    titleY = 1.0;
  }
  slide.addText(content.title || '', { x: 0.5, y: titleY, w: 9.0, h: 0.55, fontSize: 24, fontFace: BCA_FONTS.heading, color: BCA_COLORS.navy, bold: true, shrinkText: true });
  slide.addShape('line', { x: 0.5, y: titleY + 0.65, w: 9.0, h: 0, line: { color: BCA_COLORS.cyan, width: 2 } });
  return titleY + 0.65;
}

// ── 1. Title Slide ──────────────────────────────────────
function renderTitleSlide(pptx: PptxGenJS, content: Record<string, any>) {
  const dark = content.dark_variant;
  const bg = dark ? BCA_COLORS.navy : BCA_COLORS.white;
  const textColor = dark ? BCA_COLORS.white : BCA_COLORS.navy;
  const slide = pptx.addSlide();
  slide.background = { fill: bg };

  slide.addText('BCA', { x: 3.75, y: 0.6, w: 2.5, h: 0.6, fontSize: 24, fontFace: BCA_FONTS.heading, bold: true, color: textColor, align: 'center' });
  slide.addShape('line', { x: 3.0, y: 1.75, w: 4.0, h: 0, line: { color: BCA_COLORS.cyan, width: 2 } });
  slide.addText(content.title || '', { x: 0.5, y: 2.0, w: 9.0, h: 0.75, fontSize: 32, fontFace: BCA_FONTS.heading, bold: true, color: textColor, align: 'center', shrinkText: true });

  if (content.subtitle) {
    slide.addText(content.subtitle, { x: 1.0, y: 2.85, w: 8.0, h: 0.5, fontSize: 14, fontFace: BCA_FONTS.body, color: BCA_COLORS.textSecondary, align: 'center' });
  }

  const dateParts: string[] = [];
  if (content.date) dateParts.push(content.date);
  if (content.team_name) dateParts.push(content.team_name);
  if (dateParts.length) {
    slide.addText(dateParts.join(' | '), { x: 1.0, y: 3.5, w: 8.0, h: 0.35, fontSize: 11, fontFace: BCA_FONTS.body, color: BCA_COLORS.textSecondary, align: 'center' });
  }

  slide.addShape('line', { x: 4.0, y: 4.6, w: 2.0, h: 0, line: { color: BCA_COLORS.orange, width: 2 } });
}

// ── 2. Agenda ───────────────────────────────────────────
function renderAgendaSlide(pptx: PptxGenJS, content: Record<string, any>, slideNum: number, total: number) {
  const slide = pptx.addSlide();
  slide.background = { fill: BCA_COLORS.white };

  slide.addText('Agenda', { x: 0.5, y: 0.5, w: 9.0, h: 0.55, fontSize: 28, fontFace: BCA_FONTS.heading, bold: true, color: BCA_COLORS.navy });
  slide.addShape('line', { x: 0.5, y: 1.15, w: 9.0, h: 0, line: { color: BCA_COLORS.cyan, width: 2 } });

  const items: string[] = content.items || [];
  const activeIdx = content.active_item != null ? Number(content.active_item) : -1;

  items.forEach((item: string, i: number) => {
    const y = 1.4 + i * 0.6;
    const isActive = i === activeIdx;

    if (isActive) {
      slide.addShape('rect', { x: 0.4, y, w: 0.04, h: 0.45, fill: { color: BCA_COLORS.blue } });
    }

    slide.addText(`${i + 1}`, { x: 0.5, y, w: 0.5, h: 0.45, fontSize: 20, fontFace: BCA_FONTS.heading, bold: true, color: BCA_COLORS.blue, align: 'right' });
    slide.addText(item, { x: 1.25, y, w: 8.25, h: 0.45, fontSize: 14, fontFace: BCA_FONTS.body, color: isActive ? BCA_COLORS.blue : BCA_COLORS.navy, bold: isActive });

    if (i < items.length - 1) {
      slide.addShape('line', { x: 0.5, y: y + 0.5, w: 9.0, h: 0, line: { color: BCA_COLORS.divider, width: 0.5, dashType: 'dash' } });
    }
  });

  addFooter(slide, slideNum, total);
}

// ── 3. Content ──────────────────────────────────────────
function renderContentSlide(pptx: PptxGenJS, content: Record<string, any>, slideNum: number, total: number) {
  const slide = pptx.addSlide();
  slide.background = { fill: BCA_COLORS.white };
  const lineY = addSectionHeader(slide, content);

  const bodyY = lineY + 0.2;
  const bodyText = content.body || '';

  if (content.as_bullets && bodyText) {
    const lines = bodyText.split('\n').filter((l: string) => l.trim());
    lines.forEach((line: string, i: number) => {
      slide.addText(line, {
        x: 0.5, y: bodyY + i * 0.4, w: 9.0, h: 0.35,
        fontSize: 12, fontFace: BCA_FONTS.body, color: BCA_COLORS.textSecondary,
        bullet: { type: 'bullet' },
        valign: 'top',
      });
    });
  } else {
    slide.addText(bodyText, { x: 0.5, y: bodyY, w: 9.0, h: 2.8, fontSize: 12, fontFace: BCA_FONTS.body, color: BCA_COLORS.textSecondary, valign: 'top' });
  }

  if (content.takeaway?.trim()) {
    slide.addShape('rect', { x: 0.5, y: 4.7, w: 9.0, h: 0.45, fill: { color: BCA_COLORS.lightBg }, rectRadius: 0.04 });
    slide.addShape('rect', { x: 0.5, y: 4.7, w: 0.04, h: 0.45, fill: { color: BCA_COLORS.blue } });
    slide.addText(content.takeaway, { x: 0.7, y: 4.7, w: 8.8, h: 0.45, fontSize: 11, fontFace: BCA_FONTS.body, bold: true, color: BCA_COLORS.navy, valign: 'middle' });
  }

  addFooter(slide, slideNum, total);
}

// ── 4. Two-Column ───────────────────────────────────────
function renderTwoColumnSlide(pptx: PptxGenJS, content: Record<string, any>, slideNum: number, total: number) {
  const slide = pptx.addSlide();
  slide.background = { fill: BCA_COLORS.white };
  const lineY = addSectionHeader(slide, content);
  const colY = lineY + 0.2;

  // Column 1
  if (content.col1_title) {
    slide.addText(content.col1_title, { x: 0.5, y: colY, w: 4.3, h: 0.35, fontSize: 16, fontFace: BCA_FONTS.heading, bold: true, color: BCA_COLORS.navy });
  }
  slide.addText(content.col1_body || '', { x: 0.5, y: colY + 0.4, w: 4.3, h: 2.8, fontSize: 11, fontFace: BCA_FONTS.body, color: BCA_COLORS.textSecondary, valign: 'top' });

  // Divider
  slide.addShape('line', { x: 5.0, y: colY, w: 0, h: 3.3, line: { color: BCA_COLORS.divider, width: 1 } });

  // Column 2
  if (content.col2_title) {
    slide.addText(content.col2_title, { x: 5.4, y: colY, w: 4.3, h: 0.35, fontSize: 16, fontFace: BCA_FONTS.heading, bold: true, color: BCA_COLORS.navy });
  }
  slide.addText(content.col2_body || '', { x: 5.4, y: colY + 0.4, w: 4.3, h: 2.8, fontSize: 11, fontFace: BCA_FONTS.body, color: BCA_COLORS.textSecondary, valign: 'top' });

  addFooter(slide, slideNum, total);
}

// ── 5. Chart / Data ─────────────────────────────────────
function renderChartDataSlide(pptx: PptxGenJS, content: Record<string, any>, slideNum: number, total: number) {
  const slide = pptx.addSlide();
  slide.background = { fill: BCA_COLORS.white };
  const lineY = addSectionHeader(slide, content);

  const layout = content.layout || 'kpi';

  if (layout === 'kpi') {
    const kpis: { value: string; label: string; sublabel: string }[] = content.kpis || [];
    const count = kpis.length || 3;
    const totalWidth = 9.0;
    const gutter = 0.15;
    const cardW = (totalWidth - gutter * (count - 1)) / count;

    kpis.forEach((kpi, i) => {
      const x = 0.5 + i * (cardW + gutter);
      const y = lineY + 0.35;
      slide.addShape('rect', { x, y, w: cardW, h: 2.2, fill: { color: BCA_COLORS.lightBg }, rectRadius: 0.06 });
      slide.addShape('rect', { x, y, w: cardW, h: 0.04, fill: { color: BCA_COLORS.blue } });
      slide.addText(kpi.value || '', { x, y: y + 0.3, w: cardW, h: 0.7, fontSize: 40, fontFace: BCA_FONTS.heading, bold: true, color: BCA_COLORS.blue, align: 'center' });
      slide.addText(kpi.label || '', { x, y: y + 1.1, w: cardW, h: 0.4, fontSize: 11, fontFace: BCA_FONTS.body, color: BCA_COLORS.textSecondary, align: 'center' });
      slide.addText(kpi.sublabel || '', { x, y: y + 1.5, w: cardW, h: 0.35, fontSize: 9, fontFace: BCA_FONTS.body, color: BCA_COLORS.textSecondary, align: 'center' });
    });
  } else {
    // Chart
    const chartTypeMap: Record<string, PptxGenJS.CHART_NAME> = {
      bar: pptx.ChartType.bar,
      line: pptx.ChartType.line,
      pie: pptx.ChartType.pie,
      donut: pptx.ChartType.doughnut,
    };
    const chartData = content.chart_data || [];
    const labels = chartData.map((d: any) => d.label || '');
    const values = chartData.map((d: any) => parseFloat(d.value) || 0);

    if (labels.length > 0) {
      slide.addChart(chartTypeMap[content.chart_type] || pptx.ChartType.bar, [{ name: 'Daten', labels, values }], {
        x: 0.5, y: lineY + 0.2, w: 6.2, h: 3.0,
        showValue: true,
        chartColors: [BCA_COLORS.navy, BCA_COLORS.blue, BCA_COLORS.midblue, BCA_COLORS.cyan, BCA_COLORS.orange],
      });
    }

    if (content.legend?.trim()) {
      slide.addText(content.legend, { x: 7.0, y: lineY + 0.2, w: 2.5, h: 3.0, fontSize: 10, fontFace: BCA_FONTS.body, color: BCA_COLORS.textSecondary, valign: 'top' });
    }
  }

  if (content.source?.trim()) {
    slide.addText(`Quelle: ${content.source}`, { x: 0.5, y: 4.8, w: 9.0, h: 0.25, fontSize: 8, fontFace: BCA_FONTS.body, color: BCA_COLORS.textSecondary });
  }

  addFooter(slide, slideNum, total);
}

// ── 6. Team ─────────────────────────────────────────────
function renderTeamSlide(pptx: PptxGenJS, content: Record<string, any>, slideNum: number, total: number) {
  const slide = pptx.addSlide();
  slide.background = { fill: BCA_COLORS.white };

  slide.addText(content.title || 'Unser Team', { x: 0.5, y: 0.5, w: 9.0, h: 0.55, fontSize: 28, fontFace: BCA_FONTS.heading, bold: true, color: BCA_COLORS.navy });
  slide.addShape('line', { x: 0.5, y: 1.15, w: 9.0, h: 0, line: { color: BCA_COLORS.cyan, width: 2 } });

  const members: { name: string; role: string; university?: string }[] = content.members || [];
  const count = members.length;
  const circleSize = 1.1;
  const totalWidth = 9.0;
  const spacing = count > 1 ? (totalWidth - count * circleSize) / (count - 1) : 0;

  members.forEach((member, i) => {
    const x = count === 1 ? 4.45 : 0.5 + i * (circleSize + spacing);

    // Circle placeholder with initials
    const initials = (member.name || '').split(' ').map(n => n[0] || '').join('').toUpperCase().slice(0, 2);
    slide.addShape('ellipse', { x, y: 1.5, w: circleSize, h: circleSize, fill: { color: BCA_COLORS.lightBg } });
    slide.addText(initials, { x, y: 1.5, w: circleSize, h: circleSize, fontSize: 20, fontFace: BCA_FONTS.heading, bold: true, color: BCA_COLORS.blue, align: 'center', valign: 'middle' });

    slide.addText(member.name || '', { x: x - 0.2, y: 2.8, w: circleSize + 0.4, h: 0.3, fontSize: 12, fontFace: BCA_FONTS.heading, bold: true, color: BCA_COLORS.navy, align: 'center' });
    slide.addText(member.role || '', { x: x - 0.2, y: 3.1, w: circleSize + 0.4, h: 0.25, fontSize: 10, fontFace: BCA_FONTS.body, color: BCA_COLORS.blue, align: 'center' });
    if (member.university) {
      slide.addText(member.university, { x: x - 0.2, y: 3.35, w: circleSize + 0.4, h: 0.25, fontSize: 9, fontFace: BCA_FONTS.body, color: BCA_COLORS.textSecondary, align: 'center' });
    }
  });

  addFooter(slide, slideNum, total);
}

// ── 7. Closing / Contact ────────────────────────────────
function renderClosingSlide(pptx: PptxGenJS, content: Record<string, any>) {
  const dark = content.dark_variant;
  const bg = dark ? BCA_COLORS.navy : BCA_COLORS.white;
  const textColor = dark ? BCA_COLORS.white : BCA_COLORS.navy;
  const slide = pptx.addSlide();
  slide.background = { fill: bg };

  slide.addText('BCA', { x: 3.75, y: 0.7, w: 2.5, h: 0.6, fontSize: 24, fontFace: BCA_FONTS.heading, bold: true, color: textColor, align: 'center' });
  slide.addText(content.thanks || 'Vielen Dank!', { x: 0.5, y: 2.2, w: 9.0, h: 0.65, fontSize: 32, fontFace: BCA_FONTS.heading, bold: true, color: textColor, align: 'center' });
  slide.addShape('line', { x: 3.5, y: 2.95, w: 3.0, h: 0, line: { color: BCA_COLORS.orange, width: 2 } });

  if (content.subtitle) {
    slide.addText(content.subtitle, { x: 1.0, y: 3.2, w: 8.0, h: 0.4, fontSize: 14, fontFace: BCA_FONTS.body, color: dark ? BCA_COLORS.divider : BCA_COLORS.textSecondary, align: 'center' });
  }

  const contactLines: { label: string; value: string }[] = [];
  if (content.email) contactLines.push({ label: 'E-Mail: ', value: content.email });
  if (content.website) contactLines.push({ label: 'Web: ', value: content.website });
  if (content.linkedin) contactLines.push({ label: 'LinkedIn: ', value: content.linkedin });
  if (content.contact_person) contactLines.push({ label: 'Ansprechpartner: ', value: content.contact_person });

  contactLines.forEach((line, i) => {
    slide.addText([
      { text: line.label, options: { bold: true, color: BCA_COLORS.blue, fontSize: 11, fontFace: BCA_FONTS.body } },
      { text: line.value, options: { color: textColor, fontSize: 11, fontFace: BCA_FONTS.body } },
    ], { x: 2.0, y: 3.85 + i * 0.35, w: 6.0, h: 0.3, align: 'center' });
  });
}

// ── Main Export Function ────────────────────────────────
export async function generatePresentation(
  slides: SlideContent[],
  title: string
): Promise<void> {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = 'BCA Slide Studio';
  pptx.company = 'Berlin Consulting Association e.V.';
  pptx.subject = title;
  pptx.title = title;

  const totalSlides = slides.length;

  slides.forEach((slide, index) => {
    const slideNum = index + 1;
    switch (slide.template_id) {
      case 'title': renderTitleSlide(pptx, slide.content); break;
      case 'agenda': renderAgendaSlide(pptx, slide.content, slideNum, totalSlides); break;
      case 'content': renderContentSlide(pptx, slide.content, slideNum, totalSlides); break;
      case 'two-column': renderTwoColumnSlide(pptx, slide.content, slideNum, totalSlides); break;
      case 'chart': renderChartDataSlide(pptx, slide.content, slideNum, totalSlides); break;
      case 'team': renderTeamSlide(pptx, slide.content, slideNum, totalSlides); break;
      case 'contact': renderClosingSlide(pptx, slide.content); break;
    }
  });

  const sanitized = title.replace(/[^a-zA-Z0-9äöüÄÖÜß _-]/g, '').trim() || 'Praesentation';
  await pptx.writeFile({ fileName: `${sanitized}.pptx` });
}
