export type UserRoleEnum = 'ADMIN_GENERAL' | 'ADMIN_AGENCIA' | 'AGENTE' | 'CLIENTE';

export interface UserProfile {
  id_usuario: string;
  dni: string;
  nombre_completo?: string;
  nombres?: string;
  apellidos?: string;
  correo: string;
  telefono?: string;
  rol: UserRoleEnum | string;
  id_agencia?: number | null;
  contrasenia?: string;
}
