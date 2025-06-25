'use client';
import DesktopNav from "@/components/navigation/desktopNav";
import MobileNav from "@/components/navigation/mobileNav";
import Navbar from "@/components/navbar(inside)/navbar";
import NotificationPermissionPrompt from "@/components/NotificationPermissionPrompt";
import { isPWAInstalled } from "@/utils/registerServiceWorker";
import { UseIsMobile } from "@/utils/detectors";
import React from "react";
import { usePathname } from "next/navigation";
import { AuthGuard } from "@/components/AuthGuard";
  
interface BrandLayoutProps {
  children: React.ReactNode;
}


const BrandLayout: React.FC<BrandLayoutProps> = (props) => {
  const isMobile = UseIsMobile();
  const pathname = usePathname();
  const hideNavbar = pathname?.startsWith("/brand/chat/") || pathname?.startsWith("/brand/edit-profile") || pathname?.startsWith("/brand/onboarding") || false;
  const [showPrompt, setShowPrompt] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== "undefined" && isPWAInstalled()) {
      setShowPrompt(true);
    } else {
      setShowPrompt(false);
    }
  }, []);

  return (
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
  );
}

export default BrandLayout