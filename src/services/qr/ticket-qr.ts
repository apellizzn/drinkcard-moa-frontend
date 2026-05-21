export function createTicketQrPayload(ticketId: string) {
  return ticketId.trim();
}

export function readTicketIdFromQrPayload(payload: string): string | null {
  const trimmed = payload.trim();
  if (!trimmed) return null;

  try {
    const parsed = JSON.parse(trimmed);
    if (typeof parsed?.ticketId === "string" && parsed.ticketId.trim()) {
      return parsed.ticketId.trim();
    }
  } catch {}

  return trimmed;
}
