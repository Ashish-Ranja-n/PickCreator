'use client';
import { cn } from "@/lib/utils";
import { Home, ShoppingBag, MessageSquare, User, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useMemo } from "react";
import { useThemeContext } from "@/context/ThemeContext";
import { useDealStatusDot } from "@/hook/useDealStatusDot";

// Use React.memo to prevent unnecessary re-renders
const AdminMobileNav = React.memo(() => {
  const pathname = usePathname();
  const { isDarkMode } = useThemeContext();
  const hasActiveDeal = useDealStatusDot();

  const navClass = cn(
    "lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 w-[95vw] max-w-md z-50 rounded-full px-2 py-1 flex justify-between items-center backdrop-blur-md border",
    isDarkMode
      ? "bg-gray-950/90 border-gray-800 shadow-2xl dark:bg-gray-950/90 dark:border-gray-800"
      : "bg-white/90 border-slate-200 shadow-2xl dark:bg-gray-950/90 dark:border-gray-800"
  );
  const navInnerClass = cn(
    "flex w-full justify-between items-center h-16",
    isDarkMode ? "dark" : ""
  );

  // Memoize the tabs array to prevent it from being recreated on each render
  const tabs = useMemo(() => [
    { icon: Home, label: "Home", path: "/admin" },
    { icon: ShoppingBag, label: "Deals", path: "/admin/deals" },
    { icon: Users, label: "Community", path: "/admin/community" },
    { icon: MessageSquare, label: "Chat", path: "/admin/chat" },
    { icon: User, label: "Profile", path: "/admin/profile" },
  ], []);

  // Memoize the nav content based on pathname
  const navContent = useMemo(() => (
    <nav className={navClass}>
      <div className={navInnerClass}>
        {tabs.map(({ icon: Icon, label, path }) => {
          const isActive = pathname === path;
          const isDealTab = label === "Deals";
          const tabClass = "flex-1 flex flex-col items-center justify-center relative";
          const iconWrapClass = cn(
            "relative flex items-center justify-center w-12 h-12 rounded-full shadow-md border transition-all duration-200",
            isActive
              ? isDarkMode
                ? "border-fuchsia-500 bg-fuchsia-950/40 -translate-y-0.8"
                : "border-fuchsia-500 bg-fuchsia-50 -translate-y-0.8"
              : isDarkMode
                ? "bg-gray-900 border-gray-800"
                : "bg-white border-slate-200"
          );
          const iconSize = 26;
          const iconClass = cn(
            "transition-all duration-200 z-10",
            isActive
              ? isDarkMode
                ? "text-fuchsia-400"
                : "text-fuchsia-600"
              : isDarkMode
                ? "text-zinc-400 group-hover:text-fuchsia-400"
                : "text-slate-600 group-hover:text-fuchsia-500"
          );
          const labelClass = cn(
            "text-xs font-semibold mt-[1px] transition-all duration-200 z-10 tracking-wide",
            isActive
              ? isDarkMode
                ? "text-fuchsia-300 opacity-100 scale-100"
                : "text-fuchsia-700 opacity-100 scale-100"
              : "opacity-0 scale-75 h-0"
          );
          return (
            <Link
              key={path}
              href={path}
              className={tabClass}
            >
              <div className={iconWrapClass}>
                {isDealTab && hasActiveDeal && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-fuchsia-500 border-2 border-white dark:border-gray-950 rounded-full shadow-md" />
                )}
                <Icon size={iconSize} className={iconClass} />
              </div>
              <span className={labelClass}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  ), [pathname, tabs, isDarkMode, hasActiveDeal, navClass]);

  return navContent;
});

AdminMobileNav.displayName = 'AdminMobileNav';

export default AdminMobileNav;