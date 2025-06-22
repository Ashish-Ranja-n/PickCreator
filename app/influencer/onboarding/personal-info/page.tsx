"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useOnboarding } from "../OnboardingContext";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { ArrowRight, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/components/ui/use-toast";

const formSchema = z.object({
  age: z
    .number({ invalid_type_error: "Age is required" })
    .min(13, "You must be at least 13 years old")
    .max(100, "Please enter a valid age"),
  gender: z.enum(["male", "female", "other"], {
    required_error: "Gender is required",
  }),
  mobile: z
    .string()
    .min(10, "Mobile number must be at least 10 digits")
    .max(15, "Mobile number is too long"),
});

type FormValues = z.infer<typeof formSchema>;

export default function PersonalInfoPage() {
  const router = useRouter();
  const { onboardingData, updateOnboardingData, saveCurrentStep, isLoading: contextLoading } = useOnboarding();
  const [isSaving, setIsSaving] = useState(false);
  const [showValidationError, setShowValidationError] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      age: typeof onboardingData.age === 'number' ? onboardingData.age : 18,
      gender: (onboardingData.gender === 'male' || onboardingData.gender === 'female' || onboardingData.gender === 'other') ? onboardingData.gender : 'male',
      mobile: onboardingData.mobile || '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      setIsSaving(true);
      setShowValidationError(false);

      // Save to context and backend
      // Ensure gender is not empty string
      const safeValues = { ...values, gender: values.gender || 'male' };
      await saveCurrentStep(0, safeValues);
      updateOnboardingData(safeValues);

      router.push("/influencer/onboarding/review");
      toast({
        title: "Saved",
        description: "Personal information saved",
        duration: 1500,
      });
    } catch (error) {
      setShowValidationError(true);
      setIsSaving(false);
      toast({
        title: "Error",
        description: "Failed to save personal info",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <h2 className="text-3xl font-bold mb-4 text-primary">Personal Information</h2>
      <p className="mb-6 text-muted-foreground text-base">Please provide your personal details. This information will remain private and secure.</p>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="age"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Age</FormLabel>
                <FormControl>
                  <div className="relative">
                    <input
                      type="number"
                      min={13}
                      max={100}
                      className="w-full rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/30 px-4 py-3 text-base transition placeholder:text-gray-400 bg-white dark:bg-zinc-900"
                      placeholder="Enter your age"
                      {...field}
                      onChange={e => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gender</FormLabel>
                <FormControl>
                  <div className="flex gap-6 mt-2">
                    <label className={
                      `flex flex-col items-center cursor-pointer rounded-lg border-2 px-4 py-3 transition-all duration-150
                      ${field.value === 'male' ? 'border-primary bg-primary/10 shadow-md' : 'border-gray-300 bg-white dark:bg-zinc-900'}`
                    }>
                      <input
                        type="radio"
                        value="male"
                        checked={field.value === 'male'}
                        onChange={() => field.onChange('male')}
                        className="hidden"
                      />
                      <span className="text-lg font-medium">👨 Male</span>
                    </label>
                    <label className={
                      `flex flex-col items-center cursor-pointer rounded-lg border-2 px-4 py-3 transition-all duration-150
                      ${field.value === 'female' ? 'border-primary bg-primary/10 shadow-md' : 'border-gray-300 bg-white dark:bg-zinc-900'}`
                    }>
                      <input
                        type="radio"
                        value="female"
                        checked={field.value === 'female'}
                        onChange={() => field.onChange('female')}
                        className="hidden"
                      />
                      <span className="text-lg font-medium">👩 Female</span>
                    </label>
                    <label className={
                      `flex flex-col items-center cursor-pointer rounded-lg border-2 px-4 py-3 transition-all duration-150
                      ${field.value === 'other' ? 'border-primary bg-primary/10 shadow-md' : 'border-gray-300 bg-white dark:bg-zinc-900'}`
                    }>
                      <input
                        type="radio"
                        value="other"
                        checked={field.value === 'other'}
                        onChange={() => field.onChange('other')}
                        className="hidden"
                      />
                      <span className="text-lg font-medium">🌈 Other</span>
                    </label>
                  </div>
                </FormControl>
                <FormDescription>
                  Select your gender. This helps us personalize your experience.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="mobile"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mobile Number</FormLabel>
                <FormControl>
                  <div className="relative">
                    <input
                      type="tel"
                      className="w-full rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/30 px-4 py-3 text-base transition placeholder:text-gray-400 bg-white dark:bg-zinc-900"
                      placeholder="Enter your mobile number"
                      maxLength={15}
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormDescription>
                  The money will be transferred to this number and we will contact you before sending the money once the deal is completed. Your number will remain private and will not be visible to anyone else.
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
      {showValidationError && (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription>All fields are required and must be valid.</AlertDescription>
        </Alert>
      )}
    </>
  );
}
