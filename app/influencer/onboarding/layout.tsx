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
    <div className="container max-w-4xl px-6 py-10 relative">
      {/* Loading Overlay - Simplified version */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/70 z-50 flex items-center justify-center">
          <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        </div>
      )}
      
      <div className="flex flex-col space-y-8">
        {/* Header with Instagram icon */}
        <div className="flex flex-col items-center space-y-4">
          <h1 className="text-3xl font-bold text-center tracking-tight">Complete Your Profile</h1>
          <p className="text-center text-muted-foreground max-w-2xl">
            Tell brands about yourself and your collaboration preferences to get discovered.
          </p>
        </div>
        
        {/* Progress Steps */}
        <div className="relative">
          <div className="flex justify-between mb-2">
            {ONBOARDING_STEPS.map((step, index) => (
              <div key={index} className="flex flex-col items-center">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 
                    ${index <= currentStepIndex ? 'bg-primary border-primary text-primary-foreground' : 'border-muted bg-background text-muted-foreground'}`}
                >
                  {index < currentStepIndex ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <span className={`text-xs mt-1 ${index <= currentStepIndex ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted -z-10">
            <div 
              className="h-full bg-primary transition-all" 
              style={{ width: `${(currentStepIndex / (ONBOARDING_STEPS.length - 1)) * 100}%` }}
            ></div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="bg-card rounded-lg border shadow-sm p-6">
          {children}
        </div>
        
        {/* Navigation Buttons - These will be used by child components */}
        <div className="flex justify-between pt-4">
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
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          
          {currentStepIndex < ONBOARDING_STEPS.length - 1 && hasRequiredFieldsForStep(currentStepIndex) && (
            <Button
              onClick={() => router.push(ONBOARDING_STEPS[currentStepIndex + 1].path)}
              className="ml-auto"
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