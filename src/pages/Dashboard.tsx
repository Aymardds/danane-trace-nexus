import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import DashboardHome from "@/components/dashboard/DashboardHome";
import AwaitingApproval from "@/components/dashboard/AwaitingApproval";
import { useEffect } from "react";

export default function Dashboard() {
  const { user, profile, roles, loading, isApproved, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [loading, user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  if (!user) return null;

  // Show awaiting approval screen if user is not approved and has no admin role
  if (!isApproved && !roles.includes("admin")) {
    return (
      <AwaitingApproval
        fullName={profile?.full_name || user.email || "Utilisateur"}
        requestedRole={profile?.requested_role ?? null}
        onSignOut={signOut}
      />
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar
          email={user.email}
          roles={roles}
          requestedRole={profile?.requested_role}
          onSignOut={signOut}
        />
        <main className="flex-1 p-6 md:p-8 bg-background overflow-auto">
          <DashboardHome user={user} profile={profile} roles={roles} />
        </main>
      </div>
    </SidebarProvider>
  );
}
