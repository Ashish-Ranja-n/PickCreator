'use client';
import { cn } from "@/lib/utils";
import { Home, ShoppingBag, MessageCircle, User, Users2Icon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { useThemeContext } from "@/context/ThemeContext";

// Use React.memo to prevent unnecessary re-renders
const MobileNav = React.memo(() => {
  const pathname = usePathname();
  const { isDarkMode } = useThemeContext();

  // Memoize the tabs array to prevent it from being recreated on each render
  const tabs = useMemo(() => [
    { icon: Home, label: "Home", path: "/influencer" },
    { icon: ShoppingBag, label: "Deals", path: "/influencer/deals" },
    { icon: Users2Icon, label: "Community", path: "/influencer/community" },
    { icon: MessageCircle, label: "Chat", path: "/influencer/chat" },
    { icon: User, label: "Profile", path: "/influencer/profile" },
  ], []);

  // Memoize the nav content based on pathname
  const navContent = useMemo(() => (
    <nav className={cn(
      "lg:hidden fixed bottom-0 left-0 right-0 h-16 backdrop-blur-lg z-50 shadow-lg",
      isDarkMode
        ? "bg-zinc-900/90 border-t border-zinc-800/50"
        : "bg-slate-100/90 border-t border-gray-200/50"
    )}>
      <div className="grid grid-cols-5 h-full max-w-md mx-auto px-1">
        {tabs.map(({ icon: Icon, label, path }) => {
          const isActive = pathname === path;
          return (
            <Link
              key={path}
              href={path}
              className={cn(
                "flex flex-col items-center justify-center relative",
                isActive
                  ? isDarkMode ? "text-white" : "text-gray-900"
                  : isDarkMode ? "text-zinc-400" : "text-gray-500"
              )}
            >

              <motion.div
                layoutId="navIndicator"
                initial={false}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className={cn(
                "flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300",
                isActive
                  ? isDarkMode
                    ? "bg-gradient-to-r from-violet-600/30 to-fuchsia-600/30 shadow-[0_0_8px_rgba(192,38,211,0.3)]"
                    : "bg-gradient-to-r from-violet-400/30 to-fuchsia-400/30 shadow-[0_0_8px_rgba(192,38,211,0.2)]"
                  : "bg-transparent"
              )}>
                <Icon
                  size={24}
                  className={cn(
                    "transition-all duration-300",
                    isActive
                      ? isDarkMode ? "text-fuchsia-400" : "text-fuchsia-500"
                      : isDarkMode ? "text-zinc-400" : "text-gray-500"
                  )}
                />
              </motion.div>
              <span className="text-xs font-medium mt-1">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  ), [pathname, tabs, isDarkMode]);

  return navContent;
});

MobileNav.displayName = 'MobileNav';

export default MobileNav;
