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
    "lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 w-[95vw] max-w-md z-50 rounded-2xl px-3 py-2 flex justify-between items-center backdrop-blur-xl border transition-all duration-300",
    isDarkMode
      ? "bg-zinc-900/95 border-zinc-700/60 shadow-2xl shadow-black/30 ring-1 ring-zinc-600/20"
      : "bg-white/95 border-zinc-200/60 shadow-2xl shadow-black/15 ring-1 ring-zinc-200/30"
  );
  const navInnerClass = "flex w-full justify-between items-center h-14";

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
            "relative flex items-center justify-center w-12 h-12 rounded-full shadow-lg border transition-all duration-300 ease-out",
            isActive
              ? isDarkMode
                ? "border-emerald-400/60 bg-gradient-to-br from-emerald-500/30 to-teal-500/30 shadow-emerald-500/40 -translate-y-1 scale-110 ring-2 ring-emerald-400/20"
                : "border-emerald-400/60 bg-gradient-to-br from-emerald-100 to-teal-100 shadow-emerald-500/40 -translate-y-1 scale-110 ring-2 ring-emerald-400/20"
              : isDarkMode
                ? "bg-zinc-800/90 border-zinc-600/60 hover:border-emerald-400/40 hover:bg-gradient-to-br hover:from-emerald-500/15 hover:to-teal-500/15 hover:shadow-xl hover:shadow-emerald-500/20 hover:scale-105"
                : "bg-white/90 border-zinc-300/60 hover:border-emerald-400/40 hover:bg-gradient-to-br hover:from-emerald-50/70 hover:to-teal-50/70 hover:shadow-xl hover:shadow-emerald-500/20 hover:scale-105"
          );
          const iconSize = 26;
          const iconClass = cn(
            "transition-all duration-300 z-10",
            isActive
              ? isDarkMode
                ? "text-emerald-200 drop-shadow-sm"
                : "text-emerald-700 drop-shadow-sm"
              : isDarkMode
                ? "text-zinc-300 group-hover:text-emerald-200"
                : "text-zinc-700 group-hover:text-emerald-700"
          );
          const labelClass = cn(
            "text-xs font-semibold mt-[1px] transition-all duration-300 z-10 tracking-wide",
            isActive
              ? isDarkMode
                ? "text-emerald-300 opacity-100 scale-100"
                : "text-emerald-700 opacity-100 scale-100"
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
                  <span className={cn(
                    "absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full shadow-md border-2",
                    isDarkMode ? "border-zinc-900" : "border-white"
                  )} />
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