import { http } from "./http-client";
import type { PageResponse } from "./admin-service";

export interface TurnResponse {
  turnId: string;
  email: string;
  /** ISO date `yyyy-MM-dd` */
  date: string;
  /** ISO instant */
  createdAt: string;
}

export type TurnSummary = TurnResponse;

export interface AddTurnRequest {
  email: string;
  /** ISO date `yyyy-MM-dd` */
  date: string;
}

export interface ListTurnsParams {
  email?: string;
  /** ISO date `yyyy-MM-dd` */
  date?: string;
  page?: number;
  size?: number;
}

const BASE = "/api/v1/admin/turns";

export function listTurns(params: ListTurnsParams = {}) {
  return http<PageResponse<TurnSummary>>(`${BASE}${qs({ page: 0, size: 20, ...params })}`);
}

export function addTurn(data: AddTurnRequest) {
  return http<TurnResponse>(BASE, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function deleteTurn(turnId: string) {
  return http<void>(`${BASE}/${turnId}`, { method: "DELETE" });
}

function qs(params: Record<string, string | number | undefined>) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") sp.set(key, String(value));
  });
  const out = sp.toString();
  return out ? `?${out}` : "";
}
