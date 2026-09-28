import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getTranslations, getLocale } from "next-intl/server";
import { auth } from "@/auth";
import { getAllProductsForAdmin } from "@/lib/queries/admin-products";
import { ProductActiveToggle } from "@/components/admin/product-active-toggle";
import { localized } from "@/lib/locale";
import type { AppLocale } from "@/i18n/request";

export default async function AdminProductsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/");

  const products = await getAllProductsForAdmin();
  const t = await getTranslations("AdminProducts");
  const locale = (await getLocale()) as AppLocale;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-ink">{t("title")}</h1>
        <Link
          href="/admin/products/new"
          className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-paper"
        >
          {t("newProduct")}
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-steel/15">
        <table className="w-full text-sm">
          <thead className="bg-steel/5 text-start text-xs uppercase tracking-wide text-steel">
            <tr>
              <th className="px-4 py-2"></th>
              <th className="px-4 py-2 text-start">{t("name")}</th>
              <th className="px-4 py-2 text-start">{t("category")}</th>
              <th className="px-4 py-2 text-start">{t("brand")}</th>
              <th className="px-4 py-2 text-start">{t("stock")}</th>
              <th className="px-4 py-2 text-start">{t("status")}</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-steel/10">
            {products.map((p) => {
              const totalStock = p.variants.reduce(
                (sum, v) => sum + v.stock,
                0,
              );
              const thumbnail = p.images[0];
              return (
                <tr key={p.id}>
                  <td className="px-4 py-3">
                    <div className="relative h-10 w-10 overflow-hidden rounded bg-steel/5">
                      {thumbnail ? (
                        <Image
                          src={thumbnail.url}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[9px] text-steel">
                          {t("noImage")}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-ink">{localized(locale, p.nameEn, p.nameAr)}</td>
                  <td className="px-4 py-3 text-steel">{localized(locale, p.category.nameEn, p.category.nameAr)}</td>
                  <td className="px-4 py-3 text-steel">
                    {p.brand?.name ?? t("noBrand")}
                  </td>
                  <td className="px-4 py-3 font-mono text-steel">
                    {totalStock}
                  </td>
                  <td className="px-4 py-3">
                    <ProductActiveToggle
                      productId={p.id}
                      initialActive={p.isActive}
                    />
                  </td>
                  <td className="px-4 py-3 text-end">
                    <Link
                      href={`/admin/products/${p.id}/edit`}
                      className="text-xs text-ink hover:underline"
                    >
                      {t("edit")}
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
