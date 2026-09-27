"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";
  const t = useTranslations("Auth");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    // redirect: false يخلينا نتحكم إحنا في التنقل بعد النجاح، بدل ما
    // NextAuth يعمل full-page redirect لوحده
    const result = await signIn("credentials", { email, password, redirect: false });

    if (result?.error) {
      setError(t("invalidCredentials"));
      setLoading(false);
      return;
    }

    router.push(next);
    router.refresh(); // يخلي الـ Header (Server Component) يعيد قراءة الجلسة الجديدة
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label className="block text-xs font-medium uppercase tracking-wide text-steel">{t("email")}</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-md border border-steel/25 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium uppercase tracking-wide text-steel">{t("password")}</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-md border border-steel/25 px-3 py-2 text-sm"
          />
        </div>

        {error && <p className="text-sm text-alert">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-ink py-2.5 text-sm font-semibold text-paper transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {loading ? t("signingIn") : t("signIn")}
        </button>
      </form>

      <div className="mt-4 flex items-center gap-3 text-xs text-steel">
        <span className="h-px flex-1 bg-steel/15" />
        {t("or")}
        <span className="h-px flex-1 bg-steel/15" />
      </div>

      <button
        type="button"
        onClick={() => signIn("google", { callbackUrl: next })}
        className="mt-4 w-full rounded-md border border-steel/25 py-2.5 text-sm font-medium text-ink hover:border-ink"
      >
        {t("continueWithGoogle")}
      </button>

      <p className="mt-6 text-center text-sm text-steel">
        {t("noAccount")}{" "}
        <Link href="/register" className="font-medium text-ink hover:underline">
          {t("register")}
        </Link>
      </p>
    </>
  );
}
