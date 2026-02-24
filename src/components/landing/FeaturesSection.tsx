import { Shield, Leaf, QrCode, BarChart3, Users, FileCheck } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Traçabilité Complète",
    description: "Du champ au consommateur, chaque grain est suivi avec des identifiants uniques normés.",
  },
  {
    icon: QrCode,
    title: "QR Code Dynamique",
    description: "Chaque sac génère un QR code vérifiable pour garantir l'authenticité IGP.",
  },
  {
    icon: Users,
    title: "Multi-Acteurs",
    description: "Producteurs, coopératives, collecteurs, transformateurs et conditionneurs connectés.",
  },
  {
    icon: BarChart3,
    title: "Dashboard Analytique",
    description: "Volumes, rendements, qualité et conformité en temps réel.",
  },
  {
    icon: FileCheck,
    title: "Contrôle & Audit",
    description: "Inspections automatisées, alertes d'incohérence et journal infalsifiable.",
  },
  {
    icon: Leaf,
    title: "Certification IGP",
    description: "Sécurisation de l'Indication Géographique Protégée Riz Danané.",
  },
];

export default function FeaturesSection() {
  return (
    <section className="py-24 px-6 bg-background">
      <div className="container max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm font-medium mb-4">
            Fonctionnalités
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Une plateforme complète de traçabilité
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Tous les outils nécessaires pour garantir la qualité et l'authenticité du Riz Danané IGP.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              className="group p-8 rounded-xl bg-card shadow-card hover:shadow-elevated transition-all duration-300 hover:-translate-y-1 border border-border"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center mb-5 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                <feature.icon className="w-6 h-6 text-primary group-hover:text-primary-foreground transition-colors duration-300" />
              </div>
              <h3 className="text-xl font-semibold text-card-foreground mb-2 font-sans">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
