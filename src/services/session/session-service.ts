import { normalizeSession, sessionStore, type Role, type Session } from "@/lib/session";

export interface LoginResponse {
  token: string;
  volunteerId: string;
  email: string;
  role: Role;
}

export function saveLoginSession(res: LoginResponse, profile?: Pick<Session, "firstName" | "lastName">) {
  sessionStore.set(normalizeSession({ ...res, ...profile }));
}
