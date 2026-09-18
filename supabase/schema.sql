-- =========================================================================
-- ESQUEMA OFICIAL REMOTO - SUPABASE (PROYECTO BANCO DE LA NACIÓN)
-- Sincronizado directamente desde la instancia remota de Supabase
-- =========================================================================

-- ENUM DE ROLES DE USUARIO
DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM ('CLIENTE', 'AGENTE', 'ADMIN_AGENCIA', 'ADMIN_GENERAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. AGENCIA
CREATE TABLE IF NOT EXISTS public.agencia (
  id_agencia SERIAL PRIMARY KEY,
  nombre_agencia character varying NOT NULL,
  direccion character varying NOT NULL,
  distrito character varying NOT NULL,
  telefono character varying,
  latitud numeric,
  longitud numeric,
  activa boolean DEFAULT true
);

-- 2. VENTANILLA
CREATE TABLE IF NOT EXISTS public.ventanilla (
  id_ventanilla SERIAL PRIMARY KEY,
  id_agencia integer NOT NULL REFERENCES public.agencia(id_agencia) ON DELETE CASCADE,
  numero_ventanilla character varying NOT NULL,
  activa boolean DEFAULT true
);

-- 3. PERFIL DE USUARIO
CREATE TABLE IF NOT EXISTS public.perfil_usuario (
  id_usuario uuid PRIMARY KEY,
  dni character varying UNIQUE,
  nombre_completo character varying NOT NULL,
  correo character varying NOT NULL UNIQUE,
  telefono character varying,
  rol user_role NOT NULL DEFAULT 'CLIENTE'::user_role,
  id_agencia integer REFERENCES public.agencia(id_agencia),
  created_at timestamp with time zone DEFAULT now(),
  contrasenia text
);

-- 4. ASIGNACIÓN DE PERSONAL A VENTANILLA
CREATE TABLE IF NOT EXISTS public.personal_ventanilla (
  id_asignacion SERIAL PRIMARY KEY,
  id_usuario uuid NOT NULL REFERENCES public.perfil_usuario(id_usuario) ON DELETE CASCADE,
  id_ventanilla integer NOT NULL REFERENCES public.ventanilla(id_ventanilla) ON DELETE CASCADE,
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  activa boolean DEFAULT true
);

-- 5. TRÁMITES
CREATE TABLE IF NOT EXISTS public.tramite (
  id_tramite SERIAL PRIMARY KEY,
  nombre_tramite character varying NOT NULL,
  descripcion text,
  duracion_minutos smallint NOT NULL CHECK (duracion_minutos > 0),
  activo boolean DEFAULT true
);

-- 6. ASOCIACIÓN AGENCIA - TRÁMITE
CREATE TABLE IF NOT EXISTS public.agencia_tramite (
  id_agencia integer NOT NULL REFERENCES public.agencia(id_agencia) ON DELETE CASCADE,
  id_tramite integer NOT NULL REFERENCES public.tramite(id_tramite) ON DELETE CASCADE,
  PRIMARY KEY (id_agencia, id_tramite)
);

-- 7. REQUISITOS DEL TRÁMITE
CREATE TABLE IF NOT EXISTS public.requisito_tramite (
  id_requisito SERIAL PRIMARY KEY,
  id_tramite integer NOT NULL REFERENCES public.tramite(id_tramite) ON DELETE CASCADE,
  descripcion_requisito text NOT NULL,
  es_obligatorio boolean DEFAULT true
);

-- 8. HORARIOS DISPONIBLES
CREATE TABLE IF NOT EXISTS public.horario_disponible (
  id_horario SERIAL PRIMARY KEY,
  id_ventanilla integer NOT NULL REFERENCES public.ventanilla(id_ventanilla) ON DELETE CASCADE,
  fecha date NOT NULL,
  hora_inicio time without time zone NOT NULL,
  hora_fin time without time zone NOT NULL,
  estado_horario character varying NOT NULL DEFAULT 'disponible' CHECK (estado_horario IN ('disponible', 'reservado'))
);

-- 9. CITAS
CREATE TABLE IF NOT EXISTS public.cita (
  id_cita uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_cita character varying NOT NULL UNIQUE,
  id_usuario uuid NOT NULL REFERENCES public.perfil_usuario(id_usuario),
  id_horario integer NOT NULL UNIQUE REFERENCES public.horario_disponible(id_horario),
  id_tramite integer NOT NULL REFERENCES public.tramite(id_tramite),
  estado_cita character varying NOT NULL DEFAULT 'pendiente' CHECK (estado_cita IN ('pendiente', 'confirmada', 'en_atencion', 'atendida', 'rechazada', 'cancelada')),
  codigo_qr text UNIQUE,
  fecha_registro timestamp with time zone DEFAULT now()
);

-- 10. ATENCIÓN DE CITAS EN VENTANILLA
CREATE TABLE IF NOT EXISTS public.atencion_cita (
  id_atencion uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_cita uuid NOT NULL UNIQUE REFERENCES public.cita(id_cita) ON DELETE CASCADE,
  id_agente uuid NOT NULL REFERENCES public.perfil_usuario(id_usuario),
  hora_inicio_atencion timestamp with time zone,
  hora_fin_atencion timestamp with time zone,
  resultado_tramite character varying CHECK (resultado_tramite IN ('aceptado', 'rechazado')),
  comentario_observacion text,
  fecha_registro timestamp with time zone DEFAULT now()
);

-- 11. ESTADO DE CUMPLIMIENTO DE REQUISITOS POR CITA
CREATE TABLE IF NOT EXISTS public.cita_requisito_estado (
  id_cita_req SERIAL PRIMARY KEY,
  id_atencion uuid NOT NULL REFERENCES public.atencion_cita(id_atencion) ON DELETE CASCADE,
  id_requisito integer NOT NULL REFERENCES public.requisito_tramite(id_requisito),
  cumplido boolean NOT NULL
);

-- 12. NOTIFICACIONES
CREATE TABLE IF NOT EXISTS public.notificacion (
  id_notificacion SERIAL PRIMARY KEY,
  id_cita uuid NOT NULL REFERENCES public.cita(id_cita) ON DELETE CASCADE,
  tipo_notificacion character varying NOT NULL CHECK (tipo_notificacion IN ('correo', 'sms')),
  estado_envio character varying NOT NULL DEFAULT 'pendiente' CHECK (estado_envio IN ('pendiente', 'enviado', 'fallido')),
  fecha_envio timestamp with time zone
);

-- =========================================================================
-- PERMISOS PARA MODO DESARROLLO / PRUEBAS
-- =========================================================================
ALTER TABLE IF EXISTS public.agencia DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ventanilla DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.perfil_usuario DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.personal_ventanilla DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tramite DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.agencia_tramite DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.requisito_tramite DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.horario_disponible DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.cita DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.atencion_cita DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.cita_requisito_estado DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notificacion DISABLE ROW LEVEL SECURITY;

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, postgres;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, postgres;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated;
