import type { Metadata } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Header } from "@/components/header";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["500", "700"],
});
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "Tech Store",
  description: "Phones, laptops, and accessories.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // اللغة جاية من كوكي NEXT_LOCALE (شوف i18n/request.ts) — مفيش [locale]
  // segment في الـ URL. getLocale()/getMessages() بيقروا نفس الـ request
  // config، فمضمون يبقوا متزامنين مع بعض.
  const locale = await getLocale();
  const messages = await getMessages();
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-body antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Header />
          {/* SessionProvider نفسه client component جوّاه (next-auth بيحطها)،
              فعادي نرندره من Server Component هنا من غير ما نلف الملف كله.
              محتاجينه عشان useSession().update() يشتغل بعد تعديل البروفايل */}
          <SessionProvider>
            <main>{children}</main>
          </SessionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
