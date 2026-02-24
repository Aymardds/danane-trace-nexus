import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface Profile {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  requested_role: AppRole | null;
  is_approved: boolean;
}

interface AuthState {
  user: User | null;
  profile: Profile | null;
  roles: AppRole[];
  loading: boolean;
  isApproved: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    roles: [],
    loading: true,
    isApproved: false,
  });

  const fetchUserData = useCallback(async (user: User) => {
    // Fetch profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    // Fetch roles
    const { data: userRoles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const roles = (userRoles ?? []).map((r) => r.role);

    setState({
      user,
      profile: profile as Profile | null,
      roles,
      loading: false,
      isApproved: profile?.is_approved ?? false,
    });
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          // Use setTimeout to avoid potential deadlock with Supabase client
          setTimeout(() => fetchUserData(session.user), 0);
        } else {
          setState({ user: null, profile: null, roles: [], loading: false, isApproved: false });
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserData(session.user);
      } else {
        setState((s) => ({ ...s, loading: false }));
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchUserData]);

  const hasRole = (role: AppRole) => state.roles.includes(role);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { ...state, hasRole, signOut };
}
