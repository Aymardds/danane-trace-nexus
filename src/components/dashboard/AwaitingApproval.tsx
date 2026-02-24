import { Leaf, Clock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface AwaitingApprovalProps {
  fullName: string;
  requestedRole: string | null;
  onSignOut: () => void;
}

export default function AwaitingApproval({ fullName, requestedRole, onSignOut }: AwaitingApprovalProps) {
  const roleLabels: Record<string, string> = {
    producteur: "Producteur",
    cooperative: "Coopérative",
    collecteur: "Collecteur",
    transformateur: "Transformateur",
    conditionneur: "Conditionneur",
    distributeur: "Distributeur",
    admin: "Administrateur",
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="max-w-lg w-full p-10 shadow-elevated text-center">
        <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-6">
          <Clock className="w-8 h-8 text-gold" />
        </div>

        <h1 className="text-2xl font-bold text-foreground font-serif mb-2">
          En attente de validation
        </h1>

        <p className="text-muted-foreground mb-6 leading-relaxed">
          Bonjour <span className="font-semibold text-foreground">{fullName}</span>, votre demande d'accès en tant que{" "}
          <span className="font-semibold text-primary">
            {requestedRole ? roleLabels[requestedRole] ?? requestedRole : "membre"}
          </span>{" "}
          est en cours de validation par l'administration GR-IGP.
        </p>

        <div className="bg-secondary rounded-lg p-4 mb-6 text-left space-y-3">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <p className="text-sm text-muted-foreground">
              Un administrateur vérifiera votre identité et votre rôle dans la filière avant d'activer votre compte.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <Leaf className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <p className="text-sm text-muted-foreground">
              Vous recevrez une notification par e-mail une fois votre accès approuvé.
            </p>
          </div>
        </div>

        <Button variant="outline" onClick={onSignOut} className="w-full">
          Se déconnecter
        </Button>
      </Card>
    </div>
  );
}
