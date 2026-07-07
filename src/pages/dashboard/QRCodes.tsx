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
import { QrCode, Plus, Download, Search, Loader2, CheckCircle, Clock, Printer } from "lucide-react";
import type { User } from "@supabase/supabase-js";

interface QRCode {
  id: string;
  conditionnement_id: string;
  code_unique: string;
  url_tracabilite: string | null;
  statut: string;
  created_at: string;
}

interface ConditionnementItem { id: string; type_emballage: string; quantite_sacs: number; }
interface OutletContext { user: User; profile: { full_name: string } | null; roles: string[]; }

const statutColors: Record<string, string> = {
  "généré": "bg-blue-500/15 text-blue-600",
  "imprimé": "bg-amber-500/15 text-amber-600",
  "scanné": "bg-green-500/15 text-green-600",
};

export default function QRCodes() {
  const { roles } = useOutletContext<OutletContext>();
  const { toast } = useToast();
  const [qrCodes, setQrCodes] = useState<QRCode[]>([]);
  const [conditionnements, setConditionnements] = useState<ConditionnementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ conditionnement_id: "", quantite: "1" });
  const [search, setSearch] = useState("");

  const fetchData = async () => {
    setLoading(true);
    const [{ data: qrData }, { data: cData }] = await Promise.all([
      supabase.from("qr_codes").select("*").order("created_at", { ascending: false }),
      supabase.from("conditionnements").select("id, type_emballage, quantite_sacs"),
    ]);
    setQrCodes(qrData ?? []);
    setConditionnements(cData ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const generateQRCodes = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const qty = parseInt(form.quantite, 10);
    const inserts = Array.from({ length: qty }, (_, i) => ({
      conditionnement_id: form.conditionnement_id,
      code_unique: `QR-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}-${i + 1}`,
      url_tracabilite: `https://danane-trace.vercel.app/trace/${Date.now()}-${i}`,
      statut: "généré",
    }));

    const { error } = await supabase.from("qr_codes").insert(inserts);
    setSubmitting(false);
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else {
      toast({ title: `${qty} QR Code(s) généré(s) avec succès` });
      setDialogOpen(false);
      fetchData();
    }
  };

  const updateStatut = async (id: string, statut: string) => {
    const { error } = await supabase.from("qr_codes").update({ statut }).eq("id", id);
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else { toast({ title: "Statut mis à jour" }); fetchData(); }
  };

  const filtered = qrCodes.filter((q) =>
    q.code_unique.toLowerCase().includes(search.toLowerCase()) ||
    q.statut.toLowerCase().includes(search.toLowerCase())
  );

  const getCondLabel = (id: string) => {
    const c = conditionnements.find((c) => c.id === id);
    return c ? `${c.quantite_sacs} sacs (${c.type_emballage})` : id.slice(0, 8) + "...";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <QrCode className="w-7 h-7 text-primary" /> QR Codes
          </h1>
          <p className="text-muted-foreground mt-1">Génération et suivi des codes de traçabilité</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" /> Générer des QR Codes</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Générer des QR Codes</DialogTitle></DialogHeader>
            <form onSubmit={generateQRCodes} className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label>Conditionnement *</Label>
                <Select value={form.conditionnement_id} onValueChange={(v) => setForm({ ...form, conditionnement_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner un conditionnement..." /></SelectTrigger>
                  <SelectContent>
                    {conditionnements.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.quantite_sacs} sacs ({c.type_emballage})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Nombre de QR Codes à générer *</Label>
                <Input type="number" min="1" max="500" value={form.quantite} onChange={(e) => setForm({ ...form, quantite: e.target.value })} required />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
                <Button type="submit" disabled={submitting || !form.conditionnement_id}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Générer
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
          { label: "Total QR Codes", value: qrCodes.length },
          { label: "Imprimés", value: qrCodes.filter((q) => q.statut === "imprimé").length },
          { label: "Scannés", value: qrCodes.filter((q) => q.statut === "scanné").length },
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
            <QrCode className="w-10 h-10 opacity-30" />
            <p>Aucun QR Code généré</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  {["Code unique", "Conditionnement", "Statut", "Date création", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((q) => (
                  <tr key={q.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs">{q.code_unique}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{getCondLabel(q.conditionnement_id)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${statutColors[q.statut] ?? "bg-muted text-muted-foreground"}`}>
                        {q.statut}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(q.created_at).toLocaleDateString("fr-FR")}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {q.statut === "généré" && (
                          <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => updateStatut(q.id, "imprimé")}>
                            <Printer className="w-3 h-3" /> Imprimer
                          </Button>
                        )}
                        {q.statut === "imprimé" && (
                          <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-green-600" onClick={() => updateStatut(q.id, "scanné")}>
                            <CheckCircle className="w-3 h-3" /> Scanné
                          </Button>
                        )}
                        {q.url_tracabilite && (
                          <a href={q.url_tracabilite} target="_blank" rel="noopener noreferrer">
                            <Button size="icon" variant="ghost" className="h-7 w-7"><Download className="w-3 h-3" /></Button>
                          </a>
                        )}
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
