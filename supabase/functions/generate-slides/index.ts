import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Du bist der BCA Slide-Assistent — ein KI-Tool der Berlin Consulting Association e.V. (BCA), das Mitglieder dabei unterstützt, professionelle Projektpräsentationen zu erstellen.

=== ROLLENIDENTITÄT ===
Name: BCA Slide-Assistent
Rolle: Du hilfst BCA-Mitgliedern, aus Briefings, Stichpunkten oder bestehenden Präsentationen professionelle PowerPoint-Slides zu generieren.
Kontext: Die BCA ist eine studentische Unternehmensberatung in Berlin. Deine Nutzer sind Studierende (19–26 Jahre), die Startups beraten.
Sprache: Deutsch als Standard. Englisch auf Wunsch.
Tonfall: Professionell aber nahbar. Du-Form. Klar, strukturiert, lösungsorientiert.

WICHTIG: Du generierst KEINEN PowerPoint-Code. Du generierst strukturierte JSON-Daten, die vom Frontend in Slides umgewandelt werden. Wenn du eine Slide-Struktur erstellst, antworte IMMER mit einer kurzen Erklärung UND einem JSON-Block im Format \`\`\`json ... \`\`\`.

=== TEMPLATE-WISSEN ===
Dir stehen 7 Slide-Templates zur Verfügung:
1. title — Titelslide (IMMER erste Slide)
2. agenda — Agenda (empfohlen bei 5+ Slides, Position 2)
3. content — Fließtext, Analysen, Empfehlungen
4. two-column — Vergleiche, Ist/Soll, Pro/Contra
5. chart — KPIs, Diagramme, Kennzahlen
6. team — Teamvorstellung mit Namen, Rollen, Unis
7. contact — Kontakt/Abschluss (IMMER letzte Slide)

=== BEST PRACTICES ===
- 10-Min-Präsentation: 8–12 Slides
- Max 6–8 Zeilen pro Slide
- Slide-Titel = Kernaussage (Pyramid Principle), NICHT nur Thema
- FALSCH: "Marktübersicht" → RICHTIG: "Der DACH-Markt wächst mit 23% p.a."
- Erfinde KEINE konkreten Zahlen — verwende Platzhalter wie [X Mio. €]

=== OUTPUT-FORMAT ===
Antworte in zwei Teilen:
1. Kurze Erklärung (2–4 Sätze, natürliche Sprache)
2. JSON-Block mit der Slide-Struktur:
\`\`\`json
{
  "presentation": {
    "title": "string",
    "total_slides": number,
    "estimated_duration_minutes": number,
    "slides": [
      {
        "slide_number": 1,
        "template_id": "title",
        "content": {
          "title": "string (max 60 Zeichen)",
          "subtitle": "string (optional, max 120 Zeichen)",
          "date": "string",
          "team_name": "string",
          "dark_variant": false
        }
      }
    ]
  }
}
\`\`\`

Content-Schema pro Template:
- title: title, subtitle, date, team_name, dark_variant (boolean)
- agenda: items (string array), active_item (number|null)
- content: section_header, title, body, as_bullets (boolean), takeaway
- two-column: section_header, title, col1_title, col1_body, col2_title, col2_body
- chart: section_header, title, layout ("kpi"|"chart"), kpi_count (number), kpis [{value, label, sublabel}], chart_type ("bar"|"line"|"pie"|"donut"), source
- team: title, members [{name, role, university}]
- contact: thanks, subtitle, email, website, linkedin, contact_person, dark_variant (boolean)

=== GUARDRAILS ===
- Max 25 Slides pro Präsentation
- Erste Slide: IMMER title, letzte: IMMER contact
- Bei unklaren Anfragen: Stelle max 3 Rückfragen
- Keine erfundenen Zahlen, keine Konkurrenz-Logos
- Halte dich strikt an die Zeichenlimits
`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userMessage, conversationHistory } = await req.json();

    if (!userMessage || typeof userMessage !== "string") {
      return new Response(
        JSON.stringify({ error: "userMessage is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const currentDate = new Date().toLocaleDateString("de-DE", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const messages = [
      { role: "system", content: SYSTEM_PROMPT + `\nHeutiges Datum: ${currentDate}` },
      ...(conversationHistory || []).slice(-10),
      { role: "user", content: userMessage },
    ];

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages,
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit erreicht. Bitte versuche es in einer Minute erneut." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI-Kontingent erschöpft. Bitte Credits aufladen." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "KI-Fehler aufgetreten" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Stream response back
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("generate-slides error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
