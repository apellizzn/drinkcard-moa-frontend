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
import { toast } from "sonner";

export function UserMenu() {
  const session = useSession();
  const navigate = useNavigate();
  if (!session) return null;

  const initials = `${session.firstName?.[0] ?? session.email[0]}${session.lastName?.[0] ?? ""}`.toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Menú de usuario"
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
            <span className="font-medium truncate">{session.firstName ? `${session.firstName} ${session.lastName ?? ""}` : session.email}</span>
            <span className="text-xs text-muted-foreground truncate">{session.email}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {!isAdmin(session.role) && (
          <DropdownMenuItem asChild>
            <Link to="/app" className="cursor-pointer">
              <User className="mr-2 h-4 w-4" /> Mi tarjeta
            </Link>
          </DropdownMenuItem>
        )}
        {canUseBarScanner(session.role) && (
          <DropdownMenuItem asChild>
            <Link to="/bar/scanner" className="cursor-pointer">
              <ScanLine className="mr-2 h-4 w-4" /> Escáner barra
            </Link>
          </DropdownMenuItem>
        )}
        {session.role === "ADMIN" && (
          <DropdownMenuItem asChild>
            <Link to="/admin" className="cursor-pointer">
              <ShieldCheck className="mr-2 h-4 w-4" /> Panel admin
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            sessionStore.clear();
            toast.success("Sesión cerrada");
            navigate({ to: "/" });
          }}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" /> Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
