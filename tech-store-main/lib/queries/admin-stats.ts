import { prisma } from "@/lib/prisma";

export type RevenueRange = "today" | "7d" | "30d";

// "today" بيتحسب كآخر 24 ساعة (rolling)، مش من نص الليل بتوقيت القاهرة —
// نفس فلسفة الـ 7d/30d اللي أصلًا rolling window مش حدود يوم تقويمي، وده
// بيتجنب أي تعقيد/باجات متعلقة بالـ timezone أو الـ DST.
function getRangeStart(range: RevenueRange): Date {
  const hours = range === "today" ? 24 : range === "7d" ? 7 * 24 : 30 * 24;
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

export async function getAdminStats(revenueRange: RevenueRange = "30d") {
  const rangeStart = getRangeStart(revenueRange);

  const [revenueResult, ordersInRange, pendingOrders, lowStockVariants] = await Promise.all([
    // الإيراد هنا مبني على status != CANCELLED مش paymentStatus === PAID —
    // أغلب الأوردرات هنا Cash on Delivery وبتفضل paymentStatus: PENDING
    // لحد التسليم الفعلي، فلو اعتمدنا على PAID بس كان الرقم هيبقى أقل
    // بكتير من المبيعات الحقيقية. status != CANCELLED أقرب لمعنى "مبيعات"
    prisma.order.aggregate({
      where: { createdAt: { gte: rangeStart }, status: { not: "CANCELLED" } },
      _sum: { total: true },
    }),
    prisma.order.count({ where: { createdAt: { gte: rangeStart } } }),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.productVariant.count({ where: { isActive: true, stock: { lte: 5 } } }),
  ]);

  return {
    revenue: revenueResult._sum.total?.toNumber() ?? 0,
    ordersInRange,
    pendingOrders,
    lowStockVariants,
  };
}
