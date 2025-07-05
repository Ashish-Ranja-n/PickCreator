'use client';
import DesktopNav from "@/components/navigation/desktopNav";
import MobileNav from "@/components/navigation/mobileNav";
import Navbar from "@/components/navbar(inside)/navbar";
import NotificationPermissionPrompt from "@/components/NotificationPermissionPrompt";
import { isPWAInstalled } from "@/utils/registerServiceWorker";
import { UseIsMobile } from "@/utils/detectors";
import React, { useMemo } from "react";
import { usePathname } from "next/navigation";
import { AuthGuard } from "@/components/AuthGuard";
import { ThemeContextProvider, useThemeContext } from "@/context/ThemeContext";
  
interface BrandLayoutProps {
  children: React.ReactNode;
}

// Inner component that uses the theme context
const BrandLayoutInner: React.FC<BrandLayoutProps> = React.memo((props) => {
  const pathname = usePathname();
  const hideNavbar = useMemo(() => pathname?.startsWith("/brand/chat/") || pathname?.startsWith("/brand/edit-profile") || pathname?.startsWith("/brand/onboarding") || false, [pathname]);
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
    <AuthGuard requiredRole="Brand">
      {isMobile && !hideNavbar && <Navbar />}
      <div className="bg-background">
        {!hideNavbar && <DesktopNav />}
        <div className={`${isMobile && !hideNavbar ? 'pt-[50px] pb-20' : ''} h-screen}`}>
          {showPrompt && <NotificationPermissionPrompt userType="brand" />}
          {props.children}
        </div>
      </div>
      {!hideNavbar && <MobileNav />}
    </AuthGuard>
  ), [hideNavbar, isMobile, props.children, isDarkMode, showPrompt]);

  return layoutContent;
});

BrandLayoutInner.displayName = 'BrandLayoutInner';

// Wrapper component that provides the theme context
const BrandLayout: React.FC<BrandLayoutProps> = (props) => {
  return (
    <ThemeContextProvider>
      <BrandLayoutInner {...props} />
    </ThemeContextProvider>
  );
};

BrandLayout.displayName = 'BrandLayout';

export default BrandLayout;