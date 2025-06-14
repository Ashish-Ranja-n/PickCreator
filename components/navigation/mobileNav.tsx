'use client';
import { cn } from "@/lib/utils";
import { Home, ShoppingBag, MessageCircleMore, User2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDealStatusDot } from "@/hook/useDealStatusDot";

const MobileNav = () => {
  const pathname = usePathname();
  const hasActiveDeal = useDealStatusDot();

  const tabs = [
    { icon: Home, label: "Home", path: "/brand" },
    { icon: ShoppingBag, label: "Deals", path: "/brand/deals" },
    { icon: MessageCircleMore, label: "Chat", path: "/brand/chat" },
    { icon: User2, label: "Profile", path: "/brand/profile" },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 w-full z-50 bg-slate-50 border-t border-slate-200">
      <div className="flex justify-between items-center h-16 px-6 max-w-screen-sm mx-auto">
        {tabs.map(({ icon: Icon, label, path }) => {
          const isActive = pathname === path;
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
                    ? "bg-white shadow-sm"
                    : "hover:bg-slate-100"
                )}
              >
                <Icon
                  size={26}
                  className={cn(
                    "transition-all duration-200",
                    isActive
                      ? "text-blue-600"
                      : "text-slate-600 group-hover:text-blue-500"
                  )}
                />
                {label === "Deals" && hasActiveDeal && (
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
  );
};

export default MobileNav;
