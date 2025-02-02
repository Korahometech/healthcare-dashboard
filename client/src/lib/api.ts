import { apiRequest } from "./queryClient";
import type { SelectAppointment } from "@db/schema";

export async function updateAppointmentStatus({ id, status }: { id: number; status: string }): Promise<SelectAppointment> {
  const res = await apiRequest("PUT", `/api/appointments/${id}/status`, { status });
  return res.json();
}
