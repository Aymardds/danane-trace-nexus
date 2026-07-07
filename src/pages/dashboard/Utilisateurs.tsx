import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Users, Loader2, Search, CheckCircle, XCircle, ShieldCheck, UserX } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface Profile {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  requested_role: AppRole | null;
  is_approved: boolean;
  created_at: string;
}

const roleLabels: Record<string, string> = {
  producteur: "Producteur",
  cooperative: "Coopérative",
  collecteur: "Collecteur",
  transformateur: "Transformateur",
  conditionneur: "Conditionneur",
  distributeur: "Distributeur",
  admin: "Administrateur",
};

const roleColors: Record<string, string> = {
  producteur: "bg-green-500/15 text-green-700",
  cooperative: "bg-blue-500/15 text-blue-700",
  collecteur: "bg-amber-500/15 text-amber-700",
  transformateur: "bg-purple-500/15 text-purple-700",
  conditionneur: "bg-pink-500/15 text-pink-700",
  distributeur: "bg-orange-500/15 text-orange-700",
  admin: "bg-red-500/15 text-red-700",
};

export default function Utilisateurs() {
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [userRoles, setUserRoles] = useState<Record<string, AppRole[]>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [selectedRole, setSelectedRole] = useState<AppRole>("producteur");

  const fetchData = async () => {
    setLoading(true);
    const [{ data: profilesData }, { data: rolesData }] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
    ]);

    const roleMap: Record<string, AppRole[]> = {};
    (rolesData ?? []).forEach(({ user_id, role }) => {
      if (!roleMap[user_id]) roleMap[user_id] = [];
      roleMap[user_id].push(role);
    });

    setProfiles(profilesData ?? []);
    setUserRoles(roleMap);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const toggleApproval = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase.from("profiles").update({ is_approved: !currentStatus }).eq("id", id);
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else { toast({ title: !currentStatus ? "Utilisateur approuvé" : "Approbation retirée" }); fetchData(); }
  };

  const assignRole = async () => {
    if (!selectedUser) return;
    const { error } = await supabase
      .from("user_roles")
      .upsert({ user_id: selectedUser.id, role: selectedRole }, { onConflict: "user_id,role" });
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else {
      toast({ title: `Rôle "${roleLabels[selectedRole]}" assigné à ${selectedUser.full_name}` });
      setAssignDialogOpen(false);
      fetchData();
    }
  };

  const revokeRole = async (userId: string, role: AppRole) => {
    if (!confirm(`Révoquer le rôle "${roleLabels[role]}" ?`)) return;
    const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else { toast({ title: "Rôle révoqué" }); fetchData(); }
  };

  const filtered = profiles.filter((p) =>
    (p.full_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (p.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (p.requested_role ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const approved = profiles.filter((p) => p.is_approved).length;
  const pending = profiles.filter((p) => !p.is_approved).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Users className="w-7 h-7 text-primary" /> Utilisateurs
          </h1>
          <p className="text-muted-foreground mt-1">Gestion des comptes et des rôles</p>
        </div>
        <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader><DialogTitle>Assigner un rôle à {selectedUser?.full_name}</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label>Rôle</Label>
                <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as AppRole)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(roleLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>Annuler</Button>
                <Button onClick={assignRole}>Assigner</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total comptes", value: profiles.length },
          { label: "Approuvés", value: approved },
          { label: "En attente", value: pending },
          { label: "Avec rôles", value: Object.keys(userRoles).length },
        ].map((s) => (
          <Card key={s.label} className="p-4 text-center shadow-sm">
            <div className="text-2xl font-bold text-primary">{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </Card>
        ))}
      </div>

      <Card className="shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
            <Users className="w-10 h-10 opacity-30" />
            <p>Aucun utilisateur trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  {["Nom", "Email", "Rôle demandé", "Rôles actifs", "Statut", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{p.full_name || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{p.email ?? "—"}</td>
                    <td className="px-4 py-3">
                      {p.requested_role && (
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${roleColors[p.requested_role] ?? "bg-muted text-muted-foreground"}`}>
                          {roleLabels[p.requested_role]}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(userRoles[p.id] ?? []).map((role) => (
                          <button
                            key={role}
                            title={`Révoquer ${roleLabels[role]}`}
                            onClick={() => revokeRole(p.id, role)}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold cursor-pointer hover:opacity-70 transition-opacity ${roleColors[role] ?? ""}`}
                          >
                            {roleLabels[role]} <XCircle className="w-3 h-3" />
                          </button>
                        ))}
                        {(userRoles[p.id] ?? []).length === 0 && <span className="text-muted-foreground text-xs">Aucun</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${p.is_approved ? "bg-green-500/15 text-green-600" : "bg-amber-500/15 text-amber-600"}`}>
                        {p.is_approved ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {p.is_approved ? "Approuvé" : "En attente"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1"
                          onClick={() => { setSelectedUser(p); setAssignDialogOpen(true); }}
                        >
                          <ShieldCheck className="w-3 h-3" /> Rôle
                        </Button>
                        <Button
                          size="sm"
                          variant={p.is_approved ? "outline" : "default"}
                          className="h-7 text-xs gap-1"
                          onClick={() => toggleApproval(p.id, p.is_approved)}
                        >
                          {p.is_approved ? <UserX className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                          {p.is_approved ? "Bloquer" : "Approuver"}
                        </Button>
                      </div>
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
