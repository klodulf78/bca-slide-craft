import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { BCALogo } from "@/components/BCALogo";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error: authError } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (authError) {
      setError(authError.message);
    } else if (!isSignUp) {
      navigate("/");
    } else {
      setError("Bestätigungs-E-Mail gesendet. Bitte überprüfe dein Postfach.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy px-4">
      <Card className="w-full max-w-md border-none shadow-2xl">
        <CardHeader className="text-center pb-2">
          <div className="mb-4 flex justify-center">
            <BCALogo variant="dark" size="lg" />
          </div>
          <p className="font-heading text-sm text-muted-foreground">Slide Studio</p>
          <CardTitle className="font-heading text-xl mt-4">
            {isSignUp ? "Account erstellen" : "Anmelden"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input type="email" placeholder="E-Mail-Adresse" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input type="password" placeholder="Passwort" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Wird geladen..." : isSignUp ? "Registrieren" : "Anmelden"}
            </Button>
          </form>
          <button
            onClick={() => { setIsSignUp(!isSignUp); setError(""); }}
            className="w-full text-center text-sm text-muted-foreground mt-4 hover:text-foreground transition-colors"
          >
            {isSignUp ? "Bereits einen Account? Anmelden" : "Noch keinen Account? Registrieren"}
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
