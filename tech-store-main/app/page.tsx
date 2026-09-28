import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getProductList } from "@/lib/queries/products";
import { getActiveSlidersForHomepage } from "@/lib/queries/sliders";
import { localized } from "@/lib/locale";
import { ProductCard } from "@/components/product-card";
import { HeroSlider } from "@/components/hero-slider";
import type { AppLocale } from "@/i18n/request";

type SearchParams = Promise<{
  category?: string;
  search?: string;
  page?: string;
}>;

export default async function HomePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations("HomePage");

  const [{ items, totalPages }, categories, slides] = await Promise.all([
    getProductList({
      category: params.category,
      search: params.search,
      page,
      limit: 12,
    }),
    prisma.category.findMany({
      where: { parentId: null },
      orderBy: { nameEn: "asc" },
      select: { id: true, nameEn: true, nameAr: true, slug: true },
    }),
    getActiveSlidersForHomepage(),
  ]);

  // Prisma.Decimal مش نوع UI-friendly — نحوله لـ number صريح هنا في
  // طبقة الصفحة، عشان ProductCard يفضل component بسيط بأنواع JS عادية
  const products = items.map((product) => ({
    ...product,
    variants: product.variants.map((v) => ({
      price: v.price.toNumber(),
      stock: v.stock,
    })),
  }));

  const activeCategory = params.category;

  // بيبني query string محافظ على كل الفلاتر الحالية (بحث + فئة) ما عدا
  // اللي بنستبدله إحنا صراحة — قبل كده رابط الـ pagination كان بيفتكر
  // category بس وبينسى search خالص، يعني نتيجة بحث تفضل على الصفحة
  // الأولى بس. href("/", {category: undefined}) بيمسح الفئة تمامًا،
  // بينما href("/", {}) بيسيب كل حاجة زي ما هي
  function href(overrides: { category?: string; page?: number }) {
    const next = new URLSearchParams();
    const category = "category" in overrides ? overrides.category : activeCategory;
    const pageNum = "page" in overrides ? overrides.page : undefined;

    if (category) next.set("category", category);
    if (params.search) next.set("search", params.search);
    if (pageNum && pageNum > 1) next.set("page", String(pageNum));

    const qs = next.toString();
    return qs ? `/?${qs}` : "/";
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      {slides.length > 0 && (
        <div className="mb-8">
          <HeroSlider slides={slides} />
        </div>
      )}

      {params.search && (
        <div className="mb-6 flex flex-wrap items-center gap-3 text-sm">
          <p className="text-steel">
            {t("searchResultsFor", { query: params.search })}
          </p>
          <Link href={href({ category: undefined, page: 1 })} className="text-ink underline hover:no-underline">
            {t("clearSearch")}
          </Link>
        </div>
      )}

      <div className="mb-8 flex flex-wrap items-center gap-2">
        <Link
          href={href({ category: undefined, page: 1 })}
          className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
            !activeCategory
              ? "border-ink bg-ink text-paper"
              : "border-steel/25 text-steel hover:border-ink hover:text-ink"
          }`}
        >
          {t("all")}
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={href({ category: c.slug, page: 1 })}
            className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
              activeCategory === c.slug
                ? "border-ink bg-ink text-paper"
                : "border-steel/25 text-steel hover:border-ink hover:text-ink"
            }`}
          >
            {localized(locale, c.nameEn, c.nameAr)}
          </Link>
        ))}
      </div>

      {products.length === 0 ? (
        <p className="py-20 text-center text-steel">{t("noProducts")}</p>
      ) : (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} locale={locale} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-10 flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={href({ page: p })}
              className={`flex h-9 w-9 items-center justify-center rounded-md border font-mono text-sm ${
                p === page
                  ? "border-ink bg-ink text-paper"
                  : "border-steel/25 text-steel hover:border-ink hover:text-ink"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
