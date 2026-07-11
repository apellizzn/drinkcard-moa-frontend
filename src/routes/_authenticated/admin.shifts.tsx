import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { Loader2, Plus, RefreshCw, Search, Trash2, X } from "lucide-react";
import {
  AdminDataTable,
  AdminEmptyRow,
  AdminTable,
} from "@/components/admin/AdminDataTable";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { addTurn, deleteTurn, listTurns, type TurnSummary } from "@/services/api/turn-service";
import { ApiError } from "@/services/api/http-client";
import { resultCount } from "@/lib/i18n";
import { useLanguage } from "@/lib/i18n-react";

export const Route = createFileRoute("/_authenticated/admin/shifts")({
  component: TurnsPage,
});

const PAGE_SIZE = 20;

type TurnForm = { email: string; date: string };

function TurnsPage() {
  const qc = useQueryClient();
  const { language, t, dateLocale } = useLanguage();

  const [emailFilter, setEmailFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [page, setPage] = useState(0);
  const [pendingDelete, setPendingDelete] = useState<TurnSummary | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const turnsQuery = useQuery({
    queryKey: ["admin", "turns", { email: emailFilter, date: dateFilter, page }],
    queryFn: () =>
      listTurns({
        email: emailFilter || undefined,
        date: dateFilter || undefined,
        page,
        size: PAGE_SIZE,
      }),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "turns"] });

  const create = useMutation({
    mutationFn: addTurn,
    onSuccess: () => {
      toast.success(t("admin.turns.addSuccess"));
      setAddOpen(false);
      invalidate();
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : t("admin.turns.addError")),
  });

  const del = useMutation({
    mutationFn: deleteTurn,
    onSuccess: () => {
      toast.success(t("admin.turns.deleteSuccess"));
      setPendingDelete(null);
      invalidate();
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : t("admin.turns.deleteError")),
  });

  const rows = turnsQuery.data?.content ?? [];
  const totalPages = turnsQuery.data?.totalPages ?? 0;
  const totalElements = turnsQuery.data?.totalElements ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{t("admin.nav.shifts")}</p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-950">{t("admin.turns.title")}</h1>
          <p className="mt-1 text-sm text-slate-500">{t("admin.turns.description")}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => turnsQuery.refetch()}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" /> {t("common.refresh")}
          </button>
          <button
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" /> {t("admin.turns.add")}
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_200px_auto]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={emailFilter}
            onChange={(e) => {
              setEmailFilter(e.target.value);
              setPage(0);
            }}
            placeholder={t("admin.turns.filterEmailPlaceholder")}
            className="input pl-9"
          />
        </div>
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => {
            setDateFilter(e.target.value);
            setPage(0);
          }}
          className="input"
        />
        {(emailFilter || dateFilter) && (
          <button
            type="button"
            onClick={() => {
              setEmailFilter("");
              setDateFilter("");
              setPage(0);
            }}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            <X className="h-4 w-4" /> {t("common.clear")}
          </button>
        )}
      </div>

      <AdminDataTable
        title={t("admin.turns.scheduled")}
        description={resultCount(language, totalElements)}
      >
        <AdminTable>
          <thead>
            <tr>
              <th>{t("admin.turns.date")}</th>
              <th>{t("admin.turns.email")}</th>
              <th>{t("admin.turns.createdAt")}</th>
              <th className="text-right">{t("admin.common.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {turnsQuery.isLoading && (
              <AdminEmptyRow colSpan={4}>{t("admin.common.loading")}</AdminEmptyRow>
            )}
            {!turnsQuery.isLoading && rows.length === 0 && (
              <AdminEmptyRow colSpan={4}>{t("common.noResults")}</AdminEmptyRow>
            )}
            {rows.map((turn) => (
              <tr key={turn.turnId}>
                <td className="font-medium text-slate-950">
                  {format(parseISO(turn.date), "PPP", { locale: dateLocale })}
                </td>
                <td className="text-slate-700">{turn.email}</td>
                <td className="text-slate-500">
                  {format(new Date(turn.createdAt), "d MMM yyyy, HH:mm", { locale: dateLocale })}
                </td>
                <td className="text-right">
                  <button
                    type="button"
                    onClick={() => setPendingDelete(turn)}
                    title={t("admin.turns.delete")}
                    aria-label={t("admin.turns.delete")}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </AdminTable>
      </AdminDataTable>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>
            {t("admin.common.page")} {page + 1} / {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page === 0 || turnsQuery.isFetching}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t("admin.common.previous")}
            </button>
            <button
              type="button"
              disabled={page + 1 >= totalPages || turnsQuery.isFetching}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t("admin.common.next")}
            </button>
          </div>
        </div>
      )}

      <AddTurnDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSubmit={(data) => create.mutate(data)}
        pending={create.isPending}
      />

      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("admin.turns.deleteConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete
                ? t("admin.turns.deleteConfirmBody", {
                    email: pendingDelete.email,
                    date: format(parseISO(pendingDelete.date), "PPP", { locale: dateLocale }),
                  })
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={del.isPending}>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              disabled={del.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (pendingDelete) del.mutate(pendingDelete.turnId);
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              {del.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t("admin.turns.delete")
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function AddTurnDialog({
  open,
  onOpenChange,
  onSubmit,
  pending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: TurnForm) => void;
  pending: boolean;
}) {
  const { t } = useLanguage();

  const schema = useMemo(
    () =>
      z.object({
        email: z.string().email(t("validation.email")),
        date: z.string().min(1, t("validation.required")),
      }),
    [t],
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TurnForm>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", date: "" },
  });

  const handleClose = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">{t("admin.turns.addTitle")}</h2>
            <p className="mt-1 text-sm text-slate-500">{t("admin.turns.addDescription")}</p>
          </div>
          <button
            type="button"
            onClick={() => handleClose(false)}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label={t("common.close")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <form
          onSubmit={handleSubmit((data) => {
            onSubmit(data);
          })}
          className="space-y-4"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              {t("admin.turns.email")}
            </label>
            <input
              type="email"
              autoComplete="off"
              placeholder="volunteer@example.com"
              {...register("email")}
              className="input"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              {t("admin.turns.date")}
            </label>
            <input type="date" {...register("date")} className="input" />
            {errors.date && <p className="mt-1 text-xs text-red-600">{errors.date.message}</p>}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => handleClose(false)}
              disabled={pending}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("admin.turns.add")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
