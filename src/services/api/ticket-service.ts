import { http } from "./http-client";

export interface Ticket {
  ticketId: string;
  status: string;
  drinkType: string;
  expiresAt?: string;
  consumedAt?: string;
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

export function consumeDrinkTicket(ticketId: string, consumedByStaffId: string) {
  return http<ConsumeTicketResponse>(`/api/v1/drink-tickets/${ticketId}/consume`, {
    method: "POST",
    body: JSON.stringify({ consumedByStaffId }),
  });
}
