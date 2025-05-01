'use client';
import { cn } from "@/lib/utils";
import { Home, ShoppingBag, MessageSquare, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useMemo } from "react";

// Use React.memo to prevent unnecessary re-renders
const AdminMobileNav = React.memo(() => {
  const pathname = usePathname();

  // Memoize the tabs array to prevent it from being recreated on each render
  const tabs = useMemo(() => [
    { icon: Home, label: "Home", path: "/admin" },
    { icon: ShoppingBag, label: "Deals", path: "/admin/deals" },
    { icon: MessageSquare, label: "Chat", path: "/admin/chat" },
    { icon: User, label: "Profile", path: "/admin/profile" },
  ], []);

  // Memoize the nav content based on pathname
  const navContent = useMemo(() => (
    <nav className="lg:hidden sticky bottom-0 h-16 bg-white z-50 border-t border-gray-200 shadow-md">
      <div className="grid grid-cols-4 h-full">
        {tabs.map(({ icon: Icon, label, path }) => (
          <Link
            key={path}
            href={path}
            className={cn(
              "flex flex-col items-center justify-center space-y-1",
              pathname === path
                ? "text-blue-700"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            <Icon
              size={20}
              className={cn(
                "transition-colors duration-200",
                pathname === path && "text-blue-500",
                !pathname?.includes(path) && "text-gray-500 group-hover:text-gray-700"
              )}
            />
            <span className="text-xs font-medium">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  ), [pathname, tabs]);

  return navContent;
});

AdminMobileNav.displayName = 'AdminMobileNav';

export default AdminMobileNav; 