'use client';
import { cn } from "@/lib/utils";
import Link from 'next/link'
import { usePathname } from "next/navigation";
import React, { useState, useMemo } from "react";
import NotificationBell from "@/components/NotificationBell";

// Use React.memo to prevent unnecessary re-renders
const AdminDesktopNav = React.memo(() => {
  const pathname = usePathname();
  const [hovered, setHovered] = useState<string | null>(null);

  // Memoize the links array to prevent it from being recreated on each render
  const links = useMemo(() => [
    { name: "Home", path: "/admin" },
    { name: "Deals", path: "/admin/deals" },
    { name: "Chat", path: "/admin/chat" },
    { name: "Profile", path: "/admin/profile" },
  ], []);

  // Memoize the nav content based on pathname and hovered state
  const navContent = useMemo(() => (
    <nav className="hidden lg:flex sticky top-0 h-16 bg-white z-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-8 flex items-center justify-between w-full">
        <div className="flex-1">
          <span className="text-4xl font-bold bg-gradient-to-r from-pick-blue to-pick-pink text-transparent bg-clip-text">
            PICKCREATOR ADMIN
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
                    ? "text-gray-900"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                {link.name}
              </span>
              {(pathname === link.path || hovered === link.path) && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gray-900" />
              )}
            </Link>
          ))}
        </div>
        <div className="flex-1 flex justify-end">
          <NotificationBell userType="admin" />
        </div>
      </div>
    </nav>
  ), [pathname, hovered, links]);

  return navContent;
});

AdminDesktopNav.displayName = 'AdminDesktopNav';

export default AdminDesktopNav; 