import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Factory, Plus, Edit2, Trash2, Loader2, Search, QrCode, ScanLine } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { QRScanner } from "@/components/qr/QRScanner";
import { QRGenerator } from "@/components/qr/QRGenerator";

interface Transformation {
  id: string;
  lot_paddy_id: string;
  transformateur_id: string;
  poids_obtenu_kg: number;
  date_transformation: string;
  created_at: string;
}

interface LotPaddy { id: string; id_prod: string; variete: string; }
interface OutletContext { user: User; profile: { full_name: string } | null; roles: string[]; }

const emptyForm = { lot_paddy_id: "", poids_obtenu_kg: "", date_transformation: "" };

export default function Transformation() {
  const { user, roles } = useOutletContext<OutletContext>();
  const { toast } = useToast();
  const [transformations, setTransformations] = useState<Transformation[]>([]);
  const [lots, setLots] = useState<LotPaddy[]>([]);
  const [collectes, setCollectes] = useState<{ id: string; lot_paddy_id: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Transformation | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [qrTarget, setQrTarget] = useState<Transformation | null>(null);
  const isAdmin = roles.includes("admin");

  const fetchData = async () => {
    setLoading(true);
    const [{ data: tData }, { data: lData }, { data: cData }] = await Promise.all([
      supabase.from("transformations").select("*").order("created_at", { ascending: false }),
      supabase.from("lots_paddy").select("id, id_prod, variete"),
      supabase.from("collectes").select("id, lot_paddy_id"),
    ]);
    setTransformations(tData ?? []);
    setLots(lData ?? []);
    setCollectes(cData ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openAdd = () => { setEditTarget(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (t: Transformation) => {
    setEditTarget(t);
    setForm({ lot_paddy_id: t.lot_paddy_id, poids_obtenu_kg: t.poids_obtenu_kg.toString(), date_transformation: t.date_transformation });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const payload = {
      lot_paddy_id: form.lot_paddy_id,
      transformateur_id: user.id,
      poids_obtenu_kg: parseFloat(form.poids_obtenu_kg),
      date_transformation: form.date_transformation,
    };
    let error;
    if (editTarget) {
      ({ error } = await supabase.from("transformations").update(payload).eq("id", editTarget.id));
    } else {
      ({ error } = await supabase.from("transformations").insert(payload));
    }
    setSubmitting(false);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: editTarget ? "Transformation modifiée" : "Transformation enregistrée" });
      setDialogOpen(false);
      fetchData();
    }
  };

  const handleScanSuccess = (decodedText: string) => {
    setIsScanning(false);
    
    let foundLot = lots.find(l => l.id === decodedText);
    if (!foundLot) {
      const foundCollecte = collectes.find(c => c.id === decodedText);
      if (foundCollecte) {
        foundLot = lots.find(l => l.id === foundCollecte.lot_paddy_id);
      }
    }
    
    if (foundLot) {
      setEditTarget(null);
      setForm({ ...emptyForm, lot_paddy_id: foundLot.id });
      setDialogOpen(true);
      toast({ title: "Lot identifié", description: `Lot: ${foundLot.id_prod}` });
    } else {
      toast({ title: "Code non reconnu", description: "Ce QR code ne correspond à aucun lot paddy ou collecte connus.", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette transformation ?")) return;
    const { error } = await supabase.from("transformations").delete().eq("id", id);
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else { toast({ title: "Supprimé" }); fetchData(); }
  };

  const getLotLabel = (id: string) => {
    const l = lots.find((l) => l.id === id);
    return l ? `${l.id_prod} (${l.variete})` : id;
  };

  const totalObtenu = transformations.reduce((s, t) => s + t.poids_obtenu_kg, 0);
  const filtered = transformations.filter((t) =>
    getLotLabel(t.lot_paddy_id).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Factory className="w-7 h-7 text-primary" /> Transformation
          </h1>
          <p className="text-muted-foreground mt-1">Enregistrez la transformation du paddy en riz blanc</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsScanning(true)} className="gap-2">
            <ScanLine className="w-4 h-4" /> Scanner Lot ou Collecte
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openAdd} className="gap-2"><Plus className="w-4 h-4" /> Nouvelle transformation</Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>{editTarget ? "Modifier" : "Enregistrer une transformation"}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label>Lot de paddy *</Label>
                <Select value={form.lot_paddy_id} onValueChange={(v) => setForm({ ...form, lot_paddy_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner un lot..." /></SelectTrigger>
                  <SelectContent>
                    {lots.map((l) => (<SelectItem key={l.id} value={l.id}>{l.id_prod} — {l.variete}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Poids obtenu (kg) *</Label>
                  <Input type="number" step="0.01" value={form.poids_obtenu_kg} onChange={(e) => setForm({ ...form, poids_obtenu_kg: e.target.value })} required placeholder="380" />
                </div>
                <div className="space-y-1.5">
                  <Label>Date transformation *</Label>
                  <Input type="date" value={form.date_transformation} onChange={(e) => setForm({ ...form, date_transformation: e.target.value })} required />
                </div>
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
      </div>

      {isScanning && (
        <QRScanner 
          onScanSuccess={handleScanSuccess} 
          onClose={() => setIsScanning(false)} 
        />
      )}

      <Dialog open={!!qrTarget} onOpenChange={(open) => !open && setQrTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>QR Code de la Transformation</DialogTitle>
          </DialogHeader>
          {qrTarget && (
            <QRGenerator 
              value={qrTarget.id} 
              title={`Transformation`} 
              subtitle={`Lot: ${getLotLabel(qrTarget.lot_paddy_id)}`} 
            />
          )}
        </DialogContent>
      </Dialog>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: "Total transformations", value: transformations.length },
          { label: "Riz blanc obtenu (kg)", value: totalObtenu.toFixed(0) },
          { label: "Rendement moyen", value: "—" },
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
            <Factory className="w-10 h-10 opacity-30" />
            <p>Aucune transformation enregistrée</p>
            <Button variant="outline" onClick={openAdd}><Plus className="w-4 h-4 mr-2" />Enregistrer</Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  {["Lot paddy", "Poids obtenu (kg)", "Date transformation", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-primary">{getLotLabel(t.lot_paddy_id)}</td>
                    <td className="px-4 py-3">{t.poids_obtenu_kg}</td>
                    <td className="px-4 py-3">{new Date(t.date_transformation).toLocaleDateString("fr-FR")}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => setQrTarget(t)} title="Afficher QR Code">
                          <QrCode className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(t)}><Edit2 className="w-3.5 h-3.5" /></Button>
                        {isAdmin && <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(t.id)}><Trash2 className="w-3.5 h-3.5" /></Button>}
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
