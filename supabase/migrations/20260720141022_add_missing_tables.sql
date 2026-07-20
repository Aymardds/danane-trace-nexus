-- Collectes table
CREATE TABLE public.collectes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_paddy_id UUID NOT NULL REFERENCES public.lots_paddy(id) ON DELETE CASCADE,
  collecteur_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  poids_accepte NUMERIC(10,2) NOT NULL,
  date_collecte DATE NOT NULL,
  qualite_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.collectes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Collecteurs can manage own collectes" ON public.collectes
  FOR ALL TO authenticated
  USING (collecteur_id = auth.uid());

CREATE POLICY "Admins can view all collectes" ON public.collectes
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Transformations table
CREATE TABLE public.transformations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_paddy_id UUID NOT NULL REFERENCES public.lots_paddy(id) ON DELETE CASCADE,
  transformateur_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  poids_obtenu_kg NUMERIC(10,2) NOT NULL,
  date_transformation DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.transformations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Transformateurs can manage own transformations" ON public.transformations
  FOR ALL TO authenticated
  USING (transformateur_id = auth.uid());

CREATE POLICY "Admins can view all transformations" ON public.transformations
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Conditionnements table
CREATE TABLE public.conditionnements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transformation_id UUID NOT NULL REFERENCES public.transformations(id) ON DELETE CASCADE,
  conditionneur_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type_emballage TEXT NOT NULL,
  quantite_sacs INTEGER NOT NULL,
  date_conditionnement DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.conditionnements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Conditionneurs can manage own conditionnements" ON public.conditionnements
  FOR ALL TO authenticated
  USING (conditionneur_id = auth.uid());

CREATE POLICY "Admins can view all conditionnements" ON public.conditionnements
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- QR Codes table
CREATE TABLE public.qr_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conditionnement_id UUID NOT NULL REFERENCES public.conditionnements(id) ON DELETE CASCADE,
  code_unique TEXT NOT NULL UNIQUE,
  url_tracabilite TEXT,
  statut TEXT NOT NULL DEFAULT 'généré',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all qr codes" ON public.qr_codes
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Conditionneurs can view own qr codes" ON public.qr_codes
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conditionnements c
      WHERE c.id = conditionnement_id AND c.conditionneur_id = auth.uid()
    )
  );

-- Audits table
CREATE TABLE public.audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type_audit TEXT NOT NULL,
  date_audit DATE NOT NULL,
  resultat TEXT NOT NULL,
  auditeur TEXT NOT NULL,
  observations TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.audits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage audits" ON public.audits
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Everyone can view audits" ON public.audits
  FOR SELECT TO authenticated
  USING (true);
