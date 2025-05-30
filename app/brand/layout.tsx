'use client';
import DesktopNav from "@/components/navigation/desktopNav";
import MobileNav from "@/components/navigation/mobileNav";
import Navbar from "@/components/navbar(inside)/navbar";
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

  return (
    <AuthGuard requiredRole="Brand">
        {isMobile && !hideNavbar && <Navbar />}
      <div className="bg-background">
        {!hideNavbar && <DesktopNav />}
        <div className={`${isMobile && !hideNavbar ? 'pt-16' : ''} h-screen}`}>{props.children}</div>
      </div>
        {!hideNavbar && <MobileNav />}
    </AuthGuard>
  )
}

export default BrandLayout