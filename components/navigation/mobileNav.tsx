'use client';
import { cn } from "@/lib/utils";
import { Home, ShoppingBag, MessageCircle, User2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDealStatusDot } from "@/hook/useDealStatusDot";
import { useThemeContext } from "@/context/ThemeContext";

const MobileNav = () => {
  const pathname = usePathname();
  const hasActiveDeal = useDealStatusDot();
  const { isDarkMode } = useThemeContext();

  const navClass = cn(
    "lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 w-[95vw] max-w-md z-50 rounded-2xl px-3 py-2 flex justify-between items-center backdrop-blur-xl border transition-all duration-300",
    isDarkMode
      ? "bg-zinc-900/95 border-zinc-700/60 shadow-2xl shadow-black/30 ring-1 ring-zinc-600/20"
      : "bg-white/95 border-zinc-200/60 shadow-2xl shadow-black/15 ring-1 ring-zinc-200/30"
  );
  const navInnerClass = cn(
    "flex w-full justify-between items-center h-14",
    isDarkMode ? "dark" : ""
  );

  const tabs = [
    { icon: Home, label: "Home", path: "/brand" },
    { icon: ShoppingBag, label: "Deals", path: "/brand/deals" },
    { icon: MessageCircle, label: "Chats", path: "/brand/chat" },
    { icon: User2, label: "Profile", path: "/brand/profile" },
  ];

  const navContent = (
    <nav className={navClass}>
      <div className={navInnerClass}>
        {tabs.map(({ icon: Icon, label, path }) => {
          const isActive = pathname === path;
          const isDealTab = label === "Deals";
          const tabClass = "flex-1 flex flex-col items-center justify-center relative group";
          const iconWrapClass = cn(
            "relative flex items-center justify-center w-12 h-12 rounded-full shadow-lg border transition-all duration-300 ease-out",
            isActive
              ? isDarkMode
                ? "border-violet-400/60 bg-gradient-to-br from-violet-500/30 to-fuchsia-500/30 shadow-violet-500/40 -translate-y-1 scale-110 ring-2 ring-violet-400/20"
                : "border-violet-400/60 bg-gradient-to-br from-violet-100 to-fuchsia-100 shadow-violet-500/40 -translate-y-1 scale-110 ring-2 ring-violet-400/20"
              : isDarkMode
                ? "bg-zinc-800/90 border-zinc-600/60 hover:border-violet-400/40 hover:bg-gradient-to-br hover:from-violet-500/15 hover:to-fuchsia-500/15 hover:shadow-xl hover:shadow-violet-500/20 hover:scale-105"
                : "bg-white/90 border-zinc-300/60 hover:border-violet-400/40 hover:bg-gradient-to-br hover:from-violet-50/70 hover:to-fuchsia-50/70 hover:shadow-xl hover:shadow-violet-500/20 hover:scale-105"
          );
          const iconSize = 22;
          const iconClass = cn(
            "transition-all duration-300 z-10",
            isActive
              ? isDarkMode
                ? "text-violet-200 drop-shadow-sm"
                : "text-violet-700 drop-shadow-sm"
              : isDarkMode
                ? "text-zinc-300 group-hover:text-violet-200"
                : "text-zinc-700 group-hover:text-violet-700"
          );
          const labelClass = cn(
            "text-xs font-semibold mt-1 transition-all duration-300 z-10 tracking-wide",
            isActive
              ? isDarkMode
                ? "text-violet-300 opacity-100 scale-100"
                : "text-violet-700 opacity-100 scale-100"
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
                  <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-gradient-to-r from-orange-400 to-red-500 border-2 border-white dark:border-zinc-900 rounded-full shadow-lg animate-pulse" />
                )}
                <Icon size={iconSize} className={iconClass} />
              </div>
              <span className={labelClass}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );

  return navContent;
};

export default MobileNav;
