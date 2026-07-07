import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MapPin, Plus, Edit2, Trash2, Loader2, Search } from "lucide-react";
import type { User } from "@supabase/supabase-js";

interface Parcelle {
  id: string;
  id_par: string;
  localite: string;
  superficie_ha: number | null;
  latitude: number | null;
  longitude: number | null;
  variete: string | null;
  campagne: string | null;
  created_at: string;
}

interface OutletContext {
  user: User;
  profile: { full_name: string } | null;
  roles: string[];
}

const emptyForm = {
  id_par: "",
  localite: "",
  superficie_ha: "",
  latitude: "",
  longitude: "",
  variete: "",
  campagne: "",
};

export default function Parcelles() {
  const { user, roles } = useOutletContext<OutletContext>();
  const { toast } = useToast();
  const [parcelles, setParcelles] = useState<Parcelle[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Parcelle | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const isAdmin = roles.includes("admin");

  const fetchParcelles = async () => {
    setLoading(true);
    const query = supabase.from("parcelles").select("*").order("created_at", { ascending: false });
    const { data, error } = await query;
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      setParcelles(data ?? []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchParcelles(); }, []);

  const openAdd = () => {
    setEditTarget(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (p: Parcelle) => {
    setEditTarget(p);
    setForm({
      id_par: p.id_par,
      localite: p.localite,
      superficie_ha: p.superficie_ha?.toString() ?? "",
      latitude: p.latitude?.toString() ?? "",
      longitude: p.longitude?.toString() ?? "",
      variete: p.variete ?? "",
      campagne: p.campagne ?? "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const payload = {
      id_par: form.id_par,
      localite: form.localite,
      superficie_ha: form.superficie_ha ? parseFloat(form.superficie_ha) : null,
      latitude: form.latitude ? parseFloat(form.latitude) : null,
      longitude: form.longitude ? parseFloat(form.longitude) : null,
      variete: form.variete || null,
      campagne: form.campagne || null,
      producteur_id: user.id,
    };

    let error;
    if (editTarget) {
      ({ error } = await supabase.from("parcelles").update(payload).eq("id", editTarget.id));
    } else {
      ({ error } = await supabase.from("parcelles").insert(payload));
    }
    setSubmitting(false);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: editTarget ? "Parcelle modifiée" : "Parcelle ajoutée", description: "Opération réussie." });
      setDialogOpen(false);
      fetchParcelles();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette parcelle ?")) return;
    const { error } = await supabase.from("parcelles").delete().eq("id", id);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Parcelle supprimée" });
      fetchParcelles();
    }
  };

  const filtered = parcelles.filter(
    (p) =>
      p.id_par.toLowerCase().includes(search.toLowerCase()) ||
      p.localite.toLowerCase().includes(search.toLowerCase()) ||
      (p.variete ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <MapPin className="w-7 h-7 text-primary" /> Parcelles
          </h1>
          <p className="text-muted-foreground mt-1">Gérez vos parcelles agricoles</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAdd} className="gap-2">
              <Plus className="w-4 h-4" /> Nouvelle parcelle
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editTarget ? "Modifier la parcelle" : "Ajouter une parcelle"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="id_par">ID Parcelle *</Label>
                  <Input id="id_par" value={form.id_par} onChange={(e) => setForm({ ...form, id_par: e.target.value })} required placeholder="PAR-001" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="localite">Localité *</Label>
                  <Input id="localite" value={form.localite} onChange={(e) => setForm({ ...form, localite: e.target.value })} required placeholder="Danané" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="superficie_ha">Superficie (ha)</Label>
                  <Input id="superficie_ha" type="number" step="0.01" value={form.superficie_ha} onChange={(e) => setForm({ ...form, superficie_ha: e.target.value })} placeholder="1.50" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="variete">Variété</Label>
                  <Input id="variete" value={form.variete} onChange={(e) => setForm({ ...form, variete: e.target.value })} placeholder="WITA-9" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input id="latitude" type="number" step="any" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} placeholder="7.2620" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input id="longitude" type="number" step="any" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} placeholder="-8.1573" />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label htmlFor="campagne">Campagne</Label>
                  <Input id="campagne" value={form.campagne} onChange={(e) => setForm({ ...form, campagne: e.target.value })} placeholder="2025-2026" />
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editTarget ? "Modifier" : "Ajouter"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total parcelles", value: parcelles.length },
          { label: "Surface totale (ha)", value: parcelles.reduce((s, p) => s + (p.superficie_ha ?? 0), 0).toFixed(2) },
          { label: "Localités", value: [...new Set(parcelles.map((p) => p.localite))].length },
          { label: "Variétés", value: [...new Set(parcelles.map((p) => p.variete).filter(Boolean))].length },
        ].map((stat) => (
          <Card key={stat.label} className="p-4 text-center shadow-sm">
            <div className="text-2xl font-bold text-primary">{stat.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card className="shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
            <MapPin className="w-10 h-10 opacity-30" />
            <p>Aucune parcelle trouvée</p>
            <Button variant="outline" onClick={openAdd}><Plus className="w-4 h-4 mr-2" />Ajouter une parcelle</Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  {["ID Parcelle", "Localité", "Superficie (ha)", "Variété", "Campagne", "Coordonnées", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-primary">{p.id_par}</td>
                    <td className="px-4 py-3">{p.localite}</td>
                    <td className="px-4 py-3">{p.superficie_ha ?? "—"}</td>
                    <td className="px-4 py-3">{p.variete ?? "—"}</td>
                    <td className="px-4 py-3">{p.campagne ?? "—"}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {p.latitude && p.longitude ? `${p.latitude}, ${p.longitude}` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(p)}><Edit2 className="w-3.5 h-3.5" /></Button>
                        {isAdmin && <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(p.id)}><Trash2 className="w-3.5 h-3.5" /></Button>}
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
