const PENDING_PAYMENT_KEY = "drinkcard.pendingPayment";

export interface PendingPayment {
  paymentId: string;
  at: number;
}

export function getPendingPayment(): PendingPayment | null {
  try {
    const raw = localStorage.getItem(PENDING_PAYMENT_KEY);
    return raw ? (JSON.parse(raw) as PendingPayment) : null;
  } catch {
    return null;
  }
}

export function storePendingPayment(paymentId: string) {
  localStorage.setItem(PENDING_PAYMENT_KEY, JSON.stringify({ paymentId, at: Date.now() }));
}

export function clearPendingPayment() {
  localStorage.removeItem(PENDING_PAYMENT_KEY);
}
