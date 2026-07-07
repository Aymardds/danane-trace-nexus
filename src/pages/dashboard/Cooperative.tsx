import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Building2, Users, MapPin, Loader2, Search, CheckCircle, XCircle } from "lucide-react";

interface Profile {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  requested_role: string | null;
  is_approved: boolean;
  created_at: string;
}

export default function Cooperative() {
  const { toast } = useToast();
  const [producteurs, setProducteurs] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchProducteurs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("requested_role", "producteur")
      .order("created_at", { ascending: false });
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else setProducteurs(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchProducteurs(); }, []);

  const toggleApproval = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("profiles")
      .update({ is_approved: !currentStatus })
      .eq("id", id);
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else {
      toast({ title: !currentStatus ? "Producteur approuvé" : "Approbation retirée" });
      fetchProducteurs();
    }
  };

  const filtered = producteurs.filter((p) =>
    (p.full_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (p.email ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const approved = producteurs.filter((p) => p.is_approved).length;
  const pending = producteurs.filter((p) => !p.is_approved).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Building2 className="w-7 h-7 text-primary" /> Coopérative
        </h1>
        <p className="text-muted-foreground mt-1">Gérez les membres producteurs de la coopérative</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Rechercher un producteur..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: "Total producteurs", value: producteurs.length, icon: Users },
          { label: "Approuvés", value: approved, icon: CheckCircle },
          { label: "En attente", value: pending, icon: XCircle },
        ].map((s) => (
          <Card key={s.label} className="p-4 flex items-center gap-4 shadow-sm">
            <s.icon className="w-8 h-8 text-primary opacity-70" />
            <div>
              <div className="text-2xl font-bold text-primary">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
            <Users className="w-10 h-10 opacity-30" />
            <p>Aucun producteur enregistré</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  {["Nom complet", "Email", "Téléphone", "Statut", "Inscrit le", "Action"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{p.full_name || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.email ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.phone ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${p.is_approved ? "bg-green-500/15 text-green-600" : "bg-amber-500/15 text-amber-600"}`}>
                        {p.is_approved ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {p.is_approved ? "Approuvé" : "En attente"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(p.created_at).toLocaleDateString("fr-FR")}</td>
                    <td className="px-4 py-3">
                      <Button
                        size="sm"
                        variant={p.is_approved ? "outline" : "default"}
                        className="h-7 text-xs"
                        onClick={() => toggleApproval(p.id, p.is_approved)}
                      >
                        {p.is_approved ? "Retirer" : "Approuver"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
