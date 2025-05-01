"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useOnboarding } from '../OnboardingContext';
import { Button } from '@/components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Textarea } from '../../../../components/ui/textarea';
import { 
  Form,
  FormControl,
  FormDescription,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../components/ui/select';
import { Switch } from '../../../../components/ui/switch';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
import * as z from 'zod';
import { ArrowRight, Loader2, Plus, Trash2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '../../../../components/ui/alert';
import { toast } from '@/components/ui/use-toast';

// Form schema
const packageDealSchema = z.object({
  name: z.string().min(1, { message: 'Package name is required' }),
  includedServices: z.string().min(1, { message: 'Please describe what is included' }),
  totalPrice: z.coerce.number().min(0, { message: 'Price must be a positive number' }).nullable(),
});

// Schema for fixed pricing with conditional validation
const fixedPricingSchema = z.object({
  enabled: z.boolean().default(true),
  storyPrice: z.coerce.number().min(0, { message: 'Price must be a positive number' }).nullable().optional(),
  reelPrice: z.coerce.number().min(0, { message: 'Price must be a positive number' }).nullable().optional(),
  postPrice: z.coerce.number().min(0, { message: 'Price must be a positive number' }).nullable().optional(),
  livePrice: z.coerce.number().min(0, { message: 'Price must be a positive number' }).nullable().optional(),
}).refine((data) => {
  // Always validate as if it's enabled since it's required
  return !!data.storyPrice && !!data.reelPrice && !!data.postPrice && !!data.livePrice;
}, {
  message: "All pricing fields must be filled when fixed pricing is enabled",
  path: ["enabled"]
});

// Schema for package deals with conditional validation
const packageDealsSchema = z.object({
  enabled: z.boolean(),
  packages: z.array(packageDealSchema).default([]),
}).refine((data) => {
  if (data.enabled) {
    // If package deals are enabled, at least one package should be defined
    return data.packages.length > 0;
  }
  return true; // No validation if not enabled
}, {
  message: "Please add at least one package when package deals are enabled",
  path: ["enabled"]
}).refine((data) => {
  if (data.enabled && data.packages.length > 0) {
    // Check that all packages have complete information
    return data.packages.every(pkg => 
      !!pkg.name && !!pkg.includedServices && !!pkg.totalPrice
    );
  }
  return true;
}, {
  message: "All package details must be completely filled",
  path: ["packages"]
});

// Schema for barter deals with conditional validation
const barterDealsSchema = z.object({
  enabled: z.boolean(),
  acceptedCategories: z.array(z.string()).default([]),
  restrictions: z.string().optional(),
}).refine((data) => {
  if (data.enabled) {
    // If barter deals are enabled, at least one category should be selected
    return data.acceptedCategories.length > 0;
  }
  return true; // No validation if not enabled
}, {
  message: "Please select at least one category when barter deals are enabled",
  path: ["enabled"]
});

const formSchema = z.object({
  fixedPricing: fixedPricingSchema,
  negotiablePricing: z.boolean(),
  packageDeals: packageDealsSchema,
  barterDeals: barterDealsSchema,
});

// Types
type FormValues = z.infer<typeof formSchema>;

// Barter categories
const BARTER_CATEGORIES = [
  "Beauty & Skincare",
  "Fashion & Accessories",
  "Tech Gadgets",
  "Fitness & Wellness",
  "Food & Beverages",
  "Home & Decor",
  "Travel & Experiences",
  "Books & Education",
];

export default function PricingModelPage() {
  const router = useRouter();
  const { onboardingData, updateOnboardingData, saveCurrentStep, isLoading, error } = useOnboarding();
  const [isSaving, setIsSaving] = useState(false);
  const [showRequired, setShowRequired] = useState(false);
  
  // Create form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fixedPricing: {
        enabled: onboardingData.fixedPricing?.enabled || false,
        storyPrice: onboardingData.fixedPricing?.storyPrice || null,
        reelPrice: onboardingData.fixedPricing?.reelPrice || null,
        postPrice: onboardingData.fixedPricing?.postPrice || null,
        livePrice: onboardingData.fixedPricing?.livePrice || null,
      },
      negotiablePricing: onboardingData.negotiablePricing || false,
      packageDeals: {
        enabled: onboardingData.packageDeals?.enabled || false,
        packages: onboardingData.packageDeals?.packages || [],
      },
      barterDeals: {
        enabled: onboardingData.barterDeals?.enabled || false,
        acceptedCategories: onboardingData.barterDeals?.acceptedCategories || [],
        restrictions: onboardingData.barterDeals?.restrictions || '',
      },
    },
  });
  
  // Field array for package deals
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "packageDeals.packages",
  });
  
  // Update form values when onboarding data changes
  useEffect(() => {
    form.reset({
      fixedPricing: {
        enabled: true, // Always enabled
        storyPrice: onboardingData.fixedPricing?.storyPrice || null,
        reelPrice: onboardingData.fixedPricing?.reelPrice || null,
        postPrice: onboardingData.fixedPricing?.postPrice || null,
        livePrice: onboardingData.fixedPricing?.livePrice || null,
      },
      negotiablePricing: onboardingData.negotiablePricing || false,
      packageDeals: {
        enabled: onboardingData.packageDeals?.enabled || false,
        packages: onboardingData.packageDeals?.packages || [],
      },
      barterDeals: {
        enabled: onboardingData.barterDeals?.enabled || false,
        acceptedCategories: onboardingData.barterDeals?.acceptedCategories || [],
        restrictions: onboardingData.barterDeals?.restrictions || '',
      },
    });
  }, [onboardingData, form]);
  
  // Form submission handler
  const onSubmit = async (values: FormValues) => {
    try {
      setIsSaving(true);
      setShowRequired(false);
      
      // Check for required pricing fields
      if (values.fixedPricing.enabled && 
          (!values.fixedPricing.storyPrice || 
           !values.fixedPricing.reelPrice || 
           !values.fixedPricing.postPrice || 
           !values.fixedPricing.livePrice)) {
        setShowRequired(true);
        toast({
          title: "Error",
          description: "Please fill all required pricing fields",
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }
      
      // Ensure fixed pricing is always enabled
      const updatedValues = {
        ...values,
        fixedPricing: {
          ...values.fixedPricing,
          enabled: true,
        }
      };
      
      // Prepare the data that will be saved to database
      const formData = {
        fixedPricing: updatedValues.fixedPricing,
        negotiablePricing: updatedValues.negotiablePricing,
        packageDeals: updatedValues.packageDeals,
        barterDeals: updatedValues.barterDeals,
      };
      
      // Log what we're about to save
      console.log("Saving pricing model data:", JSON.stringify(formData));
      
      // Save directly to the server with formData
      await saveCurrentStep(2, formData);
      
      // Navigate immediately to next step
      router.push('/influencer/onboarding/brand-preferences');
      
      // Show a minimal toast after navigation starts
      toast({
        title: "Saved",
        description: "Pricing models saved",
        duration: 1500
      });
    } catch (error) {
      console.error('Error saving pricing models:', error);
      setShowRequired(true);
      
      toast({
        title: "Error",
        description: "Failed to save pricing models",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Generate validation error message
  const getValidationErrorMessage = () => {
    if (form.formState.errors.fixedPricing?.enabled) {
      return form.formState.errors.fixedPricing.enabled.message;
    }
    if (form.formState.errors.packageDeals?.enabled) {
      return form.formState.errors.packageDeals.enabled.message;
    }
    if (form.formState.errors.packageDeals?.packages) {
      return form.formState.errors.packageDeals.packages.message;
    }
    if (form.formState.errors.barterDeals?.enabled) {
      return form.formState.errors.barterDeals.enabled.message;
    }
    return "Please enable at least one pricing model and fill in the required fields.";
  };
  
  // Add a new package
  const addPackage = () => {
    append({ name: '', includedServices: '', totalPrice: null });
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Pricing Models</h2>
        <p className="text-muted-foreground mt-2">
          Set up how you charge for promotions and collaborations.
        </p>
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {showRequired && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4 mr-2" />
          <AlertDescription>
            {getValidationErrorMessage()}
          </AlertDescription>
        </Alert>
      )}
      
      <Alert className="mb-6 bg-blue-50 border border-blue-200">
        <AlertCircle className="h-4 w-4 mr-2 text-blue-500" />
        <AlertDescription className="text-blue-700">
          <p className="font-medium">Requirements:</p>
          <ul className="list-disc list-inside text-sm mt-1 space-y-1">
            <li>Enable at least one pricing model</li>
            <li>If Fixed Pricing is enabled, all price fields must be filled</li>
            <li>If Package Deals is enabled, at least one complete package must be added</li>
          </ul>
        </AlertDescription>
      </Alert>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Fixed Pricing */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Fixed Pricing</CardTitle>
                <FormField
                  control={form.control}
                  name="fixedPricing.enabled"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Switch
                          checked={true}
                          disabled={true}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="text-xs text-muted-foreground whitespace-nowrap">(Required)</div>
                    </FormItem>
                  )}
                />
              </div>
              <CardDescription>Set specific prices for different types of content</CardDescription>
            </CardHeader>
            
            {form.watch("fixedPricing.enabled") && (
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="fixedPricing.storyPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instagram Story Price (₹) <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Enter price"
                            {...field}
                            value={field.value === null ? '' : field.value}
                            onChange={(e) => {
                              const value = e.target.value === '' ? null : parseFloat(e.target.value);
                              field.onChange(value);
                            }}
                          />
                        </FormControl>
                        <FormDescription>Price per Instagram Story</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="fixedPricing.reelPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instagram Reel Price (₹) <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Enter price"
                            {...field}
                            value={field.value === null ? '' : field.value}
                            onChange={(e) => {
                              const value = e.target.value === '' ? null : parseFloat(e.target.value);
                              field.onChange(value);
                            }}
                          />
                        </FormControl>
                        <FormDescription>Price per Instagram Reel</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="fixedPricing.postPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instagram Post Price (₹) <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Enter price"
                            {...field}
                            value={field.value === null ? '' : field.value}
                            onChange={(e) => {
                              const value = e.target.value === '' ? null : parseFloat(e.target.value);
                              field.onChange(value);
                            }}
                          />
                        </FormControl>
                        <FormDescription>Price per Instagram Post</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="fixedPricing.livePrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instagram Live Price (₹) <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Enter price"
                            {...field}
                            value={field.value === null ? '' : field.value}
                            onChange={(e) => {
                              const value = e.target.value === '' ? null : parseFloat(e.target.value);
                              field.onChange(value);
                            }}
                          />
                        </FormControl>
                        <FormDescription>Price per Instagram Live session</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                {form.formState.errors.fixedPricing && !form.formState.errors.fixedPricing.enabled && (
                  <p className="text-sm font-medium text-destructive">
                    Please set at least one price when fixed pricing is enabled
                  </p>
                )}
                {form.formState.errors.fixedPricing?.enabled && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    <AlertDescription>
                      {form.formState.errors.fixedPricing.enabled.message}
                    </AlertDescription>
                  </Alert>
                )}
                <div className="text-xs text-muted-foreground mt-2">
                  <span className="text-destructive">*</span> All pricing fields are required when fixed pricing is enabled
                </div>
              </CardContent>
            )}
          </Card>
          
          {/* Negotiable Pricing */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Negotiable Pricing</CardTitle>
                <FormField
                  control={form.control}
                  name="negotiablePricing"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <CardDescription>Allow brands to propose their own budgets</CardDescription>
            </CardHeader>
          </Card>
          
          {/* Package Deals */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Package Deals</CardTitle>
                <FormField
                  control={form.control}
                  name="packageDeals.enabled"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <CardDescription>Create custom bundles with discounted rates</CardDescription>
            </CardHeader>
            
            {form.watch('packageDeals.enabled') && (
              <CardContent className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="border rounded-md p-4 space-y-4 relative">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    
                    <FormField
                      control={form.control}
                      name={`packageDeals.packages.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Package Name <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Starter Pack" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name={`packageDeals.packages.${index}.includedServices`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Included Services <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. 1 Reel + 1 Story" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name={`packageDeals.packages.${index}.totalPrice`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total Price (₹) <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="e.g. 12000"
                              {...field}
                              value={field.value === null ? '' : field.value}
                              onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ))}
                
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={addPackage}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Package
                </Button>
                
                {form.formState.errors.packageDeals?.enabled && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    <AlertDescription>
                      {form.formState.errors.packageDeals.enabled.message}
                    </AlertDescription>
                  </Alert>
                )}
                
                {form.formState.errors.packageDeals?.packages && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    <AlertDescription>
                      {form.formState.errors.packageDeals.packages.message}
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="text-xs text-muted-foreground mt-2">
                  <span className="text-destructive">*</span> All package fields are required when package deals are enabled
                </div>
                
                {fields.length === 0 && form.watch('packageDeals.enabled') && (
                  <Alert className="mt-2 bg-amber-50 text-amber-800 border border-amber-200">
                    <AlertCircle className="h-4 w-4 mr-2 text-amber-800" />
                    <AlertDescription className="text-amber-800">
                      You must add at least one package when package deals are enabled
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            )}
          </Card>
          
          {/* Barter Deals */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Barter Deals</CardTitle>
                <FormField
                  control={form.control}
                  name="barterDeals.enabled"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <CardDescription>Accept products instead of payment for selected categories</CardDescription>
            </CardHeader>
            
            {form.watch('barterDeals.enabled') && (
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="barterDeals.acceptedCategories"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categories You Accept for Barter</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={(value) => {
                            const currentValues = field.value || [];
                            if (currentValues.includes(value)) {
                              field.onChange(currentValues.filter(v => v !== value));
                            } else {
                              field.onChange([...currentValues, value]);
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select categories" />
                          </SelectTrigger>
                          <SelectContent>
                            {BARTER_CATEGORIES.map((category) => (
                              <SelectItem key={category} value={category}>
                                <div className="flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={(field.value || []).includes(category)}
                                    className="mr-2"
                                    readOnly
                                  />
                                  {category}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormDescription>
                        Selected categories: {(field.value || []).join(', ') || 'None'}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="barterDeals.restrictions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Restrictions (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g. Minimum product value ₹5000, only premium brands, etc."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Specify any conditions for accepting barter deals
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            )}
          </Card>
          
          <div className="flex justify-between pt-4">
            
            
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