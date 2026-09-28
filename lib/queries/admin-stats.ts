import { prisma } from "@/lib/prisma";

export type RevenueRange = "today" | "7d" | "30d";

// المتجر شغال في مصر بس، فـ "اليوم" لازم يتحسب من نص الليل بتوقيت القاهرة —
// مش من توقيت السيرفر (على Vercel بيبقى UTC) ومش "آخر 24 ساعة"، لأن الأوردر
// اللي اتعمل امبارح بالليل كان هيتحسب على إنه "النهاردة".
const STORE_TIMEZONE = "Africa/Cairo";

// بيرجّع الفرق بين توقيت المنطقة الزمنية وUTC (بالملي ثانية) في لحظة معينة.
// بنستخدم Intl عشان يراعي الـ DST تلقائيًا (مصر بترجع تستخدمه من 2023).
function getTimeZoneOffsetMs(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)!.value);
  const localAsUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second"),
  );
  return localAsUtc - Math.floor(date.getTime() / 1000) * 1000;
}

// لحظة نص الليل (00:00) بتوقيت المنطقة الزمنية، لليوم اللي فيه `now`.
function startOfDayInTimeZone(now: Date, timeZone: string): Date {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (type: string) => Number(parts.find((p) => p.type === type)!.value);
  const localMidnightAsUtc = Date.UTC(get("year"), get("month") - 1, get("day"));

  // مرتين عشان لو الـ offset اتغيّر (DST) بين نص الليل ودلوقتي
  let result = localMidnightAsUtc - getTimeZoneOffsetMs(new Date(localMidnightAsUtc), timeZone);
  result = localMidnightAsUtc - getTimeZoneOffsetMs(new Date(result), timeZone);
  return new Date(result);
}

// "today" = من نص الليل بتوقيت القاهرة لحد دلوقتي.
// "7d" / "30d" = rolling window زي ما كانوا (آخر 7 / 30 × 24 ساعة).
export function getRangeStart(range: RevenueRange, now: Date = new Date()): Date {
  if (range === "today") return startOfDayInTimeZone(now, STORE_TIMEZONE);
  const days = range === "7d" ? 7 : 30;
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
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