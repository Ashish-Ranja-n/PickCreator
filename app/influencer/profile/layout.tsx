'use client';

import React from "react";
import { AuthGuard } from "@/components/AuthGuard";

interface ProfileLayoutProps {
  children: React.ReactNode;
}

// Separate layout for profile to avoid onboarding checks 
// (since we're already in a valid influencer section)
export default function ProfileLayout({ children }: ProfileLayoutProps) {
  // Using AuthGuard without onboarding check since we're already in the profile section
  return (
    <AuthGuard requiredRole="Influencer">
      {children}
    </AuthGuard>
  );
} 