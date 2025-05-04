'use client';

import DesktopNav from "@/components/elements/influencerElements/desktopNavInf";
import MobileNav from "@/components/elements/influencerElements/mobileNavInf";
import { usePathname } from "next/navigation";
import { UseIsMobile } from "@/utils/detectors";
import React, { useMemo } from "react";
import Navbar1 from "@/components/navbar(inside)/navbar1";
import Navbar from "@/components/navbar(inside)/navbar";
import { AuthGuard } from "@/components/AuthGuard";
import { useTheme } from "next-themes";

interface InfluencerLayoutProps {
  children: React.ReactNode;
}

// Use React.memo to prevent unnecessary re-renders of the layout component
const InfluencerLayout: React.FC<InfluencerLayoutProps> = React.memo((props) => {
  const pathname = usePathname();
  const hideNavbar = useMemo(() => pathname?.startsWith("/influencer/chat/") || pathname?.startsWith("/influencer/onboarding/") || false, [pathname]);
  const isMobile = UseIsMobile();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  // Memoize the layout based on hideNavbar, isMobile, and theme
  const layoutContent = useMemo(() => (
    <AuthGuard requiredRole="Influencer">
        {isMobile && !hideNavbar && (
          isDarkMode ? <Navbar1 /> : <Navbar />
        )}
      <div className="bg-background">
        {!hideNavbar && <DesktopNav />}
        <div className="h-full">{props.children}</div>
      </div>
        {!hideNavbar && <MobileNav />}
    </AuthGuard>
  ), [hideNavbar, isMobile, props.children, isDarkMode]);

  return layoutContent;
});

InfluencerLayout.displayName = 'InfluencerLayout';

export default InfluencerLayout;