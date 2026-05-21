import { http } from "./http-client";
import type { DrinkCardAccount } from "./drink-card-service";

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface UserSummary {
  userId: string;
  fullName: string;
  email: string;
  role: string;
  status: string;
}

export interface AdminPaymentSummary {
  paymentId: string;
  volunteerId: string;
  amount: number;
  status: string;
  providerCheckoutId?: string;
  providerCheckoutUrl?: string;
  paidAt?: string | null;
  createdAt: string;
}

export function listVolunteerUsers(size = 200) {
  return http<PageResponse<UserSummary>>(`/api/v1/admin/users?role=VOLUNTEER&size=${size}`);
}

export function listDrinkCardAccounts() {
  return http<DrinkCardAccount[] | PageResponse<DrinkCardAccount>>("/api/v1/admin/drink-card-accounts");
}

export function listRecentPayments(size = 10) {
  return http<PageResponse<AdminPaymentSummary>>(`/api/v1/admin/payments?size=${size}&sort=createdAt,desc`);
}
