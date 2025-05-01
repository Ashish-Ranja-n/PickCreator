"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import axios from 'axios';
import { useCurrentUser } from '@/hook/useCurrentUser';

// Define types for fixed pricing
interface FixedPricing {
  enabled: boolean;
  storyPrice?: number | null;
  reelPrice?: number | null;
  postPrice?: number | null;
  livePrice?: number | null;
}

// Define types for package deals
interface PackageDeal {
  name: string;
  includedServices: string;
  totalPrice: number | null;
}

interface PackageDeals {
  enabled: boolean;
  packages: PackageDeal[];
}

// Define types for barter deals
interface BarterDeals {
  enabled: boolean;
  acceptedCategories: string[];
  restrictions?: string;
}

// Brand preferences interface
interface BrandPreferences {
  preferredBrandTypes: string[];
  exclusions: string[];
  collabStyles: string[];
}

// Define the shape of our onboarding state
interface OnboardingState {
  // Basic info
  bio: string;
  city: string;
  
  // Pricing models
  fixedPricing: FixedPricing;
  negotiablePricing: boolean;
  packageDeals: PackageDeals;
  barterDeals: BarterDeals;
  
  // Brand preferences
  brandPreferences: BrandPreferences;
  
  // Onboarding status
  onboardingCompleted: boolean;
  currentStep: number;
}

// Define the context type
interface OnboardingContextType {
  onboardingData: OnboardingState;
  updateOnboardingData: (newData: Partial<OnboardingState>) => void;
  saveCurrentStep: (step: number, formData?: Partial<OnboardingState>) => Promise<void>;
  saveAndCompleteOnboarding: (formData?: Partial<OnboardingState>) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

// Create the context with a default value
const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

// Default onboarding state
const defaultOnboardingState: OnboardingState = {
  bio: '',
  city: '',
  
  fixedPricing: {
    enabled: true,
    storyPrice: null,
    reelPrice: null,
    postPrice: null,
    livePrice: null
  },
  negotiablePricing: false,
  packageDeals: {
    enabled: false,
    packages: []
  },
  barterDeals: {
    enabled: false,
    acceptedCategories: [],
    restrictions: ''
  },
  
  brandPreferences: {
    preferredBrandTypes: [],
    exclusions: [],
    collabStyles: []
  },
  
  onboardingCompleted: false,
  currentStep: 0
};

// Provider component
export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [onboardingData, setOnboardingData] = useState<OnboardingState>(defaultOnboardingState);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);
  const currentUser = useCurrentUser();
  
  // Fetch existing onboarding data when component mounts
  useEffect(() => {
    if (!currentUser) return;
    
    const fetchOnboardingData = async () => {
      try {
        setIsLoading(true);
        
        const response = await axios.get('/api/influencer/onboarding');
        
        if (response.data && response.data.influencer) {
          const influencer = response.data.influencer;
          
          // Transform the data to match our state structure
          const transformedData: OnboardingState = {
            bio: influencer.bio || '',
            city: influencer.city || '',
            
            fixedPricing: {
              // Always ensure fixed pricing is enabled
              enabled: true,
              storyPrice: influencer.pricingModels?.fixedPricing?.storyPrice || null,
              reelPrice: influencer.pricingModels?.fixedPricing?.reelPrice || null,
              postPrice: influencer.pricingModels?.fixedPricing?.postPrice || null,
              livePrice: influencer.pricingModels?.fixedPricing?.livePrice || null
            },
            
            negotiablePricing: influencer.pricingModels?.negotiablePricing || false,
            
            packageDeals: {
              enabled: influencer.pricingModels?.packageDeals?.enabled || false,
              packages: influencer.pricingModels?.packageDeals?.packages || []
            },
            
            barterDeals: {
              enabled: influencer.pricingModels?.barterDeals?.enabled || false,
              acceptedCategories: influencer.pricingModels?.barterDeals?.acceptedCategories || [],
              restrictions: influencer.pricingModels?.barterDeals?.restrictions || ''
            },
            
            brandPreferences: {
              preferredBrandTypes: influencer.brandPreferences?.preferredBrandTypes || [],
              exclusions: influencer.brandPreferences?.exclusions || [],
              collabStyles: influencer.brandPreferences?.collabStyles || []
            },
            
            onboardingCompleted: influencer.onboardingCompleted || false,
            currentStep: influencer.onboardingStep || 0
          };
          
          setOnboardingData(transformedData);
        }
        
        setIsInitialLoadComplete(true);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching onboarding data:', error);
        setError('Failed to load your profile data. Please try again.');
        setIsInitialLoadComplete(true);
        setIsLoading(false);
      }
    };
    
    fetchOnboardingData();
  }, [currentUser]);
  
  // Initial loading screen
  if (!isInitialLoadComplete && isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          <p className="text-primary font-medium">Loading your profile data...</p>
        </div>
      </div>
    );
  }
  
  // Update onboarding data
  const updateOnboardingData = (newData: Partial<OnboardingState>) => {
    setOnboardingData(prevData => ({
      ...prevData,
      ...newData
    }));
  };
  
  // Save current step - COMPLETELY REDESIGNED
  const saveCurrentStep = async (step: number, formData?: Partial<OnboardingState>) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Create a complete data object, merging:
      // 1. Current state data
      // 2. Any form data passed directly (has priority)
      // 3. The new step
      const dataToSave = {
        bio: formData?.bio !== undefined ? formData.bio : onboardingData.bio,
        city: formData?.city !== undefined ? formData.city : onboardingData.city,
        fixedPricing: formData?.fixedPricing || onboardingData.fixedPricing,
        negotiablePricing: formData?.negotiablePricing !== undefined ? formData.negotiablePricing : onboardingData.negotiablePricing,
        packageDeals: formData?.packageDeals || onboardingData.packageDeals,
        barterDeals: formData?.barterDeals || onboardingData.barterDeals,
        brandPreferences: formData?.brandPreferences || onboardingData.brandPreferences,
        onboardingStep: step
      };
      
      // Also update the state for immediate UI feedback
      updateOnboardingData({ 
        ...formData,
        currentStep: step 
      });
      
      // Log what we're about to send to the API
      console.log(`SAVING STEP ${step} DATA:`, JSON.stringify(dataToSave));
      
      // API call
      const response = await axios.put('/api/influencer/onboarding', dataToSave);
      console.log(`Successfully saved onboarding step ${step}:`, response.data);
      
      setIsLoading(false);
      return;
    } catch (error: any) {
      console.error('Error saving onboarding step:', error);
      
      // Enhanced error logging
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
      } else if (error.request) {
        console.error('No response received:', error.request);
      } else {
        console.error('Error setting up request:', error.message);
      }
      
      setError('Failed to save your progress. Please try again.');
      setIsLoading(false);
      throw error;
    }
  };
  
  // Save and complete onboarding - COMPLETELY REDESIGNED
  const saveAndCompleteOnboarding = async (formData?: Partial<OnboardingState>) => {
    try {
      setIsLoading(true);
      
      // Create a complete data object, merging:
      // 1. Current state data
      // 2. Any form data passed directly (has priority)
      // 3. Setting onboardingCompleted to true
      const dataToSave = {
        bio: formData?.bio !== undefined ? formData.bio : onboardingData.bio,
        city: formData?.city !== undefined ? formData.city : onboardingData.city,
        fixedPricing: formData?.fixedPricing || onboardingData.fixedPricing,
        negotiablePricing: formData?.negotiablePricing !== undefined ? formData.negotiablePricing : onboardingData.negotiablePricing,
        packageDeals: formData?.packageDeals || onboardingData.packageDeals,
        barterDeals: formData?.barterDeals || onboardingData.barterDeals,
        brandPreferences: formData?.brandPreferences || onboardingData.brandPreferences,
        onboardingStep: formData?.currentStep !== undefined ? formData.currentStep : onboardingData.currentStep,
        onboardingCompleted: true
      };
      
      // Also update the state for immediate UI feedback
      updateOnboardingData({
        ...formData,
        onboardingCompleted: true
      });
      
      // Log what we're about to send to the API
      console.log('COMPLETING ONBOARDING WITH DATA:', JSON.stringify(dataToSave));
      
      const response = await axios.put('/api/influencer/onboarding', dataToSave);
      console.log('Successfully completed onboarding:', response.data);
      
      setIsLoading(false);
    } catch (error: any) {
      console.error('Error completing onboarding:', error);
      
      // Enhanced error logging
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
      } else if (error.request) {
        console.error('No response received:', error.request);
      } else {
        console.error('Error setting up request:', error.message);
      }
      
      setError('Failed to complete your profile setup. Please try again.');
      setIsLoading(false);
      throw error;
    }
  };
  
  return (
    <OnboardingContext.Provider 
      value={{ 
        onboardingData, 
        updateOnboardingData, 
        saveCurrentStep, 
        saveAndCompleteOnboarding,
        isLoading,
        error 
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

// Hook to use the onboarding context
export function useOnboarding() {
  const context = useContext(OnboardingContext);
  
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  
  return context;
} 