'use client';

import React from "react";
import { usePathname } from "next/navigation";
import { UseIsMobile } from "@/utils/detectors";
import { AuthGuard } from "@/components/AuthGuard";
import AdminDesktopNav from "@/components/elements/adminElements/desktopNavAdmin";
import AdminMobileNav from "@/components/elements/adminElements/mobileNavAdmin";
import Navbar from "@/components/navbar(inside)/navbar";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = React.memo((props) => {
  const pathname = usePathname();
  const hideNavbar = pathname?.startsWith("/admin/chat/") || false;
  const isMobile = UseIsMobile();

  // Memoize the layout based on hideNavbar and isMobile
  const layoutContent = React.useMemo(() => (
    <AuthGuard requiredRole="Admin">
      {isMobile && !hideNavbar && <Navbar />}
      <div className="bg-background">
        {!hideNavbar && <AdminDesktopNav />}
        <div className="h-full">{props.children}</div>
      </div>
      {!hideNavbar && <AdminMobileNav />}
    </AuthGuard>
  ), [hideNavbar, isMobile, props.children]);

  return layoutContent;
});

AdminLayout.displayName = 'AdminLayout';

export default AdminLayout;
