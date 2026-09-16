export type AppointmentStatus = "requested" | "confirmed" | "cancelled";
export type Appointment = { id: string; citizenId: string; agencyId: string; procedureId: string; startsAt: string; status: AppointmentStatus };
export type CreateAppointmentInput = Omit<Appointment, "id" | "status">;