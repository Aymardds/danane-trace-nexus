import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Leaf, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleResetRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });

        setLoading(false);

        if (error) {
            toast({
                title: "Erreur",
                description: error.message,
                variant: "destructive",
            });
        } else {
            toast({
                title: "E-mail envoyé",
                description: "Vérifiez votre boîte de réception pour le lien de réinitialisation.",
            });
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left panel (consistent with Login/Register) */}
            <div className="hidden lg:flex lg:w-1/2 gradient-hero items-center justify-center p-12">
                <div className="max-w-md text-center">
                    <Leaf className="w-16 h-16 text-gold mx-auto mb-6" />
                    <h2 className="text-3xl font-bold text-primary-foreground mb-4 font-serif">
                        Besoin d'aide ?
                    </h2>
                    <p className="text-primary-foreground/70 text-lg">
                        Nous allons vous aider à récupérer l'accès à votre compte de traçabilité.
                    </p>
                </div>
            </div>

            {/* Right panel */}
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="w-full max-w-md">
                    <Link
                        to="/login"
                        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Retour à la connexion
                    </Link>

                    <h1 className="text-3xl font-bold text-foreground mb-2 font-serif">
                        Mot de passe oublié
                    </h1>
                    <p className="text-muted-foreground mb-8">
                        Entrez votre adresse e-mail pour recevoir un lien de réinitialisation.
                    </p>

                    <form onSubmit={handleResetRequest} className="space-y-5">
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
                        <Button type="submit" className="w-full" size="lg" disabled={loading}>
                            {loading ? "Envoi en cours..." : "Envoyer le lien"}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}
