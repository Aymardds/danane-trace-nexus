import { useNavigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
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
        <main className="flex-1 p-4 md:p-8 bg-background overflow-auto relative w-full max-w-full">
          <div className="md:hidden mb-4 sticky top-0 bg-background/80 backdrop-blur-sm z-10 py-2 border-b">
            <SidebarTrigger />
          </div>
          <div className="max-w-full overflow-hidden">
            <Outlet context={{ user, profile, roles }} />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
