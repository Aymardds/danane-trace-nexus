import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Leaf, ArrowLeft, Wheat, ShieldCheck, QrCode } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if already logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) navigate("/dashboard");
    });
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast({ title: "Erreur de connexion", description: error.message, variant: "destructive" });
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 gradient-hero items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-32 h-32 rounded-full border-2 border-primary-foreground/30" />
          <div className="absolute bottom-32 right-16 w-48 h-48 rounded-full border border-primary-foreground/20" />
        </div>
        <div className="max-w-md text-center relative z-10">
          <Leaf className="w-16 h-16 text-gold mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-primary-foreground mb-4 font-serif">
            Riz Danané IGP
          </h2>
          <p className="text-primary-foreground/70 text-lg mb-10">
            Plateforme officielle de traçabilité de la filière rizicole sous Indication Géographique Protégée.
          </p>
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { icon: Wheat, label: "Traçabilité" },
              { icon: ShieldCheck, label: "Sécurité" },
              { icon: QrCode, label: "QR Code" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="p-3 rounded-lg bg-primary-foreground/10">
                <Icon className="w-6 h-6 text-gold mx-auto mb-1" />
                <span className="text-xs text-primary-foreground/60">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">


          <h1 className="text-3xl font-bold text-foreground mb-2 font-serif">Connexion</h1>
          <p className="text-muted-foreground mb-8">Accédez à votre espace de traçabilité</p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Adresse e-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="votre@email.ci"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Mot de passe</Label>
                <Link
                  to="/forgot-password"
                  className="text-sm text-primary hover:underline font-medium"
                >
                  Mot de passe oublié ?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Connexion..." : "Se connecter"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Pas encore de compte ?{" "}
            <Link to="/register" className="text-primary font-medium hover:underline">
              Demander un accès
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
