export type UserRoleEnum = 'ADMIN_GENERAL' | 'ADMIN_AGENCIA' | 'AGENTE' | 'CLIENTE';

export function roleIdToEnum(id_rol: number): UserRoleEnum {
  switch (id_rol) {
    case 4:
      return 'ADMIN_GENERAL';
    case 3:
      return 'ADMIN_AGENCIA';
    case 2:
      return 'AGENTE';
    case 1:
    default:
      return 'CLIENTE';
  }
}

export function roleEnumToId(role: string): number {
  const norm = role.toUpperCase();
  if (norm === 'ADMIN_GENERAL') return 4;
  if (norm === 'ADMIN_AGENCIA') return 3;
  if (norm === 'AGENTE' || norm === 'AGENTE_VENTANILLA' || norm === 'VENTANILLA') return 2;
  return 1;
}

export interface UserProfile {
  id_usuario: string;
  dni: string;
  nombres: string;
  apellidos: string;
  nombre_completo?: string;
  correo: string;
  telefono?: string | null;
  id_rol: number;
  rol_nombre?: string;
  rol: UserRoleEnum | string;
  id_agencia?: number | null;
  agencia_nombre?: string | null;
}
