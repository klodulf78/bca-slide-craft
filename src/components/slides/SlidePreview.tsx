import { cn } from "@/lib/utils";

interface SlidePreviewProps {
  templateId: string;
  content?: Record<string, any>;
  className?: string;
}

export function SlidePreview({ templateId, content = {}, className }: SlidePreviewProps) {
  return (
    <div
      className={cn(
        "w-[200px] h-[112px] rounded-md border border-border bg-white overflow-hidden flex-shrink-0 relative",
        className
      )}
      style={{ fontFamily: "'Raleway', sans-serif" }}
    >
      <div className="w-full h-full p-2 flex flex-col" style={{ transform: "scale(1)", transformOrigin: "top left" }}>
        {templateId === "title" && <TitlePreview content={content} />}
        {templateId === "agenda" && <AgendaPreview content={content} />}
        {templateId === "content" && <ContentPreview content={content} />}
        {templateId === "two-column" && <TwoColumnPreview content={content} />}
        {templateId === "chart" && <ChartPreview content={content} />}
        {templateId === "team" && <TeamPreview content={content} />}
        {templateId === "contact" && <ContactPreview content={content} />}
      </div>
    </div>
  );
}

function TitlePreview({ content }: { content: Record<string, any> }) {
  const dark = content.dark_variant;
  return (
    <div className={cn("flex-1 flex flex-col items-center justify-center text-center gap-0.5 rounded", dark ? "bg-[#010038]" : "")}>
      <div className="w-6 h-1 bg-[#0524DE] rounded-full mb-1" />
      <p className={cn("text-[7px] font-bold leading-tight truncate max-w-[180px]", dark ? "text-white" : "text-[#010038]")}>
        {content.title || "Projekttitel"}
      </p>
      {content.subtitle && (
        <p className={cn("text-[5px] truncate max-w-[160px]", dark ? "text-gray-300" : "text-gray-500")}>
          {content.subtitle}
        </p>
      )}
      <p className={cn("text-[4px] mt-0.5", dark ? "text-gray-400" : "text-gray-400")}>
        {content.date || new Date().toLocaleDateString("de-DE")}
      </p>
    </div>
  );
}

function AgendaPreview({ content }: { content: Record<string, any> }) {
  const items = content.items?.length ? content.items : ["Punkt 1", "Punkt 2", "Punkt 3"];
  return (
    <div className="flex-1 flex flex-col gap-0.5">
      <p className="text-[6px] font-bold text-[#010038]">Agenda</p>
      {items.slice(0, 5).map((item: string, i: number) => (
        <div key={i} className="flex items-center gap-1">
          <span className={cn("text-[5px] font-bold w-2.5 h-2.5 rounded-full flex items-center justify-center", 
            content.active_item === i + 1 ? "bg-[#0524DE] text-white" : "bg-gray-100 text-[#010038]"
          )}>{i + 1}</span>
          <span className="text-[5px] text-gray-600 truncate">{item}</span>
        </div>
      ))}
    </div>
  );
}

function ContentPreview({ content }: { content: Record<string, any> }) {
  return (
    <div className="flex-1 flex flex-col gap-0.5">
      {content.section_header && (
        <p className="text-[4px] font-bold text-[#0524DE] uppercase tracking-wider">{content.section_header}</p>
      )}
      <p className="text-[6px] font-bold text-[#010038] truncate">{content.title || "Slide-Titel"}</p>
      <div className="flex-1">
        {content.as_bullets ? (
          <div className="space-y-0.5">
            {(content.body || "Inhalt hier...").split("\n").slice(0, 3).map((line: string, i: number) => (
              <div key={i} className="flex items-start gap-0.5">
                <span className="text-[4px] text-[#0524DE] mt-[1px]">•</span>
                <span className="text-[4px] text-gray-600 truncate">{line}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[4px] text-gray-600 line-clamp-3">{content.body || "Inhalt hier..."}</p>
        )}
      </div>
      {content.takeaway && (
        <p className="text-[4px] text-[#0524DE] font-medium truncate border-t border-gray-100 pt-0.5">{content.takeaway}</p>
      )}
    </div>
  );
}

function TwoColumnPreview({ content }: { content: Record<string, any> }) {
  return (
    <div className="flex-1 flex flex-col gap-0.5">
      <p className="text-[6px] font-bold text-[#010038] truncate">{content.title || "Zwei-Spalter"}</p>
      <div className="flex-1 flex gap-1">
        <div className="flex-1 bg-gray-50 rounded p-1">
          <p className="text-[4px] font-bold text-[#010038] truncate">{content.col1_title || "Spalte 1"}</p>
          <p className="text-[3px] text-gray-500 line-clamp-3">{content.col1_body || ""}</p>
        </div>
        <div className="flex-1 bg-gray-50 rounded p-1">
          <p className="text-[4px] font-bold text-[#010038] truncate">{content.col2_title || "Spalte 2"}</p>
          <p className="text-[3px] text-gray-500 line-clamp-3">{content.col2_body || ""}</p>
        </div>
      </div>
    </div>
  );
}

function ChartPreview({ content }: { content: Record<string, any> }) {
  return (
    <div className="flex-1 flex flex-col gap-0.5">
      <p className="text-[6px] font-bold text-[#010038] truncate">{content.title || "Chart / Daten"}</p>
      <div className="flex-1 flex items-center justify-center">
        {content.layout === "kpi" ? (
          <div className="flex gap-1">
            {Array.from({ length: content.kpi_count || 3 }).map((_, i) => (
              <div key={i} className="bg-gray-50 rounded p-1 text-center min-w-[30px]">
                <p className="text-[6px] font-bold text-[#0524DE]">{content.kpis?.[i]?.value || "0"}</p>
                <p className="text-[3px] text-gray-500">{content.kpis?.[i]?.label || "KPI"}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-end gap-0.5 h-[40px]">
            {[60, 80, 45, 90, 70].map((h, i) => (
              <div key={i} className="w-3 bg-[#0524DE] rounded-t opacity-60" style={{ height: `${h}%` }} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TeamPreview({ content }: { content: Record<string, any> }) {
  const members = content.members?.length ? content.members : [{ name: "Name" }, { name: "Name" }];
  return (
    <div className="flex-1 flex flex-col gap-0.5">
      <p className="text-[6px] font-bold text-[#010038]">{content.title || "Unser Team"}</p>
      <div className="flex-1 flex items-center justify-center gap-2">
        {members.slice(0, 4).map((m: any, i: number) => (
          <div key={i} className="text-center">
            <div className="w-5 h-5 rounded-full bg-gray-200 mx-auto mb-0.5" />
            <p className="text-[4px] text-[#010038] font-medium truncate max-w-[40px]">{m.name || "Name"}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContactPreview({ content }: { content: Record<string, any> }) {
  const dark = content.dark_variant;
  return (
    <div className={cn("flex-1 flex flex-col items-center justify-center text-center gap-0.5 rounded", dark ? "bg-[#010038]" : "")}>
      <p className={cn("text-[7px] font-bold", dark ? "text-white" : "text-[#010038]")}>
        {content.thanks || "Vielen Dank!"}
      </p>
      <p className={cn("text-[4px]", dark ? "text-gray-300" : "text-gray-500")}>
        {content.subtitle || "Wir freuen uns auf eure Fragen."}
      </p>
      <div className="w-8 h-[1px] bg-[#0524DE] my-0.5" />
      <p className={cn("text-[4px]", dark ? "text-gray-400" : "text-gray-400")}>
        {content.email || "kontakt@bca-berlin.de"}
      </p>
    </div>
  );
}
