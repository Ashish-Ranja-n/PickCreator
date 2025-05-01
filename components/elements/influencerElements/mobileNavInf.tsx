'use client';
import { cn } from "@/lib/utils";
import { Home, ShoppingBag, MessageSquare, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useMemo } from "react";
import { motion } from "framer-motion";

// Use React.memo to prevent unnecessary re-renders
const MobileNav = React.memo(() => {
  const pathname = usePathname();

  // Memoize the tabs array to prevent it from being recreated on each render
  const tabs = useMemo(() => [
    { icon: Home, label: "Home", path: "/influencer" },
    { icon: ShoppingBag, label: "Deals", path: "/influencer/deals" },
    { icon: MessageSquare, label: "Chat", path: "/influencer/chat" },
    { icon: User, label: "Profile", path: "/influencer/profile" },
  ], []);

  // Memoize the nav content based on pathname
  const navContent = useMemo(() => (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-black/95 backdrop-blur-md z-50 border-t border-zinc-800/50 shadow-lg">
      <div className="grid grid-cols-4 h-full max-w-md mx-auto px-2">
        {tabs.map(({ icon: Icon, label, path }) => {
          const isActive = pathname === path;
          return (
            <Link
              key={path}
              href={path}
              className={cn(
                "flex flex-col items-center justify-center relative",
                isActive
                  ? "text-white"
                  : "text-zinc-400"
              )}
            >

              <motion.div
                layoutId="navIndicator"
                initial={false}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className={cn(
                "flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300",
                isActive
                  ? "bg-gradient-to-r from-violet-600/30 to-fuchsia-600/30 shadow-[0_0_8px_rgba(192,38,211,0.3)]"
                  : "bg-transparent"
              )}>
                <Icon
                  size={20}
                  className={cn(
                    "transition-all duration-300",
                    isActive
                      ? "text-fuchsia-400"
                      : "text-zinc-400"
                  )}
                />
              </motion.div>
              <span className="text-xs font-medium mt-1">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  ), [pathname, tabs]);

  return navContent;
});

MobileNav.displayName = 'MobileNav';

export default MobileNav;
