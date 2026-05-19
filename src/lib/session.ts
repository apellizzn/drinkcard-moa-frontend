export type Role = "VOLUNTEER" | "BAR_STAFF" | "ADMIN";

export interface Session {
  token: string;
  userId: string;
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
      return raw ? (JSON.parse(raw) as Session) : null;
    } catch {
      return null;
    }
  },
  set(s: Session) {
    localStorage.setItem(KEY, JSON.stringify(s));
    window.dispatchEvent(new Event("drinkcard:session"));
  },
  clear() {
    localStorage.removeItem(KEY);
    window.dispatchEvent(new Event("drinkcard:session"));
  },
};
