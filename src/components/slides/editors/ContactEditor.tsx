import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { CharCount } from "./CharCount";

interface Props {
  content: Record<string, any>;
  onChange: (content: Record<string, any>) => void;
}

export function ContactEditor({ content, onChange }: Props) {
  const update = (key: string, value: any) => onChange({ ...content, [key]: value });

  return (
    <div className="space-y-3">
      <div>
        <Label>Dankes-Text</Label>
        <Input value={content.thanks ?? "Vielen Dank!"} onChange={(e) => update("thanks", e.target.value.slice(0, 30))} className="bg-[hsl(228,33%,98%)]" />
        <CharCount current={(content.thanks ?? "Vielen Dank!").length} max={30} />
      </div>
      <div>
        <Label>Untertitel</Label>
        <Input value={content.subtitle ?? "Wir freuen uns auf eure Fragen."} onChange={(e) => update("subtitle", e.target.value.slice(0, 60))} className="bg-[hsl(228,33%,98%)]" />
        <CharCount current={(content.subtitle ?? "Wir freuen uns auf eure Fragen.").length} max={60} />
      </div>
      <div>
        <Label>E-Mail</Label>
        <Input value={content.email ?? "kontakt@bca-berlin.de"} onChange={(e) => update("email", e.target.value)} className="bg-[hsl(228,33%,98%)]" />
      </div>
      <div>
        <Label>Website</Label>
        <Input value={content.website ?? "www.bca-berlin.de"} onChange={(e) => update("website", e.target.value)} className="bg-[hsl(228,33%,98%)]" />
      </div>
      <div>
        <Label>LinkedIn</Label>
        <Input value={content.linkedin ?? "linkedin.com/company/bca-berlin"} onChange={(e) => update("linkedin", e.target.value)} className="bg-[hsl(228,33%,98%)]" />
      </div>
      <div>
        <Label>Ansprechpartner</Label>
        <Input value={content.contact_person || ""} onChange={(e) => update("contact_person", e.target.value)} placeholder="Optional" className="bg-[hsl(228,33%,98%)]" />
      </div>
      <div className="flex items-center gap-2">
        <Checkbox checked={content.dark_variant || false} onCheckedChange={(v) => update("dark_variant", !!v)} id="dark-contact" />
        <Label htmlFor="dark-contact" className="cursor-pointer">Dunkler Hintergrund</Label>
      </div>
    </div>
  );
}
