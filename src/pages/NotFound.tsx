import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { BCALogo } from "@/components/BCALogo";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2 mb-6">
          <BCALogo variant="blue" className="h-10 w-auto" />
          <span className="font-heading text-2xl text-primary">Slide Studio</span>
        </div>
        <h1 className="text-6xl font-heading font-bold text-foreground">404</h1>
        <p className="text-xl text-muted-foreground">Seite nicht gefunden</p>
        <p className="text-sm text-muted-foreground max-w-md">
          Die Seite <code className="bg-muted px-1.5 py-0.5 rounded text-xs">{location.pathname}</code> existiert nicht.
        </p>
        <Button onClick={() => window.location.href = "/"} className="mt-4">
          Zurück zum Dashboard
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
