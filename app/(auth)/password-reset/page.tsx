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
      {/* Modern animated background */}
      <div className='absolute inset-0'>
        <div className='absolute inset-0 bg-gradient-to-br from-[#f1f5ff] via-[#ffffff] to-[#f0f7ff] opacity-70' />
        <div className='absolute inset-0 bg-[url(/grid.svg)] bg-center opacity-5' />
      </div>

      {/* Animated geometric elements */}
      <div className='absolute w-full h-full overflow-hidden'>
        {/* Floating elements */}
        <div className='absolute top-1/4 right-1/4 w-72 h-72 bg-gradient-to-r from-[#4f46e5]/10 to-[#8b5cf6]/10 rounded-full blur-3xl animate-float' style={{animationDuration: '20s'}} />
        <div className='absolute bottom-1/4 left-1/3 w-96 h-96 bg-gradient-to-r from-[#8b5cf6]/10 to-[#ec4899]/10 rounded-full blur-3xl animate-float' style={{animationDuration: '25s'}} />
        <div className='absolute top-1/2 left-1/4 w-64 h-64 bg-gradient-to-r from-[#ec4899]/10 to-[#4f46e5]/10 rounded-full blur-3xl animate-float' style={{animationDuration: '15s'}} />
      </div>

      {/* Header with Logo */}
      <div className='absolute top-0 left-0 p-6 z-10'>
        <div className='relative group'>
          <div className='absolute -inset-6 bg-gradient-to-r from-[#4f46e5]/20 via-[#8b5cf6]/20 to-[#ec4899]/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-all duration-700' />
          <Link href="/" className="relative flex items-center">
            <div className="flex items-center">
              <span className="text-4xl font-black tracking-tighter">
                <span className="bg-black bg-clip-text text-transparent">
                  pick
                </span>
                <span className="bg-gradient-to-r from-[#4f46e5] to-[#8b5cf6] bg-clip-text text-transparent">
                  creator
                </span>
              </span>
              <span className="ml-2 text-xl font-semibold text-gray-600">
                STUDIO
              </span>
            </div>
          </Link>
        </div>
      </div>

      {/* Main content */}
      <div className='relative flex flex-col items-center justify-center min-h-screen px-4'>
        <div className='w-full max-w-md relative'>
          <div className='absolute -inset-2 bg-gradient-to-r from-[#4f46e5]/10 via-[#8b5cf6]/10 to-[#ec4899]/10 rounded-2xl blur-lg opacity-70 animate-pulse' style={{animationDuration: '3s'}} />
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

      {/* Footer Links */}
      <div className='absolute bottom-0 left-0 w-full p-6 flex justify-center items-center gap-8 text-sm text-gray-500 z-10'>
        <Link 
          href="/legal/privacy-policy" 
          className="hover:text-[#4f46e5] transition-colors duration-200"
        >
          Privacy Policy
        </Link>
        <Link 
          href="/legal/terms-conditions" 
          className="hover:text-[#4f46e5] transition-colors duration-200"
        >
          Terms & Conditions
        </Link>
      </div>
    </div>
  );
};

export default PasswordResetPage;
