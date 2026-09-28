"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";

export type SlideItem = {
  id: string;
  url: string;
  alt: string | null;
  link: string | null;
};

const AUTO_ADVANCE_MS = 5000;

function isExternalLink(link: string) {
  return /^https?:\/\//i.test(link);
}

export function HeroSlider({ slides }: { slides: SlideItem[] }) {
  const t = useTranslations("HeroSlider");
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const goTo = useCallback(
    (i: number) =>
      setIndex(((i % slides.length) + slides.length) % slides.length),
    [slides.length],
  );
  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  // Auto-advance, paused on hover/focus so nobody loses their place mid-read.
  useEffect(() => {
    if (slides.length < 2 || paused) return;
    const id = setInterval(next, AUTO_ADVANCE_MS);
    return () => clearInterval(id);
  }, [slides.length, paused, next]);

  if (slides.length === 0) return null;

  return (
    <div
      className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-steel/15 bg-steel/5 sm:aspect-[21/7]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {slides.map((slide, i) => {
        const isCurrent = i === index;
        const image = (
          <Image
            src={slide.url}
            alt={slide.alt ?? ""}
            fill
            priority={i === 0}
            className="object-cover"
            sizes="100vw"
          />
        );

        return (
          <div
            key={slide.id}
            aria-hidden={!isCurrent}
            className={`absolute inset-0 transition-opacity duration-700 ${
              isCurrent ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            {slide.link ? (
              isExternalLink(slide.link) ? (
                <a
                  href={slide.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  tabIndex={isCurrent ? 0 : -1}
                  className="block h-full w-full"
                >
                  {image}
                </a>
              ) : (
                <Link
                  href={slide.link}
                  tabIndex={isCurrent ? 0 : -1}
                  className="block h-full w-full"
                >
                  {image}
                </Link>
              )
            ) : (
              image
            )}
          </div>
        );
      })}

      {slides.length > 1 && (
        <>
          {/* start-2/end-2 بدل left-2/right-2 عشان الزرارين يبدّلوا مكانهم
              صح تحت RTL؛ rtl:scale-x-[-1] بتعكس شكل السهم نفسه ‹/› عشان
              يفضل شكله منطقي بالنسبة لمكانه الجديد (كل سهم بيشاور لبرّه،
              ناحية الحافة اللي هو واقف عندها — نفس المنطق في الاتجاهين) */}
          <button
            type="button"
            onClick={prev}
            aria-label={t("previousSlide")}
            className="absolute start-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-ink/60 text-lg text-paper backdrop-blur-sm hover:bg-ink/80 sm:h-9 sm:w-9 rtl:scale-x-[-1]"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={next}
            aria-label={t("nextSlide")}
            className="absolute end-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-ink/60 text-lg text-paper backdrop-blur-sm hover:bg-ink/80 sm:h-9 sm:w-9 rtl:scale-x-[-1]"
          >
            ›
          </button>

          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => goTo(i)}
                aria-label={t("goToSlide", { number: i + 1 })}
                aria-current={i === index}
                className={`h-1.5 rounded-full transition-all ${
                  i === index
                    ? "w-5 bg-paper"
                    : "w-1.5 bg-paper/50 hover:bg-paper/80"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
