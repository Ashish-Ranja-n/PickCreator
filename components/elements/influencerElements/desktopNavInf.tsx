'use client';
import { cn } from "@/lib/utils";
import Link from 'next/link'
import { usePathname } from "next/navigation";
import React, { useState, useMemo } from "react";
import NotificationBell from "@/components/NotificationBell";
import { useThemeContext } from "@/context/ThemeContext";

// Use React.memo to prevent unnecessary re-renders
const DesktopNav = React.memo(() => {
  const pathname = usePathname();
  const [hovered, setHovered] = useState<string | null>(null);
  const { isDarkMode } = useThemeContext();

  // Memoize the links array to prevent it from being recreated on each render
  const links = useMemo(() => [
    { name: "Home", path: "/influencer" },
    { name: "Deals", path: "/influencer/deals" },
    { name: "Community", path: "/influencer/community" },
    { name: "Chat", path: "/influencer/chat" },
    { name: "Profile", path: "/influencer/profile" },
  ], []);

  // Memoize the nav content based on pathname and hovered state
  const navContent = useMemo(() => (
    <nav className={cn(
      "hidden lg:flex sticky top-0 h-16 z-50 backdrop-blur-md",
      isDarkMode
        ? "bg-black/95 border-b border-zinc-800/50 text-white"
        : "bg-white/95 border-b border-gray-200/50 text-gray-900"
    )}>
      <div className="max-w-7xl mx-auto px-8 flex items-center justify-between w-full">
        <div className="flex-1">
          <span className="text-4xl font-bold bg-gradient-to-r from-pick-blue to-pick-pink text-transparent bg-clip-text">
            PICKCREATOR
          </span>
        </div>
        <div className="flex items-center space-x-8">
          {links.map((link) => (
            <Link
              key={link.path}
              href={link.path}
              className="relative py-5 px-1"
              onMouseEnter={() => setHovered(link.path)}
              onMouseLeave={() => setHovered(null)}
            >
              <span
                className={cn(
                  "text-sm font-medium transition-colors duration-200",
                  pathname === link.path
                    ? isDarkMode ? "text-white" : "text-gray-900"
                    : isDarkMode ? "text-zinc-400 hover:text-white" : "text-gray-600 hover:text-gray-900"
                )}
              >
                {link.name}
              </span>
              {(pathname === link.path || hovered === link.path) && (
                <span className={cn(
                  "absolute bottom-0 left-0 w-full h-0.5",
                  isDarkMode ? "bg-fuchsia-500" : "bg-gray-900"
                )} />
              )}
            </Link>
          ))}
        </div>
        <div className="flex-1 flex justify-end">
          <NotificationBell userType="influencer" />
        </div>
      </div>
    </nav>
  ), [pathname, hovered, links, isDarkMode]);

  return navContent;
});

DesktopNav.displayName = 'DesktopNav';

export default DesktopNav;
