import { useEffect, useState } from "react";
import { sessionStore, type Session } from "@/lib/session";

export function useSession() {
  const [session, setSession] = useState<Session | null>(() => sessionStore.get());
  useEffect(() => {
    const sync = () => setSession(sessionStore.get());
    window.addEventListener("drinkcard:session", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("drinkcard:session", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return session;
}
