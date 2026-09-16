import type { Appointment, CreateAppointmentInput } from "@/domain/entities/appointment";
import type { AppointmentRepository } from "@/application/ports/appointment-repository";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
export class SupabaseAppointmentRepository implements AppointmentRepository {
  async create(input: CreateAppointmentInput): Promise<Appointment> {
    const { data, error } = await (await createSupabaseServerClient()).from("appointments").insert({ ...input, status: "requested" }).select().single();
    if (error) throw new Error(`No se pudo crear la cita: ${error.message}`);
    return data as Appointment;
  }
  async findByCitizen(citizenId: string): Promise<Appointment[]> {
    const { data, error } = await (await createSupabaseServerClient()).from("appointments").select("*").eq("citizen_id", citizenId).order("starts_at");
    if (error) throw new Error(`No se pudieron consultar las citas: ${error.message}`);
    return (data ?? []) as Appointment[];
  }
}