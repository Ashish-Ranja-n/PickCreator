"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useOnboarding } from '../OnboardingContext';
import { Button } from '@/components/ui/button';
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Check, Edit, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import { toast } from '@/components/ui/use-toast';

// Brand types map for display
const BRAND_TYPES_MAP: Record<string, string> = {
  "fashion": "Fashion",
  "beauty": "Beauty & Skincare",
  "food": "Food & Beverages",
  "tech": "Technology",
  "travel": "Travel",
  "fitness": "Fitness & Wellness",
  "lifestyle": "Lifestyle",
  "entertainment": "Entertainment",
  "education": "Education",
  "finance": "Finance",
  "automotive": "Automotive",
  "home": "Home & Decor",
};

// Brand exclusions map for display
const BRAND_EXCLUSIONS_MAP: Record<string, string> = {
  "alcohol": "Alcohol",
  "tobacco": "Tobacco",
  "gambling": "Gambling",
  "adult": "Adult Content",
  "political": "Political Organizations",
  "religious": "Religious Organizations",
  "crypto": "Cryptocurrency",
  "mlm": "Multi-Level Marketing",
  "weapons": "Weapons & Firearms",
};

// Collaboration styles map for display
const COLLAB_STYLES_MAP: Record<string, string> = {
  "sponsored_posts": "Sponsored Posts",
  "product_reviews": "Product Reviews",
  "brand_ambassador": "Brand Ambassador",
  "affiliate_marketing": "Affiliate Marketing",
  "giveaways": "Giveaways & Contests",
  "account_takeovers": "Account Takeovers",
  "event_coverage": "Event Coverage",
  "content_creation": "Content Creation",
};

// Barter categories map for display
const BARTER_CATEGORIES_MAP: Record<string, string> = {
  "Beauty & Skincare": "Beauty & Skincare",
  "Fashion & Accessories": "Fashion & Accessories",
  "Tech Gadgets": "Tech Gadgets",
  "Fitness & Wellness": "Fitness & Wellness",
  "Food & Beverages": "Food & Beverages",
  "Home & Decor": "Home & Decor",
  "Travel & Experiences": "Travel & Experiences",
  "Books & Education": "Books & Education",
};

export default function ReviewPage() {
  const router = useRouter();
  const { onboardingData, saveAndCompleteOnboarding, isLoading, error } = useOnboarding();
  const [isSaving, setIsSaving] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  
  // Handle submission
  const handleSubmit = async () => {
    if (!termsAccepted) {
      toast({
        title: "Error",
        description: "Please accept the terms and conditions",
        variant: "destructive",
      });
      return;
    }
    try {
      setIsSaving(true);
      toast({
        title: "Saving",
        description: "Finalizing your profile...",
        duration: 2000
      });
      const formData = {
        bio: onboardingData.bio,
        city: onboardingData.city, 
        fixedPricing: onboardingData.fixedPricing,
        negotiablePricing: onboardingData.negotiablePricing,
        packageDeals: onboardingData.packageDeals,
        barterDeals: onboardingData.barterDeals,
        brandPreferences: onboardingData.brandPreferences,
        currentStep: 3
      };
      console.log("Completing onboarding with full data:", JSON.stringify(formData));
      await saveAndCompleteOnboarding(formData);
      router.push('/verify-instagram');
      toast({
        title: "Complete! 🎉",
        description: "Your profile is now live",
        duration: 2000
      });
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast({
        title: "Error",
        description: "Failed to complete profile setup",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Review Your Profile</h2>
        <p className="text-muted-foreground mt-2">
          Review your information before finalizing your profile.
        </p>
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {/* Personal Info */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Your age and gender</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/influencer/onboarding/personal-info">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium text-sm">Age</h4>
            <p className="text-sm text-muted-foreground mt-1">
              {onboardingData.age || 'Not provided'}
            </p>
          </div>
          <div>
            <h4 className="font-medium text-sm">Gender</h4>
            <p className="text-sm text-muted-foreground mt-1">
              {onboardingData.gender ? onboardingData.gender.charAt(0).toUpperCase() + onboardingData.gender.slice(1) : 'Not provided'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Basic Info */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Your bio and location</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/influencer/onboarding/basic-info">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium text-sm">Bio</h4>
            <p className="text-sm text-muted-foreground mt-1">
              {onboardingData.bio || 'No bio provided'}
            </p>
          </div>
          <div>
            <h4 className="font-medium text-sm">City</h4>
            <p className="text-sm text-muted-foreground mt-1">
              {onboardingData.city || 'No city selected'}
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* Pricing Models */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Pricing Models</CardTitle>
            <CardDescription>How you charge for promotions</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/influencer/onboarding/pricing-model">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Fixed Pricing */}
          {onboardingData.fixedPricing?.enabled && (
            <div>
              <h4 className="font-medium">Fixed Pricing</h4>
              <div className="grid grid-cols-2 gap-4 mt-2">
                {onboardingData.fixedPricing.storyPrice && (
                  <div>
                    <p className="text-sm font-medium">Instagram Story</p>
                    <p className="text-sm text-muted-foreground">₹{onboardingData.fixedPricing.storyPrice} per story</p>
                  </div>
                )}
                {onboardingData.fixedPricing.reelPrice && (
                  <div>
                    <p className="text-sm font-medium">Instagram Reel</p>
                    <p className="text-sm text-muted-foreground">₹{onboardingData.fixedPricing.reelPrice} per reel</p>
                  </div>
                )}
                {onboardingData.fixedPricing.postPrice && (
                  <div>
                    <p className="text-sm font-medium">Instagram Post</p>
                    <p className="text-sm text-muted-foreground">₹{onboardingData.fixedPricing.postPrice} per post</p>
                  </div>
                )}
                {onboardingData.fixedPricing.livePrice && (
                  <div>
                    <p className="text-sm font-medium">Instagram Live</p>
                    <p className="text-sm text-muted-foreground">₹{onboardingData.fixedPricing.livePrice} per session</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Negotiable Pricing */}
          {onboardingData.negotiablePricing && (
            <div>
              <h4 className="font-medium">Negotiable Pricing</h4>
              <p className="text-sm text-muted-foreground mt-1">
                You are open to negotiating prices with brands.
              </p>
            </div>
          )}
          
          {/* Package Deals */}
          {onboardingData.packageDeals?.enabled && onboardingData.packageDeals.packages?.length > 0 && (
            <div>
              <h4 className="font-medium">Package Deals</h4>
              <div className="space-y-3 mt-2">
                {onboardingData.packageDeals.packages.map((pkg, index) => (
                  <div key={index} className="border rounded-md p-3">
                    <p className="text-sm font-medium">{pkg.name}</p>
                    <p className="text-sm text-muted-foreground">{pkg.includedServices}</p>
                    <p className="text-sm font-medium mt-1">₹{pkg.totalPrice}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Barter Deals */}
          {onboardingData.barterDeals?.enabled && (
            <div>
              <h4 className="font-medium">Barter Deals</h4>
              {onboardingData.barterDeals.acceptedCategories?.length > 0 && (
                <div className="mt-1">
                  <p className="text-sm font-medium">Accepted Categories:</p>
                  <p className="text-sm text-muted-foreground">
                    {onboardingData.barterDeals.acceptedCategories.map(cat => 
                      BARTER_CATEGORIES_MAP[cat] || cat
                    ).join(', ')}
                  </p>
                </div>
              )}
              {onboardingData.barterDeals.restrictions && (
                <div className="mt-2">
                  <p className="text-sm font-medium">Restrictions:</p>
                  <p className="text-sm text-muted-foreground">{onboardingData.barterDeals.restrictions}</p>
                </div>
              )}
            </div>
          )}
          
          {!onboardingData.fixedPricing?.enabled && 
           !onboardingData.negotiablePricing && 
           !onboardingData.packageDeals?.enabled && 
           !onboardingData.barterDeals?.enabled && (
            <p className="text-sm text-muted-foreground">No pricing models selected</p>
          )}
        </CardContent>
      </Card>
      
      {/* Brand Preferences */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Brand Preferences</CardTitle>
            <CardDescription>Types of brands you want to work with</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/influencer/onboarding/brand-preferences">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Preferred Brand Types */}
          <div>
            <h4 className="font-medium text-sm">Preferred Brand Types</h4>
            <p className="text-sm text-muted-foreground mt-1">
              {onboardingData.brandPreferences?.preferredBrandTypes?.length > 0 
                ? onboardingData.brandPreferences.preferredBrandTypes.map(type => 
                    BRAND_TYPES_MAP[type] || type
                  ).join(', ')
                : 'No preferred brand types selected'
              }
            </p>
          </div>
          
          {/* Brand Exclusions */}
          <div>
            <h4 className="font-medium text-sm">Brand Exclusions</h4>
            <p className="text-sm text-muted-foreground mt-1">
              {onboardingData.brandPreferences?.exclusions?.length > 0 
                ? onboardingData.brandPreferences.exclusions.map(type => 
                    BRAND_EXCLUSIONS_MAP[type] || type
                  ).join(', ')
                : 'No brand exclusions selected'
              }
            </p>
          </div>
          
          {/* Collaboration Styles */}
          <div>
            <h4 className="font-medium text-sm">Collaboration Styles</h4>
            <p className="text-sm text-muted-foreground mt-1">
              {onboardingData.brandPreferences?.collabStyles?.length > 0 
                ? onboardingData.brandPreferences.collabStyles.map(style => 
                    COLLAB_STYLES_MAP[style] || style
                  ).join(', ')
                : 'No collaboration styles selected'
              }
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* Terms and Conditions */}
      <Card>
        <CardHeader>
          <CardTitle>Terms and Conditions</CardTitle>
          <CardDescription>Please review and accept our terms before completing your profile</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start space-x-3">
            <Checkbox 
              id="terms" 
              checked={termsAccepted} 
              onCheckedChange={(checked: boolean | "indeterminate") => setTermsAccepted(checked === true)}
            />
            <div>
              <Label htmlFor="terms" className="font-medium">
                I accept the Terms and Conditions
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                By checking this box, you agree to our Terms of Service and Privacy Policy. You also confirm that all the information provided is accurate.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-between pt-4">
        
        
        <Button
          onClick={handleSubmit}
          disabled={isSaving || isLoading || !termsAccepted}
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Completing Setup...
            </>
          ) : (
            <>
              Complete Profile
              <Check className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}