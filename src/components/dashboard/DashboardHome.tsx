import { Card } from "@/components/ui/card";
import { Wheat, MapPin, Package, AlertTriangle } from "lucide-react";
import type { User } from "@supabase/supabase-js";

const stats = [
  { label: "Parcelles enregistrées", value: "0", icon: MapPin, color: "text-primary" },
  { label: "Lots paddy", value: "0", icon: Wheat, color: "text-gold" },
  { label: "Sacs conditionnés", value: "0", icon: Package, color: "text-emerald-light" },
  { label: "Non-conformités", value: "0", icon: AlertTriangle, color: "text-destructive" },
];

export default function DashboardHome({ user }: { user: User | null }) {
  const fullName = user?.user_metadata?.full_name || user?.email || "Utilisateur";

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground font-serif">
          Bienvenue, {fullName}
        </h1>
        <p className="text-muted-foreground mt-1">
          Votre espace de traçabilité IGP Riz Danané
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        {stats.map((stat) => (
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
          Utilisez le menu de navigation pour enregistrer vos parcelles, déclarer vos récoltes et suivre vos lots à travers la chaîne de traçabilité.
        </p>
      </Card>
    </div>
  );
}
