import { Leaf } from "lucide-react";

export default function Footer() {
  return (
    <footer className="py-12 px-6 bg-foreground text-primary-foreground/70">
      <div className="container max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Leaf className="w-5 h-5 text-gold" />
            <span className="font-serif font-bold text-primary-foreground">Riz Danané IGP</span>
          </div>
          <p className="text-sm">
            © {new Date().getFullYear()} GR-IGP Riz Danané — Plateforme officielle de traçabilité
          </p>
        </div>
      </div>
    </footer>
  );
}
