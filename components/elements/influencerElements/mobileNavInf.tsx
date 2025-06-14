'use client';
import { cn } from "@/lib/utils";
import { Home, ShoppingBag, MessageCircle, User, Users2Icon,User2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { useThemeContext } from "@/context/ThemeContext";
import { useDealStatusDot } from "@/hook/useDealStatusDot";

// Use React.memo to prevent unnecessary re-renders
const MobileNav = React.memo(() => {
  const pathname = usePathname();
  const { isDarkMode } = useThemeContext();
  const hasActiveDeal = useDealStatusDot();

  // Memoize the tabs array to prevent it from being recreated on each render
  const tabs = useMemo(() => [
    { icon: Home, label: "Home", path: "/influencer" },
    { icon: ShoppingBag, label: "Deals", path: "/influencer/deals" },
    { icon: Users2Icon, label: "Community", path: "/influencer/community" },
    { icon: MessageCircle, label: "Chat", path: "/influencer/chat" },
    { icon: User2, label: "Profile", path: "/influencer/profile" },
  ], []);

  // Memoize the nav content based on pathname
  const navContent = useMemo(() => (
    <nav className={cn(
      "lg:hidden fixed bottom-0 left-0 right-0 w-full z-50 border-t",
      isDarkMode 
        ? "bg-gray-950 border-gray-800"
        : "bg-slate-50 border-slate-200"
    )}>
      <div className="flex justify-between items-center h-16 px-6 max-w-screen-sm mx-auto">
        {tabs.map(({ icon: Icon, label, path }) => {
          const isActive = pathname === path;
          const isDealTab = label === "Deals";
          return (
            <Link
              key={path}
              href={path}
              className="relative group"
            >
              <div
                className={cn(
                  "relative flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200",
                  isActive
                    ? isDarkMode
                      ? "bg-gray-800"
                      : "bg-white shadow-sm"
                    : "hover:bg-slate-100"
                )}
              >
                <Icon
                  size={26}
                  className={cn(
                    "transition-all duration-200",
                    isActive
                      ? isDarkMode
                        ? "text-fuchsia-400"
                        : "text-fuchsia-600"
                      : isDarkMode
                        ? "text-zinc-400 group-hover:text-fuchsia-400"
                        : "text-slate-600 group-hover:text-fuchsia-500"
                  )}
                />
                {isDealTab && hasActiveDeal && (
                  <div className="absolute -top-1 -right-1 flex items-center justify-center">
                    <span className="absolute w-4 h-4 bg-red-500/20 rounded-full animate-ping" />
                    <span className="relative w-3 h-3 bg-red-500 rounded-full" />
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  ), [pathname, tabs, isDarkMode, hasActiveDeal]);

  return navContent;
});

MobileNav.displayName = 'MobileNav';

export default MobileNav;
