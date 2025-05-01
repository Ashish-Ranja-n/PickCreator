'use client';

import DesktopNav from "@/components/elements/influencerElements/desktopNavInf";
import MobileNav from "@/components/elements/influencerElements/mobileNavInf";
import { usePathname } from "next/navigation";
import { UseIsMobile } from "@/utils/detectors";
import React, { useMemo } from "react";
import Navbar1 from "@/components/navbar(inside)/navbar1";
import { AuthGuard } from "@/components/AuthGuard";
  
interface InfluencerLayoutProps {
  children: React.ReactNode;
}

// Use React.memo to prevent unnecessary re-renders of the layout component
const InfluencerLayout: React.FC<InfluencerLayoutProps> = React.memo((props) => {
  const pathname = usePathname();
  const hideNavbar = useMemo(() => pathname?.startsWith("/influencer/chat/") || pathname?.startsWith("/influencer/onboarding/") || false, [pathname]);
  const isMobile = UseIsMobile();

  // Memoize the layout based on hideNavbar and isMobile
  const layoutContent = useMemo(() => (
    <AuthGuard requiredRole="Influencer">
        {isMobile && !hideNavbar && <Navbar1 />}
      <div className="bg-background">
        {!hideNavbar && <DesktopNav />}
        <div className="h-full">{props.children}</div>
      </div>
        {!hideNavbar && <MobileNav />}
    </AuthGuard>
  ), [hideNavbar, isMobile, props.children]);

  return layoutContent;
});

InfluencerLayout.displayName = 'InfluencerLayout';

export default InfluencerLayout;