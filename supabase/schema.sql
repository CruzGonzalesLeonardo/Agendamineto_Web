-- =========================================================================
-- SISTEMA DE AGENDAMIENTO Y ORIENTACIÓN - BANCO DE LA NACIÓN
-- MOTOR: PostgreSQL (Supabase)
-- MODO PRUEBAS / DESARROLLO: ACCESO PÚBLICO TOTAL SIN RESTRICCIONES RLS
-- =========================================================================

-- 1. CONTROL DE ACCESOS Y ROLES (RBAC)
CREATE TABLE IF NOT EXISTS rol (
    id_rol SERIAL PRIMARY KEY,
    nombre_rol VARCHAR(30) NOT NULL UNIQUE
);

INSERT INTO rol (id_rol, nombre_rol) VALUES 
(1, 'Cliente'),
(2, 'Agente Ventanilla'),
(3, 'Administrador Agencia'),
(4, 'Administrador General')
ON CONFLICT (id_rol) DO NOTHING;

CREATE TABLE IF NOT EXISTS permiso (
    id_permiso SERIAL PRIMARY KEY,
    codigo_permiso VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT
);

CREATE TABLE IF NOT EXISTS rol_permiso (
    id_rol INT REFERENCES rol(id_rol) ON DELETE CASCADE,
    id_permiso INT REFERENCES permiso(id_permiso) ON DELETE CASCADE,
    PRIMARY KEY (id_rol, id_permiso)
);

-- 2. AGENCIAS Y VENTANILLAS
CREATE TABLE IF NOT EXISTS agencia (
    id_agencia SERIAL PRIMARY KEY,
    nombre_agencia VARCHAR(100) NOT NULL,
    direccion VARCHAR(200) NOT NULL,
    distrito VARCHAR(100) NOT NULL,
    telefono VARCHAR(15),
    latitud NUMERIC(10, 8),
    longitud NUMERIC(11, 8),
    activa BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS ventanilla (
    id_ventanilla SERIAL PRIMARY KEY,
    id_agencia INT NOT NULL REFERENCES agencia(id_agencia) ON DELETE CASCADE,
    numero_ventanilla VARCHAR(10) NOT NULL,
    activa BOOLEAN DEFAULT true,
    CONSTRAINT uq_agencia_ventanilla UNIQUE (id_agencia, numero_ventanilla)
);

-- 3. PERFIL DE USUARIO
CREATE TABLE IF NOT EXISTS perfil_usuario (
    id_usuario UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dni VARCHAR(15) NOT NULL UNIQUE,
    nombre_completo VARCHAR(200),
    nombres VARCHAR(100),
    apellidos VARCHAR(100),
    correo VARCHAR(150) NOT NULL UNIQUE,
    telefono VARCHAR(15),
    rol VARCHAR(30) DEFAULT 'CLIENTE',
    id_rol INT REFERENCES rol(id_rol) DEFAULT 1,
    id_agencia INT REFERENCES agencia(id_agencia) ON DELETE SET NULL,
    contrasenia TEXT
);

CREATE TABLE IF NOT EXISTS personal_ventanilla (
    id_asignacion SERIAL PRIMARY KEY,
    id_usuario UUID NOT NULL REFERENCES perfil_usuario(id_usuario) ON DELETE CASCADE,
    id_ventanilla INT NOT NULL REFERENCES ventanilla(id_ventanilla) ON DELETE CASCADE,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    activa BOOLEAN DEFAULT true
);

-- 4. TRÁMITES Y REQUISITOS DINÁMICOS
CREATE TABLE IF NOT EXISTS tramite (
    id_tramite SERIAL PRIMARY KEY,
    nombre_tramite VARCHAR(100) NOT NULL,
    descripcion TEXT,
    duracion_minutos SMALLINT NOT NULL CHECK (duracion_minutos > 0),
    activo BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS agencia_tramite (
    id_agencia INT REFERENCES agencia(id_agencia) ON DELETE CASCADE,
    id_tramite INT REFERENCES tramite(id_tramite) ON DELETE CASCADE,
    PRIMARY KEY (id_agencia, id_tramite)
);

CREATE TABLE IF NOT EXISTS requisito_tramite (
    id_requisito SERIAL PRIMARY KEY,
    id_tramite INT NOT NULL REFERENCES tramite(id_tramite) ON DELETE CASCADE,
    descripcion_requisito TEXT NOT NULL,
    es_obligatorio BOOLEAN DEFAULT true
);

-- 5. HORARIOS Y CITAS
CREATE TABLE IF NOT EXISTS horario_disponible (
    id_horario SERIAL PRIMARY KEY,
    id_ventanilla INT NOT NULL REFERENCES ventanilla(id_ventanilla) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    estado_horario VARCHAR(20) NOT NULL DEFAULT 'disponible'
        CHECK (estado_horario IN ('disponible', 'reservado')),
    CONSTRAINT uq_horario_ventanilla_fecha_hora UNIQUE (id_ventanilla, fecha, hora_inicio),
    CONSTRAINT ck_horario_rango_valido CHECK (hora_fin > hora_inicio)
);

CREATE TABLE IF NOT EXISTS cita (
    id_cita UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_cita VARCHAR(15) NOT NULL UNIQUE,
    id_usuario UUID NOT NULL REFERENCES perfil_usuario(id_usuario),
    id_horario INT NOT NULL UNIQUE REFERENCES horario_disponible(id_horario),
    id_tramite INT NOT NULL REFERENCES tramite(id_tramite),
    estado_cita VARCHAR(20) NOT NULL DEFAULT 'pendiente'
        CHECK (estado_cita IN ('pendiente', 'confirmada', 'en_atencion', 'atendida', 'rechazada', 'cancelada')),
    codigo_qr TEXT UNIQUE,
    fecha_registro TIMESTAMPTZ DEFAULT now()
);

-- 6. ATENCIÓN Y CONTROL DE REQUISITOS
CREATE TABLE IF NOT EXISTS atencion_cita (
    id_atencion UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_cita UUID NOT NULL UNIQUE REFERENCES cita(id_cita) ON DELETE CASCADE,
    id_agente UUID NOT NULL REFERENCES perfil_usuario(id_usuario),
    hora_inicio_atencion TIMESTAMPTZ,
    hora_fin_atencion TIMESTAMPTZ,
    resultado_tramite VARCHAR(20) CHECK (resultado_tramite IN ('aceptado', 'rechazado')),
    comentario_observacion TEXT,
    fecha_registro TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cita_requisito_estado (
    id_cita_req SERIAL PRIMARY KEY,
    id_atencion UUID NOT NULL REFERENCES atencion_cita(id_atencion) ON DELETE CASCADE,
    id_requisito INT NOT NULL REFERENCES requisito_tramite(id_requisito),
    cumplido BOOLEAN NOT NULL
);

-- 7. NOTIFICACIONES
CREATE TABLE IF NOT EXISTS notificacion (
    id_notificacion SERIAL PRIMARY KEY,
    id_cita UUID NOT NULL REFERENCES cita(id_cita) ON DELETE CASCADE,
    tipo_notificacion VARCHAR(10) NOT NULL CHECK (tipo_notificacion IN ('correo', 'sms')),
    estado_envio VARCHAR(20) NOT NULL DEFAULT 'pendiente'
        CHECK (estado_envio IN ('pendiente', 'enviado', 'fallido')),
    fecha_envio TIMESTAMPTZ
);

-- =========================================================================
-- DESACTIVACIÓN DE RLS Y PERMISOS TOTALES PÚBLICOS PARA MODO PRUEBAS
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
ALTER TABLE IF EXISTS public.rol DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.permiso DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.rol_permiso DISABLE ROW LEVEL SECURITY;

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, postgres;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, postgres;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated;
