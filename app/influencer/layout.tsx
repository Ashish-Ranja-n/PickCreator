'use client';

import DesktopNav from "@/components/elements/influencerElements/desktopNavInf";
import MobileNav from "@/components/elements/influencerElements/mobileNavInf";
import { usePathname } from "next/navigation";
import { UseIsMobile } from "@/utils/detectors";
import React, { useMemo } from "react";
import Navbar1 from "@/components/navbar(inside)/navbar1";
import Navbar from "@/components/navbar(inside)/navbar";
import NotificationPermissionPrompt from "@/components/NotificationPermissionPrompt";
import { isPWAInstalled } from "@/utils/registerServiceWorker";
import { AuthGuard } from "@/components/AuthGuard";
import { ThemeContextProvider, useThemeContext } from "@/context/ThemeContext";

interface InfluencerLayoutProps {
  children: React.ReactNode;
}

// Inner component that uses the theme context

const InfluencerLayoutInner: React.FC<InfluencerLayoutProps> = React.memo((props) => {
  const pathname = usePathname();
  const hideNavbar = useMemo(() => pathname?.startsWith("/influencer/chat/") || pathname?.startsWith("/influencer/onboarding/") || false, [pathname]);
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
    <AuthGuard requiredRole="Influencer">
      {isMobile && !hideNavbar && <Navbar />}
      <div className="bg-background">
        {!hideNavbar && <DesktopNav />}
        <div className="h-full">
          {showPrompt && <NotificationPermissionPrompt userType="influencer" />}
          {props.children}
        </div>
      </div>
      {!hideNavbar && <MobileNav />}
    </AuthGuard>
  ), [hideNavbar, isMobile, props.children, isDarkMode, showPrompt]);

  return layoutContent;
});

InfluencerLayoutInner.displayName = 'InfluencerLayoutInner';

// Wrapper component that provides the theme context
const InfluencerLayout: React.FC<InfluencerLayoutProps> = (props) => {
  return (
    <ThemeContextProvider>
      <InfluencerLayoutInner {...props} />
    </ThemeContextProvider>
  );
};

InfluencerLayout.displayName = 'InfluencerLayout';

export default InfluencerLayout;