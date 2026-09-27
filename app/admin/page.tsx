import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { getAdminStats } from "@/lib/queries/admin-stats";

export default async function AdminHomePage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/");

  const [t, stats] = await Promise.all([
    getTranslations("AdminHome"),
    getAdminStats(),
  ]);

  const cards = [
    { href: "/admin/orders", title: t("orders"), desc: t("ordersDesc") },
    { href: "/admin/products", title: t("products"), desc: t("productsDesc") },
    { href: "/admin/categories", title: t("categories"), desc: t("categoriesDesc") },
    { href: "/admin/brands", title: t("brands"), desc: t("brandsDesc") },
    { href: "/admin/shipping-rates", title: t("shippingRates"), desc: t("shippingRatesDesc") },
    { href: "/admin/sliders", title: t("homepageSlider"), desc: t("homepageSliderDesc") },
    { href: "/admin/coupons", title: t("coupons"), desc: t("couponsDesc") },
    { href: "/admin/reviews", title: t("reviews"), desc: t("reviewsDesc") },
  ];

  const statCards = [
    { label: t("revenue30d"), value: `EGP ${stats.revenue30d.toLocaleString()}` },
    { label: t("orders30d"), value: stats.orders30d.toLocaleString() },
    {
      label: t("pendingOrders"),
      value: stats.pendingOrders.toLocaleString(),
      href: "/admin/orders?status=PENDING",
      alert: stats.pendingOrders > 0,
    },
    {
      label: t("lowStock"),
      value: stats.lowStockVariants.toLocaleString(),
      href: "/admin/products",
      alert: stats.lowStockVariants > 0,
    },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-2xl font-bold text-ink">{t("title")}</h1>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {statCards.map((stat) =>
          stat.href ? (
            <Link
              key={stat.label}
              href={stat.href}
              className="rounded-lg border border-steel/15 p-4 hover:border-ink"
            >
              <p className="text-xs text-steel">{stat.label}</p>
              <p
                className={`mt-1 font-mono text-xl font-semibold ${
                  stat.alert ? "text-alert" : "text-ink"
                }`}
              >
                {stat.value}
              </p>
            </Link>
          ) : (
            <div key={stat.label} className="rounded-lg border border-steel/15 p-4">
              <p className="text-xs text-steel">{stat.label}</p>
              <p className="mt-1 font-mono text-xl font-semibold text-ink">{stat.value}</p>
            </div>
          ),
        )}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-lg border border-steel/15 p-5 hover:border-ink"
          >
            <h2 className="font-display font-semibold text-ink">{card.title}</h2>
            <p className="mt-1 text-sm text-steel">{card.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
