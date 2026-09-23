import type { Appointment, CreateAppointmentInput } from "@/domain/entities/appointment";
import type { AppointmentRepository } from "@/application/ports/appointment-repository";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";

export class SupabaseAppointmentRepository implements AppointmentRepository {
  async create(input: CreateAppointmentInput): Promise<Appointment> {
    const supabase = await createSupabaseServerClient();

    // 1. Intentar usar el procedimiento almacenado con bloqueo de concurrencia
    try {
      const { data: rpcCitaId, error: rpcError } = await (supabase.rpc as any)('reservar_cita', {
        p_id_usuario: input.id_usuario,
        p_id_horario: input.id_horario,
        p_id_tramite: input.id_tramite,
        p_codigo_cita: input.codigo_cita,
      });

      if (!rpcError && rpcCitaId) {
        const { data: createdCita, error: fetchErr } = await supabase
          .from("cita")
          .select("*")
          .eq("id_cita", rpcCitaId)
          .single();

        if (!fetchErr && createdCita) {
          return createdCita as Appointment;
        }
      }
    } catch (rpcErr) {
      console.warn("Fallo RPC reservar_cita, procediendo con inserción directa:", rpcErr);
    }

    // 2. Inserción directa en tabla cita y actualización en horario_disponible
    const { data, error } = await supabase
      .from("cita")
      .insert({
        codigo_cita: input.codigo_cita,
        id_usuario: input.id_usuario,
        id_horario: input.id_horario,
        id_tramite: input.id_tramite,
        estado_cita: "pendiente",
        codigo_qr: input.codigo_qr ?? input.codigo_cita,
      })
      .select()
      .single();

    if (error) throw new Error(`No se pudo crear la cita: ${error.message}`);

    // Actualizar estado de horario a 'reservado'
    await supabase
      .from("horario_disponible")
      .update({ estado_horario: "reservado" })
      .eq("id_horario", input.id_horario);

    return data as Appointment;
  }

  async findByCitizen(citizenId: string): Promise<Appointment[]> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("cita")
      .select(`
        *,
        tramite ( nombre_tramite ),
        horario_disponible (
          fecha,
          hora_inicio,
          hora_fin,
          ventanilla (
            numero_ventanilla,
            agencia ( nombre_agencia )
          )
        )
      `)
      .eq("id_usuario", citizenId)
      .order("fecha_registro", { ascending: false });

    if (error) throw new Error(`No se pudieron consultar las citas: ${error.message}`);

    return ((data ?? []) as any[]).map((item) => ({
      id_cita: item.id_cita,
      codigo_cita: item.codigo_cita,
      id_usuario: item.id_usuario,
      id_horario: item.id_horario,
      id_tramite: item.id_tramite,
      estado_cita: item.estado_cita,
      codigo_qr: item.codigo_qr,
      fecha_registro: item.fecha_registro,
      tramite_nombre: item.tramite?.nombre_tramite,
      agencia_nombre: item.horario_disponible?.ventanilla?.agencia?.nombre_agencia,
      horario_fecha: item.horario_disponible?.fecha,
      horario_inicio: item.horario_disponible?.hora_inicio,
      horario_fin: item.horario_disponible?.hora_fin,
      numero_ventanilla: item.horario_disponible?.ventanilla?.numero_ventanilla,
    }));
  }
}