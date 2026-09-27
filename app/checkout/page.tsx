import { redirect } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getCartForUser } from "@/lib/queries/cart";
import { localized } from "@/lib/locale";
import { CheckoutForm } from "@/components/checkout-form";
import type { AppLocale } from "@/i18n/request";

export default async function CheckoutPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/checkout");

  const [cart, addresses] = await Promise.all([
    getCartForUser(session.user.id),
    prisma.address.findMany({
      where: { userId: session.user.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    }),
  ]);

  if (cart.items.length === 0) redirect("/cart");

  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations("Checkout");

  const items = cart.items.map((item) => ({
    id: item.id,
    quantity: item.quantity,
    name: localized(locale, item.variant.product.nameEn, item.variant.product.nameAr),
    price: item.variant.price.toNumber(),
  }));

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-2xl font-bold text-ink">{t("title")}</h1>
      <CheckoutForm items={items} subtotal={cart.subtotal} addresses={addresses} />
    </div>
  );
}
