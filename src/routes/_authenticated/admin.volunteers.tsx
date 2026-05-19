import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Sticker } from "@/components/Sticker";
import { useMemo, useState } from "react";
import { Search, RefreshCw } from "lucide-react";
import { format } from "date-fns";

interface User { id: string; firstName?: string; lastName?: string; email: string; role: string; status: string }
interface Account { volunteerId: string; credits: number; status: string; lastPurchaseTimestamp?: string | null }

export const Route = createFileRoute("/_authenticated/admin/volunteers")({
  component: VolunteersPage,
});

function VolunteersPage() {
  const users = useQuery({ queryKey: ["admin", "users", "vol"], queryFn: () => api<unknown>("/api/v1/admin/users?role=VOLUNTEER&size=500") });
  const accounts = useQuery({ queryKey: ["admin", "accounts"], queryFn: () => api<unknown>("/api/v1/admin/drink-card-accounts") });
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<string | null>(null);

  const list = useMemo(() => {
    const u = arr<User>(users.data);
    const a = arr<Account>(accounts.data);
    const accByVol = new Map(a.map((x) => [x.volunteerId, x]));
    return u.map((x) => ({ ...x, account: accByVol.get(x.id) }));
  }, [users.data, accounts.data]);

  const filtered = list.filter((v) => {
    const text = `${v.firstName ?? ""} ${v.lastName ?? ""} ${v.email} ${v.id}`.toLowerCase();
    return text.includes(q.toLowerCase());
  });
  const selected = filtered.find((v) => v.id === sel) ?? filtered[0];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <Sticker color="cyan" rotate={-3}>Voluntarios</Sticker>
          <h1 className="mt-2 font-display text-5xl">Cuentas DrinkCard</h1>
        </div>
        <button onClick={() => { users.refetch(); accounts.refetch(); }} className="inline-flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-sm hover:bg-muted">
          <RefreshCw className="h-4 w-4" /> Refrescar
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre, email o ID" className="input pl-9" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="rounded-3xl border-2 bg-card p-3 sticker overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr><th className="px-2 py-2">Nombre</th><th>Email</th><th>Estado</th><th className="text-right pr-2">Créditos</th></tr>
            </thead>
            <tbody>
              {users.isLoading && <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">Cargando...</td></tr>}
              {!users.isLoading && filtered.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">Sin resultados</td></tr>}
              {filtered.map((v) => (
                <tr key={v.id} onClick={() => setSel(v.id)} className={`cursor-pointer border-t border-border ${selected?.id === v.id ? "bg-muted" : "hover:bg-muted/50"}`}>
                  <td className="px-2 py-2 font-medium">{v.firstName} {v.lastName}</td>
                  <td className="text-muted-foreground">{v.email}</td>
                  <td><span className="text-xs">{v.status}</span></td>
                  <td className="text-right pr-2 font-display text-lg">{v.account?.credits ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <aside className="rounded-3xl border-2 bg-card p-5 sticker h-fit">
          {selected ? (
            <>
              <Sticker color="yellow" rotate={-5}>Detalle</Sticker>
              <h2 className="mt-3 font-display text-3xl">{selected.firstName} {selected.lastName}</h2>
              <p className="text-sm text-muted-foreground">{selected.email}</p>
              <dl className="mt-4 space-y-3 text-sm">
                <Row k="Estado usuario" v={selected.status} />
                <Row k="Estado cuenta" v={selected.account?.status ?? "—"} />
                <Row k="Créditos" v={String(selected.account?.credits ?? 0)} />
                <Row k="Última compra" v={selected.account?.lastPurchaseTimestamp ? format(new Date(selected.account.lastPurchaseTimestamp), "d MMM, HH:mm") : "—"} />
                <Row k="ID" v={selected.id} mono />
              </dl>
            </>
          ) : (
            <p className="text-muted-foreground text-sm">Selecciona un voluntario para ver el detalle.</p>
          )}
        </aside>
      </div>
    </div>
  );
}

function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className={`text-right ${mono ? "font-mono text-xs break-all" : "font-medium"}`}>{v}</dd>
    </div>
  );
}

function arr<T>(x: unknown): T[] {
  if (Array.isArray(x)) return x as T[];
  if (x && typeof x === "object" && "content" in (x as any) && Array.isArray((x as any).content)) return (x as any).content;
  return [];
}
