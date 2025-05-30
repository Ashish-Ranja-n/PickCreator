'use client';
import { cn } from "@/lib/utils";
import { Home, ShoppingBag, MessageCircleMore, User2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
const MobileNav = () => {
  const pathname = usePathname();

  const tabs = [
    { icon: Home, label: "Home", path: "/brand" },
    { icon: ShoppingBag, label: "Deals", path: "/brand/deals" },
    { icon: MessageCircleMore, label: "Chat", path: "/brand/chat" },
    { icon: User2, label: "Profile", path: "/brand/profile" },
  ];

  return (
    <nav className="lg:hidden fixed left-0 right-0 bottom-0 h-16 bg-white z-30 border-t border-gray-200">
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
  );
};

export default MobileNav;
