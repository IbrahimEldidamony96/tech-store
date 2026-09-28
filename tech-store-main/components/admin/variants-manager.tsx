"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { localized } from "@/lib/locale";
import type { AppLocale } from "@/i18n/request";
import type { OptionWithValues } from "./options-manager";

export type VariantWithSummary = {
  id: string;
  sku: string;
  price: number;
  stock: number;
  isActive: boolean;
  optionSummary: string;
};

const emptyNew = { sku: "", price: "", stock: "" };

export function VariantsManager({
  productId,
  options,
  variants,
  setVariants,
  locale,
}: {
  productId: string;
  options: OptionWithValues[];
  variants: VariantWithSummary[];
  setVariants: React.Dispatch<React.SetStateAction<VariantWithSummary[]>>;
  locale: AppLocale;
}) {
  const t = useTranslations("AdminVariants");
  const [newVariant, setNewVariant] = useState(emptyNew);
  const [selectedValues, setSelectedValues] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  async function updateVariant(id: string, data: { sku?: string; price?: number; stock?: number }) {
    setSavingId(id);
    const res = await fetch(`/api/products/${productId}/variants/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const body = await res.json();
      setVariants((prev) =>
        prev.map((v) => (v.id === id ? { ...v, ...body.data, price: Number(body.data.price) } : v))
      );
    }
    setSavingId(null);
  }

  async function addVariant(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // نتأكد إن كل Option فعلاً معاه قيمة مختارة (مش بس المفتاح موجود في
    // الـ state — لو حد رجّع الـ dropdown لـ "Color…" تاني، المفتاح
    // بيفضل موجود بس القيمة بتبقى فاضية "")
    const allSelected = options.every((o) => !!selectedValues[o.id]);
    if (options.length > 0 && !allSelected) {
      setError(t("selectValueForEveryOption"));
      return;
    }

    const optionValueIds = Object.values(selectedValues);

    const res = await fetch(`/api/products/${productId}/variants`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sku: newVariant.sku,
        price: Number(newVariant.price),
        stock: Number(newVariant.stock),
        optionValueIds,
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? t("addFailed"));
      return;
    }

    const body = await res.json();

    const optionSummary = options
      .map((o) => {
        const value = o.values.find((v) => v.id === selectedValues[o.id]);
        return value ? localized(locale, value.valueEn, value.valueAr) : undefined;
      })
      .filter(Boolean)
      .join(" / ");

    setVariants((prev) => [
      ...prev,
      {
        id: body.data.id,
        sku: body.data.sku,
        price: Number(body.data.price),
        stock: body.data.stock,
        isActive: body.data.isActive,
        optionSummary,
      },
    ]);
    setNewVariant(emptyNew);
    setSelectedValues({});
  }

  return (
    <div className="mt-8 rounded-lg border border-steel/15 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-steel">{t("title")}</p>

      {variants.length === 0 ? (
        <p className="mt-3 text-sm text-alert">
          {t("noVariants")}
        </p>
      ) : (
        <table className="mt-3 w-full text-sm">
          <thead className="text-start text-xs text-steel">
            <tr>
              <th className="py-1 text-start">{t("sku")}</th>
              <th className="py-1 text-start">{t("options")}</th>
              <th className="py-1 text-start">{t("price")}</th>
              <th className="py-1 text-start">{t("stock")}</th>
            </tr>
          </thead>
          <tbody>
            {variants.map((v) => (
              <tr key={v.id}>
                <td className="py-1">
                  <input
                    defaultValue={v.sku}
                    dir="ltr"
                    onBlur={(e) => e.target.value !== v.sku && updateVariant(v.id, { sku: e.target.value })}
                    disabled={savingId === v.id}
                    className="w-28 rounded border border-steel/25 px-2 py-1 font-mono text-xs disabled:opacity-50"
                  />
                </td>
                <td className="py-1 text-xs text-steel">{v.optionSummary || "—"}</td>
                <td className="py-1">
                  <input
                    type="number"
                    step="0.01"
                    defaultValue={v.price}
                    dir="ltr"
                    onBlur={(e) => updateVariant(v.id, { price: Number(e.target.value) })}
                    disabled={savingId === v.id}
                    className="w-24 rounded border border-steel/25 px-2 py-1 text-xs disabled:opacity-50"
                  />
                </td>
                <td className="py-1">
                  <input
                    type="number"
                    defaultValue={v.stock}
                    dir="ltr"
                    onBlur={(e) => updateVariant(v.id, { stock: Number(e.target.value) })}
                    disabled={savingId === v.id}
                    className="w-20 rounded border border-steel/25 px-2 py-1 text-xs disabled:opacity-50"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <form onSubmit={addVariant} className="mt-4 space-y-2 border-t border-steel/10 pt-4">
        {options.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {options.map((option) => (
              <select
                key={option.id}
                value={selectedValues[option.id] ?? ""}
                onChange={(e) => setSelectedValues((prev) => ({ ...prev, [option.id]: e.target.value }))}
                className="rounded-md border border-steel/25 px-2 py-1 text-xs"
              >
                <option value="">{localized(locale, option.nameEn, option.nameAr)}…</option>
                {option.values.map((v) => (
                  <option key={v.id} value={v.id}>
                    {localized(locale, v.valueEn, v.valueAr)}
                  </option>
                ))}
              </select>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <input
            required
            placeholder={t("sku")}
            dir="ltr"
            value={newVariant.sku}
            onChange={(e) => setNewVariant((p) => ({ ...p, sku: e.target.value }))}
            className="w-28 rounded-md border border-steel/25 px-2 py-1 font-mono text-xs"
          />
          <input
            required
            type="number"
            step="0.01"
            placeholder={t("price")}
            dir="ltr"
            value={newVariant.price}
            onChange={(e) => setNewVariant((p) => ({ ...p, price: e.target.value }))}
            className="w-24 rounded-md border border-steel/25 px-2 py-1 text-xs"
          />
          <input
            required
            type="number"
            placeholder={t("stock")}
            dir="ltr"
            value={newVariant.stock}
            onChange={(e) => setNewVariant((p) => ({ ...p, stock: e.target.value }))}
            className="w-20 rounded-md border border-steel/25 px-2 py-1 text-xs"
          />
          <button type="submit" className="rounded-md bg-ink px-3 py-1 text-xs font-semibold text-paper">
            {t("addVariant")}
          </button>
        </div>
      </form>

      {error && <p className="mt-2 text-xs text-alert">{error}</p>}
    </div>
  );
}
