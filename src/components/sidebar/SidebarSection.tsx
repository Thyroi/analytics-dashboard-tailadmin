"use client";

import SidebarItem from "./SidebarItem";
import { SidebarItemDef } from "./types";

type Props = {
  items: SidebarItemDef[];
  isActive: (path: string) => boolean;
};

export default function SidebarSection({ items, isActive }: Props) {
  return (
    <ul className="space-y-1">
      {items.map((it) => (
        <li key={it.name}>
          <SidebarItem item={it} active={isActive(it.path)} />
        </li>
      ))}
    </ul>
  );
}
