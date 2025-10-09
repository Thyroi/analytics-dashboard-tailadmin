import {
  ChartBarIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  HomeIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { SidebarItemDef } from "./types";

/** Ítems fijos (arriba) */
export const PRIMARY_ITEMS: SidebarItemDef[] = [
  { name: "Resumen", path: "/", icon: <HomeIcon className="w-5 h-5" /> },
];

/** Ítems funcionales base (debajo) */
export const SECONDARY_ITEMS_BASE: SidebarItemDef[] = [
  {
    name: "Analítica web",
    path: "/analytics",
    icon: <ChartBarIcon className="w-5 h-5" />,
  },
  {
    name: "Analítica chatbot",
    path: "/chatbot",
    icon: <ChatBubbleOvalLeftEllipsisIcon className="w-5 h-5" />,
  },
];

/** Ítem condicional admin */
export const ADMIN_ITEM: SidebarItemDef = {
  name: "Users",
  path: "/users",
  icon: <UserGroupIcon className="w-5 h-5" />,
};
