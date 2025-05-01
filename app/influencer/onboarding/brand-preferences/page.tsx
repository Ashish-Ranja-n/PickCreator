"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useOnboarding } from '../OnboardingContext';
import { Button } from '@/components/ui/button';
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '../../../../components/ui/checkbox';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/components/ui/use-toast';

// Brand types
const BRAND_TYPES = [
  { id: "fashion", label: "Fashion" },
  { id: "beauty", label: "Beauty & Skincare" },
  { id: "food", label: "Food & Beverages" },
  { id: "tech", label: "Technology" },
  { id: "travel", label: "Travel" },
  { id: "fitness", label: "Fitness & Wellness" },
  { id: "lifestyle", label: "Lifestyle" },
  { id: "entertainment", label: "Entertainment" },
  { id: "education", label: "Education" },
  { id: "finance", label: "Finance" },
  { id: "automotive", label: "Automotive" },
  { id: "home", label: "Home & Decor" },
];

// Brand exclusions
const BRAND_EXCLUSIONS = [
  { id: "alcohol", label: "Alcohol" },
  { id: "tobacco", label: "Tobacco" },
  { id: "gambling", label: "Gambling" },
  { id: "adult", label: "Adult Content" },
  { id: "political", label: "Political Organizations" },
  { id: "religious", label: "Religious Organizations" },
  { id: "crypto", label: "Cryptocurrency" },
  { id: "mlm", label: "Multi-Level Marketing" },
  { id: "weapons", label: "Weapons & Firearms" },
];

// Collaboration styles
const COLLAB_STYLES = [
  { id: "sponsored_posts", label: "Sponsored Posts" },
  { id: "product_reviews", label: "Product Reviews" },
  { id: "brand_ambassador", label: "Brand Ambassador" },
  { id: "affiliate_marketing", label: "Affiliate Marketing" },
  { id: "giveaways", label: "Giveaways & Contests" },
  { id: "account_takeovers", label: "Account Takeovers" },
  { id: "event_coverage", label: "Event Coverage" },
  { id: "content_creation", label: "Content Creation" },
];

// Form schema
const formSchema = z.object({
  preferredBrandTypes: z.array(z.string())
    .min(1, { message: 'Select at least one brand type' }),
  exclusions: z.array(z.string())
    .min(1, { message: 'Select at least one brand exclusion' }),
  collabStyles: z.array(z.string())
    .min(1, { message: 'Select at least one collaboration style' }),
});

// Types
type FormValues = z.infer<typeof formSchema>;

export default function BrandPreferencesPage() {
  const router = useRouter();
  const { onboardingData, updateOnboardingData, saveCurrentStep, isLoading, error } = useOnboarding();
  const [isSaving, setIsSaving] = useState(false);
  const [showValidationError, setShowValidationError] = useState(false);
  
  // Create form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      preferredBrandTypes: onboardingData.brandPreferences?.preferredBrandTypes || [],
      exclusions: onboardingData.brandPreferences?.exclusions || [],
      collabStyles: onboardingData.brandPreferences?.collabStyles || [],
    },
  });
  
  // Update form values when onboarding data changes
  useEffect(() => {
    form.reset({
      preferredBrandTypes: onboardingData.brandPreferences?.preferredBrandTypes || [],
      exclusions: onboardingData.brandPreferences?.exclusions || [],
      collabStyles: onboardingData.brandPreferences?.collabStyles || [],
    });
  }, [onboardingData, form]);
  
  // Form submission handler
  const onSubmit = async (values: FormValues) => {
    try {
      setIsSaving(true);
      setShowValidationError(false);
      
      // Validate that at least one brand type and collab style is selected
      if (values.preferredBrandTypes.length === 0 || values.collabStyles.length === 0) {
        setShowValidationError(true);
        toast({
          title: "Error",
          description: "Please select brand types and collaboration styles",
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }
      
      // Prepare the data that will be saved to database
      const formData = {
        brandPreferences: {
          preferredBrandTypes: values.preferredBrandTypes,
          exclusions: values.exclusions,
          collabStyles: values.collabStyles,
        },
      };
      
      // Log what we're about to save
      console.log("Saving brand preferences data:", JSON.stringify(formData));
      
      // Save directly to the server with formData
      await saveCurrentStep(3, formData);
      
      // Navigate immediately to next step
      router.push('/influencer/onboarding/review');
      
      // Show a minimal toast after navigation starts
      toast({
        title: "Saved",
        description: "Brand preferences saved",
        duration: 1500
      });
    } catch (error) {
      console.error('Error saving brand preferences:', error);
      setShowValidationError(true);
      
      toast({
        title: "Error",
        description: "Failed to save preferences",
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
        <h2 className="text-2xl font-bold tracking-tight">Brand Preferences</h2>
        <p className="text-muted-foreground mt-2">
          Tell us what types of brands you prefer to work with and any restrictions you have.
        </p>
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {showValidationError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4 mr-2" />
          <AlertDescription>
            Please complete all required fields before proceeding.
          </AlertDescription>
        </Alert>
      )}
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Preferred Brand Types */}
          <Card>
            <CardHeader>
              <CardTitle>Preferred Brand Types</CardTitle>
              <CardDescription>Select the types of brands you prefer to work with</CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="preferredBrandTypes"
                render={() => (
                  <FormItem>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {BRAND_TYPES.map((type) => (
                        <FormField
                          key={type.id}
                          control={form.control}
                          name="preferredBrandTypes"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={type.id}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(type.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, type.id])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== type.id
                                            )
                                          )
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {type.label}
                                </FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      <span className="text-destructive">*</span> Required - Select at least one brand type
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          
          {/* Brand Exclusions */}
          <Card>
            <CardHeader>
              <CardTitle>Brand Exclusions</CardTitle>
              <CardDescription>Select the types of brands you DO NOT want to work with</CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="exclusions"
                render={() => (
                  <FormItem>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {BRAND_EXCLUSIONS.map((exclusion) => (
                        <FormField
                          key={exclusion.id}
                          control={form.control}
                          name="exclusions"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={exclusion.id}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(exclusion.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, exclusion.id])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== exclusion.id
                                            )
                                          )
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {exclusion.label}
                                </FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      <span className="text-destructive">*</span> Required - Select at least one exclusion
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          
          {/* Collaboration Styles */}
          <Card>
            <CardHeader>
              <CardTitle>Collaboration Styles</CardTitle>
              <CardDescription>Select the types of collaborations you&apos;re interested in</CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="collabStyles"
                render={() => (
                  <FormItem>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {COLLAB_STYLES.map((style) => (
                        <FormField
                          key={style.id}
                          control={form.control}
                          name="collabStyles"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={style.id}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(style.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, style.id])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== style.id
                                            )
                                          )
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {style.label}
                                </FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      <span className="text-destructive">*</span> Required - Select at least one collaboration style
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          
          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              disabled={isSaving || isLoading}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Next Step
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
} 