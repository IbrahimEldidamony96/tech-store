"use client";

import { usePathname } from "next/navigation";
import type { AppLocale } from "@/i18n/request";

// Client component بسيط عشان محتاجين usePathname() نعرف الصفحة الحالية
// ونرجع لها بعد تبديل اللغة (مش نرمي اليوزر للـ homepage). الزرار نفسه
// مجرد <a> عادي — مفيش fetch ولا state، الـ /api/locale route هو اللي
// بيحط الكوكي ويعمل redirect.
export function LocaleSwitcher({ locale }: { locale: AppLocale }) {
  const pathname = usePathname();
  const next: AppLocale = locale === "ar" ? "en" : "ar";
  const label = next === "ar" ? "العربية" : "EN";

  return (
    <a
      href={`/api/locale?locale=${next}&redirect=${encodeURIComponent(pathname)}`}
      className="rounded-md border border-steel/25 px-2 py-1 font-mono text-xs font-medium text-steel hover:border-ink hover:text-ink"
    >
      {label}
    </a>
  );
}
