import { prisma } from "@/lib/prisma";

export async function getAdminStats() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [revenueResult, orders30d, pendingOrders, lowStockVariants] = await Promise.all([
    // الإيراد هنا مبني على status != CANCELLED مش paymentStatus === PAID —
    // أغلب الأوردرات هنا Cash on Delivery وبتفضل paymentStatus: PENDING
    // لحد التسليم الفعلي، فلو اعتمدنا على PAID بس كان الرقم هيبقى أقل
    // بكتير من المبيعات الحقيقية. status != CANCELLED أقرب لمعنى "مبيعات"
    prisma.order.aggregate({
      where: { createdAt: { gte: thirtyDaysAgo }, status: { not: "CANCELLED" } },
      _sum: { total: true },
    }),
    prisma.order.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.productVariant.count({ where: { isActive: true, stock: { lte: 5 } } }),
  ]);

  return {
    revenue30d: revenueResult._sum.total?.toNumber() ?? 0,
    orders30d,
    pendingOrders,
    lowStockVariants,
  };
}
