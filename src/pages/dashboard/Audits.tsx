import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ClipboardCheck, Plus, Edit2, Trash2, Loader2, Search, CheckCircle, AlertTriangle, XCircle } from "lucide-react";

interface Audit {
  id: string;
  type_audit: string;
  date_audit: string;
  resultat: string;
  auditeur: string;
  observations: string | null;
  created_at: string;
}

const emptyForm = {
  type_audit: "interne",
  date_audit: "",
  resultat: "conforme",
  auditeur: "",
  observations: "",
};

const resultatConfig: Record<string, { color: string; icon: React.ComponentType<{ className?: string }> }> = {
  conforme: { color: "bg-green-500/15 text-green-600", icon: CheckCircle },
  "non-conforme": { color: "bg-red-500/15 text-red-600", icon: XCircle },
  "à corriger": { color: "bg-amber-500/15 text-amber-600", icon: AlertTriangle },
};

export default function Audits() {
  const { toast } = useToast();
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Audit | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");

  const fetchAudits = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("audits").select("*").order("date_audit", { ascending: false });
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else setAudits(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchAudits(); }, []);

  const openAdd = () => { setEditTarget(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (a: Audit) => {
    setEditTarget(a);
    setForm({
      type_audit: a.type_audit,
      date_audit: a.date_audit,
      resultat: a.resultat,
      auditeur: a.auditeur,
      observations: a.observations ?? "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const payload = {
      type_audit: form.type_audit,
      date_audit: form.date_audit,
      resultat: form.resultat,
      auditeur: form.auditeur,
      observations: form.observations || null,
    };
    let error;
    if (editTarget) {
      ({ error } = await supabase.from("audits").update(payload).eq("id", editTarget.id));
    } else {
      ({ error } = await supabase.from("audits").insert(payload));
    }
    setSubmitting(false);
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else {
      toast({ title: editTarget ? "Audit modifié" : "Audit enregistré" });
      setDialogOpen(false);
      fetchAudits();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cet audit ?")) return;
    const { error } = await supabase.from("audits").delete().eq("id", id);
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else { toast({ title: "Audit supprimé" }); fetchAudits(); }
  };

  const filtered = audits.filter((a) =>
    a.auditeur.toLowerCase().includes(search.toLowerCase()) ||
    a.type_audit.toLowerCase().includes(search.toLowerCase()) ||
    a.resultat.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ClipboardCheck className="w-7 h-7 text-primary" /> Audits
          </h1>
          <p className="text-muted-foreground mt-1">Suivi des audits de conformité et certification</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAdd} className="gap-2"><Plus className="w-4 h-4" /> Nouvel audit</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle>{editTarget ? "Modifier l'audit" : "Enregistrer un audit"}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Type d'audit *</Label>
                  <Select value={form.type_audit} onValueChange={(v) => setForm({ ...form, type_audit: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["interne", "externe", "certification", "surveillance"].map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Date audit *</Label>
                  <Input type="date" value={form.date_audit} onChange={(e) => setForm({ ...form, date_audit: e.target.value })} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Résultat *</Label>
                  <Select value={form.resultat} onValueChange={(v) => setForm({ ...form, resultat: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["conforme", "non-conforme", "à corriger"].map((r) => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Auditeur *</Label>
                  <Input value={form.auditeur} onChange={(e) => setForm({ ...form, auditeur: e.target.value })} required placeholder="Nom de l'auditeur" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Observations</Label>
                <Textarea value={form.observations} onChange={(e) => setForm({ ...form, observations: e.target.value })} placeholder="Notes et observations..." rows={3} />
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
          { label: "Total audits", value: audits.length },
          { label: "Conformes", value: audits.filter((a) => a.resultat === "conforme").length },
          { label: "Non-conformes", value: audits.filter((a) => a.resultat === "non-conforme").length },
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
            <ClipboardCheck className="w-10 h-10 opacity-30" />
            <p>Aucun audit enregistré</p>
            <Button variant="outline" onClick={openAdd}><Plus className="w-4 h-4 mr-2" />Créer un audit</Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  {["Type", "Auditeur", "Date", "Résultat", "Observations", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((a) => {
                  const cfg = resultatConfig[a.resultat];
                  const Icon = cfg?.icon ?? CheckCircle;
                  return (
                    <tr key={a.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 capitalize font-medium">{a.type_audit}</td>
                      <td className="px-4 py-3">{a.auditeur}</td>
                      <td className="px-4 py-3">{new Date(a.date_audit).toLocaleDateString("fr-FR")}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${cfg?.color ?? ""}`}>
                          <Icon className="w-3 h-3" />{a.resultat}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs max-w-xs truncate">{a.observations ?? "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(a)}><Edit2 className="w-3.5 h-3.5" /></Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(a.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
