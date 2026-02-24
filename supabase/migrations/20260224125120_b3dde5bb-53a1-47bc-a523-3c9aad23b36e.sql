
-- Fix: Replace overly permissive INSERT policy on logs_activites
DROP POLICY "System can insert logs" ON public.logs_activites;

CREATE POLICY "Users can insert own logs" ON public.logs_activites
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
