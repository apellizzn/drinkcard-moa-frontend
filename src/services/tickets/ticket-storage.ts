import type { Ticket } from "@/services/api/ticket-service";

const CURRENT_TICKET_KEY = "drinkcard.currentTicket";

export function getStoredTicket(): Ticket | null {
  try {
    const raw = localStorage.getItem(CURRENT_TICKET_KEY);
    return raw ? (JSON.parse(raw) as Ticket) : null;
  } catch {
    return null;
  }
}

export function storeCurrentTicket(ticket: Ticket) {
  localStorage.setItem(CURRENT_TICKET_KEY, JSON.stringify(ticket));
}

export function clearStoredTicket() {
  localStorage.removeItem(CURRENT_TICKET_KEY);
}
