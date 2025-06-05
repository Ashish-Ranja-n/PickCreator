'use client'
import React, { useState, useEffect } from 'react'
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { Input } from "@/components/ui/input"
import {  LucideLoaderCircle, Eye, EyeOff, CheckCircle, AlertCircle, KeyRoundIcon } from 'lucide-react'
import Link from 'next/link'
import axios from 'axios'
import { useRouter, usePathname } from 'next/navigation'
import AccountTypeToggle from './form/AccountTypeToggle'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { notifyServiceWorkerLogin } from '@/utils/serviceWorkerControl';

interface UserData {
  email: string;
  password: string;
  name?: string;
  role?: string;
}

type AccountType = "Brand" | "Influencer";
type AuthStep = "credentials" | "verification";

const formSchema = (type: string) => z.object({
  name: type === 'Log In' ? z.string().optional() : z.string().min(2, {
    message: "Name must be at least 2 characters",
  }),
  email: z.string().email({
    message: "Please enter a valid email address",
  }),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters",
  }),
  role: type === 'Log In' ? z.string().optional() : z.enum(["Brand", "Influencer"], {
    message: "Please select an account type",
  }),
})

const otpSchema = z.object({
  pin: z.string().min(6, {
    message: "Your verification code must be 6 characters",
  }),
});

const AuthForm = ({type}: {type: string}) => {
  const [currentStep, setCurrentStep] = useState<AuthStep>("credentials");
  const [user, setUser] = useState<UserData>({
    email: "",
    password: "",
    name: undefined,
    role: undefined,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isOtpVerifying, setIsOtpVerifying] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const authFormSchema = formSchema(type);

  // Monitor pathname to detect when navigation has completed
  useEffect(() => {
    // If we were navigating and pathname changes, reset navigation state
    if (isNavigating) {
      setIsNavigating(false);
      setIsLoading(false);
      setIsOtpVerifying(false);
    }
  }, [pathname, isNavigating]);

  // Cooldown timer for OTP resend
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Reset resend success message after 3 seconds
  useEffect(() => {
    if (resendSuccess) {
      const timer = setTimeout(() => setResendSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [resendSuccess]);

  // Form setup
  const credentialsForm = useForm<z.infer<typeof authFormSchema>>({
    resolver: zodResolver(authFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "",
    },
  });

  const otpForm = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      pin: "",
    },
  });

  // Improved navigation with loading state and better reliability
  const navigateWithLoading = (path: string) => {
    setIsLoading(true);
    setIsNavigating(true);

    // Use requestAnimationFrame for smoother transition
    requestAnimationFrame(() => {
      // Shorter delay for better responsiveness
      setTimeout(() => {
        router.push(path);
      }, 300);
    });

    // Add a safety timeout but keep it shorter
    const safetyTimeout = setTimeout(() => {
      setIsLoading(false);
      setIsNavigating(false);
    }, 3000);

    return () => clearTimeout(safetyTimeout);
  };

  // Enhanced navigation for cases that need hard refresh
  const navigateWithHardRedirect = (path: string) => {
    setIsLoading(true);
    // Brief delay to show loading state before redirect
    setTimeout(() => {
      window.location.href = path;
    }, 300);
  };

  // Handle credentials form submission
  const onSubmitCredentials = async (data: z.infer<typeof authFormSchema>) => {
    // Reset any previous errors
    setGeneralError('');
    setIsLoading(true);

    // Trim input values to prevent whitespace issues
    const userData = {
      email: data.email.trim(),
      password: data.password,
      name: data.name?.trim(),
      role: data.role
    };
    setUser(userData);

    try {
      if (type === 'Log In') {
        try {
          const response = await axios.post('/api/auth/log-in', userData);
          const userId = response.data.user?._id;
          const role = response.data.user?.role;

          if (!userId || !role) {
            throw new Error('Invalid response from server');
          }

          // Notify service worker and handle navigation based on role
          await notifyServiceWorkerLogin(userId, role);

          if (role === 'Brand') {
            navigateWithHardRedirect('/brand');
          } else if (role === 'Influencer') {
            // Use hard redirect for Influencer to ensure proper page load
            navigateWithHardRedirect('/influencer');
          } else if (role === 'Admin') {
            navigateWithHardRedirect('/admin');
          } else {
            navigateWithHardRedirect('/');
          }
        } catch (error: any) {
          handleAuthError(error, 'login');
        }
        return;
      }

      if (type === 'Sign Up') {
        try {
          // First check if account exists
          await axios.post('/api/auth/checkDatabase', userData);

          // Then send OTP
          await axios.post("/api/send-otp", userData);

          // Move to verification step and start cooldown
          setCurrentStep("verification");
          setResendCooldown(30);
          setIsLoading(false);
        } catch (error: any) {
          handleAuthError(error, 'signup');
        }
      }
    } catch (error: any) {
      handleAuthError(error, type === 'Log In' ? 'login' : 'signup');
    } finally {
      if (!isNavigating) {
        setIsLoading(false);
      }
    }
  };

  // Centralized error handling function
  const handleAuthError = (error: any, context: 'login' | 'signup' | 'otp') => {
    console.error(`Auth error in ${context}:`, error);

    if (context === 'login') {
      if (error.response?.status === 489) {
        setGeneralError('Invalid email or account does not exist');
      } else if (error.response?.status === 490) {
        setGeneralError('Incorrect password');
      } else if (error.response?.status === 403) {
        setGeneralError('Your account is not verified. Please contact support.');
      } else {
        setGeneralError(error.response?.data?.error || 'Authentication failed. Please try again.');
      }
    } else if (context === 'signup') {
      if (error.response?.status === 489) {
        setGeneralError('Account already exists with this email');
      } else if (error.response?.status === 400) {
        setGeneralError('Please fill all required fields');
      } else {
        setGeneralError(error.response?.data?.error || 'Failed to create account. Please try again.');
      }
    } else if (context === 'otp') {
      if (error.response?.status === 472) {
        setOtpError(error.response.data.error || 'Invalid verification code');
      } else {
        setOtpError(error.response?.data?.error || 'Verification failed. Please try again.');
      }
    }
  };

  // Handle OTP verification
  const onVerifyOtp = async (otp: z.infer<typeof otpSchema>) => {
    setOtpError('');
    setIsOtpVerifying(true);

    try {
      // Normalize the OTP before sending
      const normalizedOtp = String(otp.pin).trim();

      // Verify OTP
      const verifyResponse = await axios.post("/api/verify-otp", {
        email: user.email,
        otp: normalizedOtp
      });

      if (!verifyResponse.data.message) {
        throw new Error("OTP verification failed");
      }

      // Create account after successful OTP verification
      const signupResponse = await axios.post('/api/auth/sign-up', user);

      if (!signupResponse.data.success) {
        throw new Error(signupResponse.data.error || 'Failed to create account');
      }

      // Get the role from the response
      const userRole = signupResponse.data.role;

      // Notify service worker about login after successful signup
      try {
        await notifyServiceWorkerLogin(signupResponse.data.userId, userRole);
      } catch (swError) {
        console.warn("Service worker notification failed, continuing with navigation:", swError);
      }

      // Handle role-specific redirections using the role from response
      if (userRole === 'Influencer') {
        navigateWithHardRedirect('/connect-instagram?fresh=true');
        return;
      }

      // For Brand role
      if (userRole === 'Brand') {
        navigateWithHardRedirect('/brand/onboarding');
      } else {
        navigateWithHardRedirect('/');
      }

    } catch (error: any) {
      handleAuthError(error, 'otp');
      setIsOtpVerifying(false);
    }
  };

  // Enhanced OTP resend with better error handling
  const onResendOtp = async () => {
    if (resendCooldown > 0) return;

    otpForm.reset({ pin: "" });
    setOtpError('');

    try {
      await axios.post("/api/send-otp", { email: user.email.trim() });
      setResendSuccess(true);
      setResendCooldown(30);
    } catch (error: any) {
      setOtpError(error.response?.data?.error || 'Failed to resend code. Please try again.');
    }
  };

  const handleFocus = (fieldName: string) => {
    setFocusedField(fieldName);
  };

  const handleGoBack = () => {
    setCurrentStep("credentials");
    setOtpError('');
  };

  // Mask email for display
  const maskEmail = (email: string) => {
    if (!email) return '';
    const [username, domain] = email.split('@');
    if (!username || !domain) return email;

    return `${username}@${domain}`;
  };

  return (
    <div className='w-full max-w-md mx-auto'>
      <div className='space-y-6 bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.07)] border border-white/20'>
        {currentStep === "credentials" ? (
          <>
            <div className='text-center space-y-2'>
              <h1 className='text-2xl sm:text-3xl font-bold bg-gradient-to-r from-[#4f46e5] via-[#8b5cf6] to-[#ec4899] bg-clip-text text-transparent'>
                {type === 'Log In' ? 'Welcome Back!' : 'Join PickCreator'}
              </h1>
              <p className='text-gray-500 text-sm'>
                {type === 'Log In'
                  ? 'Great to see you again'
                  : 'Start your creative journey'}
              </p>
            </div>

            {generalError && (
              <Alert variant="destructive" className="py-3 px-4 bg-red-50/80 backdrop-blur-sm border border-red-100 rounded-2xl">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <AlertDescription className="text-sm text-red-600 font-medium">
                    {generalError}
                  </AlertDescription>
                </div>
              </Alert>
            )}

            <Form {...credentialsForm}>
              <form onSubmit={credentialsForm.handleSubmit(onSubmitCredentials)} className="space-y-5">
                {type === 'Sign Up' && (
                  <FormField
                    control={credentialsForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="relative">
                        <div className="relative group">
                          <FormLabel className={`absolute left-4 transition-all duration-200 pointer-events-none z-10
                            ${field.value || focusedField === 'name'
                              ? '-translate-y-7 text-xs font-medium text-[#8b5cf6]'
                              : 'translate-y-3.5 text-gray-400'}`}>
                            Name
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="text"
                              id="name"
                              onFocus={() => handleFocus('name')}
                              onBlur={() => setFocusedField(null)}
                              className='h-14 px-4 rounded-2xl border-2 border-gray-100 bg-gray-50/30 focus:bg-white transition-all duration-200 shadow-sm focus:border-[#8b5cf6] focus:ring-4 focus:ring-[#8b5cf6]/10 text-gray-800 placeholder:text-transparent'
                            />
                          </FormControl>
                        </div>
                        <FormMessage className="text-xs font-medium mt-2 text-red-400" />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={credentialsForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="relative">
                      <div className="relative group">
                        <FormLabel className={`absolute left-4 transition-all duration-200 pointer-events-none z-10
                          ${field.value || focusedField === 'email'
                            ? '-translate-y-7 text-xs font-medium text-[#8b5cf6]'
                            : 'translate-y-3.5 text-gray-400'}`}>
                          Email
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="email"
                            id="email"
                            onFocus={() => handleFocus('email')}
                            onBlur={() => setFocusedField(null)}
                            className='h-14 px-4 rounded-2xl border-2 border-gray-100 bg-gray-50/30 focus:bg-white transition-all duration-200 shadow-sm focus:border-[#8b5cf6] focus:ring-4 focus:ring-[#8b5cf6]/10 text-gray-800 placeholder:text-transparent'
                          />
                        </FormControl>
                      </div>
                      <FormMessage className="text-xs font-medium mt-2 text-red-400" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={credentialsForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="relative">
                      <div className="relative group">
                        <FormLabel className={`absolute left-4 transition-all duration-200 pointer-events-none z-10
                          ${field.value || focusedField === 'password'
                            ? '-translate-y-7 text-xs font-medium text-[#8b5cf6]'
                            : 'translate-y-3.5 text-gray-400'}`}>
                          Password
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              {...field}
                              type={showPassword ? "text" : "password"}
                              id="password"
                              onFocus={() => handleFocus('password')}
                              onBlur={() => setFocusedField(null)}
                              className='h-14 px-4 pr-12 rounded-2xl border-2 border-gray-100 bg-gray-50/30 focus:bg-white transition-all duration-200 shadow-sm focus:border-[#8b5cf6] focus:ring-4 focus:ring-[#8b5cf6]/10 text-gray-800 placeholder:text-transparent'
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#8b5cf6] transition-colors"
                              aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                              {showPassword ? (
                                <EyeOff size={20} className="opacity-75" />
                              ) : (
                                <Eye size={20} className="opacity-75" />
                              )}
                            </button>
                          </div>
                        </FormControl>
                      </div>
                      <FormMessage className="text-xs font-medium mt-2 text-red-400" />
                    </FormItem>
                  )}
                />

                {type === 'Sign Up' && (
                  <FormField
                    control={credentialsForm.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem className="space-y-3 pt-2">
                        <FormLabel className="text-xs font-medium text-[#8b5cf6]">Choose Account Type</FormLabel>
                        <AccountTypeToggle selectedType={field.value as AccountType} onChange={field.onChange} />
                        <FormMessage className="text-xs font-medium text-red-400" />
                      </FormItem>
                    )}
                  />
                )}

                {type === 'Log In' && (
                  <div className="flex justify-end -mt-2">
                    <Link
                      href="/password-reset"
                      className="text-sm text-[#4f46e5] hover:text-[#8b5cf6] transition-colors font-medium"
                    >
                      Forgot password?
                    </Link>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full h-14 mt-4 rounded-2xl font-semibold text-base transition-all duration-300
                    ${isLoading
                      ? 'bg-gradient-to-r from-[#524be2]/80 to-[#8d63ee]/80 cursor-wait'
                      : 'bg-gradient-to-r from-[#4f46e5] to-[#8b5cf6] hover:from-[#4f46e5] hover:to-[#ec4899] hover:shadow-lg hover:scale-[1.02]'
                    }`}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <LucideLoaderCircle className="h-5 w-5 animate-spin" />
                      <span>{type === 'Log In' ? 'Logging in...' : 'Creating account...'}</span>
                    </div>
                  ) : (
                    type === 'Log In' ? 'Log In' : 'Create Account'
                  )}
                </Button>
              </form>
            </Form>

            <div className='text-center space-y-6 mt-8'>
              <div className='relative'>
                <div className='absolute inset-0 flex items-center'>
                  <div className='w-full border-t border-gray-100'></div>
                </div>
                <div className='relative flex justify-center text-xs uppercase'>
                  <span className='bg-white px-4 text-gray-400 font-medium'>Or continue with</span>
                </div>
              </div>

              <div>
                <p className='text-sm text-gray-600'>
                  {type === 'Log In'
                    ? 'New to PickCreator? '
                    : 'Already have an account? '}
                  <Link
                    href={type === 'Log In' ? '/sign-up' : '/log-in'}
                    className='text-[#4f46e5] font-semibold hover:text-[#8b5cf6] transition-colors'
                  >
                    {type === 'Log In' ? 'Create an account' : 'Sign in'}
                  </Link>
                </p>
              </div>
            </div>
          </>
        ) : (
          // OTP Verification UI
          <>
            <div className='text-center space-y-4'>
              <div className='inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#8b5cf6]/10 mb-2'>
                <KeyRoundIcon className="h-8 w-8 text-[#8b5cf6]" />
              </div>
              <h1 className='text-2xl sm:text-3xl font-bold bg-gradient-to-r from-[#4f46e5] via-[#8b5cf6] to-[#ec4899] bg-clip-text text-transparent'>
                Verify Your Email
              </h1>
              <div className='space-y-1'>
                <p className='text-gray-500 text-sm'>
                  We've sent a 6-digit code to
                </p>
                <p className='font-medium text-gray-800'>
                  {maskEmail(user.email)}
                </p>
              </div>
            </div>

            <Form {...otpForm}>
              <form onSubmit={otpForm.handleSubmit(onVerifyOtp)} className="space-y-6">
                <FormField
                  control={otpForm.control}
                  name="pin"
                  render={({ field }) => (
                    <FormItem className="space-y-4">
                      <FormControl>
                        <div className="flex justify-center">
                          <InputOTP maxLength={6} {...field}>
                            <InputOTPGroup>
                              <InputOTPSlot index={0} className="w-12 h-14 sm:w-14 sm:h-16 border-2 border-gray-100 rounded-xl shadow-sm bg-gray-50/30 text-gray-800 text-lg font-medium focus:border-[#8b5cf6] focus:ring-4 focus:ring-[#8b5cf6]/10" />
                              <InputOTPSlot index={1} className="w-12 h-14 sm:w-14 sm:h-16 border-2 border-gray-100 rounded-xl shadow-sm bg-gray-50/30 text-gray-800 text-lg font-medium focus:border-[#8b5cf6] focus:ring-4 focus:ring-[#8b5cf6]/10" />
                              <InputOTPSlot index={2} className="w-12 h-14 sm:w-14 sm:h-16 border-2 border-gray-100 rounded-xl shadow-sm bg-gray-50/30 text-gray-800 text-lg font-medium focus:border-[#8b5cf6] focus:ring-4 focus:ring-[#8b5cf6]/10" />
                              <InputOTPSlot index={3} className="w-12 h-14 sm:w-14 sm:h-16 border-2 border-gray-100 rounded-xl shadow-sm bg-gray-50/30 text-gray-800 text-lg font-medium focus:border-[#8b5cf6] focus:ring-4 focus:ring-[#8b5cf6]/10" />
                              <InputOTPSlot index={4} className="w-12 h-14 sm:w-14 sm:h-16 border-2 border-gray-100 rounded-xl shadow-sm bg-gray-50/30 text-gray-800 text-lg font-medium focus:border-[#8b5cf6] focus:ring-4 focus:ring-[#8b5cf6]/10" />
                              <InputOTPSlot index={5} className="w-12 h-14 sm:w-14 sm:h-16 border-2 border-gray-100 rounded-xl shadow-sm bg-gray-50/30 text-gray-800 text-lg font-medium focus:border-[#8b5cf6] focus:ring-4 focus:ring-[#8b5cf6]/10" />
                            </InputOTPGroup>
                          </InputOTP>
                        </div>
                      </FormControl>

                      {otpError && (
                        <Alert variant="destructive" className="py-3 px-4 bg-red-50/80 backdrop-blur-sm border border-red-100 rounded-2xl">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-red-500" />
                            <AlertDescription className="text-sm text-red-600 font-medium">
                              {otpError}
                            </AlertDescription>
                          </div>
                        </Alert>
                      )}

                      {resendSuccess && (
                        <Alert className="py-3 px-4 bg-green-50/80 backdrop-blur-sm border border-green-100 rounded-2xl">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <AlertDescription className="text-sm text-green-600 font-medium">
                              New code sent successfully!
                            </AlertDescription>
                          </div>
                        </Alert>
                      )}

                      <FormMessage className="text-center text-xs text-red-400" />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <Button
                    type="submit"
                    disabled={isOtpVerifying}
                    className={`w-full h-14 rounded-2xl font-semibold text-base transition-all duration-300
                      ${isOtpVerifying
                        ? 'bg-gradient-to-r from-[#524be2]/80 to-[#8d63ee]/80 cursor-wait'
                        : 'bg-gradient-to-r from-[#4f46e5] to-[#8b5cf6] hover:from-[#4f46e5] hover:to-[#ec4899] hover:shadow-lg hover:scale-[1.02]'
                      }`}
                  >
                    {isOtpVerifying ? (
                      <div className="flex items-center justify-center gap-2">
                        <LucideLoaderCircle className="h-5 w-5 animate-spin" />
                        <span>Verifying...</span>
                      </div>
                    ) : (
                      'Verify & Continue'
                    )}
                  </Button>

                  <div className="flex flex-col items-center gap-4">
                    <p className="text-gray-500 text-sm">
                      Didn't receive the code?
                    </p>
                    <div className="flex items-center gap-6">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={onResendOtp}
                        disabled={resendCooldown > 0}
                        className="h-auto px-0 text-[#4f46e5] hover:text-[#8b5cf6] font-medium text-sm hover:bg-transparent"
                      >
                        {resendCooldown > 0
                          ? `Resend in ${resendCooldown}s`
                          : 'Resend code'}
                      </Button>
                      <div className="h-4 w-px bg-gray-200" />
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={handleGoBack}
                        className="h-auto px-0 text-gray-500 hover:text-gray-700 text-sm hover:bg-transparent"
                      >
                        Change email
                      </Button>
                    </div>
                  </div>
                </div>
              </form>
            </Form>
          </>
        )}
      </div>
    </div>
  )
}

export default AuthForm