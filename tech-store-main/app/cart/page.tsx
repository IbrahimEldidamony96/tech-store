import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { auth } from "@/auth";
import { getCartForUser } from "@/lib/queries/cart";
import { localized } from "@/lib/locale";
import { CartItems } from "@/components/cart-items";
import type { AppLocale } from "@/i18n/request";

export default async function CartPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/cart");

  const cart = await getCartForUser(session.user.id);
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations("Cart");

  // Decimal -> number لطبقة الـ UI، ونحول شكل الـ optionValues لسطر واحد
  // مقروء ("Black / 128GB") بدل مصفوفة متداخلة — باللغة الحالية
  const items = cart.items.map((item) => ({
    id: item.id,
    quantity: item.quantity,
    variant: {
      id: item.variant.id,
      sku: item.variant.sku,
      price: item.variant.price.toNumber(),
      stock: item.variant.stock,
      isActive: item.variant.isActive,
      optionSummary: item.variant.optionValues
        .map((ov) => localized(locale, ov.optionValue.valueEn, ov.optionValue.valueAr))
        .join(" / "),
      product: {
        id: item.variant.product.id,
        name: localized(locale, item.variant.product.nameEn, item.variant.product.nameAr),
        slug: item.variant.product.slug,
        isActive: item.variant.product.isActive,
        images: item.variant.product.images,
      },
    },
  }));

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-2xl font-bold text-ink">{t("title")}</h1>

      {items.length === 0 ? (
        <div className="mt-10 text-center">
          <p className="text-steel">{t("empty")}</p>
          <Link href="/" className="mt-4 inline-block rounded-md bg-ink px-4 py-2 text-sm font-medium text-paper">
            {t("browseProducts")}
          </Link>
        </div>
      ) : (
        <CartItems initialItems={items} />
      )}
    </div>
  );
}
