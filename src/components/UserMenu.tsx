import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, User, ShieldCheck, ScanLine } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { canUseBarScanner, isAdmin, sessionStore } from "@/lib/session";
import { useSession } from "@/hooks/use-session";
import { logoutUser } from "@/services/api/auth-service";
import { toast } from "sonner";
import { useI18n } from "@/i18n/i18n";

export function UserMenu() {
  const session = useSession();
  const navigate = useNavigate();
  const { t } = useI18n();
  if (!session) return null;

  const initials =
    `${session.firstName?.[0] ?? session.email[0]}${session.lastName?.[0] ?? ""}`.toUpperCase();
  const handleLogout = async () => {
    const refreshToken = sessionStore.get()?.refreshToken;
    if (refreshToken) {
      try {
        await logoutUser({ refreshToken });
      } catch {
        // Local logout should still complete if the backend is unreachable.
      }
    }

    sessionStore.clear();
    toast.success(t("toast.loggedOut"));
    navigate({ to: "/" });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label={t("nav.myCard")}
          className="flex items-center gap-2 rounded-full border-2 border-foreground/10 bg-card pl-1 pr-3 py-1 hover:bg-muted transition-colors sticker"
        >
          <span className="grid h-8 w-8 place-items-center rounded-full bg-primary font-display text-primary-foreground">
            {initials}
          </span>
          <span className="hidden sm:block text-sm font-medium max-w-[140px] truncate">
            {session.firstName ?? session.email}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="font-medium truncate">
              {session.firstName ? `${session.firstName} ${session.lastName ?? ""}` : session.email}
            </span>
            <span className="text-xs text-muted-foreground truncate">{session.email}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {!isAdmin(session.role) && (
          <DropdownMenuItem asChild>
            <Link to="/app" className="cursor-pointer">
              <User className="mr-2 h-4 w-4" /> {t("nav.myCard")}
            </Link>
          </DropdownMenuItem>
        )}
        {canUseBarScanner(session.role) && (
          <DropdownMenuItem asChild>
            <Link to="/bar/scanner" className="cursor-pointer">
              <ScanLine className="mr-2 h-4 w-4" /> {t("nav.barScanner")}
            </Link>
          </DropdownMenuItem>
        )}
        {session.role === "ADMIN" && (
          <DropdownMenuItem asChild>
            <Link to="/admin" className="cursor-pointer">
              <ShieldCheck className="mr-2 h-4 w-4" /> {t("nav.adminPanel")}
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => void handleLogout()}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" /> {t("nav.logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
