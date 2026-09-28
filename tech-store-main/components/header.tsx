import { Suspense } from "react";
import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { auth, signOut } from "@/auth";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { SearchBar } from "@/components/search-bar";

// Server Component عادي — بينادي auth() مباشرة على السيرفر، من غير أي
// fetch لأي API. مفيش داعي "نتصل بنفسنا" عشان نعرف مين اليوزر.
export async function Header() {
  const session = await auth();
  const t = await getTranslations("Header");
  const locale = await getLocale();

  return (
    <header className="border-b border-steel/15 bg-paper">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="font-display text-lg font-bold tracking-tight text-ink"
        >
          TECH<span className="text-signal">/</span>STORE
        </Link>

        {/* useSearchParams() جوه SearchBar محتاج Suspense boundary، وإلا
            Next.js بيرفض الـ build (نفس سبب الـ Suspense في app/login/page.tsx) */}
        <Suspense fallback={<div className="h-9 w-full sm:w-56" />}>
          <SearchBar className="order-3 w-full sm:order-none sm:w-56" />
        </Suspense>

        <nav className="flex items-center gap-5 text-sm font-medium text-steel">
          <Link href="/wishlist" className="hover:text-ink">
            {t("wishlist")}
          </Link>
          <Link href="/cart" className="hover:text-ink">
            {t("cart")}
          </Link>
          {session?.user ? (
            <>
              {session.user.role === "ADMIN" && (
                <Link href="/admin" className="hover:text-ink">
                  {t("admin")}
                </Link>
              )}
              <Link href="/orders" className="hover:text-ink">
                {t("orders")}
              </Link>
              <Link href="/account" className="hover:text-ink">
                {session.user.name}
              </Link>
              {/* Server Action مباشرة جوه الـ form — مش محتاجين نحول
                  الـ Header كله لـ Client Component عشان زرار واحد */}
              <form
                action={async () => {
                  "use server";
                  await signOut();
                }}
              >
                <button type="submit" className="hover:text-ink">
                  {t("signOut")}
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-md bg-ink px-3 py-1.5 text-paper transition-colors hover:bg-ink/90"
            >
              {t("signIn")}
            </Link>
          )}
          <LocaleSwitcher locale={locale as "en" | "ar"} />
        </nav>
      </div>
    </header>
  );
}
