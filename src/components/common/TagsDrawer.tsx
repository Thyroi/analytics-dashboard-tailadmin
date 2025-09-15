"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  ComponentType,
  SVGProps,
  KeyboardEvent,
  PointerEvent,
} from "react";
import TagStat from "@/components/dashboard/TagsStat";
import PagerDots from "@/components/common/PagerDots";
import { useTopTagsCtx } from "@/context/TopTagsCtx";
import { useRouter, useSearchParams } from "next/navigation";

export type HeroIcon = ComponentType<SVGProps<SVGSVGElement>>;
export type TagMetaEntry = { label: string; icon: HeroIcon; color: string };
export type TagRow = { tag: string; total: number };

type Props = {
  rows: TagRow[];
  tagMeta: Record<string, TagMetaEntry>;
  defaultTagMeta: TagMetaEntry;
  /** autoplay en ms; 0 = off */
  autoPlayMs?: number;
  /** items por vista por breakpoint */
  perView?: { mobile: number; tablet: number; desktop: number };
  /** gradiente lateral */
  edgeFade?: boolean;
  className?: string;
};

export default function TagsDrawer({
  rows,
  tagMeta,
  defaultTagMeta,
  autoPlayMs = 0,
  perView = { mobile: 2, tablet: 3, desktop: 4 },
  edgeFade = true,
  className = "",
}: Props) {
  // ---- estado & refs (no returns antes) ----
  const containerRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const drag = useRef<{ startX: number; dx: number; dragging: boolean }>({
    startX: 0,
    dx: 0,
    dragging: false,
  });

  const { setActiveTag } = useTopTagsCtx();
  const router = useRouter();
  const searchParams = useSearchParams();

  // responsive itemsPerView
  const [itemsPerView, setItemsPerView] = useState<number>(perView.desktop);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      const next =
        w < 640 ? perView.mobile : w < 1024 ? perView.tablet : perView.desktop;
      setItemsPerView(Math.max(1, next));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [perView.mobile, perView.tablet, perView.desktop]);

  const realCount = rows.length;
  const cloneCount = Math.min(itemsPerView, Math.max(1, realCount)); // clones por extremo
  const headClones = rows.slice(-cloneCount);
  const tailClones = rows.slice(0, cloneCount);
  const slides = [...headClones, ...rows, ...tailClones];

  const START_INDEX = cloneCount;
  const [index, setIndex] = useState(START_INDEX);
  const [anim, setAnim] = useState(true);

  // reinicia index si cambia itemsPerView o dataset
  useEffect(() => {
    setAnim(false);
    setIndex(START_INDEX);
    const t = requestAnimationFrame(() => setAnim(true));
    return () => cancelAnimationFrame(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsPerView, realCount]);

  // índice visible (para dots)
  const visibleIndex =
    realCount > 0
      ? ((index - START_INDEX) % realCount + realCount) % realCount
      : 0;

  // loop robusto (sin blancos): si caes en clone, teleporta al real equivalente
  const onTransitionEnd = useCallback(() => {
    if (realCount === 0) return;
    const firstReal = START_INDEX;
    const lastReal = START_INDEX + realCount - 1;

    if (index > lastReal) {
      // hemos entrado a clones de cola → salta atrás realCount
      setAnim(false);
      setIndex(index - realCount);
    } else if (index < firstReal) {
      // hemos entrado a clones de cabeza → salta adelante realCount
      setAnim(false);
      setIndex(index + realCount);
    }
  }, [index, realCount, START_INDEX]);

  // reactivar anim tras teleport
  useEffect(() => {
    if (!anim) {
      const t = requestAnimationFrame(() => setAnim(true));
      return () => cancelAnimationFrame(t);
    }
  }, [anim]);

  const goto = useCallback((next: number) => {
    setAnim(true);
    setIndex(next);
  }, []);

  const onNext = useCallback(() => {
    if (realCount < 2) return;
    goto(index + 1);
  }, [goto, index, realCount]);

  const onPrev = useCallback(() => {
    if (realCount < 2) return;
    goto(index - 1);
  }, [goto, index, realCount]);

  // autoplay opcional
  useEffect(() => {
    if (!autoPlayMs || realCount < 2) return;
    const t = setInterval(onNext, autoPlayMs);
    return () => clearInterval(t);
  }, [autoPlayMs, onNext, realCount]);

  // gestos
  const onPointerDown = (e: PointerEvent) => {
    if (realCount < 2) return;
    drag.current.dragging = true;
    drag.current.startX = e.clientX;
    drag.current.dx = 0;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setAnim(false);
  };
  const onPointerMove = (e: PointerEvent) => {
    if (!drag.current.dragging) return;
    drag.current.dx = e.clientX - drag.current.startX;
  };
  const onPointerUp = () => {
    if (!drag.current.dragging) return;
    drag.current.dragging = false;
    const { dx } = drag.current;
    const threshold = 40;
    if (dx > threshold) onPrev();
    else if (dx < -threshold) onNext();
    else setAnim(true);
  };

  // selección
  const handleSelectTag = useCallback(
    (tag: string) => {
      setActiveTag(tag);
      const params = new URLSearchParams(searchParams.toString());
      params.set("tag", tag);
      router.replace(`?${params.toString()}`, { scroll: false });
      document
        .getElementById("subtags-section")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [router, searchParams, setActiveTag]
  );

  // a11y
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight") onNext();
    if (e.key === "ArrowLeft") onPrev();
  };

  // layout
  const slideBasis = `${100 / Math.max(1, itemsPerView)}%`;
  const translatePct = -(index * (100 / Math.max(1, itemsPerView)));

  return (
    <div className={["relative", className].join(" ")} ref={containerRef} onKeyDown={onKeyDown}>
      {/* Viewport */}
      <div
        role="region"
        aria-roledescription="Carrusel de etiquetas"
        className="overflow-hidden rounded-2xl relative"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        {edgeFade && (
          <>
            <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-white dark:from-gray-950 to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-white dark:from-gray-950 to-transparent" />
          </>
        )}

        <div
          ref={trackRef}
          className={[
            "flex will-change-transform",
            anim ? "transition-transform duration-300 ease-out" : "transition-none",
          ].join(" ")}
          style={{ transform: `translateX(${translatePct}%)` }}
          onTransitionEnd={onTransitionEnd}
        >
          {(realCount >= 2 ? slides : rows).map(({ tag, total }, i) => {
            const meta = tagMeta[tag] ?? defaultTagMeta;
            return (
              <div key={`${tag}-${i}`} className="shrink-0 px-1 sm:px-2 mt-2" style={{ flex: `0 0 ${slideBasis}` }}>
                <button
                  type="button"
                  onClick={() => handleSelectTag(tag)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleSelectTag(tag);
                    }
                  }}
                  className="w-full text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded-xl"
                  aria-label={`Ver subtags de ${meta.label}`}
                >
                  <TagStat label={meta.label} count={total} icon={meta.icon} iconClassName={meta.color} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ÚNICO control: PagerDots (flechas y puntos) */}
      <div className="mt-3">
        <PagerDots
          page={visibleIndex}
          pages={Math.max(1, realCount)}
          onPrev={onPrev}
          onNext={onNext}
        />
      </div>

      {/* Slot vacío sin romper hooks */}
      {realCount === 0 && (
        <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">Sin datos</div>
      )}
    </div>
  );
}
