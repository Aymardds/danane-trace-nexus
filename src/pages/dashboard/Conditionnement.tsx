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
import { Package, Plus, Edit2, Trash2, Loader2, Search, ScanLine, QrCode } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { QRScanner } from "@/components/qr/QRScanner";
import { QRGenerator } from "@/components/qr/QRGenerator";

interface Conditionnement {
  id: string;
  transformation_id: string;
  conditionneur_id: string;
  type_emballage: string;
  quantite_sacs: number;
  date_conditionnement: string;
  created_at: string;
}

interface TransformationItem { id: string; lot_paddy_id: string; poids_obtenu_kg: number; }
interface OutletContext { user: User; profile: { full_name: string } | null; roles: string[]; }

const emptyForm = {
  transformation_id: "", type_emballage: "50kg", quantite_sacs: "", date_conditionnement: "",
};

export default function Conditionnement() {
  const { user, roles } = useOutletContext<OutletContext>();
  const { toast } = useToast();
  const [conditionnements, setConditionnements] = useState<Conditionnement[]>([]);
  const [transformations, setTransformations] = useState<TransformationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Conditionnement | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [qrTarget, setQrTarget] = useState<Conditionnement | null>(null);
  const isAdmin = roles.includes("admin");

  const fetchData = async () => {
    setLoading(true);
    const [{ data: cData }, { data: tData }] = await Promise.all([
      supabase.from("conditionnements").select("*").order("created_at", { ascending: false }),
      supabase.from("transformations").select("id, lot_paddy_id, poids_obtenu_kg"),
    ]);
    setConditionnements(cData ?? []);
    setTransformations(tData ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openAdd = () => { setEditTarget(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (c: Conditionnement) => {
    setEditTarget(c);
    setForm({
      transformation_id: c.transformation_id,
      type_emballage: c.type_emballage,
      quantite_sacs: c.quantite_sacs.toString(),
      date_conditionnement: c.date_conditionnement,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const payload = {
      transformation_id: form.transformation_id,
      conditionneur_id: user.id,
      type_emballage: form.type_emballage,
      quantite_sacs: parseInt(form.quantite_sacs, 10),
      date_conditionnement: form.date_conditionnement,
    };
    let error;
    if (editTarget) {
      ({ error } = await supabase.from("conditionnements").update(payload).eq("id", editTarget.id));
    } else {
      ({ error } = await supabase.from("conditionnements").insert(payload));
    }
    setSubmitting(false);
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else {
      toast({ title: editTarget ? "Conditionnement modifié" : "Conditionnement enregistré" });
      setDialogOpen(false);
      fetchData();
    }
  };

  const handleScanSuccess = (decodedText: string) => {
    setIsScanning(false);
    
    let foundTransfo = transformations.find(t => t.id === decodedText);
    if (!foundTransfo) {
      foundTransfo = transformations.find(t => t.lot_paddy_id === decodedText);
    }
    
    if (foundTransfo) {
      setEditTarget(null);
      setForm({ ...emptyForm, transformation_id: foundTransfo.id });
      setDialogOpen(true);
      toast({ title: "Transformation identifiée", description: `Pour le lot associé` });
    } else {
      toast({ title: "Code non reconnu", description: "Ce QR code ne correspond à aucune transformation connue.", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce conditionnement ?")) return;
    const { error } = await supabase.from("conditionnements").delete().eq("id", id);
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else { toast({ title: "Supprimé" }); fetchData(); }
  };

  const totalSacs = conditionnements.reduce((s, c) => s + c.quantite_sacs, 0);
  const filtered = conditionnements.filter((c) =>
    c.type_emballage.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Package className="w-7 h-7 text-primary" /> Conditionnement
          </h1>
          <p className="text-muted-foreground mt-1">Gestion de l'emballage et des sacs de riz</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsScanning(true)} className="gap-2">
            <ScanLine className="w-4 h-4" /> Scanner Transformation
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openAdd} className="gap-2"><Plus className="w-4 h-4" /> Nouveau conditionnement</Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>{editTarget ? "Modifier" : "Enregistrer un conditionnement"}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label>Transformation *</Label>
                <Select value={form.transformation_id} onValueChange={(v) => setForm({ ...form, transformation_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner une transformation..." /></SelectTrigger>
                  <SelectContent>
                    {transformations.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.poids_obtenu_kg} kg obtenu
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Type d'emballage *</Label>
                  <Select value={form.type_emballage} onValueChange={(v) => setForm({ ...form, type_emballage: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["1kg", "5kg", "10kg", "25kg", "50kg"].map((e) => (<SelectItem key={e} value={e}>{e}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Quantité de sacs *</Label>
                  <Input type="number" value={form.quantite_sacs} onChange={(e) => setForm({ ...form, quantite_sacs: e.target.value })} required placeholder="100" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Date conditionnement *</Label>
                <Input type="date" value={form.date_conditionnement} onChange={(e) => setForm({ ...form, date_conditionnement: e.target.value })} required />
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
            <DialogTitle>QR Code Conditionnement</DialogTitle>
          </DialogHeader>
          {qrTarget && (
            <QRGenerator 
              value={qrTarget.id} 
              title={`Conditionnement`} 
              subtitle={`${qrTarget.quantite_sacs} sacs de ${qrTarget.type_emballage}`} 
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
          { label: "Opérations", value: conditionnements.length },
          { label: "Total sacs", value: totalSacs },
          { label: "Types d'emballage", value: [...new Set(conditionnements.map((c) => c.type_emballage))].length },
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
            <Package className="w-10 h-10 opacity-30" />
            <p>Aucun conditionnement enregistré</p>
            <Button variant="outline" onClick={openAdd}><Plus className="w-4 h-4 mr-2" />Enregistrer</Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  {["Emballage", "Quantité (sacs)", "Date conditionnement", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{c.type_emballage}</td>
                    <td className="px-4 py-3">{c.quantite_sacs}</td>
                    <td className="px-4 py-3">{new Date(c.date_conditionnement).toLocaleDateString("fr-FR")}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => setQrTarget(c)} title="Afficher QR Code">
                          <QrCode className="w-3.5 h-3.5" />
                        </Button>
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
