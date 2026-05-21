import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { AdminDataTable, AdminEmptyRow, AdminStatusBadge, AdminTable } from "@/components/admin/AdminDataTable";
import { listDrinkCardAccounts, listVolunteerUsers, type PageResponse, type UserSummary } from "@/services/api/admin-service";
import type { DrinkCardAccount } from "@/services/api/drink-card-service";

type AccountResponse = DrinkCardAccount[] | PageResponse<DrinkCardAccount>;

export const Route = createFileRoute("/_authenticated/admin/volunteers")({
  component: VolunteersPage,
});

function VolunteersPage() {
  const users = useQuery({ queryKey: ["admin", "users", "vol"], queryFn: () => listVolunteerUsers(500) });
  const accounts = useQuery({ queryKey: ["admin", "accounts"], queryFn: listDrinkCardAccounts });
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<string | null>(null);

  const list = useMemo(() => {
    const u = arr<UserSummary>(users.data);
    const a = arr<DrinkCardAccount>(accounts.data as AccountResponse | undefined);
    const accByVol = new Map(a.map((x) => [x.volunteerId, x]));
    return u.map((x) => ({ ...x, account: accByVol.get(x.userId) }));
  }, [users.data, accounts.data]);

  const filtered = list.filter((v) => {
    const text = `${v.fullName ?? ""} ${v.email} ${v.userId}`.toLowerCase();
    return text.includes(q.toLowerCase());
  });
  const selected = filtered.find((v) => v.userId === sel) ?? filtered[0];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm font-medium text-slate-500">Voluntarios</p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-950">Cuentas DrinkCard</h1>
        </div>
        <button onClick={() => { users.refetch(); accounts.refetch(); }} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          <RefreshCw className="h-4 w-4" /> Refrescar
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre, email o ID" className="input pl-9" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <AdminDataTable title="Listado de voluntarios" description={`${filtered.length} resultado${filtered.length === 1 ? "" : "s"}`}>
          <AdminTable>
            <thead>
              <tr><th>Nombre</th><th>Email</th><th>Estado</th><th className="text-right">Créditos</th></tr>
            </thead>
            <tbody>
              {users.isLoading && <AdminEmptyRow colSpan={4}>Cargando...</AdminEmptyRow>}
              {!users.isLoading && filtered.length === 0 && <AdminEmptyRow colSpan={4}>Sin resultados</AdminEmptyRow>}
              {filtered.map((v) => (
                <tr key={v.userId} onClick={() => setSel(v.userId)} className={`cursor-pointer ${selected?.userId === v.userId ? "bg-blue-50" : ""}`}>
                  <td className="font-medium text-slate-950">{v.fullName}</td>
                  <td className="text-slate-500">{v.email}</td>
                  <td><AdminStatusBadge status={v.status} /></td>
                  <td className="text-right text-base font-semibold text-slate-950">{v.account?.credits ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </AdminTable>
        </AdminDataTable>

        <aside className="admin-panel h-fit p-5">
          {selected ? (
            <>
              <p className="text-sm font-medium text-slate-500">Detalle</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-950">{selected.fullName}</h2>
              <p className="text-sm text-slate-500">{selected.email}</p>
              <dl className="mt-4 space-y-3 text-sm">
                <Row k="Estado usuario" v={selected.status} />
                <Row k="Estado cuenta" v={selected.account?.status ?? "—"} />
                <Row k="Créditos" v={String(selected.account?.credits ?? 0)} />
                <Row k="Última compra" v={selected.account?.lastPurchaseTimestamp ? format(new Date(selected.account.lastPurchaseTimestamp), "d MMM, HH:mm") : "—"} />
                <Row k="ID" v={selected.userId} mono />
              </dl>
            </>
          ) : (
            <p className="text-sm text-slate-500">Selecciona un voluntario para ver el detalle.</p>
          )}
        </aside>
      </div>
    </div>
  );
}

function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-slate-500">{k}</dt>
      <dd className={`text-right text-slate-950 ${mono ? "font-mono text-xs break-all" : "font-medium"}`}>{v}</dd>
    </div>
  );
}

function arr<T>(x: unknown): T[] {
  if (Array.isArray(x)) return x as T[];
  if (x && typeof x === "object" && "content" in (x as any) && Array.isArray((x as any).content)) return (x as any).content;
  return [];
}
