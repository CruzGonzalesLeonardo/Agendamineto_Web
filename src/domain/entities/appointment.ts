export type AppointmentState = 
  | 'pendiente'
  | 'confirmada'
  | 'en_atencion'
  | 'atendida'
  | 'rechazada'
  | 'cancelada';

export interface AvailableSlot {
  id_horario: number;
  id_ventanilla: number;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  estado_horario: 'disponible' | 'reservado';
}

export interface Appointment {
  id_cita: string;
  codigo_cita: string;
  id_usuario: string;
  id_horario: number;
  id_tramite: number;
  estado_cita: AppointmentState;
  codigo_qr?: string;
  fecha_registro: string;
  // Relaciones pobladas opcionales
  tramite_nombre?: string;
  agencia_nombre?: string;
  horario_fecha?: string;
  horario_inicio?: string;
}

export interface CreateAppointmentDTO {
  id_usuario: string;
  id_horario: number;
  id_tramite: number;
  codigo_cita: string;
}

export type CreateAppointmentInput = CreateAppointmentDTO;