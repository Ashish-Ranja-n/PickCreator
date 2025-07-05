'use client';

import React, { useMemo } from "react";
import NotificationPermissionPrompt from "@/components/NotificationPermissionPrompt";
import { isPWAInstalled } from "@/utils/registerServiceWorker";
import { usePathname } from "next/navigation";
import { UseIsMobile } from "@/utils/detectors";
import { AuthGuard } from "@/components/AuthGuard";
import AdminDesktopNav from "@/components/elements/adminElements/desktopNavAdmin";
import AdminMobileNav from "@/components/elements/adminElements/mobileNavAdmin";
import Navbar from "@/components/navbar(inside)/navbar";
import { ThemeContextProvider, useThemeContext } from "@/context/ThemeContext";

interface AdminLayoutProps {
  children: React.ReactNode;
}

// Inner component that uses the theme context
const AdminLayoutInner: React.FC<AdminLayoutProps> = React.memo((props) => {
  const pathname = usePathname();
  const hideNavbar = useMemo(() => pathname?.startsWith("/admin/chat/") || false, [pathname]);
  const isMobile = UseIsMobile();
  const { isDarkMode } = useThemeContext();
  const [showPrompt, setShowPrompt] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== "undefined" && isPWAInstalled()) {
      setShowPrompt(true);
    } else {
      setShowPrompt(false);
    }
  }, []);

  // Memoize the layout based on hideNavbar, isMobile, and theme
  const layoutContent = useMemo(() => (
    <AuthGuard requiredRole="Admin">
      {isMobile && !hideNavbar && <Navbar />}
      <div className="bg-background">
        {!hideNavbar && <AdminDesktopNav />}
        <div className={`${isMobile && !hideNavbar ? 'pt-10 pb-28' : ''} h-screen`}>
          {showPrompt && <NotificationPermissionPrompt userType="admin" />}
          {props.children}
        </div>
      </div>
      {!hideNavbar && <AdminMobileNav />}
    </AuthGuard>
  ), [hideNavbar, isMobile, props.children, isDarkMode, showPrompt]);

  return layoutContent;
});

AdminLayoutInner.displayName = 'AdminLayoutInner';

// Wrapper component that provides the theme context
const AdminLayout: React.FC<AdminLayoutProps> = (props) => {
  return (
    <ThemeContextProvider>
      <AdminLayoutInner {...props} />
    </ThemeContextProvider>
  );
};

AdminLayout.displayName = 'AdminLayout';

export default AdminLayout;
