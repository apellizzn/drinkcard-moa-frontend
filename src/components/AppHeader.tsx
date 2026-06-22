import { Link } from "@tanstack/react-router";
import { UserMenu } from "./UserMenu";
import { ScanLine } from "lucide-react";
import { useSession } from "@/hooks/use-session";
import { canUseBarScanner, defaultAuthenticatedPath } from "@/lib/session";
import { BrandLogo } from "./BrandLogo";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useI18n } from "@/i18n/i18n";

export function AppHeader() {
  const session = useSession();
  const { t } = useI18n();
  return (
    <header className="sticky top-0 z-40 bg-background border-b-2 border-foreground">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <BrandLogo to={session ? defaultAuthenticatedPath(session.role) : "/"} />
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          {canUseBarScanner(session?.role) && (
            <Link
              to="/bar/scanner"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-accent px-3 py-2 font-display text-sm text-accent-foreground sticker hover:translate-y-[-1px] transition-transform"
            >
              <ScanLine className="h-4 w-4" /> {t("nav.scanner")}
            </Link>
          )}
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
