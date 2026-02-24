import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldCheck } from "lucide-react";
import heroImage from "@/assets/hero-rice.jpg";

export default function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Rizières de Danané, Côte d'Ivoire"
          className="w-full h-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-dark/95 via-primary/80 to-primary/40" />
      </div>

      <div className="relative z-10 container max-w-6xl mx-auto px-6 py-20">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-6 animate-fade-in-up">
            <ShieldCheck className="w-5 h-5 text-gold" />
            <span className="text-gold font-medium text-sm tracking-wider uppercase">
              Indication Géographique Protégée
            </span>
          </div>

          <h1
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground leading-tight mb-6 animate-fade-in-up"
            style={{ animationDelay: "0.1s" }}
          >
            Traçabilité du{" "}
            <span className="text-gold">Riz Danané</span>
          </h1>

          <p
            className="text-lg md:text-xl text-primary-foreground/80 mb-10 leading-relaxed animate-fade-in-up max-w-xl"
            style={{ animationDelay: "0.2s" }}
          >
            Plateforme officielle de suivi de la filière rizicole IGP — du producteur au consommateur. 
            Sécurisez la qualité, luttez contre la fraude.
          </p>

          <div
            className="flex flex-wrap gap-4 animate-fade-in-up"
            style={{ animationDelay: "0.3s" }}
          >
            <Button variant="gold" size="lg" asChild>
              <Link to="/login">
                Accéder à la plateforme
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground" asChild>
              <Link to="/verify">
                Vérifier un produit
              </Link>
            </Button>
          </div>

          <div
            className="mt-14 flex gap-10 animate-fade-in-up"
            style={{ animationDelay: "0.4s" }}
          >
            {[
              { value: "500+", label: "Producteurs" },
              { value: "1 200", label: "Parcelles" },
              { value: "100%", label: "Traçable" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl font-bold text-gold">{stat.value}</div>
                <div className="text-sm text-primary-foreground/60">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
