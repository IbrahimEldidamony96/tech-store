import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { getAllCouponsForAdmin } from "@/lib/queries/admin-coupons";
import { CouponsManager } from "@/components/admin/coupons-manager";

export default async function AdminCouponsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/");

  const coupons = await getAllCouponsForAdmin();
  const t = await getTranslations("AdminCoupons");

  const mapped = coupons.map((c) => ({
    id: c.id,
    code: c.code,
    type: c.type,
    value: c.value.toNumber(),
    minOrderAmount: c.minOrderAmount?.toNumber() ?? null,
    maxDiscount: c.maxDiscount?.toNumber() ?? null,
    usageLimit: c.usageLimit,
    usageLimitPerUser: c.usageLimitPerUser,
    usedCount: c.usedCount,
    startsAt: c.startsAt,
    expiresAt: c.expiresAt,
    isActive: c.isActive,
  }));

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-2xl font-bold text-ink">{t("title")}</h1>
      <CouponsManager initialCoupons={mapped} />
    </div>
  );
}
