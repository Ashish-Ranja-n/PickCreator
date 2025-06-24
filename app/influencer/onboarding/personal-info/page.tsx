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
  name: z
    .string({ required_error: "Name is required" })
    .min(2, "Name must be at least 2 characters"),
  age: z
    .number({ invalid_type_error: "Age is required" })
    .min(13, "You must be at least 13 years old")
    .max(100, "Please enter a valid age"),
  gender: z.enum(["male", "female", "other"], {
    required_error: "Gender is required",
  }),
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
      name: typeof onboardingData.name === 'string' ? onboardingData.name : '',
      age: typeof onboardingData.age === 'number' ? onboardingData.age : 18,
      gender: (onboardingData.gender === 'male' || onboardingData.gender === 'female' || onboardingData.gender === 'other') ? onboardingData.gender : 'male',
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
        duration: 1000,
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
      <h2 className="text-3xl font-bold mb-4 text-[#C13B7B]">Personal Information</h2>
      <p className="mb-6 text-[#A07BA6] text-base">Please provide your personal details. This information will remain private and secure.</p>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/30 px-4 py-3 text-base transition placeholder:text-gray-400 bg-white dark:bg-zinc-900"
                    placeholder="Enter your name"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
                <FormLabel className="text-[#C13B7B]">Gender</FormLabel>
                <FormControl>
                  <div className="flex gap-6 mt-2">
                    <label className={
                      `flex flex-col items-center cursor-pointer rounded-lg border-2 px-4 py-3 transition-all duration-150
                      ${field.value === 'male' ? 'border-[#C13B7B] bg-[#C13B7B] bg-opacity-10 shadow-md' : 'border-gray-300 bg-white dark:bg-zinc-900'}`
                    }>
                      <input
                        type="radio"
                        value="male"
                        checked={field.value === 'male'}
                        onChange={() => field.onChange('male')}
                        className="hidden onboarding-radio"
                      />
                      <span className="text-lg font-medium text-[#C13B7B]">👨‍🦱 Male</span>
                    </label>
                    <label className={
                      `flex flex-col items-center cursor-pointer rounded-lg border-2 px-4 py-3 transition-all duration-150
                      ${field.value === 'female' ? 'border-[#C13B7B] bg-[#C13B7B] bg-opacity-10 shadow-md' : 'border-gray-300 bg-white dark:bg-zinc-900'}`
                    }>
                      <input
                        type="radio"
                        value="female"
                        checked={field.value === 'female'}
                        onChange={() => field.onChange('female')}
                        className="hidden onboarding-radio"
                      />
                      <span className="text-lg font-medium text-[#C13B7B]">👩‍🦰 Female</span>
                    </label>
                    <label className={
                      `flex flex-col items-center cursor-pointer rounded-lg border-2 px-4 py-3 transition-all duration-150
                      ${field.value === 'other' ? 'border-[#C13B7B] bg-[#C13B7B] bg-opacity-10 shadow-md' : 'border-gray-300 bg-white dark:bg-zinc-900'}`
                    }>
                      <input
                        type="radio"
                        value="other"
                        checked={field.value === 'other'}
                        onChange={() => field.onChange('other')}
                        className="hidden onboarding-radio"
                      />
                      <span className="text-lg font-medium text-[#C13B7B]">🏳️‍🌈 Other</span>
                    </label>
                  </div>
                </FormControl>
                <FormDescription className="text-[#A07BA6]">
                  Select your gender. This helps us personalize your experience.
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
      {showValidationError && (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription>All fields are required and must be valid.</AlertDescription>
        </Alert>
      )}
    </>
  );
}
