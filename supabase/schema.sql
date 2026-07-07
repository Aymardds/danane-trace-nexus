-- App role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'producteur', 'cooperative', 'collecteur', 'transformateur', 'conditionneur', 'distributeur');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT,
  phone TEXT,
  requested_role app_role DEFAULT 'producteur',
  is_approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, requested_role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'requested_role')::app_role, 'producteur')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Parcelles table
CREATE TABLE public.parcelles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  producteur_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  id_par TEXT NOT NULL UNIQUE,
  localite TEXT NOT NULL,
  superficie_ha NUMERIC(10,2),
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),
  variete TEXT,
  campagne TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.parcelles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Producteurs can manage own parcelles" ON public.parcelles
  FOR ALL TO authenticated
  USING (producteur_id = auth.uid());

CREATE POLICY "Admins can view all parcelles" ON public.parcelles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Lots paddy table
CREATE TABLE public.lots_paddy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  producteur_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parcelle_id UUID REFERENCES public.parcelles(id),
  id_prod TEXT NOT NULL UNIQUE,
  variete TEXT NOT NULL,
  poids_kg NUMERIC(10,2),
  date_recolte DATE NOT NULL,
  campagne TEXT,
  statut TEXT NOT NULL DEFAULT 'declaré',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.lots_paddy ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Producteurs can manage own lots" ON public.lots_paddy
  FOR ALL TO authenticated
  USING (producteur_id = auth.uid());

CREATE POLICY "Admins can view all lots" ON public.lots_paddy
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Logs activites
CREATE TABLE public.logs_activites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.logs_activites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view logs" ON public.logs_activites
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));


-- Create policy for user to insert own logs (from the second migration)
CREATE POLICY "Users can insert own logs" ON public.logs_activites
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

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
