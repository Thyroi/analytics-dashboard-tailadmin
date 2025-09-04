"use client";

import * as React from "react";
import TagStat from "@/components/dashboard/TagsStat";
import PagerDots from "../../../../components/common/PagerDots";
import { useTopTagsCtx } from "@/features/chatbot/context/TopTagsCtx";
import { useRouter, useSearchParams } from "next/navigation";

type HeroIcon = React.ComponentType<React.SVGProps<SVGSVGElement>>;

export type TagMetaEntry = {
  label: string;
  icon: HeroIcon;
  color: string; // clases Tailwind para el chip
};

export type TagRow = { tag: string; total: number };

export default function TagsDrawer({
  rows,
  tagMeta,
  defaultTagMeta,
  page,
  pages,
  onPrev,
  onNext,
  className = "",
}: {
  rows: TagRow[];
  tagMeta: Record<string, TagMetaEntry>;
  defaultTagMeta: TagMetaEntry;
  page: number;
  pages: number;
  onPrev: () => void;
  onNext: () => void;
  className?: string;
}) {
  const { setActiveTag } = useTopTagsCtx();
  const router = useRouter();
  const searchParams = useSearchParams();

  const onSelectTag = React.useCallback(
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

  return (
    <div className={className}>
      <div className="tag-grid">
        {rows.map(({ tag, total }) => {
          const meta = tagMeta[tag] ?? defaultTagMeta;
          return (
            <div key={tag} className="min-w-0">
              <button
                type="button"
                onClick={() => onSelectTag(tag)}
                onKeyDown={(e: React.KeyboardEvent<HTMLButtonElement>) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectTag(tag);
                  }
                }}
                className="w-full text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded-xl"
                aria-label={`Ver subtags de ${meta.label}`}
              >
                <TagStat
                  label={meta.label}
                  count={total}
                  icon={meta.icon}
                  iconClassName={meta.color}
                />
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-3">
        <PagerDots page={page} pages={pages} onPrev={onPrev} onNext={onNext} />
      </div>
    </div>
  );
}
