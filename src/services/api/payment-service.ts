import { http } from "./http-client";

export interface CreateCheckoutResponse {
  paymentId: string;
  checkoutUrl: string;
  status: string;
  amount?: number;
}

export interface ConfirmPaymentResponse {
  paymentId: string;
  status: string;
  credits: number;
  amount?: number;
}

export function createPaymentCheckout(volunteerId: string) {
  return http<CreateCheckoutResponse>("/api/v1/payments/checkout", {
    method: "POST",
    body: JSON.stringify({
      volunteerId,
      idempotencyKey: crypto.randomUUID(),
    }),
  });
}

export function confirmPayment(paymentId: string) {
  return http<ConfirmPaymentResponse>(`/api/v1/payments/${paymentId}/confirm`, { method: "POST" });
}
