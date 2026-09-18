import { Agency } from '@/domain/entities/agency';
import { createSupabaseBrowserClient } from '@/infrastructure/supabase/client';

export class SupabaseAgencyRepository {
  async getAgencies(districtFilter?: string, searchQuery?: string): Promise<Agency[]> {
    const supabase = createSupabaseBrowserClient();
    let query = supabase.from('agencia').select('*').eq('activa', true);

    if (districtFilter && districtFilter !== 'Todas las agencias') {
      query = query.ilike('distrito', `%${districtFilter}%`);
    }

    if (searchQuery && searchQuery.trim() !== '') {
      query = query.or(`nombre_agencia.ilike.%${searchQuery}%,direccion.ilike.%${searchQuery}%,distrito.ilike.%${searchQuery}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error al consultar agencias en Supabase:', error.message);
      throw error;
    }

    return (data as Agency[]) ?? [];
  }
}
