import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Leaf } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function ResetPasswordPage() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { toast } = useToast();

    // Basic check to ensure user is actually coming from a recovery flow
    useEffect(() => {
        supabase.auth.onAuthStateChange(async (event) => {
            if (event !== "PASSWORD_RECOVERY") {
                // Optional: you could redirect if not in recovery mode, 
                // but Supabase usually handles the session from the link automatically.
            }
        });
    }, []);

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast({
                title: "Erreur",
                description: "Les mots de passe ne correspondent pas.",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);
        const { error } = await supabase.auth.updateUser({ password });
        setLoading(false);

        if (error) {
            toast({
                title: "Erreur",
                description: error.message,
                variant: "destructive",
            });
        } else {
            toast({
                title: "Succès",
                description: "Votre mot de passe a été mis à jour avec succès.",
            });
            navigate("/login");
        }
    };

    return (
        <div className="min-h-screen flex text-left">
            {/* Left panel */}
            <div className="hidden lg:flex lg:w-1/2 gradient-hero items-center justify-center p-12">
                <div className="max-w-md text-center">
                    <Leaf className="w-16 h-16 text-gold mx-auto mb-6" />
                    <h2 className="text-3xl font-bold text-primary-foreground mb-4 font-serif">
                        Nouveau départ
                    </h2>
                    <p className="text-primary-foreground/70 text-lg">
                        Sécurisez votre compte avec un nouveau mot de passe robuste.
                    </p>
                </div>
            </div>

            {/* Right panel */}
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="w-full max-w-md">
                    <h1 className="text-3xl font-bold text-foreground mb-2 font-serif text-left">
                        Réinitialiser le mot de passe
                    </h1>
                    <p className="text-muted-foreground mb-8 text-left">
                        Veuillez entrer votre nouveau mot de passe ci-dessous.
                    </p>

                    <form onSubmit={handlePasswordUpdate} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="password">Nouveau mot de passe</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={8}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>
                        <Button type="submit" className="w-full" size="lg" disabled={loading}>
                            {loading ? "Mise à jour..." : "Mettre à jour le mot de passe"}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}
