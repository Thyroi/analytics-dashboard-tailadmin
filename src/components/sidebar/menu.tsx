import { SidebarItemDef } from "./types";
import {
  HomeIcon,
  MapPinIcon,
  Squares2X2Icon,
  ChartBarIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";

/** Ítems fijos (arriba) */
export const PRIMARY_ITEMS: SidebarItemDef[] = [
  { name: "Home", path: "/", icon: <HomeIcon className="w-5 h-5" /> },
  {
    name: "Municipios y categorías",
    path: "/municipios",
    icon: <MapPinIcon className="w-5 h-5" />,
  },
  {
    name: "Secciones",
    path: "/secciones",
    icon: <Squares2X2Icon className="w-5 h-5" />,
  },
];

/** Ítems funcionales base (debajo) */
export const SECONDARY_ITEMS_BASE: SidebarItemDef[] = [
  { name: "Analytics", path: "/analytics", icon: <ChartBarIcon className="w-5 h-5" /> },
  {
    name: "Chatbot Insights",
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
