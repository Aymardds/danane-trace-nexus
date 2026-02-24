import { Link } from "react-router-dom";
import { Leaf } from "lucide-react";

export default function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container max-w-6xl mx-auto flex items-center justify-between h-16 px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <Leaf className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <span className="font-serif font-bold text-foreground text-lg leading-none">Riz Danané</span>
            <span className="block text-[10px] tracking-widest uppercase text-muted-foreground">Traçabilité IGP</span>
          </div>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">Accueil</Link>
          <Link to="/verify" className="hover:text-foreground transition-colors">Vérifier</Link>
          <Link to="/about" className="hover:text-foreground transition-colors">À propos</Link>
        </nav>
        <Link
          to="/login"
          className="px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Connexion
        </Link>
      </div>
    </header>
  );
}
