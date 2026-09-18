import { Procedure } from '@/domain/entities/procedure';
import { createSupabaseBrowserClient } from '@/infrastructure/supabase/client';

export class SupabaseProcedureRepository {
  async getProcedures(searchQuery?: string): Promise<Procedure[]> {
    const supabase = createSupabaseBrowserClient();
    let query = supabase.from('tramite').select('*, requisito_tramite(*)').eq('activo', true);

    if (searchQuery && searchQuery.trim() !== '') {
      query = query.or(`nombre_tramite.ilike.%${searchQuery}%,descripcion.ilike.%${searchQuery}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error al consultar trámites en Supabase:', error.message);
      throw error;
    }

    if (!data) return [];

    return data.map((item) => ({
      id_tramite: item.id_tramite,
      nombre_tramite: item.nombre_tramite,
      descripcion: item.descripcion,
      duracion_minutos: item.duracion_minutos,
      activo: item.activo,
      requisitos: item.requisito_tramite ?? [],
    }));
  }
}
