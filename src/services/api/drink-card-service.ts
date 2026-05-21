import { http } from "./http-client";

export interface DrinkCardAccount {
  volunteerId: string;
  credits: number;
  status: string;
  lastPurchaseTimestamp?: string | null;
}

export function getCurrentDrinkCardAccount() {
  return http<DrinkCardAccount>("/api/v1/drink-card-accounts/me");
}
