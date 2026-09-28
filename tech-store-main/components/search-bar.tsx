"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

// <form method="GET" action="/"> عادي — من غير أي onSubmit أو fetch.
// الـ submit بيعمل navigation طبيعي لـ "/?search=..." حتى لو الـ JS فشل
// يحمّل خالص. الحاجة الوحيدة المحتاجة client-side فعلاً هي قراءة القيمة
// الحالية من الـ URL عشان الـ input يتملى بيها (مثلاً لو اليوزر عمل
// refresh وهو على نتائج بحث)
export function SearchBar({ className }: { className?: string }) {
  const searchParams = useSearchParams();
  const t = useTranslations("Header");
  const currentSearch = searchParams.get("search") ?? "";

  return (
    <form action="/" method="GET" role="search" className={className}>
      <input
        type="search"
        name="search"
        defaultValue={currentSearch}
        placeholder={t("searchPlaceholder")}
        className="w-full rounded-md border border-steel/25 bg-paper px-3 py-1.5 text-sm text-ink placeholder:text-steel focus:border-ink focus:outline-none"
      />
    </form>
  );
}
