"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Download, Edit3, Eye, FileText, Plus, Printer, Search, Trash2, Upload } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, type FieldValues } from "react-hook-form";
import type { ZodType } from "zod";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useApp } from "@/components/providers";
import { StaffGuard } from "@/components/auth/staff-guard";
import { useRealtimeCollection } from "@/hooks/useRealtimeCollection";
import { audit, createRecord, deleteRecord, updateRecord, uploadFile, type CollectionName } from "@/lib/firestore-service";
import type { BaseRecord, GymPackage } from "@/lib/firebase-types";
import { cn } from "@/lib/utils";

export type FieldConfig = {
  name: string;
  label: string;
  type?: "text" | "number" | "date" | "email" | "select" | "textarea" | "checkbox";
  options?: readonly string[];
  section?: string;
  required?: boolean;
};

export type ModuleAction<T> = {
  label: string;
  value: Partial<T>;
};

type ModuleManagerProps<T extends BaseRecord> = {
  title: string;
  subtitle: string;
  collectionName: CollectionName;
  schema: ZodType<FieldValues, FieldValues>;
  fields: readonly FieldConfig[];
  columns: { key: keyof T; label: string }[];
  defaultValues: Record<string, unknown>;
  searchKeys: (keyof T)[];
  actions?: ModuleAction<T>[];
  uploadPath?: (record: T) => string;
  layout?: "split" | "wide";
  detailPath?: (record: T) => string;
};

function normalize(value: unknown) {
  return String(value ?? "").toLowerCase();
}

function exportCsv<T extends BaseRecord>(title: string, rows: T[]) {
  const keys = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  const csv = [keys.join(","), ...rows.map((row) => keys.map((key) => JSON.stringify((row as Record<string, unknown>)[key] ?? "")).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${title.toLowerCase().replace(/\s+/g, "-")}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function generateMemberId() {
  return `EF-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
}

function dateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function addDays(dateKeyValue: string, days: number) {
  const date = new Date(`${dateKeyValue || dateKey()}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function toNumber(value: unknown) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}

const memberPaymentFieldNames = new Set([
  "initialPaymentMethod",
  "initialPaymentStatus",
  "initialPaymentAmount",
  "initialPaidAmount",
  "initialPendingAmount",
  "initialPaidAt",
  "initialInvoiceNumber"
]);

export function ModuleManager<T extends BaseRecord>({
  title,
  subtitle,
  collectionName,
  schema,
  fields,
  columns,
  defaultValues,
  searchKeys,
  actions = [],
  uploadPath,
  layout = "wide",
  detailPath
}: ModuleManagerProps<T>) {
  const { data, loading, error } = useRealtimeCollection<T>(collectionName);
  const packages = useRealtimeCollection<GymPackage>("packages", undefined, { enabled: collectionName === "members" });
  const { toast } = useApp();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortKey, setSortKey] = useState<string>(String(columns[0]?.key ?? "updatedAt"));
  const [editing, setEditing] = useState<T | null>(null);
  const [selectedActions, setSelectedActions] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const lastPackageRef = useRef("");
  const pageSize = 8;

  const form = useForm<FieldValues>({
    resolver: zodResolver(schema),
    defaultValues
  });
  const watchedPackageName = form.watch("packageName");
  const watchedMembershipStart = form.watch("membershipStart");
  const watchedPaymentStatus = form.watch("initialPaymentStatus");
  const watchedPaymentAmount = form.watch("initialPaymentAmount");
  const watchedPaidAmount = form.watch("initialPaidAmount");

  const activePackages = useMemo(
    () => packages.data.filter((item) => item.status === "Active").sort((a, b) => a.name.localeCompare(b.name)),
    [packages.data]
  );

  const selectedPackage = useMemo(
    () => activePackages.find((item) => item.name === watchedPackageName),
    [activePackages, watchedPackageName]
  );

  const visibleFields = useMemo(
    () =>
      fields.map((field) => {
        if (collectionName === "members" && field.name === "packageName") {
          return {
            ...field,
            type: "select" as const,
            options: ["", ...activePackages.map((item) => item.name)]
          };
        }

        return field;
      }),
    [activePackages, collectionName, fields]
  );

  const statuses = useMemo(() => {
    const values = data.map((item) => String((item as Record<string, unknown>).status ?? "")).filter(Boolean);
    return ["All", ...Array.from(new Set(values))];
  }, [data]);

  const filtered = useMemo(() => {
    return data
      .filter((item) => {
        const matchesSearch = searchKeys.some((key) => normalize(item[key]).includes(query.toLowerCase()));
        const itemStatus = String((item as Record<string, unknown>).status ?? "");
        const matchesStatus = statusFilter === "All" || itemStatus === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => normalize((b as Record<string, unknown>)[sortKey]).localeCompare(normalize((a as Record<string, unknown>)[sortKey])));
  }, [data, query, searchKeys, sortKey, statusFilter]);

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));

  useEffect(() => {
    if (collectionName !== "members" || !selectedPackage) {
      return;
    }

    const start = String(watchedMembershipStart || dateKey());
    const packageChanged = lastPackageRef.current !== selectedPackage.name;
    lastPackageRef.current = selectedPackage.name;

    form.setValue("membershipStart", start, { shouldDirty: false });
    form.setValue("membershipEnd", addDays(start, Math.max(1, Number(selectedPackage.durationDays || 30)) - 1), { shouldDirty: true });

    if (packageChanged) {
      const amount = toNumber(selectedPackage.price);
      form.setValue("initialPaymentAmount", amount, { shouldDirty: true });
      form.setValue("initialPaidAmount", watchedPaymentStatus === "Pending" ? 0 : amount, { shouldDirty: true });
      form.setValue("initialPendingAmount", watchedPaymentStatus === "Pending" ? amount : 0, { shouldDirty: true });
      form.setValue("initialInvoiceNumber", `EF-INV-${Date.now()}`, { shouldDirty: false });
    }
  }, [collectionName, form, selectedPackage, watchedMembershipStart, watchedPaymentStatus]);

  useEffect(() => {
    if (collectionName !== "members") {
      return;
    }

    const amount = toNumber(watchedPaymentAmount);
    const paid = toNumber(watchedPaidAmount);

    if (watchedPaymentStatus === "Paid") {
      form.setValue("initialPaidAmount", amount, { shouldDirty: true });
      form.setValue("initialPendingAmount", 0, { shouldDirty: true });
    } else if (watchedPaymentStatus === "Pending") {
      form.setValue("initialPaidAmount", 0, { shouldDirty: true });
      form.setValue("initialPendingAmount", amount, { shouldDirty: true });
    } else if (watchedPaymentStatus === "Partial") {
      form.setValue("initialPendingAmount", Math.max(0, amount - paid), { shouldDirty: true });
    }
  }, [collectionName, form, watchedPaidAmount, watchedPaymentAmount, watchedPaymentStatus]);

  async function submit(values: FieldValues) {
    try {
      const memberFormValues = { ...values };
      const initialAmount = toNumber(memberFormValues.initialPaymentAmount);
      const initialPaidAmount = toNumber(memberFormValues.initialPaidAmount);
      const initialPendingAmount = toNumber(memberFormValues.initialPendingAmount);
      const initialPaymentStatus = String(memberFormValues.initialPaymentStatus || "Pending") as "Paid" | "Partial" | "Pending";
      const shouldCreateInitialPayment = collectionName === "members" && !editing && (initialAmount > 0 || initialPaidAmount > 0 || initialPendingAmount > 0);
      const generatedMemberId = collectionName === "members" && !editing ? generateMemberId() : String(memberFormValues.memberId || "");

      for (const name of memberPaymentFieldNames) {
        delete memberFormValues[name];
      }

      const payload =
        collectionName === "members" && !editing
          ? {
              ...memberFormValues,
              memberId: generatedMemberId,
              latestPaymentStatus: shouldCreateInitialPayment ? initialPaymentStatus : "No Payment",
              latestPaymentDate: shouldCreateInitialPayment ? String(values.initialPaidAt || dateKey()) : "",
              latestInvoice: shouldCreateInitialPayment ? String(values.initialInvoiceNumber || `EF-INV-${Date.now()}`) : "",
              pendingAmount: shouldCreateInitialPayment ? initialPendingAmount : 0
            }
          : memberFormValues;

      if (editing) {
        await updateRecord(collectionName, editing.id, payload);
        await audit("update", collectionName, editing.id);
        toast(`${title} updated`, "success");
      } else {
        const id = await createRecord(collectionName, payload);
        if (shouldCreateInitialPayment) {
          await createRecord("payments", {
            memberId: generatedMemberId,
            memberName: String(values.fullName || ""),
            method: String(values.initialPaymentMethod || "UPI"),
            type: "Admission",
            amount: initialAmount,
            paidAmount: initialPaidAmount,
            pendingAmount: initialPendingAmount,
            invoiceNumber: String(values.initialInvoiceNumber || `EF-INV-${Date.now()}`),
            status: initialPaymentStatus,
            paidAt: String(values.initialPaidAt || dateKey()),
            membershipStart: String(values.membershipStart || dateKey()),
            membershipEnd: String(values.membershipEnd || "")
          });
        }
        await audit("create", collectionName, id);
        toast(`${title} created`, "success");
      }
      setEditing(null);
      lastPackageRef.current = "";
      form.reset(defaultValues);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Save failed", "error");
    }
  }

  async function remove(record: T) {
    if (!window.confirm(`Delete this ${title.toLowerCase()} record?`)) {
      return;
    }

    try {
      await deleteRecord(collectionName, record.id);
      await audit("delete", collectionName, record.id);
      toast(`${title} deleted`, "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Delete failed", "error");
    }
  }

  async function applyAction(record: T, action: ModuleAction<T>) {
    try {
      await updateRecord(collectionName, record.id, action.value as Record<string, unknown>);
      await audit(action.label, collectionName, record.id);
      toast(`${action.label} complete`, "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Action failed", "error");
    }
  }

  async function upload(record: T, file: File) {
    if (!uploadPath) {
      return;
    }

    try {
      const url = await uploadFile(uploadPath(record), file);
      await updateRecord(collectionName, record.id, { photoUrl: url, documentUrl: url });
      toast("File uploaded", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Upload failed", "error");
    }
  }

  return (
    <StaffGuard>
      <main className="flex min-h-screen overflow-x-hidden bg-[#050505] text-white">
        <Sidebar />
        <section className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 border-b border-white/10 bg-[#050505]/90 px-4 py-4 backdrop-blur md:px-7">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0 break-words">
              <p className="text-sm text-white/50">{subtitle}</p>
              <h1 className="text-2xl font-black md:text-3xl">{title}</h1>
            </div>
            <div className="grid w-full gap-2 sm:flex sm:w-auto sm:flex-wrap">
              <div className="flex h-11 w-full items-center gap-2 rounded-lg border border-white/10 bg-white/6 px-3 sm:min-w-64">
                <Search size={18} className="text-white/40" />
                <input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full bg-transparent text-sm outline-none" placeholder={`Search ${title.toLowerCase()}...`} />
              </div>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-11 w-full rounded-lg border border-white/10 bg-[#111111] px-3 text-sm sm:w-auto">
                {statuses.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
              <select value={sortKey} onChange={(event) => setSortKey(event.target.value)} className="h-11 w-full rounded-lg border border-white/10 bg-[#111111] px-3 text-sm sm:w-auto">
                {columns.map((column) => (
                  <option key={String(column.key)} value={String(column.key)}>
                    Sort: {column.label}
                  </option>
                ))}
              </select>
              <Button variant="secondary" className="w-full sm:w-auto" onClick={() => exportCsv(title, filtered)}>
                <Download size={18} /> Export
              </Button>
              <Button variant="secondary" className="w-full sm:w-auto" onClick={() => window.print()}>
                <Printer size={18} /> Print
              </Button>
            </div>
          </div>
        </header>

        <div className={cn("grid gap-7 p-4 md:p-7", layout === "wide" ? "grid-cols-1" : "xl:grid-cols-[minmax(24rem,0.9fr)_minmax(0,1.1fr)]")}>
          <Card>
            <div className="mb-6 flex flex-col gap-3 border-b border-white/8 pb-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 break-words">
                <h2 className="text-xl font-black">{editing ? "Edit Record" : "Create Record"}</h2>
                <p className="mt-1 text-sm text-white/50">Enter the important details with enough space to review before saving.</p>
              </div>
              <Button
                variant="secondary"
                className="w-full sm:w-auto"
                onClick={() => {
                  setEditing(null);
                  form.reset(defaultValues);
                }}
              >
                <Plus size={18} /> New
              </Button>
            </div>
            <form className={cn("grid gap-x-6 gap-y-5 md:grid-cols-2", layout === "wide" && "xl:grid-cols-3")} onSubmit={form.handleSubmit(submit)}>
              {visibleFields.map((field) => (
                <label key={field.name} className={cn("min-w-0", field.type === "textarea" && "md:col-span-2", layout === "wide" && field.type === "textarea" && "xl:col-span-3")}>
                  <span className="mb-2 block text-sm font-semibold text-white/68">
                    {field.label}
                    {field.required && <span className="ml-1 text-[#E10600]">*</span>}
                  </span>
                  {field.type === "textarea" ? (
                    <textarea className="min-h-32 w-full rounded-lg border border-white/10 bg-black/35 px-4 py-3 leading-6 outline-none focus:border-[#E10600]" {...form.register(field.name)} />
                  ) : field.type === "select" ? (
                    <select className="h-12 w-full rounded-lg border border-white/10 bg-[#111111] px-4 outline-none focus:border-[#E10600]" {...form.register(field.name)}>
                      {field.options?.map((option) => (
                        <option key={option} value={option}>
                          {option || "Select package"}
                        </option>
                      ))}
                    </select>
                  ) : field.type === "checkbox" ? (
                    <div className="flex h-12 items-center rounded-lg border border-white/10 bg-black/25 px-4">
                      <input type="checkbox" className="size-5 accent-[#E10600]" {...form.register(field.name)} />
                    </div>
                  ) : (
                    <input type={field.type ?? "text"} className="h-12 w-full rounded-lg border border-white/10 bg-black/35 px-4 outline-none focus:border-[#E10600]" {...form.register(field.name, { valueAsNumber: field.type === "number" })} />
                  )}
                  {form.formState.errors[field.name] && <span className="mt-1 block text-xs text-[#DC2626]">This field needs a valid value.</span>}
                </label>
              ))}
              <div className={cn("mt-2 grid gap-3 border-t border-white/8 pt-5 sm:flex sm:flex-wrap md:col-span-2", layout === "wide" && "xl:col-span-3")}>
                <Button type="submit" className="w-full sm:w-auto">{editing ? "Update" : "Save"}</Button>
                <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={() => form.reset(defaultValues)}>
                  Cancel
                </Button>
              </div>
            </form>
          </Card>

          <Card>
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 break-words">
                <h2 className="text-xl font-black">Live Records</h2>
                <p className="text-sm text-white/50">{filtered.length} matching Firestore records</p>
              </div>
              {loading && <span className="rounded-full bg-white/8 px-3 py-1 text-xs">Loading...</span>}
            </div>

            {error && <div className="mb-4 rounded-lg border border-[#DC2626]/30 bg-[#DC2626]/10 p-3 text-sm text-[#ffb4b4]">{error}</div>}

            <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
              <table className="w-full min-w-[780px] text-sm">
                <thead className="text-left text-white/45">
                  <tr>
                    {columns.map((column) => (
                      <th key={String(column.key)} className="py-3 pr-4">{column.label}</th>
                    ))}
                    <th className="w-[22rem] min-w-[22rem] py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((record, index) => (
                    <motion.tr key={record.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }} className="border-t border-white/8">
                      {columns.map((column) => (
                        <td key={String(column.key)} className="max-w-56 truncate py-4 pr-4">
                          {String(record[column.key] ?? "-")}
                        </td>
                      ))}
                      <td className="w-[22rem] min-w-[22rem] py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="secondary"
                            type="button"
                            title="Edit record"
                            aria-label="Edit record"
                            className="size-10 min-h-0 shrink-0 px-0 py-0"
                            onClick={() => {
                              setEditing(record);
                              form.reset(record as FieldValues);
                            }}
                          >
                            <Edit3 size={16} />
                          </Button>
                          {actions.length > 0 && (
                            <select
                              value={selectedActions[record.id] ?? ""}
                              title="Status action"
                              aria-label="Status action"
                              className="h-10 w-28 shrink-0 rounded-lg border border-white/12 bg-[#111111] px-2 text-xs font-semibold text-white outline-none focus:border-[#E10600]"
                              onChange={(event) => {
                                const action = actions.find((item) => item.label === event.target.value);
                                setSelectedActions((value) => ({ ...value, [record.id]: event.target.value }));
                                if (action) {
                                  void applyAction(record, action).finally(() => {
                                    setSelectedActions((value) => ({ ...value, [record.id]: "" }));
                                  });
                                }
                              }}
                            >
                              <option value="">Status</option>
                              {actions.map((action) => (
                                <option key={action.label} value={action.label}>
                                  {action.label}
                                </option>
                              ))}
                            </select>
                          )}
                          {uploadPath && (
                            <label className="inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-white/12 bg-white/8 text-sm font-semibold hover:bg-white/12" title="Upload file" aria-label="Upload file">
                              <Upload size={16} />
                              <input type="file" className="hidden" onChange={(event) => event.target.files?.[0] && upload(record, event.target.files[0])} />
                            </label>
                          )}
                          {collectionName === "members" && (
                            <>
                              {detailPath && (
                                <Link href={detailPath(record)}>
                                  <Button variant="secondary" type="button" title="View details" aria-label="View details" className="size-10 min-h-0 shrink-0 px-0 py-0">
                                    <Eye size={16} />
                                  </Button>
                                </Link>
                              )}
                              <Button variant="secondary" type="button" title="Open card" aria-label="Open card" className="size-10 min-h-0 shrink-0 px-0 py-0" onClick={() => window.open(`/members/card?id=${record.id}`, "_blank")}>
                                <FileText size={16} />
                              </Button>
                            </>
                          )}
                          <Button variant="secondary" type="button" title="Delete record" aria-label="Delete record" className="size-10 min-h-0 shrink-0 px-0 py-0 text-[#ffb4b4]" onClick={() => remove(record)}>
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!loading && filtered.length === 0 && (
              <div className="rounded-lg border border-dashed border-white/15 p-5 text-center text-white/55 sm:p-8">
                No Firestore records yet. Create the first one using the form.
              </div>
            )}

            <div className="mt-5 flex flex-col gap-3 text-sm text-white/60 sm:flex-row sm:items-center sm:justify-between">
              <span>
                Page {page} of {pages}
              </span>
              <div className="grid gap-2 sm:flex">
                <Button variant="secondary" className="w-full sm:w-auto" disabled={page === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>
                  Previous
                </Button>
                <Button variant="secondary" className="w-full sm:w-auto" disabled={page === pages} onClick={() => setPage((value) => Math.min(pages, value + 1))}>
                  Next
                </Button>
              </div>
            </div>
          </Card>
          </div>
        </section>
      </main>
    </StaffGuard>
  );
}
