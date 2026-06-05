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

export interface PaymentSummary {
  paymentId: string;
  volunteerId: string;
  amount: number;
  status: string;
  providerCheckoutId?: string | null;
  providerCheckoutUrl?: string | null;
  paidAt?: string | null;
  createdAt: string;
}

export function createPaymentCheckout(volunteerId: string) {
  return http<CreateCheckoutResponse>("/api/v1/payments/checkout", {
    method: "POST",
    body: JSON.stringify({
      volunteerId,
    }),
  });
}

export function confirmPayment(paymentId: string) {
  return http<ConfirmPaymentResponse>(`/api/v1/payments/${paymentId}/confirm`, { method: "POST" });
}

export function listCurrentVolunteerPayments(size = 20) {
  return http<import("./admin-service").PageResponse<PaymentSummary>>(
    `/api/v1/payments/me?size=${size}&sort=createdAt,desc`,
  );
}
