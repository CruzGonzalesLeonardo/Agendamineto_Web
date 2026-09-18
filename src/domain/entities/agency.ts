export interface Agency {
  id_agencia: number;
  nombre_agencia: string;
  direccion: string;
  distrito: string;
  telefono?: string;
  latitud?: number;
  longitud?: number;
  total_ventanillas?: number;
  activa: boolean;
}