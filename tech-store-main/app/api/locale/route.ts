import { NextRequest, NextResponse } from "next/server";
import { LOCALE_COOKIE, SUPPORTED_LOCALES } from "@/i18n/request";

// زرار تبديل اللغة بيعمل navigation عادي لـ /api/locale?locale=ar&redirect=/products/x
// بدل ما يبقى client component معقد بيعمل fetch + router.refresh(). ده أبسط
// وأضمن: full page load حقيقي، فـ <html lang>/dir والـ Tailwind rtl: variants
// بترجع صح من أول مرة من غير أي مشاكل hydration أو re-render جزئي.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const requested = searchParams.get("locale");
  const locale = (SUPPORTED_LOCALES as readonly string[]).includes(requested ?? "")
    ? (requested as string)
    : "en";

  // منسمحش بأي redirect خارج الموقع — لازم يبدأ بـ "/"
  const redirectParam = searchParams.get("redirect");
  const redirectTo = redirectParam && redirectParam.startsWith("/") ? redirectParam : "/";

  const response = NextResponse.redirect(new URL(redirectTo, request.url));
  response.cookies.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return response;
}
