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
import { Truck, Plus, Edit2, Trash2, Loader2, Search } from "lucide-react";
import type { User } from "@supabase/supabase-js";

interface Collecte {
  id: string;
  lot_paddy_id: string;
  collecteur_id: string;
  poids_accepte: number;
  date_collecte: string;
  qualite_note: string | null;
  created_at: string;
}

interface LotPaddy { id: string; id_prod: string; variete: string; }

interface OutletContext {
  user: User;
  profile: { full_name: string } | null;
  roles: string[];
}

const emptyForm = {
  lot_paddy_id: "",
  poids_accepte: "",
  date_collecte: "",
  qualite_note: "",
};

export default function Collecte() {
  const { user, roles } = useOutletContext<OutletContext>();
  const { toast } = useToast();
  const [collectes, setCollectes] = useState<Collecte[]>([]);
  const [lots, setLots] = useState<LotPaddy[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Collecte | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const isAdmin = roles.includes("admin");

  const fetchData = async () => {
    setLoading(true);
    const [{ data: collectesData }, { data: lotsData }] = await Promise.all([
      supabase.from("collectes").select("*").order("created_at", { ascending: false }),
      supabase.from("lots_paddy").select("id, id_prod, variete"),
    ]);
    setCollectes(collectesData ?? []);
    setLots(lotsData ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openAdd = () => { setEditTarget(null); setForm(emptyForm); setDialogOpen(true); };

  const openEdit = (c: Collecte) => {
    setEditTarget(c);
    setForm({
      lot_paddy_id: c.lot_paddy_id,
      poids_accepte: c.poids_accepte.toString(),
      date_collecte: c.date_collecte,
      qualite_note: c.qualite_note ?? "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const payload = {
      lot_paddy_id: form.lot_paddy_id,
      collecteur_id: user.id,
      poids_accepte: parseFloat(form.poids_accepte),
      date_collecte: form.date_collecte,
      qualite_note: form.qualite_note || null,
    };

    let error;
    if (editTarget) {
      ({ error } = await supabase.from("collectes").update(payload).eq("id", editTarget.id));
    } else {
      ({ error } = await supabase.from("collectes").insert(payload));
    }
    setSubmitting(false);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: editTarget ? "Collecte modifiée" : "Collecte enregistrée" });
      setDialogOpen(false);
      fetchData();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette collecte ?")) return;
    const { error } = await supabase.from("collectes").delete().eq("id", id);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Collecte supprimée" });
      fetchData();
    }
  };

  const getLotLabel = (id: string) => {
    const l = lots.find((l) => l.id === id);
    return l ? `${l.id_prod} (${l.variete})` : id;
  };

  const totalPoids = collectes.reduce((s, c) => s + c.poids_accepte, 0);
  const filtered = collectes.filter((c) =>
    getLotLabel(c.lot_paddy_id).toLowerCase().includes(search.toLowerCase()) ||
    (c.qualite_note ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Truck className="w-7 h-7 text-primary" /> Collecte
          </h1>
          <p className="text-muted-foreground mt-1">Enregistrez les collectes de paddy</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAdd} className="gap-2"><Plus className="w-4 h-4" /> Nouvelle collecte</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editTarget ? "Modifier la collecte" : "Enregistrer une collecte"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label>Lot de paddy *</Label>
                <Select value={form.lot_paddy_id} onValueChange={(v) => setForm({ ...form, lot_paddy_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner un lot..." /></SelectTrigger>
                  <SelectContent>
                    {lots.map((l) => (
                      <SelectItem key={l.id} value={l.id}>{l.id_prod} — {l.variete}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Poids accepté (kg) *</Label>
                  <Input type="number" step="0.01" value={form.poids_accepte} onChange={(e) => setForm({ ...form, poids_accepte: e.target.value })} required placeholder="450" />
                </div>
                <div className="space-y-1.5">
                  <Label>Date de collecte *</Label>
                  <Input type="date" value={form.date_collecte} onChange={(e) => setForm({ ...form, date_collecte: e.target.value })} required />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Note de qualité</Label>
                <Input value={form.qualite_note} onChange={(e) => setForm({ ...form, qualite_note: e.target.value })} placeholder="Bonne qualité, humidité < 14%" />
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

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: "Total collectes", value: collectes.length },
          { label: "Volume collecté (kg)", value: totalPoids.toFixed(0) },
          { label: "Volume collecté (T)", value: (totalPoids / 1000).toFixed(2) },
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
            <Truck className="w-10 h-10 opacity-30" />
            <p>Aucune collecte enregistrée</p>
            <Button variant="outline" onClick={openAdd}><Plus className="w-4 h-4 mr-2" />Enregistrer une collecte</Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  {["Lot Paddy", "Poids accepté (kg)", "Date collecte", "Note qualité", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-primary">{getLotLabel(c.lot_paddy_id)}</td>
                    <td className="px-4 py-3">{c.poids_accepte}</td>
                    <td className="px-4 py-3">{new Date(c.date_collecte).toLocaleDateString("fr-FR")}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.qualite_note ?? "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(c)}><Edit2 className="w-3.5 h-3.5" /></Button>
                        {isAdmin && <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(c.id)}><Trash2 className="w-3.5 h-3.5" /></Button>}
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
