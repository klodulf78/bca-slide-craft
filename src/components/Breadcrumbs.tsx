import { useLocation, Link } from "react-router-dom";
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbSeparator, BreadcrumbPage,
} from "@/components/ui/breadcrumb";

const routeLabels: Record<string, string> = {
  "": "Dashboard",
  new: "Neue Präsentation",
  chat: "Chat-Assistent",
  upload: "Upload",
  settings: "Einstellungen",
  presentation: "Präsentation",
  edit: "Editor",
};

export function Breadcrumbs() {
  const { pathname } = useLocation();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  const crumbs: { label: string; path: string }[] = [{ label: "Dashboard", path: "/" }];

  let currentPath = "";
  segments.forEach((seg, i) => {
    currentPath += `/${seg}`;
    const label = routeLabels[seg] || (seg.length > 8 ? seg.slice(0, 8) + "…" : seg);
    if (label !== "Dashboard") {
      crumbs.push({ label, path: currentPath });
    }
  });

  if (crumbs.length <= 1) return null;

  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        {crumbs.map((crumb, i) => (
          <BreadcrumbItem key={crumb.path}>
            {i > 0 && <BreadcrumbSeparator />}
            {i === crumbs.length - 1 ? (
              <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
            ) : (
              <BreadcrumbLink asChild>
                <Link to={crumb.path}>{crumb.label}</Link>
              </BreadcrumbLink>
            )}
          </BreadcrumbItem>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
