"use client";

import * as React from "react";
import TagStat from "@/components/dashboard/TagsStat";
import PagerDots from "./PagerDots";

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
  return (
    <div className={className}>
      {/* Grid de tags */}
      <div className="tag-grid">
        {rows.map(({ tag, total }) => {
          const meta = tagMeta[tag] ?? defaultTagMeta;
          return (
            <div key={tag} className="min-w-0">
              <TagStat
                label={meta.label}
                count={total}
                icon={meta.icon}
                iconClassName={meta.color}
              />
            </div>
          );
        })}
      </div>

      {/* Paginación */}
      <div className="mt-3">
        <PagerDots page={page} pages={pages} onPrev={onPrev} onNext={onNext} />
      </div>
    </div>
  );
}
