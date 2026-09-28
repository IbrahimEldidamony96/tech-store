import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { LoginForm } from "@/components/login-form";

export default async function LoginPage() {
  const t = await getTranslations("Auth");
  return (
    <div className="mx-auto max-w-sm px-4 py-16 sm:px-6">
      <h1 className="font-display text-2xl font-bold text-ink">{t("signIn")}</h1>
      {/* useSearchParams جوه LoginForm محتاج Suspense boundary، وإلا
          Next.js بيرفض الـ build */}
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
