export type Role = "VOLUNTEER" | "BAR_STAFF" | "ADMIN";

export interface Session {
  token: string;
  userId: string;
  volunteerId: string;
  email: string;
  role: Role;
  firstName?: string;
  lastName?: string;
}

const KEY = "drinkcard.session";

export const sessionStore = {
  get(): Session | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? normalizeSession(JSON.parse(raw)) : null;
    } catch {
      return null;
    }
  },
  set(s: Session) {
    localStorage.setItem(KEY, JSON.stringify(normalizeSession(s)));
    window.dispatchEvent(new Event("drinkcard:session"));
  },
  clear() {
    localStorage.removeItem(KEY);
    window.dispatchEvent(new Event("drinkcard:session"));
  },
};

export function normalizeSession(value: unknown): Session {
  const s = value as Partial<Session> & { volunteerId?: string; userId?: string };
  const id = s.volunteerId ?? s.userId ?? "";
  return {
    token: s.token ?? "",
    userId: s.userId ?? id,
    volunteerId: s.volunteerId ?? id,
    email: s.email ?? "",
    role: (s.role ?? "VOLUNTEER") as Role,
    firstName: s.firstName,
    lastName: s.lastName,
  };
}
