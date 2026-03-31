import { cn } from "@/lib/utils";
import { BUSINESS_ICONS } from "./editors/IconPicker";

interface SlidePreviewProps {
  templateId: string;
  content?: Record<string, any>;
  className?: string;
}

function SlideIcon({ name, size = 10, color }: { name?: string; size?: number; color?: string }) {
  if (!name || !BUSINESS_ICONS[name]) return null;
  const Icon = BUSINESS_ICONS[name].icon;
  return <Icon style={{ width: size, height: size, color, flexShrink: 0 }} />;
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
        {templateId === "exec_summary" && <ExecSummaryPreview content={content} />}
      </div>
    </div>
  );
}

function ExecSummaryPreview({ content }: { content: Record<string, any> }) {
  return (
    <div className="flex-1 flex flex-col gap-0.5">
      <p className="text-[4px] font-bold text-[#0524DE] uppercase tracking-wider">EXECUTIVE SUMMARY</p>
      <p className="text-[6px] font-bold text-[#010038] truncate">{content.title || "Kernaussage"}</p>
      {content.subtitle && (
        <p className="text-[4px] text-[#4A4A6A] truncate">{content.subtitle}</p>
      )}
      <div className="w-full h-[1px] bg-[#27E0FF] my-0.5" />
      <div className="flex-1 flex gap-0.5">
        {[
          { label: "Ausgangslage", color: "#0063F2", text: content.situation, icon: content.situation_icon },
          { label: "Herausforderung", color: "#FF671E", text: content.complication, icon: content.complication_icon },
          { label: "Empfehlung", color: "#0524DE", text: content.resolution, icon: content.resolution_icon },
        ].map((box, i) => (
          <div key={i} className="flex-1 bg-[#F8F9FC] rounded-sm p-0.5" style={{ borderLeft: `2px solid ${box.color}` }}>
            <div className="flex items-center gap-0.5">
              <SlideIcon name={box.icon} size={6} color={box.color} />
              <p className="text-[3px] font-bold" style={{ color: box.color }}>{box.label}</p>
            </div>
            <p className="text-[3px] text-[#4A4A6A] line-clamp-3">{box.text || ""}</p>
          </div>
        ))}
      </div>
      {content.key_takeaway && (
        <div className="bg-[#F8F9FC] rounded-sm p-0.5 border-l-2 border-[#010038]">
          <p className="text-[3px] font-bold text-[#010038] truncate">{content.key_takeaway}</p>
        </div>
      )}
    </div>
  );
}

function TitlePreview({ content }: { content: Record<string, any> }) {
  const dark = content.dark_variant;
  return (
    <div className={cn("flex-1 flex flex-col items-center justify-center text-center gap-0.5 rounded", dark ? "bg-[#010038]" : "")}>
      <img src={dark ? "/bca-logo-white.svg" : "/bca-logo-blue.svg"} alt="BCA" className="h-3 w-auto mb-1" />
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
        <div className="flex items-center gap-0.5">
          <SlideIcon name={content.icon} size={6} color="#0524DE" />
          <p className="text-[4px] font-bold text-[#0524DE] uppercase tracking-wider">{content.section_header}</p>
        </div>
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
          {content.col1_icon && <SlideIcon name={content.col1_icon} size={8} color="#010038" />}
          <p className="text-[4px] font-bold text-[#010038] truncate">{content.col1_title || "Spalte 1"}</p>
          <p className="text-[3px] text-gray-500 line-clamp-3">{content.col1_body || ""}</p>
        </div>
        <div className="flex-1 bg-gray-50 rounded p-1">
          {content.col2_icon && <SlideIcon name={content.col2_icon} size={8} color="#010038" />}
          <p className="text-[4px] font-bold text-[#010038] truncate">{content.col2_title || "Spalte 2"}</p>
          <p className="text-[3px] text-gray-500 line-clamp-3">{content.col2_body || ""}</p>
        </div>
      </div>
    </div>
  );
}

function ChartPreview({ content }: { content: Record<string, any> }) {
  const chartData = content.chart_data || [];

  return (
    <div className="flex-1 flex flex-col gap-0.5">
      <p className="text-[6px] font-bold text-[#010038] truncate">{content.title || "Chart / Daten"}</p>
      <div className="flex-1 flex items-center justify-center relative">
        {content.layout === "kpi" ? (
          <div className="flex gap-1">
            {Array.from({ length: content.kpi_count || 3 }).map((_, i) => {
              const kpi = content.kpis?.[i];
              const trend = kpi?.trend;
              return (
                <div key={i} className="bg-[#F8F9FC] rounded p-1 text-center min-w-[30px] relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#0524DE] to-transparent" />
                  {kpi?.icon && (
                    <div className="flex justify-center mb-0.5">
                      <SlideIcon name={kpi.icon} size={7} color="#0524DE" />
                    </div>
                  )}
                  <div className="flex items-center justify-center gap-0.5">
                    <p className="text-[7px] font-bold text-[#0524DE]">{kpi?.value || "0"}</p>
                    {trend === "up" && <span className="text-[5px] text-[#10B981]">↑</span>}
                    {trend === "down" && <span className="text-[5px] text-[#EF4444]">↓</span>}
                  </div>
                  <p className="text-[3px] text-gray-500">{kpi?.label || "KPI"}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="w-full px-1">
            {content.chart_type === "pie" || content.chart_type === "donut" ? (
              <div className="flex items-center justify-center h-[40px]">
                <div className="w-[36px] h-[36px] rounded-full border-4 border-[#0524DE] relative">
                  <div className="absolute inset-[6px] rounded-full border-4 border-[#0063F2]" />
                  {content.chart_type === "donut" && <div className="absolute inset-[12px] rounded-full bg-white" />}
                </div>
              </div>
            ) : content.chart_type === "line" ? (
              <svg viewBox="0 0 100 40" className="w-full h-[40px]">
                <polyline points="5,35 25,20 45,28 65,10 85,15 95,5" fill="none" stroke="#0524DE" strokeWidth="2" />
                {[5,25,45,65,85,95].map((x, i) => (
                  <circle key={i} cx={x} cy={[35,20,28,10,15,5][i]} r="2" fill="#0524DE" />
                ))}
              </svg>
            ) : (
              <div className="flex items-end gap-0.5 h-[40px]">
                {(chartData.length > 0 ? chartData : [{value:60},{value:80},{value:45},{value:90},{value:70}]).map((d: any, i: number) => {
                  const val = parseFloat(d.value) || [60,80,45,90,70][i % 5];
                  const maxVal = Math.max(...(chartData.length > 0 ? chartData : [{value:90}]).map((x: any) => parseFloat(x.value) || 90));
                  const h = Math.max(10, (val / maxVal) * 100);
                  const colors = ["#010038", "#0524DE", "#0063F2", "#27E0FF", "#FF671E"];
                  return <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, backgroundColor: colors[i % 5] }} />;
                })}
              </div>
            )}
          </div>
        )}
        {/* Annotations */}
        {content.annotations?.map((ann: any, i: number) => (
          <div key={i} className="absolute bg-white border border-[#E2E4EC] rounded px-0.5 text-[3px] font-bold text-[#010038] shadow-sm"
            style={{
              top: ann.position?.includes("top") ? "2px" : "auto",
              bottom: ann.position?.includes("bottom") ? "2px" : "auto",
              right: ann.position?.includes("right") ? "2px" : "auto",
              left: ann.position?.includes("left") ? "2px" : "auto",
            }}
          >
            {ann.text}
          </div>
        ))}
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
