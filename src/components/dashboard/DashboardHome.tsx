import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Wheat, MapPin, Package, AlertTriangle, Building2, Truck } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { useOutletContext } from "react-router-dom";

type AppRole = Database["public"]["Enums"]["app_role"];

interface Profile {
  full_name: string;
  requested_role: AppRole | null;
}

interface DashboardHomeProps {
  user: User | null;
  profile: Profile | null;
  roles: AppRole[];
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

export default function DashboardHome() {
  const { user, profile, roles } = useOutletContext<DashboardHomeProps>();
  const fullName = profile?.full_name || user?.user_metadata?.full_name || user?.email || "Utilisateur";
  const effectiveRole = roles[0] ?? profile?.requested_role ?? "producteur";

  const [stats, setStats] = useState({
    parcelles: 0,
    lots: 0,
    sacs: 0,
    alertes: 0,
    producteurs: 0,
    volumesCollectes: 0,
  });

  useEffect(() => {
    async function fetchStats() {
      if (!user) return;
      
      const [
        { count: parcellesCount },
        { count: lotsCount },
        { data: sacsData },
        { count: auditsCount },
        { count: prodsCount },
        { data: collectesData }
      ] = await Promise.all([
        supabase.from("parcelles").select("*", { count: "exact", head: true }),
        supabase.from("lots_paddy").select("*", { count: "exact", head: true }),
        supabase.from("conditionnements").select("quantite_sacs"),
        supabase.from("audits").select("*", { count: "exact", head: true }).neq("resultat", "Conforme"),
        supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "producteur"),
        supabase.from("lots_paddy").select("poids_estime_kg")
      ]);

      const totalSacs = sacsData?.reduce((sum, item) => sum + (item.quantite_sacs || 0), 0) || 0;
      const totalVolume = collectesData?.reduce((sum, item) => sum + (item.poids_estime_kg || 0), 0) || 0;

      setStats({
        parcelles: parcellesCount || 0,
        lots: lotsCount || 0,
        sacs: totalSacs,
        alertes: auditsCount || 0,
        producteurs: prodsCount || 0,
        volumesCollectes: Math.round(totalVolume / 1000), // En tonnes
      });
    }

    fetchStats();
  }, [user]);

  const producteurStats = [
    { label: "Parcelles enregistrées", value: stats.parcelles.toString(), icon: MapPin, color: "text-primary" },
    { label: "Lots paddy", value: stats.lots.toString(), icon: Wheat, color: "text-gold" },
    { label: "Sacs conditionnés", value: stats.sacs.toString(), icon: Package, color: "text-emerald-light" },
    { label: "Non-conformités", value: stats.alertes.toString(), icon: AlertTriangle, color: "text-destructive" },
  ];

  const cooperativeStats = [
    { label: "Producteurs inscrits", value: stats.producteurs.toString(), icon: Building2, color: "text-primary" },
    { label: "Parcelles rattachées", value: stats.parcelles.toString(), icon: MapPin, color: "text-gold" },
    { label: "Volumes Paddy (T)", value: stats.volumesCollectes.toString(), icon: Truck, color: "text-emerald-light" },
    { label: "Alertes", value: stats.alertes.toString(), icon: AlertTriangle, color: "text-destructive" },
  ];

  const currentStats = effectiveRole === "cooperative" ? cooperativeStats : producteurStats;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground font-serif">
            Bienvenue, {fullName}
          </h1>
          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-secondary text-secondary-foreground">
            {roleLabels[effectiveRole] ?? effectiveRole}
          </span>
        </div>
        <p className="text-muted-foreground mt-1">
          Votre espace de traçabilité IGP Riz Danané
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        {currentStats.map((stat) => (
          <Card key={stat.label} className="p-6 shadow-card hover:shadow-elevated transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <stat.icon className={`w-8 h-8 ${stat.color}`} />
            </div>
            <div className="text-3xl font-bold text-card-foreground mb-1">{stat.value}</div>
            <div className="text-sm text-muted-foreground">{stat.label}</div>
          </Card>
        ))}
      </div>

      <Card className="p-8 shadow-card text-center">
        <Wheat className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-card-foreground mb-2 font-sans">
          Commencez par enregistrer vos données
        </h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          {effectiveRole === "cooperative"
            ? "Validez les producteurs de votre zone, suivez les volumes et approuvez les bordereaux de collecte."
            : "Enregistrez vos parcelles, déclarez vos récoltes et suivez vos lots à travers la chaîne de traçabilité."}
        </p>
      </Card>
    </div>
  );
}
