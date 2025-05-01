'use client';
import React, { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { KeyRoundIcon, ArrowLeftIcon, CheckCircleIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/components/ui/use-toast';

// Define the form schemas for each step
const emailSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address",
  }),
});

const otpSchema = z.object({
  otp: z.string().min(6, {
    message: "Your verification code must be 6 characters",
  }),
});

const passwordSchema = z.object({
  password: z.string().min(8, {
    message: "Password must be at least 8 characters",
  }),
  confirmPassword: z.string().min(8, {
    message: "Confirm password must be at least 8 characters",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type EmailFormValues = z.infer<typeof emailSchema>;
type OtpFormValues = z.infer<typeof otpSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

// Define the steps of the password reset process
type ResetStep = 'email' | 'otp' | 'password' | 'success';

const PasswordResetPage = () => {
  const { toast } = useToast();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<ResetStep>('email');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendSuccess, setResendSuccess] = useState(false);

  // Initialize the forms for each step
  const emailForm = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: '',
    },
  });

  const otpForm = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: '',
    },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  // Handle email submission
  const onEmailSubmit = async (values: EmailFormValues) => {
    setIsLoading(true);
    try {
      const response = await axios.post('/api/auth/forgot-password', {
        email: values.email,
      });

      if (response.data.success) {
        setEmail(values.email);
        setCurrentStep('otp');
        setResendCooldown(30);

        // Start cooldown timer
        const timer = setInterval(() => {
          setResendCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch (error: any) {
      // Handle specific error for non-existent account
      if (error.response?.status === 404) {
        toast({
          title: "Account Not Found",
          description: error.response?.data?.error || "No account found with this email address.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.response?.data?.error || "Failed to send verification code",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP submission
  const onOtpSubmit = async (values: OtpFormValues) => {
    setIsLoading(true);
    try {
      const response = await axios.post('/api/verify-otp', {
        email: email,
        otp: values.otp,
      });

      if (response.data.message) {
        setCurrentStep('password');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Invalid verification code",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle password submission
  const onPasswordSubmit = async (values: PasswordFormValues) => {
    setIsLoading(true);
    try {
      const response = await axios.post('/api/auth/reset-password', {
        email: email,
        password: values.password,
      });

      if (response.data.success) {
        setCurrentStep('success');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to reset password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle resending OTP
  const onResendOtp = async () => {
    if (resendCooldown > 0) return;

    setIsLoading(true);
    try {
      const response = await axios.post('/api/auth/forgot-password', {
        email: email,
      });

      if (response.data.success) {
        setResendSuccess(true);
        setResendCooldown(30);

        // Start cooldown timer
        const timer = setInterval(() => {
          setResendCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        toast({
          title: "Success",
          description: "Verification code sent successfully",
        });
      }
    } catch (error: any) {
      // Handle specific error for non-existent account
      if (error.response?.status === 404) {
        toast({
          title: "Account Not Found",
          description: error.response?.data?.error || "No account found with this email address.",
          variant: "destructive",
        });

        // Go back to email step
        setCurrentStep('email');
      } else {
        toast({
          title: "Error",
          description: error.response?.data?.error || "Failed to resend verification code",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle going back to previous step
  const handleGoBack = () => {
    if (currentStep === 'otp') {
      setCurrentStep('email');
    } else if (currentStep === 'password') {
      setCurrentStep('otp');
    }
  };

  // Mask email for display
  const maskEmail = (email: string) => {
    if (!email) return '';
    const [username, domain] = email.split('@');
    if (!username || !domain) return email;

    const maskedUsername = username.length > 2
      ? `${username.substring(0, 2)}${'*'.repeat(username.length - 2)}`
      : username;

    return `${maskedUsername}@${domain}`;
  };

  return (
    <div className='min-h-screen relative overflow-hidden bg-[#f8f9ff]'>
      {/* Modern geometric background elements */}
      <div className='absolute inset-0 bg-[url(/grid.svg)] bg-center opacity-5 pointer-events-none' />

      {/* Abstract shapes */}
      <div className='absolute top-0 left-0 w-1/3 h-screen bg-gradient-to-b from-[#f1f5ff] to-[#ffffff] transform -skew-x-12 z-0' />
      <div className='absolute bottom-0 right-0 w-1/2 h-1/3 bg-gradient-to-t from-[#f0f7ff] to-transparent transform skew-x-12 z-0' />

      {/* Animated accent elements */}
      <div className='absolute top-20 left-[20%] w-64 h-64 rounded-full border border-[#e1e8ff] opacity-20 animate-spin-slow' />
      <div className='absolute bottom-40 right-[15%] w-40 h-40 rounded-full border border-[#d8e3ff] opacity-30 animate-spin-slow' style={{animationDuration: '15s'}} />
      <div className='absolute top-[40%] right-[10%] w-20 h-20 rounded-full bg-gradient-to-r from-[#4f46e5]/5 to-[#8b5cf6]/5 animate-float' style={{animationDuration: '7s'}} />

      {/* Accent lines */}
      <div className='absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#4f46e5] via-[#8b5cf6] to-[#ec4899] opacity-80' />
      <div className='absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-[#ec4899] via-[#8b5cf6] to-[#4f46e5] opacity-80' />

      <div className='container relative z-10 flex flex-col items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8'>
        <div className='w-full max-w-md space-y-8'>
          <div className='text-center'>
            <Link href="/" className='inline-block'>
              <h1 className='text-4xl font-bold bg-gradient-to-r from-[#4f46e5] via-[#8b5cf6] to-[#ec4899] bg-clip-text text-transparent'>
                PickCreator
              </h1>
            </Link>
            <h2 className='mt-6 text-3xl font-extrabold text-gray-800'>Reset Password</h2>
          </div>

          <Card className='bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-[#e1e8ff]'>
            <CardHeader>
              <div className='flex justify-center mb-4'>
                <div className='p-3 bg-gradient-to-r from-[#4f46e5]/10 to-[#8b5cf6]/10 rounded-full relative group'>
                  <div className='absolute inset-0 bg-gradient-to-r from-[#4f46e5]/20 to-[#8b5cf6]/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500' />
                  <KeyRoundIcon className='h-6 w-6 text-[#4f46e5] relative z-10 group-hover:text-[#8b5cf6] transition-colors duration-300' />
                </div>
              </div>
              <CardTitle className='text-center text-gray-800'>
                {currentStep === 'email' && 'Forgot Password'}
                {currentStep === 'otp' && 'Verify Your Email'}
                {currentStep === 'password' && 'Create New Password'}
                {currentStep === 'success' && 'Password Reset Complete'}
              </CardTitle>
              <CardDescription className='text-center text-gray-600'>
                {currentStep === 'email' && 'Enter your email to receive a verification code'}
                {currentStep === 'otp' && `We've sent a code to ${maskEmail(email)}`}
                {currentStep === 'password' && 'Enter your new password'}
                {currentStep === 'success' && 'Your password has been reset successfully'}
              </CardDescription>
            </CardHeader>

            <CardContent>
              {currentStep === 'email' && (
                <Form {...emailForm}>
                  <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className='space-y-4'>
                    <FormField
                      control={emailForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-gray-700'>Email</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter your email"
                              {...field}
                              className='h-12 px-4 rounded-xl border border-[#e1e8ff] bg-white/80 focus:bg-white transition-all duration-200 shadow-sm focus:border-[#8b5cf6] focus:ring-1 focus:ring-[#8b5cf6] text-gray-800'
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className='w-full h-12 mt-4 rounded-xl font-semibold transition-all duration-300 bg-gradient-to-r from-[#4f46e5] to-[#8b5cf6] hover:from-[#4f46e5] hover:to-[#ec4899] hover:shadow-lg text-white'
                      disabled={isLoading}
                    >
                      {isLoading ? 'Sending...' : 'Send Verification Code'}
                    </Button>
                  </form>
                </Form>
              )}

              {currentStep === 'otp' && (
                <Form {...otpForm}>
                  <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className='space-y-4'>
                    <FormField
                      control={otpForm.control}
                      name="otp"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-gray-700'>Verification Code</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter 6-digit code"
                              {...field}
                              className='h-12 px-4 rounded-xl border border-[#e1e8ff] bg-white/80 focus:bg-white transition-all duration-200 shadow-sm focus:border-[#8b5cf6] focus:ring-1 focus:ring-[#8b5cf6] text-gray-800'
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className='w-full h-12 mt-4 rounded-xl font-semibold transition-all duration-300 bg-gradient-to-r from-[#4f46e5] to-[#8b5cf6] hover:from-[#4f46e5] hover:to-[#ec4899] hover:shadow-lg text-white'
                      disabled={isLoading}
                    >
                      {isLoading ? 'Verifying...' : 'Verify Code'}
                    </Button>
                    <div className='flex justify-between items-center mt-4'>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={handleGoBack}
                        className='text-gray-600 hover:text-[#4f46e5]'
                      >
                        <ArrowLeftIcon className='h-4 w-4 mr-2' />
                        Back
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={onResendOtp}
                        disabled={resendCooldown > 0 || isLoading}
                        className='text-gray-600 hover:text-[#4f46e5]'
                      >
                        {resendCooldown > 0
                          ? `Resend in ${resendCooldown}s`
                          : 'Resend Code'}
                      </Button>
                    </div>
                  </form>
                </Form>
              )}

              {currentStep === 'password' && (
                <Form {...passwordForm}>
                  <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className='space-y-4'>
                    <FormField
                      control={passwordForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-gray-700'>New Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Enter new password"
                              {...field}
                              className='h-12 px-4 rounded-xl border border-[#e1e8ff] bg-white/80 focus:bg-white transition-all duration-200 shadow-sm focus:border-[#8b5cf6] focus:ring-1 focus:ring-[#8b5cf6] text-gray-800'
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-gray-700'>Confirm Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Confirm new password"
                              {...field}
                              className='h-12 px-4 rounded-xl border border-[#e1e8ff] bg-white/80 focus:bg-white transition-all duration-200 shadow-sm focus:border-[#8b5cf6] focus:ring-1 focus:ring-[#8b5cf6] text-gray-800'
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className='w-full h-12 mt-4 rounded-xl font-semibold transition-all duration-300 bg-gradient-to-r from-[#4f46e5] to-[#8b5cf6] hover:from-[#4f46e5] hover:to-[#ec4899] hover:shadow-lg text-white'
                      disabled={isLoading}
                    >
                      {isLoading ? 'Resetting...' : 'Reset Password'}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleGoBack}
                      className='text-gray-600 hover:text-[#4f46e5]'
                    >
                      <ArrowLeftIcon className='h-4 w-4 mr-2' />
                      Back
                    </Button>
                  </form>
                </Form>
              )}

              {currentStep === 'success' && (
                <div className='text-center space-y-4'>
                  <div className='flex justify-center'>
                    <CheckCircleIcon className='h-16 w-16 text-green-500' />
                  </div>
                  <p className='text-gray-700'>Your password has been reset successfully.</p>
                  <Button
                    onClick={() => router.push('/log-in')}
                    className='w-full h-12 mt-4 rounded-xl font-semibold transition-all duration-300 bg-gradient-to-r from-[#4f46e5] to-[#8b5cf6] hover:from-[#4f46e5] hover:to-[#ec4899] hover:shadow-lg text-white'
                  >
                    Log In
                  </Button>
                </div>
              )}
            </CardContent>

            <CardFooter className='flex justify-center border-t border-[#e1e8ff] pt-4'>
              <p className='text-sm text-gray-600'>
                Remember your password?{' '}
                <Link href="/log-in" className='text-[#4f46e5] font-semibold hover:text-[#8b5cf6] transition-colors'>
                  Log In
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PasswordResetPage;
