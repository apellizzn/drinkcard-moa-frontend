import { http } from "./http-client";

export interface Ticket {
  ticketId: string;
  drinkTicketId?: string;
  volunteerId?: string;
  status: string;
  drinkType: string;
  createdAt?: string;
  expiresAt?: string;
  consumedAt?: string;
  consumedByStaffId?: string;
}

export interface ConsumeTicketResponse {
  ticketId: string;
  status: string;
  drinkType: string;
  remainingCredits: number;
}

export function createDrinkTicket(volunteerId: string, drinkType: string) {
  return http<Ticket>("/api/v1/drink-tickets", {
    method: "POST",
    body: JSON.stringify({ volunteerId, drinkType }),
  });
}

export function getDrinkTicketStatus(ticketId: string) {
  return http<Ticket>(`/api/v1/drink-tickets/${ticketId}/status`);
}

export function listCurrentVolunteerTickets(size = 20) {
  return http<import("./admin-service").PageResponse<Ticket>>(
    `/api/v1/drink-tickets/me?size=${size}&sort=createdAt,desc`,
  );
}

export function consumeDrinkTicket(ticketId: string, consumedByStaffId: string) {
  return http<ConsumeTicketResponse>(`/api/v1/drink-tickets/${ticketId}/consume`, {
    method: "POST",
    body: JSON.stringify({ consumedByStaffId }),
  });
}
