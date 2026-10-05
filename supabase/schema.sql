-- ==========================================
-- PACOTIZAR - Base de datos para Supabase
-- ==========================================
-- Base esperada: pacotizar
-- Objetivo:
-- - Usar tablas principales en español.
-- - Mantener vistas compatibilidad en inglés para que la app actual siga funcionando.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================================================
-- 1) Perfiles de usuarios
-- =========================================================
CREATE TABLE IF NOT EXISTS public.perfiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre text,
  telefono text,
  ciudad text,
  rol text NOT NULL DEFAULT 'owner' CHECK (rol IN ('owner', 'admin', 'administrator', 'advisor')),
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "usuarios pueden ver su perfil" ON public.perfiles;
CREATE POLICY "usuarios pueden ver su perfil"
  ON public.perfiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "usuarios pueden crear su perfil" ON public.perfiles;
CREATE POLICY "usuarios pueden crear su perfil"
  ON public.perfiles FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "usuarios pueden actualizar su perfil" ON public.perfiles;
CREATE POLICY "usuarios pueden actualizar su perfil"
  ON public.perfiles FOR UPDATE
  USING (auth.uid() = id);

-- =========================================================
-- 2) Administradores de plataforma
-- =========================================================
CREATE TABLE IF NOT EXISTS public.administradores_plataforma (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.administradores_plataforma ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.es_administrador_plataforma()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.administradores_plataforma ap
    WHERE ap.profile_id = (SELECT auth.uid())
      AND ap.activo = true
  );
$$;

REVOKE ALL ON FUNCTION public.es_administrador_plataforma() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.es_administrador_plataforma() TO anon, authenticated;

DROP POLICY IF EXISTS "admins pueden ver administradores" ON public.administradores_plataforma;
CREATE POLICY "admins pueden ver administradores"
  ON public.administradores_plataforma FOR SELECT
  USING (profile_id = (SELECT auth.uid()) OR public.es_administrador_plataforma());

DROP POLICY IF EXISTS "admins pueden insertar administradores" ON public.administradores_plataforma;
CREATE POLICY "admins pueden insertar administradores"
  ON public.administradores_plataforma FOR INSERT
  WITH CHECK (public.es_administrador_plataforma());

-- =========================================================
-- 3) Talleres / negocios / proveedores
-- =========================================================
CREATE TABLE IF NOT EXISTS public.talleres (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  propietario_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  nombre text NOT NULL,
  ciudad text,
  descripcion text,
  telefono text,
  email text,
  logo_url text,
  sitio_web text,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.talleres ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "todos pueden ver talleres activos" ON public.talleres;
CREATE POLICY "todos pueden ver talleres activos"
  ON public.talleres FOR SELECT
  USING (
    activo = true OR
    propietario_id = auth.uid() OR
    public.es_administrador_plataforma()
  );

DROP POLICY IF EXISTS "dueños pueden crear talleres" ON public.talleres;
CREATE POLICY "dueños pueden crear talleres"
  ON public.talleres FOR INSERT
  WITH CHECK (propietario_id = auth.uid());

DROP POLICY IF EXISTS "dueños pueden actualizar sus talleres" ON public.talleres;
CREATE POLICY "dueños pueden actualizar sus talleres"
  ON public.talleres FOR UPDATE
  USING (propietario_id = auth.uid());

DROP POLICY IF EXISTS "admins pueden gestionar talleres" ON public.talleres;
CREATE POLICY "admins pueden gestionar talleres"
  ON public.talleres FOR UPDATE
  USING (public.es_administrador_plataforma());

-- =========================================================
-- 4) Solicitudes / cotizaciones del marketplace
-- =========================================================
CREATE TABLE IF NOT EXISTS public.solicitudes_cotizacion (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitante_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  titulo text NOT NULL,
  descripcion text NOT NULL,
  ciudad text,
  presupuesto numeric(12,2),
  categoria text,
  etiquetas text[] NOT NULL DEFAULT '{}',
  imagenes text[] NOT NULL DEFAULT '{}',
  estado text NOT NULL DEFAULT 'open' CHECK (estado IN ('open', 'closed', 'draft')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.solicitudes_cotizacion ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "todos pueden ver solicitudes abiertas" ON public.solicitudes_cotizacion;
CREATE POLICY "todos pueden ver solicitudes abiertas"
  ON public.solicitudes_cotizacion FOR SELECT
  USING (
    estado = 'open' OR
    solicitante_id = auth.uid() OR
    public.es_administrador_plataforma()
  );

DROP POLICY IF EXISTS "usuarios autenticados pueden crear solicitudes" ON public.solicitudes_cotizacion;
CREATE POLICY "usuarios autenticados pueden crear solicitudes"
  ON public.solicitudes_cotizacion FOR INSERT
  WITH CHECK (auth.uid() = solicitante_id);

DROP POLICY IF EXISTS "usuarios pueden actualizar sus solicitudes" ON public.solicitudes_cotizacion;
CREATE POLICY "usuarios pueden actualizar sus solicitudes"
  ON public.solicitudes_cotizacion FOR UPDATE
  USING (solicitante_id = auth.uid());

DROP POLICY IF EXISTS "admins pueden gestionar solicitudes" ON public.solicitudes_cotizacion;
CREATE POLICY "admins pueden gestionar solicitudes"
  ON public.solicitudes_cotizacion FOR UPDATE
  USING (public.es_administrador_plataforma());

-- =========================================================
-- 5) Negocios destacados en el marketplace
-- =========================================================
CREATE TABLE IF NOT EXISTS public.negocios_destacados (
  workshop_id uuid PRIMARY KEY REFERENCES public.talleres(id) ON DELETE CASCADE,
  categoria text,
  descripcion text,
  activo boolean NOT NULL DEFAULT true,
  orden integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.negocios_destacados ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "todos pueden ver destacados activos" ON public.negocios_destacados;
CREATE POLICY "todos pueden ver destacados activos"
  ON public.negocios_destacados FOR SELECT
  USING (activo = true);

DROP POLICY IF EXISTS "admins pueden gestionar destacados" ON public.negocios_destacados;
CREATE POLICY "admins pueden gestionar destacados"
  ON public.negocios_destacados FOR ALL
  USING (public.es_administrador_plataforma())
  WITH CHECK (public.es_administrador_plataforma());

-- =========================================================
-- 6) Trigger para updated_at
-- =========================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_perfiles_updated_at ON public.perfiles;
CREATE TRIGGER trg_perfiles_updated_at
BEFORE UPDATE ON public.perfiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_talleres_updated_at ON public.talleres;
CREATE TRIGGER trg_talleres_updated_at
BEFORE UPDATE ON public.talleres
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_solicitudes_updated_at ON public.solicitudes_cotizacion;
CREATE TRIGGER trg_solicitudes_updated_at
BEFORE UPDATE ON public.solicitudes_cotizacion
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_negocios_destacados_updated_at ON public.negocios_destacados;
CREATE TRIGGER trg_negocios_destacados_updated_at
BEFORE UPDATE ON public.negocios_destacados
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- 7) Índices útiles
-- =========================================================
CREATE INDEX IF NOT EXISTS idx_perfiles_rol ON public.perfiles (rol);
CREATE INDEX IF NOT EXISTS idx_talleres_ciudad ON public.talleres (ciudad);
CREATE INDEX IF NOT EXISTS idx_talleres_activo ON public.talleres (activo);
CREATE INDEX IF NOT EXISTS idx_solicitudes_estado ON public.solicitudes_cotizacion (estado);
CREATE INDEX IF NOT EXISTS idx_solicitudes_fecha ON public.solicitudes_cotizacion (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_negocios_destacados_activo_orden ON public.negocios_destacados (activo, orden);

-- =========================================================
-- 8) Vistas de compatibilidad para la app actual
--    La app actual consulta nombres en inglés, así que aquí
--    mantemos esos nombres sin romper la idea de tablas en español.
-- =========================================================
CREATE OR REPLACE VIEW public.platform_admins WITH (security_invoker = true) AS
SELECT
  profile_id,
  activo AS active,
  created_at,
  id
FROM public.administradores_plataforma;

CREATE OR REPLACE VIEW public.quote_requests WITH (security_invoker = true) AS
SELECT
  id,
  solicitante_id AS requester_id,
  titulo AS title,
  descripcion AS description,
  ciudad AS location,
  presupuesto AS budget_amount,
  categoria AS category,
  etiquetas AS tags,
  imagenes AS image_urls,
  estado AS status,
  created_at
FROM public.solicitudes_cotizacion;

CREATE OR REPLACE VIEW public.workshops WITH (security_invoker = true) AS
SELECT
  id,
  nombre AS name,
  ciudad AS city,
  logo_url,
  descripcion,
  telefono,
  email,
  sitio_web,
  activo,
  propietario_id,
  created_at,
  updated_at
FROM public.talleres;

CREATE OR REPLACE VIEW public.featured_businesses WITH (security_invoker = true) AS
SELECT
  workshop_id,
  activo AS is_active,
  orden AS sort_order,
  categoria AS category,
  descripcion AS description,
  created_at
FROM public.negocios_destacados;

-- =========================================================
-- 9) Trigger para crear perfil al registrar usuario
-- =========================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.perfiles (id, nombre)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================
-- 10) Función de negocios destacados para la app
-- =========================================================
CREATE OR REPLACE FUNCTION public.get_featured_businesses()
RETURNS TABLE (
  workshop_id uuid,
  name text,
  city text,
  category text,
  description text,
  logo_url text,
  sort_order integer
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    fb.workshop_id,
    w.nombre AS name,
    w.ciudad AS city,
    COALESCE(fb.categoria, 'Proveedor general') AS category,
    COALESCE(fb.descripcion, 'Negocio destacado en Pacotizar') AS description,
    w.logo_url,
    fb.orden AS sort_order
  FROM public.negocios_destacados fb
  JOIN public.talleres w ON w.id = fb.workshop_id
  WHERE fb.activo = true
  ORDER BY fb.orden ASC, w.nombre ASC;
$$;

-- =========================================================
-- 11) Ejemplo para crear el primer administrador
-- =========================================================
-- Ejecuta esto desde Supabase > SQL Editor después de registrarte en la app.
-- Reemplaza el correo por el mismo que usaste en Supabase Auth.
-- Primero puedes comprobar que existe con:
-- SELECT id, email FROM auth.users WHERE lower(email) = lower('tu-correo@ejemplo.com');
-- Luego ejecuta:
-- INSERT INTO public.administradores_plataforma (profile_id, activo)
-- SELECT id, true
-- FROM auth.users
-- WHERE lower(email) = lower('tu-correo@ejemplo.com')
-- ON CONFLICT (profile_id) DO UPDATE SET activo = true;

COMMIT;
