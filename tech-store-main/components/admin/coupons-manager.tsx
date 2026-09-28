"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

type DiscountType = "PERCENTAGE" | "FIXED";

export type CouponRow = {
  id: string;
  code: string;
  type: DiscountType;
  value: number;
  minOrderAmount: number | null;
  maxDiscount: number | null;
  usageLimit: number | null;
  usageLimitPerUser: number;
  usedCount: number;
  startsAt: Date | null;
  expiresAt: Date | null;
  isActive: boolean;
};

type FormState = {
  code: string;
  type: DiscountType;
  value: string;
  minOrderAmount: string;
  maxDiscount: string;
  usageLimit: string;
  usageLimitPerUser: string;
  startsAt: string;
  expiresAt: string;
  isActive: boolean;
};

const emptyForm: FormState = {
  code: "",
  type: "PERCENTAGE",
  value: "",
  minOrderAmount: "",
  maxDiscount: "",
  usageLimit: "",
  usageLimitPerUser: "1",
  startsAt: "",
  expiresAt: "",
  isActive: true,
};

// <input type="datetime-local"> بيدي/بياخد string من غير timezone خالص
// ("2026-09-25T14:30"). لو سبناها زي ما هي وبعتناها للسيرفر، Zod
// coerce.date() هيفسرها كـ "وقت محلي" — بس وقت محلي بتاع السيرفر (UTC
// على Vercel غالبًا)، مش وقت الأدمن الفعلي في القاهرة. فبنعمل التحويل هنا
// في المتصفح بالظبط: new Date(value) بتفسر الـ string بتوقيت المتصفح
// (توقيت الأدمن الحقيقي)، وبعدين .toISOString() بتحولها لـ instant واحد
// مؤكد يوصل السيرفر صح أيًا كان الـ timezone بتاعه
function localInputToISO(value: string): string | null {
  if (!value) return null;
  return new Date(value).toISOString();
}

// والعكس: لما نعرض تاريخ متخزن (UTC) في الـ input، لازم نفكّه لمكوناته
// المحلية (getFullYear/getMonth/...) مش .toISOString().slice(0,16) اللي
// كانت هترجع وقت UTC مش وقت الأدمن المحلي
function dateToLocalInputValue(date: Date | null): string {
  if (!date) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formFromCoupon(c: CouponRow): FormState {
  return {
    code: c.code,
    type: c.type,
    value: String(c.value),
    minOrderAmount: c.minOrderAmount !== null ? String(c.minOrderAmount) : "",
    maxDiscount: c.maxDiscount !== null ? String(c.maxDiscount) : "",
    usageLimit: c.usageLimit !== null ? String(c.usageLimit) : "",
    usageLimitPerUser: String(c.usageLimitPerUser),
    startsAt: dateToLocalInputValue(c.startsAt),
    expiresAt: dateToLocalInputValue(c.expiresAt),
    isActive: c.isActive,
  };
}

export function CouponsManager({ initialCoupons }: { initialCoupons: CouponRow[] }) {
  const router = useRouter();
  const t = useTranslations("AdminCoupons");
  const [coupons, setCoupons] = useState(initialCoupons);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function startEdit(c: CouponRow) {
    setEditingId(c.id);
    setAdding(false);
    setForm(formFromCoupon(c));
    setError("");
  }

  function startAdd() {
    setEditingId(null);
    setAdding(true);
    setForm(emptyForm);
    setError("");
  }

  function cancel() {
    setEditingId(null);
    setAdding(false);
    setError("");
  }

  function statusFor(c: CouponRow): { key: string; tone: "ok" | "muted" | "alert" } {
    const now = new Date();
    if (!c.isActive) return { key: "statusInactive", tone: "muted" };
    if (c.expiresAt && c.expiresAt < now) return { key: "statusExpired", tone: "alert" };
    if (c.startsAt && c.startsAt > now) return { key: "statusScheduled", tone: "muted" };
    if (c.usageLimit !== null && c.usedCount >= c.usageLimit)
      return { key: "statusLimitReached", tone: "alert" };
    return { key: "statusActive", tone: "ok" };
  }

  function mapCouponResponse(data: {
    id: string;
    code: string;
    type: DiscountType;
    value: string | number;
    minOrderAmount: string | number | null;
    maxDiscount: string | number | null;
    usageLimit: number | null;
    usageLimitPerUser: number;
    usedCount: number;
    startsAt: string | null;
    expiresAt: string | null;
    isActive: boolean;
  }): CouponRow {
    // Prisma.Decimal بيتسلسل كـ string في الـ JSON response (مش number)،
    // فلازم نحوله هنا صراحة قبل ما نخزنه في الـ state
    return {
      id: data.id,
      code: data.code,
      type: data.type,
      value: Number(data.value),
      minOrderAmount: data.minOrderAmount !== null ? Number(data.minOrderAmount) : null,
      maxDiscount: data.maxDiscount !== null ? Number(data.maxDiscount) : null,
      usageLimit: data.usageLimit,
      usageLimitPerUser: data.usageLimitPerUser,
      usedCount: data.usedCount,
      startsAt: data.startsAt ? new Date(data.startsAt) : null,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      isActive: data.isActive,
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const payload = {
      code: form.code,
      type: form.type,
      value: Number(form.value),
      minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : null,
      maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
      usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
      usageLimitPerUser: Number(form.usageLimitPerUser),
      startsAt: localInputToISO(form.startsAt),
      expiresAt: localInputToISO(form.expiresAt),
      isActive: form.isActive,
    };

    const url = editingId ? `/api/admin/coupons/${editingId}` : "/api/admin/coupons";
    const method = editingId ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? t("saveFailed"));
      setSubmitting(false);
      return;
    }

    const body = await res.json();
    const saved = mapCouponResponse(body.data);

    // بنحدّث الـ state المحلي هنا صراحة بدل ما نعتمد على router.refresh()
    // لوحده — الـ Client Component ده بيبني الجدول من useState(initialCoupons)
    // اللي بتتقرا مرة واحدة بس؛ تغيير الـ props من فوق (زي اللي router.refresh()
    // بيعمله) مبيعيدش تصفير useState تلقائيًا، فمن غيرها الجدول كان هيفضل
    // زي ما هو لحد ما اليوزر يعمل refresh فعلي بإيده
    setCoupons((prev) =>
      editingId ? prev.map((c) => (c.id === editingId ? saved : c)) : [saved, ...prev],
    );

    setSubmitting(false);
    setEditingId(null);
    setAdding(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    setError("");
    const res = await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? t("deleteFailed"));
      return;
    }

    setCoupons((prev) => prev.filter((c) => c.id !== id));
  }

  const showForm = adding || editingId !== null;

  return (
    <div className="mt-6 space-y-6">
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-2 gap-3 rounded-lg border border-steel/15 p-4"
        >
          <p className="col-span-2 text-xs font-medium uppercase tracking-wide text-steel">
            {editingId ? t("editingCoupon") : t("newCoupon")}
          </p>

          <input
            required
            placeholder={t("code")}
            dir="ltr"
            value={form.code}
            onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
            className="rounded-md border border-steel/25 px-3 py-2 font-mono text-sm"
          />
          <select
            value={form.type}
            onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as DiscountType }))}
            className="rounded-md border border-steel/25 px-3 py-2 text-sm"
          >
            <option value="PERCENTAGE">{t("percentage")}</option>
            <option value="FIXED">{t("fixed")}</option>
          </select>

          <input
            required
            type="number"
            min="0"
            step="0.01"
            dir="ltr"
            placeholder={form.type === "PERCENTAGE" ? `${t("value")} (%)` : `${t("value")} (EGP)`}
            value={form.value}
            onChange={(e) => setForm((p) => ({ ...p, value: e.target.value }))}
            className="rounded-md border border-steel/25 px-3 py-2 text-sm"
          />
          <input
            type="number"
            min="0"
            step="0.01"
            dir="ltr"
            placeholder={t("maxDiscount")}
            value={form.maxDiscount}
            onChange={(e) => setForm((p) => ({ ...p, maxDiscount: e.target.value }))}
            className="rounded-md border border-steel/25 px-3 py-2 text-sm"
          />

          <input
            type="number"
            min="0"
            step="0.01"
            dir="ltr"
            placeholder={t("minOrderAmount")}
            value={form.minOrderAmount}
            onChange={(e) => setForm((p) => ({ ...p, minOrderAmount: e.target.value }))}
            className="rounded-md border border-steel/25 px-3 py-2 text-sm"
          />
          <input
            required
            type="number"
            min="1"
            step="1"
            dir="ltr"
            placeholder={t("usageLimitPerUser")}
            value={form.usageLimitPerUser}
            onChange={(e) => setForm((p) => ({ ...p, usageLimitPerUser: e.target.value }))}
            className="rounded-md border border-steel/25 px-3 py-2 text-sm"
          />
          <input
            type="number"
            min="1"
            step="1"
            dir="ltr"
            placeholder={t("usageLimit")}
            value={form.usageLimit}
            onChange={(e) => setForm((p) => ({ ...p, usageLimit: e.target.value }))}
            className="col-span-2 rounded-md border border-steel/25 px-3 py-2 text-sm"
          />

          <label className="flex flex-col gap-1 text-xs text-steel">
            {t("startsAt")}
            <input
              type="datetime-local"
              dir="ltr"
              value={form.startsAt}
              onChange={(e) => setForm((p) => ({ ...p, startsAt: e.target.value }))}
              className="rounded-md border border-steel/25 px-3 py-2 text-sm text-ink"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-steel">
            {t("expiresAt")}
            <input
              type="datetime-local"
              dir="ltr"
              value={form.expiresAt}
              onChange={(e) => setForm((p) => ({ ...p, expiresAt: e.target.value }))}
              className="rounded-md border border-steel/25 px-3 py-2 text-sm text-ink"
            />
          </label>

          <label className="col-span-2 flex items-center gap-2 text-sm text-steel">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
            />
            {t("active")}
          </label>

          {error && <p className="col-span-2 text-sm text-alert">{error}</p>}

          <div className="col-span-2 flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-md bg-ink py-2 text-sm font-semibold text-paper disabled:opacity-40"
            >
              {submitting ? t("saving") : editingId ? t("saveChanges") : t("addCoupon")}
            </button>
            <button
              type="button"
              onClick={cancel}
              className="rounded-md border border-steel/25 px-4 py-2 text-sm text-steel hover:text-ink"
            >
              {t("cancel")}
            </button>
          </div>
        </form>
      )}

      {!showForm && (
        <button
          type="button"
          onClick={startAdd}
          className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-paper"
        >
          {t("addCoupon")}
        </button>
      )}

      {error && !showForm && <p className="text-sm text-alert">{error}</p>}

      {coupons.length === 0 ? (
        <p className="text-sm text-steel">{t("noCoupons")}</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="text-start text-xs uppercase tracking-wide text-steel">
            <tr>
              <th className="py-2 text-start">{t("code")}</th>
              <th className="py-2 text-start">{t("value")}</th>
              <th className="py-2 text-start">{t("used")}</th>
              <th className="py-2 text-start">{t("status")}</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-steel/10">
            {coupons.map((c) => {
              const status = statusFor(c);
              return (
                <tr key={c.id}>
                  <td className="py-2 font-mono text-ink">{c.code}</td>
                  <td className="py-2 text-steel">
                    {c.type === "PERCENTAGE" ? `${c.value}%` : `EGP ${c.value.toLocaleString()}`}
                  </td>
                  <td className="py-2 font-mono text-xs text-steel">
                    {c.usedCount} / {c.usageLimit ?? t("noLimit")}
                  </td>
                  <td className="py-2">
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-medium ${
                        status.tone === "ok"
                          ? "bg-signal/20 text-ink"
                          : status.tone === "alert"
                            ? "bg-alert/10 text-alert"
                            : "bg-steel/10 text-steel"
                      }`}
                    >
                      {t(status.key)}
                    </span>
                  </td>
                  <td className="py-2 space-x-3 text-end rtl:space-x-reverse">
                    <button onClick={() => startEdit(c)} className="text-xs text-ink hover:underline">
                      {t("edit")}
                    </button>
                    <button onClick={() => handleDelete(c.id)} className="text-xs text-steel hover:text-alert">
                      {t("delete")}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
