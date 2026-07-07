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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Wheat, Plus, Edit2, Trash2, Loader2, Search, Badge } from "lucide-react";
import type { User } from "@supabase/supabase-js";

interface LotPaddy {
  id: string;
  id_prod: string;
  variete: string;
  poids_kg: number | null;
  date_recolte: string;
  campagne: string | null;
  statut: string;
  parcelle_id: string | null;
  created_at: string;
}

interface Parcelle { id: string; id_par: string; localite: string; }

interface OutletContext {
  user: User;
  profile: { full_name: string } | null;
  roles: string[];
}

const emptyForm = {
  id_prod: "",
  parcelle_id: "",
  variete: "",
  poids_kg: "",
  date_recolte: "",
  campagne: "",
  statut: "déclaré",
};

const statutColors: Record<string, string> = {
  "déclaré": "bg-blue-500/15 text-blue-600",
  "collecté": "bg-amber-500/15 text-amber-600",
  "transformé": "bg-purple-500/15 text-purple-600",
  "conditionné": "bg-green-500/15 text-green-600",
};

export default function Recoltes() {
  const { user, roles } = useOutletContext<OutletContext>();
  const { toast } = useToast();
  const [lots, setLots] = useState<LotPaddy[]>([]);
  const [parcelles, setParcelles] = useState<Parcelle[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<LotPaddy | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const isAdmin = roles.includes("admin");

  const fetchData = async () => {
    setLoading(true);
    const [{ data: lotsData }, { data: parcellesData }] = await Promise.all([
      supabase.from("lots_paddy").select("*").order("created_at", { ascending: false }),
      supabase.from("parcelles").select("id, id_par, localite"),
    ]);
    setLots(lotsData ?? []);
    setParcelles(parcellesData ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openAdd = () => {
    setEditTarget(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (l: LotPaddy) => {
    setEditTarget(l);
    setForm({
      id_prod: l.id_prod,
      parcelle_id: l.parcelle_id ?? "",
      variete: l.variete,
      poids_kg: l.poids_kg?.toString() ?? "",
      date_recolte: l.date_recolte,
      campagne: l.campagne ?? "",
      statut: l.statut,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const payload = {
      id_prod: form.id_prod,
      parcelle_id: form.parcelle_id || null,
      variete: form.variete,
      poids_kg: form.poids_kg ? parseFloat(form.poids_kg) : null,
      date_recolte: form.date_recolte,
      campagne: form.campagne || null,
      statut: form.statut,
      producteur_id: user.id,
    };

    let error;
    if (editTarget) {
      ({ error } = await supabase.from("lots_paddy").update(payload).eq("id", editTarget.id));
    } else {
      ({ error } = await supabase.from("lots_paddy").insert(payload));
    }
    setSubmitting(false);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: editTarget ? "Récolte modifiée" : "Récolte enregistrée" });
      setDialogOpen(false);
      fetchData();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce lot de paddy ?")) return;
    const { error } = await supabase.from("lots_paddy").delete().eq("id", id);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Lot supprimé" });
      fetchData();
    }
  };

  const filtered = lots.filter(
    (l) =>
      l.id_prod.toLowerCase().includes(search.toLowerCase()) ||
      l.variete.toLowerCase().includes(search.toLowerCase()) ||
      l.statut.toLowerCase().includes(search.toLowerCase())
  );

  const totalPoids = lots.reduce((s, l) => s + (l.poids_kg ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Wheat className="w-7 h-7 text-primary" /> Récoltes (Lots Paddy)
          </h1>
          <p className="text-muted-foreground mt-1">Déclarez et suivez vos lots de paddy</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAdd} className="gap-2">
              <Plus className="w-4 h-4" /> Nouvelle récolte
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editTarget ? "Modifier le lot" : "Enregistrer une récolte"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>ID Production *</Label>
                  <Input value={form.id_prod} onChange={(e) => setForm({ ...form, id_prod: e.target.value })} required placeholder="LOT-2025-001" />
                </div>
                <div className="space-y-1.5">
                  <Label>Parcelle</Label>
                  <Select value={form.parcelle_id} onValueChange={(v) => setForm({ ...form, parcelle_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                    <SelectContent>
                      {parcelles.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.id_par} — {p.localite}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Variété *</Label>
                  <Input value={form.variete} onChange={(e) => setForm({ ...form, variete: e.target.value })} required placeholder="WITA-9" />
                </div>
                <div className="space-y-1.5">
                  <Label>Poids (kg)</Label>
                  <Input type="number" step="0.01" value={form.poids_kg} onChange={(e) => setForm({ ...form, poids_kg: e.target.value })} placeholder="500" />
                </div>
                <div className="space-y-1.5">
                  <Label>Date de récolte *</Label>
                  <Input type="date" value={form.date_recolte} onChange={(e) => setForm({ ...form, date_recolte: e.target.value })} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Campagne</Label>
                  <Input value={form.campagne} onChange={(e) => setForm({ ...form, campagne: e.target.value })} placeholder="2025-2026" />
                </div>
                {isAdmin && (
                  <div className="space-y-1.5 col-span-2">
                    <Label>Statut</Label>
                    <Select value={form.statut} onValueChange={(v) => setForm({ ...form, statut: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["déclaré", "collecté", "transformé", "conditionné"].map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editTarget ? "Modifier" : "Enregistrer"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total lots", value: lots.length },
          { label: "Poids total (kg)", value: totalPoids.toFixed(0) },
          { label: "Déclarés", value: lots.filter((l) => l.statut === "déclaré").length },
          { label: "Collectés", value: lots.filter((l) => l.statut === "collecté").length },
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
            <Wheat className="w-10 h-10 opacity-30" />
            <p>Aucune récolte enregistrée</p>
            <Button variant="outline" onClick={openAdd}><Plus className="w-4 h-4 mr-2" />Enregistrer une récolte</Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  {["ID Prod.", "Variété", "Poids (kg)", "Date récolte", "Campagne", "Statut", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((l) => (
                  <tr key={l.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-primary">{l.id_prod}</td>
                    <td className="px-4 py-3">{l.variete}</td>
                    <td className="px-4 py-3">{l.poids_kg ?? "—"}</td>
                    <td className="px-4 py-3">{new Date(l.date_recolte).toLocaleDateString("fr-FR")}</td>
                    <td className="px-4 py-3">{l.campagne ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${statutColors[l.statut] ?? "bg-muted text-muted-foreground"}`}>
                        {l.statut}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(l)}><Edit2 className="w-3.5 h-3.5" /></Button>
                        {isAdmin && <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(l.id)}><Trash2 className="w-3.5 h-3.5" /></Button>}
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
