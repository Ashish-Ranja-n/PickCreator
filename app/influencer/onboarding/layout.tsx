"use client";

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OnboardingProvider, useOnboarding } from './OnboardingContext';

// Define onboarding steps
const ONBOARDING_STEPS = [
  { path: "/influencer/onboarding/basic-info", label: "Basic Info" },
  { path: "/influencer/onboarding/pricing-model", label: "Pricing Models" },
  { path: "/influencer/onboarding/brand-preferences", label: "Brand Preferences" },
  { path: "/influencer/onboarding/personal-info", label: "Personal Info" },
  { path: "/influencer/onboarding/review", label: "Review" }
];

function OnboardingLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { onboardingData, isLoading, error } = useOnboarding();
  
  // Determine current step index
  const currentStepIndex = ONBOARDING_STEPS.findIndex(step => step.path === pathname);
  
  // Function to check if required fields for the current step are filled
  const hasRequiredFieldsForStep = (stepIndex: number): boolean => {
    // If data is still loading, default to false (don't show skip button)
    if (isLoading) return false;
    
    switch(stepIndex) {
      case 0: // Basic Info
        return !!onboardingData.bio && !!onboardingData.city;
      case 1: // Pricing Models
        return (
          (onboardingData.fixedPricing?.enabled && 
            (!!onboardingData.fixedPricing?.storyPrice || 
             !!onboardingData.fixedPricing?.reelPrice || 
             !!onboardingData.fixedPricing?.postPrice || 
             !!onboardingData.fixedPricing?.livePrice)) || 
          onboardingData.negotiablePricing ||
          (onboardingData.packageDeals?.enabled && onboardingData.packageDeals?.packages?.length > 0) ||
          (onboardingData.barterDeals?.enabled && onboardingData.barterDeals?.acceptedCategories?.length > 0)
        );
      case 2: // Brand Preferences
        return (
          (onboardingData.brandPreferences?.preferredBrandTypes?.length > 0) &&
          (onboardingData.brandPreferences?.collabStyles?.length > 0)
        );
      case 3: // Personal Info
        return (
          typeof onboardingData.age === 'number' && onboardingData.age >= 13 && onboardingData.age <= 100 &&
          !!onboardingData.gender
        );
      default:
        return false;
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-[#F8F6FA] px-4 pt-0 pb-0 relative">
      {/* Top Bar: PickCreator + Help */}
      <div className="flex items-center justify-between pt-6 px-1 mb-6">
        <h2 className="text-[#C13B7B] text-2xl font-extrabold tracking-wide select-none" style={{letterSpacing: '0.04em'}}>PickCreator</h2>
        <button type="button" className="text-[#C13B7B] hover:text-[#A07BA6] text-2xl" title="Help">
          <span className="text-3xl font-bold">?</span>
        </button>
      </div>
      {/* Loading Overlay - Darker Pink version */}
      {isLoading && (
        <div className="absolute inset-0 bg-[#F8F6FA]/80 z-50 flex items-center justify-center">
          <div className="h-10 w-10 rounded-full border-4 border-[#C13B7B] border-t-transparent animate-spin"></div>
        </div>
      )}
      <div className="flex flex-col space-y-8 flex-1">
        {/* Header */}
        <div className="flex flex-col items-center space-y-4">
          <h1 className="text-3xl font-bold text-center tracking-tight text-[#23111A]">Complete Your Profile</h1>
          <p className="text-center text-[#A07BA6] max-w-2xl">
            Tell brands about yourself and your collaboration preferences to get discovered.
          </p>
        </div>
        {/* Progress Steps */}
        <div className="relative">
          <div className="flex justify-between mb-2">
            {ONBOARDING_STEPS.map((step, index) => (
              <div key={index} className="flex flex-col items-center">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-300
                    ${index <= currentStepIndex ? 'bg-[#C13B7B] border-[#C13B7B] text-white' : 'border-[#E2B6C6] bg-[#F8E6F4] text-[#A07BA6]'}`}
                >
                  {index < currentStepIndex ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <span className={`text-xs mt-1 ${index <= currentStepIndex ? 'text-[#C13B7B] font-medium' : 'text-[#A07BA6]'}`}>{step.label}</span>
              </div>
            ))}
          </div>
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-[#E2B6C6] -z-10">
            <div 
              className="h-full bg-[#C13B7B] transition-all" 
              style={{ width: `${(currentStepIndex / (ONBOARDING_STEPS.length - 1)) * 100}%` }}
            ></div>
          </div>
        </div>
        {/* Main Content */}
        <div className="bg-white rounded-2xl border border-[#F9D6C7] shadow-sm p-6">
          {children}
        </div>
        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4 pb-8">
          <Button
            variant="outline"
            onClick={() => {
              if (currentStepIndex > 0) {
                router.push(ONBOARDING_STEPS[currentStepIndex - 1].path);
              } else {
                router.push('/connect-instagram');
              }
            }}
            disabled={currentStepIndex === 0 || isLoading}
            className="border-[#C13B7B] text-[#C13B7B] hover:bg-[#F8E6F4]"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          {currentStepIndex < ONBOARDING_STEPS.length - 1 && hasRequiredFieldsForStep(currentStepIndex) && (
            <Button
              onClick={() => router.push(ONBOARDING_STEPS[currentStepIndex + 1].path)}
              className="ml-auto bg-[#C13B7B] hover:bg-[#a02c63] text-white"
              disabled={isLoading}
            >
              Skip
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <OnboardingProvider>
      <OnboardingLayoutContent>
        {children}
      </OnboardingLayoutContent>
    </OnboardingProvider>
  );
}