'use client';

import React from "react";
import NotificationPermissionPrompt from "@/components/NotificationPermissionPrompt";
import { isPWAInstalled } from "@/utils/registerServiceWorker";
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
  const [showPrompt, setShowPrompt] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== "undefined" && isPWAInstalled()) {
      setShowPrompt(true);
    } else {
      setShowPrompt(false);
    }
  }, []);

  const layoutContent = React.useMemo(() => (
    <AuthGuard requiredRole="Admin">
      {isMobile && !hideNavbar && <Navbar />}
      <div className="bg-background">
        {!hideNavbar && <AdminDesktopNav />}
        <div className={`${isMobile && !hideNavbar ? 'pt-11 pb-16' : ''} h-screen`}>
          {showPrompt && <NotificationPermissionPrompt userType="admin" />}
          {props.children}
        </div>
      </div>
      {!hideNavbar && <AdminMobileNav />}
    </AuthGuard>
  ), [hideNavbar, isMobile, props.children, showPrompt]);

  return layoutContent;
});

AdminLayout.displayName = 'AdminLayout';

export default AdminLayout;
