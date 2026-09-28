import { Agency } from '@/domain/entities/agency';
import { createSupabaseBrowserClient } from '@/infrastructure/supabase/client';

export interface CreateAgencyParams {
  nombre_agencia: string;
  direccion: string;
  distrito: string;
  provincia?: string;
  departamento?: string;
  telefono?: string;
  latitud?: number;
  longitud?: number;
  total_ventanillas: number;
  dias_semana: number[]; // Ej: [1, 2, 3, 4, 5] (Lunes a Viernes)
  hora_apertura: string; // Ej: "08:30"
  hora_cierre: string; // Ej: "17:30"
  hora_inicio_almuerzo?: string; // Ej: "13:00"
  hora_fin_almuerzo?: string; // Ej: "14:00"
  tramite_ids: number[];
}

export class SupabaseAgencyRepository {
  /**
   * Obtiene la lista de agencias con conteo de ventanillas asociadas.
   * Si includeInactive es false, solo trae agencias activas (para el público).
   */
  async getAgencies(
    districtFilter?: string,
    searchQuery?: string,
    includeInactive = false
  ): Promise<Agency[]> {
    const supabase = createSupabaseBrowserClient();
    let query = supabase.from('agencia').select('*, ventanilla(id_ventanilla, activa)');

    if (!includeInactive) {
      query = query.eq('activa', true);
    }

    if (districtFilter && districtFilter !== 'Todas las agencias') {
      query = query.ilike('distrito', `%${districtFilter}%`);
    }

    if (searchQuery && searchQuery.trim() !== '') {
      query = query.or(
        `nombre_agencia.ilike.%${searchQuery}%,direccion.ilike.%${searchQuery}%,distrito.ilike.%${searchQuery}%,provincia.ilike.%${searchQuery}%,departamento.ilike.%${searchQuery}%`
      );
    }

    query = query.order('id_agencia', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Error al consultar agencias en Supabase:', error.message);
      throw error;
    }

    return ((data as any[]) ?? []).map((row) => ({
      id_agencia: row.id_agencia,
      nombre_agencia: row.nombre_agencia,
      direccion: row.direccion,
      distrito: row.distrito,
      provincia: row.provincia || undefined,
      departamento: row.departamento || undefined,
      telefono: row.telefono,
      latitud: row.latitud ? Number(row.latitud) : undefined,
      longitud: row.longitud ? Number(row.longitud) : undefined,
      activa: row.activa,
      total_ventanillas: Array.isArray(row.ventanilla) ? row.ventanilla.length : 0,
    }));
  }

  /**
   * Crea una nueva agencia y alimenta automáticamente sus dependencias:
   * 1. public.agencia
   * 2. public.ventanilla (genera N ventanillas en formato V-01)
   * 3. public.plantilla_horario_agencia (genera horario por cada día con intervalo de 15 min)
   * 4. public.agencia_tramite (asocia los trámites elegidos)
   */
  async createAgencyWithDependencies(params: CreateAgencyParams): Promise<Agency> {
    const supabase = createSupabaseBrowserClient();

    // 1. Insertar en public.agencia
    const { data: agenciaData, error: agenciaError } = await supabase
      .from('agencia')
      .insert({
        nombre_agencia: params.nombre_agencia.trim(),
        direccion: params.direccion.trim(),
        distrito: params.distrito.trim(),
        provincia: params.provincia?.trim() || null,
        departamento: params.departamento?.trim() || null,
        telefono: params.telefono?.trim() || null,
        latitud: params.latitud !== undefined ? params.latitud : null,
        longitud: params.longitud !== undefined ? params.longitud : null,
        activa: true,
      })
      .select()
      .single();

    if (agenciaError || !agenciaData) {
      console.error('Error al crear agencia en Supabase:', agenciaError?.message);
      throw new Error(agenciaError?.message || 'Error al crear la agencia');
    }

    const idAgencia = agenciaData.id_agencia;

    // 2. Insertar en public.ventanilla (Formato V-01, V-02 para cumplir con VARCHAR(10))
    const totalVentanillas = Math.max(1, params.total_ventanillas || 1);
    const ventanillasToInsert = Array.from({ length: totalVentanillas }, (_, idx) => ({
      id_agencia: idAgencia,
      numero_ventanilla: `V-${String(idx + 1).padStart(2, '0')}`,
      activa: true,
    }));

    const { error: ventanillaError } = await supabase.from('ventanilla').insert(ventanillasToInsert);
    if (ventanillaError) {
      console.warn('Aviso: Error al registrar ventanillas:', ventanillaError.message);
    }

    // 3. Insertar en public.plantilla_horario_agencia (días seleccionados, intervalo fijo en 15 min)
    const dias = params.dias_semana.length > 0 ? params.dias_semana : [1, 2, 3, 4, 5];
    const horariosToInsert = dias.map((dia) => ({
      id_agencia: idAgencia,
      dia_semana: dia,
      hora_apertura: params.hora_apertura || '08:30:00',
      hora_cierre: params.hora_cierre || '17:30:00',
      hora_inicio_almuerzo: params.hora_inicio_almuerzo || '13:00:00',
      hora_fin_almuerzo: params.hora_fin_almuerzo || '14:00:00',
      intervalo_minutos: 15,
      activa: true,
    }));

    const { error: horarioError } = await supabase
      .from('plantilla_horario_agencia')
      .insert(horariosToInsert);
    if (horarioError) {
      console.warn('Aviso: Error al registrar plantilla de horarios:', horarioError.message);
    }

    // 4. Insertar en public.agencia_tramite (los trámites seleccionados)
    if (params.tramite_ids && params.tramite_ids.length > 0) {
      const tramitesToInsert = params.tramite_ids.map((idTramite) => ({
        id_agencia: idAgencia,
        id_tramite: idTramite,
      }));

      const { error: tramitesError } = await supabase
        .from('agencia_tramite')
        .insert(tramitesToInsert);
      if (tramitesError) {
        console.warn('Aviso: Error al asociar trámites a la agencia:', tramitesError.message);
      }
    }

    return {
      id_agencia: agenciaData.id_agencia,
      nombre_agencia: agenciaData.nombre_agencia,
      direccion: agenciaData.direccion,
      distrito: agenciaData.distrito,
      provincia: agenciaData.provincia || undefined,
      departamento: agenciaData.departamento || undefined,
      telefono: agenciaData.telefono || undefined,
      latitud: agenciaData.latitud ? Number(agenciaData.latitud) : undefined,
      longitud: agenciaData.longitud ? Number(agenciaData.longitud) : undefined,
      total_ventanillas: totalVentanillas,
      activa: agenciaData.activa,
    };
  }

  /**
   * Actualiza datos básicos de la agencia
   */
  async updateAgency(id: number, data: Partial<Agency>): Promise<void> {
    const supabase = createSupabaseBrowserClient();
    const updatePayload: any = {};

    if (data.nombre_agencia !== undefined) updatePayload.nombre_agencia = data.nombre_agencia;
    if (data.direccion !== undefined) updatePayload.direccion = data.direccion;
    if (data.distrito !== undefined) updatePayload.distrito = data.distrito;
    if (data.provincia !== undefined) updatePayload.provincia = data.provincia;
    if (data.departamento !== undefined) updatePayload.departamento = data.departamento;
    if (data.telefono !== undefined) updatePayload.telefono = data.telefono;
    if (data.latitud !== undefined) updatePayload.latitud = data.latitud;
    if (data.longitud !== undefined) updatePayload.longitud = data.longitud;
    if (data.activa !== undefined) updatePayload.activa = data.activa;

    const { error } = await supabase.from('agencia').update(updatePayload).eq('id_agencia', id);

    if (error) {
      console.error('Error al actualizar agencia en Supabase:', error.message);
      throw error;
    }
  }

  /**
   * Borrado Lógico: Marca activa = false
   */
  async softDeleteAgency(id: number): Promise<void> {
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.from('agencia').update({ activa: false }).eq('id_agencia', id);

    if (error) {
      console.error('Error al dar de baja la agencia:', error.message);
      throw error;
    }
  }

  /**
   * Reactivar agencia: Marca activa = true
   */
  async reactivateAgency(id: number): Promise<void> {
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.from('agencia').update({ activa: true }).eq('id_agencia', id);

    if (error) {
      console.error('Error al reactivar la agencia:', error.message);
      throw error;
    }
  }
}
