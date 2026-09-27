"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";

type Item = {
  id: string;
  product: {
    id: string;
    name: string;
    slug: string;
    isActive: boolean;
    image: string | null;
    price: number | null;
    stock: number;
  };
};

export function WishlistItems({ initialItems }: { initialItems: Item[] }) {
  const t = useTranslations("Wishlist");
  const [items, setItems] = useState(initialItems);

  // toggle بتاعت Phase 4: بما إن العنصر أصلاً محفوظ، الضغطة هنا هتشيله —
  // بنشيله من الواجهة فورًا (optimistic) من غير ما نستنى رد السيرفر
  async function remove(productId: string) {
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
    await fetch("/api/wishlist/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
  }

  if (items.length === 0) {
    return (
      <div className="mt-10 text-center">
        <p className="text-steel">{t("empty")}</p>
        <Link href="/" className="mt-4 inline-block rounded-md bg-ink px-4 py-2 text-sm font-medium text-paper">
          {t("browseProducts")}
        </Link>
      </div>
    );
  }

  return (
    <ul className="mt-8 divide-y divide-steel/10">
      {items.map((item) => (
        <li key={item.id} className="flex gap-4 py-5">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md border border-steel/15 bg-steel/5">
            {item.product.image && (
              <Image
                src={item.product.image}
                alt={item.product.name}
                fill
                className="object-cover"
                sizes="80px"
              />
            )}
          </div>
          <div className="flex-1">
            <Link
              href={`/products/${item.product.slug}`}
              className="font-display text-sm font-medium text-ink hover:underline"
            >
              {item.product.name}
            </Link>
            <p className="mt-1 font-mono text-sm text-ink">
              {item.product.price !== null ? `EGP ${item.product.price.toLocaleString()}` : "—"}
            </p>
            {(!item.product.isActive || item.product.stock === 0) && (
              <p className="mt-1 text-xs text-alert">{t("unavailable")}</p>
            )}
            <button
              type="button"
              onClick={() => remove(item.product.id)}
              className="mt-2 text-xs text-steel hover:text-alert"
            >
              {t("removeItem")}
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
