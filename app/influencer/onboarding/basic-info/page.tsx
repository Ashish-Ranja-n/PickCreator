"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useOnboarding } from '../OnboardingContext';
import { Button } from '@/components/ui/button';
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { ArrowRight, Loader2, Check, ChevronsUpDown, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { INDIAN_CITIES } from '../data/indianCities';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Card } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';

// Predefined bio options grouped by categories
const BIO_OPTIONS_GROUPED = [
  {
    category: "Content Creation",
    options: [
      "Creative content creator passionate about storytelling through visuals.",
      "Lifestyle influencer sharing daily inspiration and authentic moments."
    ]
  },
  {
    category: "Fashion & Beauty",
    options: [
      "Fashion enthusiast with an eye for emerging trends and timeless style.",
      "Beauty expert exploring the latest products and sharing honest reviews."
    ]
  },
  {
    category: "Health & Travel",
    options: [
      "Fitness advocate promoting wellness and balanced, healthy living.",
      "Travel enthusiast showcasing hidden gems and unforgettable experiences."
    ]
  },
  {
    category: "Tech & Food",
    options: [
      "Tech reviewer providing insightful analysis on the latest gadgets.",
      "Food lover exploring culinary delights and sharing delicious recipes."
    ]
  },
  {
    category: "Business & Motivation",
    options: [
      "Motivational speaker inspiring others to achieve their goals.",
      "Entrepreneur sharing business insights and growth strategies."
    ]
  }
];

// Form schema
const formSchema = z.object({
  bio: z.string({
    required_error: "Please select a bio that best describes you",
  }).min(1, "Please select a bio that best describes you"),
  city: z.string({
    required_error: "Please select your city",
  }).min(1, "Please select your city"),
});

// Types
type FormValues = z.infer<typeof formSchema>;

export default function BasicInfoPage() {
  const router = useRouter();
  const { onboardingData, updateOnboardingData, saveCurrentStep, isLoading: contextLoading, error } = useOnboarding();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [openCategories, setOpenCategories] = useState<string[]>([]);
  const [showValidationError, setShowValidationError] = useState(false);
  
  // Function to toggle category expansion
  const toggleCategory = (category: string) => {
    setOpenCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category) 
        : [...prev, category]
    );
  };
  
  // Create form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      bio: onboardingData.bio || '',
      city: onboardingData.city || '',
    },
  });
  
  // Update form values when onboarding data changes
  useEffect(() => {
    if (onboardingData) {
      // Only reset the form if the values have actually changed
      const currentBio = form.getValues('bio');
      const currentCity = form.getValues('city');
      
      if (currentBio !== onboardingData.bio || currentCity !== onboardingData.city) {
        form.reset({
          bio: onboardingData.bio || '',
          city: onboardingData.city || '',
        });
        
        // Find which category contains the selected bio and open it
        if (onboardingData.bio) {
          BIO_OPTIONS_GROUPED.forEach(group => {
            if (group.options.includes(onboardingData.bio)) {
              setOpenCategories([group.category]);
            }
          });
        }
      }
    }
    
    // Set loading to false after we've processed the data
    setIsLoading(false);
  }, [onboardingData, form]);
  
  // Form submission handler
  const onSubmit = async (values: FormValues) => {
    try {
      setIsSaving(true);
      setShowValidationError(false);
      
      // Validate form values
      if (!values.bio || !values.city) {
        setShowValidationError(true);
        setIsSaving(false);
        return;
      }
      
      // Prepare the data that will be saved to database
      const formData = {
        bio: values.bio,
        city: values.city,
      };
      
      // Log what we're about to save
      console.log("Saving basic info data:", JSON.stringify(formData));
      
      // Save directly to the server with formData
      await saveCurrentStep(1, formData);
      
      // Navigate immediately to next step
      router.push('/influencer/onboarding/pricing-model');
      
      // Small toast notification (show after navigation starts)
      toast({
        title: "Saved",
        description: "Basic information saved",
        duration: 1000
      });
    } catch (error) {
      console.error('Error saving basic info:', error);
      setShowValidationError(true);
      
      toast({
        title: "Error",
        description: "Failed to save information",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  if (isLoading || contextLoading) {
    return (
      <div className="space-y-6 flex justify-center items-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-[#C13B7B]">Basic Information</h2>
        <p className="text-[#A07BA6] mt-2">
          Share details about yourself to help brands understand who you are.
        </p>
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {showValidationError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4 mr-2 text-[#C13B7B]" />
          <AlertDescription>
            <span className="text-[#C13B7B]">Please complete all required fields before proceeding.</span>
          </AlertDescription>
        </Alert>
      )}
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="bio"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>
                  <span className="text-[#C13B7B]">Select a Bio That Best Describes You <span className="text-[#C13B7B]">*</span></span>
                </FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    className="space-y-3"
                  >
                    {BIO_OPTIONS_GROUPED.map((group) => (
                      <Card key={group.category} className="overflow-hidden border-[#C13B7B]/30">
                        <Collapsible 
                          open={openCategories.includes(group.category)}
                          onOpenChange={() => toggleCategory(group.category)}
                        >
                          <CollapsibleTrigger asChild>
                            <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-[#F8E6F4]">
                              <span className="font-semibold text-[#C13B7B]">{group.category}</span>
                              {openCategories.includes(group.category) ? (
                                <ChevronUp className="h-5 w-5 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="space-y-1 px-1 pb-3">
                              {group.options.map((option, idx) => (
                                <FormItem
                                  key={idx}
                                  className={cn(
                                    "flex items-start space-x-3 space-y-0 rounded-md border p-3 m-2 cursor-pointer hover:bg-accent",
                                    field.value === option && "bg-accent/40"
                                  )}
                                >
                                  <FormControl>
                                    <RadioGroupItem value={option} />
                                  </FormControl>
                                  <FormLabel className="font-normal cursor-pointer mt-0">
                                    {option}
                                  </FormLabel>
                                </FormItem>
                              ))}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </Card>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  City <span className="text-destructive">*</span>
                </FormLabel>
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        type="button"
                        className={cn(
                          "w-full justify-between h-12 px-4",
                          "bg-background border-2",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value || "Select your city"}
                        <ChevronsUpDown className="ml-2 h-5 w-5 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0 shadow-lg" align="start">
                    <div className="sticky top-0 bg-white dark:bg-white p-2 rounded-t-md">
                      <div className="relative">
                        <input
                          className="flex h-12 w-full rounded-xl border-2 border-input bg-background pl-4 pr-10 text-base focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          placeholder="Type to search cities..."
                          onChange={(e) => {
                            const list = document.querySelector('.cities-list');
                            const items = list?.querySelectorAll('.city-item');
                            const search = e.target.value.toLowerCase();
                            
                            items?.forEach((item) => {
                              const text = item.textContent?.toLowerCase() || '';
                              item.classList.toggle('hidden', !text.includes(search));
                            });
                          }}
                        />
                      </div>
                    </div>
                    <div className="cities-list max-h-[400px] overflow-auto">
                      {INDIAN_CITIES.length === 0 && (
                        <div className="text-base text-center py-8 text-muted-foreground">
                          No cities found
                        </div>
                      )}
                      {INDIAN_CITIES.map((city) => (
                        <div
                          key={city}
                          className={cn(
                            "city-item relative flex cursor-pointer select-none items-center px-4 py-3 text-base",
                            "hover:bg-accent/5",
                            "border-b border-input/10",
                            field.value === city && "bg-accent/5 font-medium"
                          )}
                          onClick={() => {
                            form.setValue("city", city);
                            form.trigger("city");
                            setOpen(false);
                          }}
                        >
                          {city}
                          {field.value === city && (
                            <Check className="ml-auto h-5 w-5 text-primary" />
                          )}
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  Your location helps brands find local influencers for campaigns.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              disabled={isSaving || contextLoading}
              onClick={(e) => {
                if (isSaving || contextLoading) {
                  e.preventDefault();
                }
              }}
              className="bg-[#C13B7B] hover:bg-[#a02c63] text-white font-semibold shadow-md px-6 py-3 rounded-lg transition-colors duration-200"
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