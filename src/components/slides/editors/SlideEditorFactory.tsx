import { TitleSlideEditor } from "./TitleSlideEditor";
import { AgendaEditor } from "./AgendaEditor";
import { ContentEditor } from "./ContentEditor";
import { TwoColumnEditor } from "./TwoColumnEditor";
import { ChartEditor } from "./ChartEditor";
import { TeamEditor } from "./TeamEditor";
import { ContactEditor } from "./ContactEditor";
import { ExecSummaryEditor } from "./ExecSummaryEditor";

interface Props {
  templateId: string;
  content: Record<string, any>;
  onChange: (content: Record<string, any>) => void;
}

export function SlideEditorFactory({ templateId, content, onChange }: Props) {
  switch (templateId) {
    case "title": return <TitleSlideEditor content={content} onChange={onChange} />;
    case "agenda": return <AgendaEditor content={content} onChange={onChange} />;
    case "content": return <ContentEditor content={content} onChange={onChange} />;
    case "two-column": return <TwoColumnEditor content={content} onChange={onChange} />;
    case "chart": return <ChartEditor content={content} onChange={onChange} />;
    case "team": return <TeamEditor content={content} onChange={onChange} />;
    case "contact": return <ContactEditor content={content} onChange={onChange} />;
    case "exec_summary": return <ExecSummaryEditor content={content} onChange={onChange} />;
    default: return <p className="text-muted-foreground text-sm">Kein Editor für dieses Template verfügbar.</p>;
  }
}
