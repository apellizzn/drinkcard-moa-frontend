import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search, RefreshCw, Pause, Play } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  AdminDataTable,
  AdminEmptyRow,
  AdminStatusBadge,
  AdminTable,
} from "@/components/admin/AdminDataTable";
import {
  disableDrinkCardAccountRefill,
  enableDrinkCardAccountRefill,
  listDrinkCardAccounts,
  listVolunteerUsers,
  type PageResponse,
  type UserSummary,
} from "@/services/api/admin-service";
import type { DrinkCardAccount } from "@/services/api/drink-card-service";
import { ApiError } from "@/services/api/http-client";
import { useI18n } from "@/i18n/i18n";
import { dateLocales, statusKey } from "@/i18n/format";

type AccountResponse = DrinkCardAccount[] | PageResponse<DrinkCardAccount>;

export const Route = createFileRoute("/_authenticated/admin/volunteers")({
  component: VolunteersPage,
});

function VolunteersPage() {
  const { language, t } = useI18n();
  const qc = useQueryClient();
  const users = useQuery({
    queryKey: ["admin", "users", "vol"],
    queryFn: () => listVolunteerUsers(500),
  });
  const accounts = useQuery({ queryKey: ["admin", "accounts"], queryFn: listDrinkCardAccounts });
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<string | null>(null);

  const toggleRefill = useMutation({
    mutationFn: ({ volunteerId, enable }: { volunteerId: string; enable: boolean }) =>
      enable
        ? enableDrinkCardAccountRefill(volunteerId)
        : disableDrinkCardAccountRefill(volunteerId),
    onSuccess: (_data, { enable }) => {
      toast.success(enable ? t("toast.refillEnabled") : t("toast.refillDisabled"));
      qc.invalidateQueries({ queryKey: ["admin", "accounts"] });
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : t("errors.refillUpdate")),
  });

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
          <p className="text-sm font-medium text-slate-500">{t("admin.nav.volunteers")}</p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-950">{t("admin.accountsTitle")}</h1>
        </div>
        <button
          onClick={() => {
            users.refetch();
            accounts.refetch();
          }}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <RefreshCw className="h-4 w-4" /> {t("common.refresh")}
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("admin.searchVolunteer")}
          className="input pl-9"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <AdminDataTable
          title={t("admin.volunteerList")}
          description={t("common.results", {
            count: filtered.length,
            suffix: filtered.length === 1 ? "" : "s",
          })}
        >
          <AdminTable>
            <thead>
              <tr>
                <th>{t("common.name")}</th>
                <th>{t("common.email")}</th>
                <th>{t("common.status")}</th>
                <th className="text-right">{t("common.credits")}</th>
                <th className="text-right">{t("admin.refill")}</th>
              </tr>
            </thead>
            <tbody>
              {users.isLoading && (
                <AdminEmptyRow colSpan={5}>{t("common.loadingDots")}</AdminEmptyRow>
              )}
              {!users.isLoading && filtered.length === 0 && (
                <AdminEmptyRow colSpan={5}>{t("admin.noResults")}</AdminEmptyRow>
              )}
              {filtered.map((v) => {
                const accountStatus = v.account?.status;
                const refillEnabled = accountStatus === "ACTIVE";
                const hasAccount = !!v.account;
                const isPending =
                  toggleRefill.isPending && toggleRefill.variables?.volunteerId === v.userId;
                return (
                  <tr
                    key={v.userId}
                    onClick={() => setSel(v.userId)}
                    className={`cursor-pointer ${selected?.userId === v.userId ? "bg-blue-50" : ""}`}
                  >
                    <td className="font-medium text-slate-950">{v.fullName}</td>
                    <td className="text-slate-500">{v.email}</td>
                    <td>
                      <AdminStatusBadge status={v.status} />
                    </td>
                    <td className="text-right text-base font-semibold text-slate-950">
                      {v.account?.credits ?? 0}
                    </td>
                    <td className="text-right">
                      <button
                        type="button"
                        disabled={!hasAccount || isPending}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleRefill.mutate({ volunteerId: v.userId, enable: !refillEnabled });
                        }}
                        title={
                          !hasAccount
                            ? t("admin.noDrinkCard")
                            : refillEnabled
                              ? t("admin.disableRefill")
                              : t("admin.enableRefill")
                        }
                        aria-label={
                          refillEnabled ? t("admin.disableRefill") : t("admin.enableRefill")
                        }
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-md border disabled:cursor-not-allowed disabled:opacity-60 ${
                          refillEnabled
                            ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                            : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        }`}
                      >
                        {refillEnabled ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </AdminTable>
        </AdminDataTable>

        <aside className="admin-panel h-fit p-5">
          {selected ? (
            <>
              <p className="text-sm font-medium text-slate-500">{t("admin.detail")}</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-950">{selected.fullName}</h2>
              <p className="text-sm text-slate-500">{selected.email}</p>
              <dl className="mt-4 space-y-3 text-sm">
                <Row k={t("admin.userStatus")} v={t(statusKey(selected.status))} />
                <Row
                  k={t("admin.accountStatus")}
                  v={selected.account?.status ? t(statusKey(selected.account.status)) : "—"}
                />
                <Row k={t("common.credits")} v={String(selected.account?.credits ?? 0)} />
                <Row
                  k={t("app.lastPurchase")}
                  v={
                    selected.account?.lastPurchaseTimestamp
                      ? format(new Date(selected.account.lastPurchaseTimestamp), "d MMM, HH:mm", {
                          locale: dateLocales[language],
                        })
                      : "—"
                  }
                />
                <Row k="ID" v={selected.userId} mono />
              </dl>
            </>
          ) : (
            <p className="text-sm text-slate-500">{t("admin.selectVolunteer")}</p>
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
      <dd
        className={`text-right text-slate-950 ${mono ? "font-mono text-xs break-all" : "font-medium"}`}
      >
        {v}
      </dd>
    </div>
  );
}

function arr<T>(x: unknown): T[] {
  if (Array.isArray(x)) return x as T[];
  if (x && typeof x === "object" && "content" in x) {
    const content = (x as { content?: unknown }).content;
    if (Array.isArray(content)) return content as T[];
  }
  return [];
}
