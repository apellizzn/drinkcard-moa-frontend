import { Link } from "@tanstack/react-router";
import { UserMenu } from "./UserMenu";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/70 border-b border-border">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary font-display text-2xl text-primary-foreground sticker">
            D
          </span>
          <span className="font-display text-2xl tracking-wide">DrinkCard <span className="text-primary">MOA</span></span>
        </Link>
        <UserMenu />
      </div>
    </header>
  );
}
