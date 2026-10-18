import {
  Home,
  FileStack,
  Settings,
} from "lucide-react";

export interface NavItem {
  label: string;
  path: string;
  icon: typeof Home;
  tooltip: string;
  section?: "primary" | "system";
}

export const PRIMARY_NAV_ITEMS: NavItem[] = [
  { label: "Home", path: "/command-center", icon: Home, tooltip: "Your cases and how the 4 steps work" },
  { label: "Cases", path: "/cases", icon: FileStack, tooltip: "All cases assigned to you" },
];

export const SYSTEM_NAV_ITEMS: NavItem[] = [
  { label: "Settings", path: "/settings", icon: Settings, tooltip: "Your preferences" },
];

export const ALL_NAV_ITEMS: NavItem[] = [...PRIMARY_NAV_ITEMS, ...SYSTEM_NAV_ITEMS];
