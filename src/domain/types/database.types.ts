export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'CLIENTE' | 'AGENTE' | 'ADMIN_AGENCIA' | 'ADMIN_GENERAL';

export type EstadoHorario = 'disponible' | 'reservado';

export type EstadoCita =
  | 'pendiente'
  | 'confirmada'
  | 'en_atencion'
  | 'atendida'
  | 'rechazada'
  | 'cancelada';

export type ResultadoTramite = 'aceptado' | 'rechazado';

export type TipoNotificacion = 'correo' | 'sms';

export type EstadoEnvio = 'pendiente' | 'enviado' | 'fallido';

export interface Database {
  public: {
    Tables: {
      agencia: {
        Row: {
          id_agencia: number;
          nombre_agencia: string;
          direccion: string;
          distrito: string;
          telefono: string | null;
          latitud: number | null;
          longitud: number | null;
          activa: boolean;
        };
        Insert: {
          id_agencia?: number;
          nombre_agencia: string;
          direccion: string;
          distrito: string;
          telefono?: string | null;
          latitud?: number | null;
          longitud?: number | null;
          activa?: boolean;
        };
        Update: {
          id_agencia?: number;
          nombre_agencia?: string;
          direccion?: string;
          distrito?: string;
          telefono?: string | null;
          latitud?: number | null;
          longitud?: number | null;
          activa?: boolean;
        };
        Relationships: [];
      };
      ventanilla: {
        Row: {
          id_ventanilla: number;
          id_agencia: number;
          numero_ventanilla: string;
          activa: boolean;
        };
        Insert: {
          id_ventanilla?: number;
          id_agencia: number;
          numero_ventanilla: string;
          activa?: boolean;
        };
        Update: {
          id_ventanilla?: number;
          id_agencia?: number;
          numero_ventanilla?: string;
          activa?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "ventanilla_id_agencia_fkey";
            columns: ["id_agencia"];
            isOneToOne: false;
            referencedRelation: "agencia";
            referencedColumns: ["id_agencia"];
          }
        ];
      };
      perfil_usuario: {
        Row: {
          id_usuario: string;
          dni: string | null;
          nombre_completo: string;
          correo: string;
          telefono: string | null;
          rol: UserRole;
          id_agencia: number | null;
          created_at: string | null;
          contrasenia: string | null;
        };
        Insert: {
          id_usuario: string;
          dni?: string | null;
          nombre_completo: string;
          correo: string;
          telefono?: string | null;
          rol?: UserRole;
          id_agencia?: number | null;
          created_at?: string | null;
          contrasenia?: string | null;
        };
        Update: {
          id_usuario?: string;
          dni?: string | null;
          nombre_completo?: string;
          correo?: string;
          telefono?: string | null;
          rol?: UserRole;
          id_agencia?: number | null;
          created_at?: string | null;
          contrasenia?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "perfil_usuario_id_agencia_fkey";
            columns: ["id_agencia"];
            isOneToOne: false;
            referencedRelation: "agencia";
            referencedColumns: ["id_agencia"];
          }
        ];
      };
      personal_ventanilla: {
        Row: {
          id_asignacion: number;
          id_usuario: string;
          id_ventanilla: number;
          fecha: string;
          activa: boolean;
        };
        Insert: {
          id_asignacion?: number;
          id_usuario: string;
          id_ventanilla: number;
          fecha?: string;
          activa?: boolean;
        };
        Update: {
          id_asignacion?: number;
          id_usuario?: string;
          id_ventanilla?: number;
          fecha?: string;
          activa?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "personal_ventanilla_id_usuario_fkey";
            columns: ["id_usuario"];
            isOneToOne: false;
            referencedRelation: "perfil_usuario";
            referencedColumns: ["id_usuario"];
          },
          {
            foreignKeyName: "personal_ventanilla_id_ventanilla_fkey";
            columns: ["id_ventanilla"];
            isOneToOne: false;
            referencedRelation: "ventanilla";
            referencedColumns: ["id_ventanilla"];
          }
        ];
      };
      tramite: {
        Row: {
          id_tramite: number;
          nombre_tramite: string;
          descripcion: string | null;
          duracion_minutos: number;
          activo: boolean;
        };
        Insert: {
          id_tramite?: number;
          nombre_tramite: string;
          descripcion?: string | null;
          duracion_minutos: number;
          activo?: boolean;
        };
        Update: {
          id_tramite?: number;
          nombre_tramite?: string;
          descripcion?: string | null;
          duracion_minutos?: number;
          activo?: boolean;
        };
        Relationships: [];
      };
      agencia_tramite: {
        Row: {
          id_agencia: number;
          id_tramite: number;
        };
        Insert: {
          id_agencia: number;
          id_tramite: number;
        };
        Update: {
          id_agencia?: number;
          id_tramite?: number;
        };
        Relationships: [
          {
            foreignKeyName: "agencia_tramite_id_agencia_fkey";
            columns: ["id_agencia"];
            isOneToOne: false;
            referencedRelation: "agencia";
            referencedColumns: ["id_agencia"];
          },
          {
            foreignKeyName: "agencia_tramite_id_tramite_fkey";
            columns: ["id_tramite"];
            isOneToOne: false;
            referencedRelation: "tramite";
            referencedColumns: ["id_tramite"];
          }
        ];
      };
      requisito_tramite: {
        Row: {
          id_requisito: number;
          id_tramite: number;
          descripcion_requisito: string;
          es_obligatorio: boolean;
        };
        Insert: {
          id_requisito?: number;
          id_tramite: number;
          descripcion_requisito: string;
          es_obligatorio?: boolean;
        };
        Update: {
          id_requisito?: number;
          id_tramite?: number;
          descripcion_requisito?: string;
          es_obligatorio?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "requisito_tramite_id_tramite_fkey";
            columns: ["id_tramite"];
            isOneToOne: false;
            referencedRelation: "tramite";
            referencedColumns: ["id_tramite"];
          }
        ];
      };
      horario_disponible: {
        Row: {
          id_horario: number;
          id_ventanilla: number;
          fecha: string;
          hora_inicio: string;
          hora_fin: string;
          estado_horario: EstadoHorario;
        };
        Insert: {
          id_horario?: number;
          id_ventanilla: number;
          fecha: string;
          hora_inicio: string;
          hora_fin: string;
          estado_horario?: EstadoHorario;
        };
        Update: {
          id_horario?: number;
          id_ventanilla?: number;
          fecha?: string;
          hora_inicio?: string;
          hora_fin?: string;
          estado_horario?: EstadoHorario;
        };
        Relationships: [
          {
            foreignKeyName: "horario_disponible_id_ventanilla_fkey";
            columns: ["id_ventanilla"];
            isOneToOne: false;
            referencedRelation: "ventanilla";
            referencedColumns: ["id_ventanilla"];
          }
        ];
      };
      cita: {
        Row: {
          id_cita: string;
          codigo_cita: string;
          id_usuario: string;
          id_horario: number;
          id_tramite: number;
          estado_cita: EstadoCita;
          codigo_qr: string | null;
          fecha_registro: string | null;
        };
        Insert: {
          id_cita?: string;
          codigo_cita: string;
          id_usuario: string;
          id_horario: number;
          id_tramite: number;
          estado_cita?: EstadoCita;
          codigo_qr?: string | null;
          fecha_registro?: string | null;
        };
        Update: {
          id_cita?: string;
          codigo_cita?: string;
          id_usuario?: string;
          id_horario?: number;
          id_tramite?: number;
          estado_cita?: EstadoCita;
          codigo_qr?: string | null;
          fecha_registro?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "cita_id_usuario_fkey";
            columns: ["id_usuario"];
            isOneToOne: false;
            referencedRelation: "perfil_usuario";
            referencedColumns: ["id_usuario"];
          },
          {
            foreignKeyName: "cita_id_horario_fkey";
            columns: ["id_horario"];
            isOneToOne: true;
            referencedRelation: "horario_disponible";
            referencedColumns: ["id_horario"];
          },
          {
            foreignKeyName: "cita_id_tramite_fkey";
            columns: ["id_tramite"];
            isOneToOne: false;
            referencedRelation: "tramite";
            referencedColumns: ["id_tramite"];
          }
        ];
      };
      atencion_cita: {
        Row: {
          id_atencion: string;
          id_cita: string;
          id_agente: string;
          hora_inicio_atencion: string | null;
          hora_fin_atencion: string | null;
          resultado_tramite: ResultadoTramite | null;
          comentario_observacion: string | null;
          fecha_registro: string | null;
        };
        Insert: {
          id_atencion?: string;
          id_cita: string;
          id_agente: string;
          hora_inicio_atencion?: string | null;
          hora_fin_atencion?: string | null;
          resultado_tramite?: ResultadoTramite | null;
          comentario_observacion?: string | null;
          fecha_registro?: string | null;
        };
        Update: {
          id_atencion?: string;
          id_cita?: string;
          id_agente?: string;
          hora_inicio_atencion?: string | null;
          hora_fin_atencion?: string | null;
          resultado_tramite?: ResultadoTramite | null;
          comentario_observacion?: string | null;
          fecha_registro?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "atencion_cita_id_cita_fkey";
            columns: ["id_cita"];
            isOneToOne: true;
            referencedRelation: "cita";
            referencedColumns: ["id_cita"];
          },
          {
            foreignKeyName: "atencion_cita_id_agente_fkey";
            columns: ["id_agente"];
            isOneToOne: false;
            referencedRelation: "perfil_usuario";
            referencedColumns: ["id_usuario"];
          }
        ];
      };
      cita_requisito_estado: {
        Row: {
          id_cita_req: number;
          id_atencion: string;
          id_requisito: number;
          cumplido: boolean;
        };
        Insert: {
          id_cita_req?: number;
          id_atencion: string;
          id_requisito: number;
          cumplido: boolean;
        };
        Update: {
          id_cita_req?: number;
          id_atencion?: string;
          id_requisito?: number;
          cumplido?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "cita_requisito_estado_id_atencion_fkey";
            columns: ["id_atencion"];
            isOneToOne: false;
            referencedRelation: "atencion_cita";
            referencedColumns: ["id_atencion"];
          },
          {
            foreignKeyName: "cita_requisito_estado_id_requisito_fkey";
            columns: ["id_requisito"];
            isOneToOne: false;
            referencedRelation: "requisito_tramite";
            referencedColumns: ["id_requisito"];
          }
        ];
      };
      notificacion: {
        Row: {
          id_notificacion: number;
          id_cita: string;
          tipo_notificacion: TipoNotificacion;
          estado_envio: EstadoEnvio;
          fecha_envio: string | null;
        };
        Insert: {
          id_notificacion?: number;
          id_cita: string;
          tipo_notificacion: TipoNotificacion;
          estado_envio?: EstadoEnvio;
          fecha_envio?: string | null;
        };
        Update: {
          id_notificacion?: number;
          id_cita?: string;
          tipo_notificacion?: TipoNotificacion;
          estado_envio?: EstadoEnvio;
          fecha_envio?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "notificacion_id_cita_fkey";
            columns: ["id_cita"];
            isOneToOne: false;
            referencedRelation: "cita";
            referencedColumns: ["id_cita"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_role: UserRole;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
