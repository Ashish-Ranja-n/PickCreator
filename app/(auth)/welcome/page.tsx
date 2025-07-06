"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function WelcomeAuthPage() {
  const [input, setInput] = useState("");
  // Placeholder for step (1: input, 2: otp)
  const [step, setStep] = useState(1);

  // Placeholder for OTP input
  const [otp, setOtp] = useState("");

  const [firebaseError, setFirebaseError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [currentImage, setCurrentImage] = useState<number>(0);
  const isSubmitting = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const otpRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const images: { src: string; alt: string }[] = [
    { src: "/welcome1.png", alt: "Welcome 1" },
    { src: "/welcome2.png", alt: "Welcome 2" },
  ];

  // Email validation only
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.trim());

  // Check for Google OAuth errors in URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    if (error) {
      let errorMessage = 'Authentication failed. Please try again.';
      switch (error) {
        case 'access_denied':
          errorMessage = 'Google sign-in was cancelled.';
          break;
        case 'missing_code':
          errorMessage = 'Google authentication failed. Please try again.';
          break;
        case 'config_error':
          errorMessage = 'Google sign-in is not properly configured.';
          break;
        case 'token_exchange_failed':
          errorMessage = 'Failed to complete Google sign-in.';
          break;
        case 'profile_fetch_failed':
          errorMessage = 'Failed to get your Google profile information.';
          break;
        case 'no_email':
          errorMessage = 'No email address found in your Google account.';
          break;
        case 'user_creation_failed':
          errorMessage = 'Failed to create your account. Please try again.';
          break;
        case 'jwt_config_error':
          errorMessage = 'Authentication system error. Please try again.';
          break;
        case 'oauth_process_failed':
          errorMessage = 'Google sign-in process failed. Please try again.';
          break;
        case 'api_error':
          errorMessage = 'System error occurred. Please try again.';
          break;
      }
      setFirebaseError(errorMessage);
      // Clear the error from URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 2 && resendTimer > 0) {
      timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    } else if (step === 2 && resendTimer === 0) {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [step, resendTimer]);

  // Add auto-slide effect for images
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev: number) => (prev === images.length - 1 ? 0 : prev + 1));
    }, 3000);
    return () => clearInterval(interval);
  }, [images.length]);

  const handleContinue = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting.current) return;
    isSubmitting.current = true;
    setFirebaseError("");
    setLoading(true);
    try {
      if (!isEmail) {
        setFirebaseError("Please enter a valid email address.");
        inputRef.current?.focus();
        return;
      }
      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: input }),
      });
      if (!res.ok) throw new Error("Failed to send OTP to email");
      setStep(2);
      setTimeout(() => otpRef.current?.focus(), 100); // focus OTP input
    } catch (err: any) {
      setFirebaseError(err.message || "Failed to send OTP");
      inputRef.current?.focus();
    } finally {
      setLoading(false);
      isSubmitting.current = false;
    }
  }, [input, isEmail]);

  const handleOtpVerify = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting.current) return;
    isSubmitting.current = true;
    setFirebaseError("");
    setOtpLoading(true);
    try {
      // Validate OTP: must be 6 digits
      if (!/^\d{6}$/.test(otp)) {
        setFirebaseError("Please enter a valid 6-digit OTP.");
        otpRef.current?.focus();
        return;
      }
      const res = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: input, otp }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Invalid OTP or verification failed");
      const loginRes = await fetch("/api/auth/otp-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: input }),
        credentials: "include",
      });
      if (!loginRes.ok) throw new Error("Failed to login. Try again.");
      const data = await loginRes.json();
      // ...existing code...
      if (data.isNew) {
        router.push("/pickRole");
      } else {
        if (data.user?.role === "Brand") {
          window.location.replace("/brand");
        } else if (data.user?.role === "Influencer") {
          window.location.replace("/influencer");
        } else {
          router.push("/");
        }
      }
    } catch (err: any) {
      setFirebaseError(err.message || "OTP verification failed");
      otpRef.current?.focus();
    } finally {
      setOtpLoading(false);
      isSubmitting.current = false;
    }
  }, [input, otp, isEmail, router]);

  const handleResendOtp = useCallback(async () => {
    setFirebaseError("");
    setResendTimer(30);
    setCanResend(false);
    setLoading(true);
    try {
      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: input }),
      });
      if (!res.ok) throw new Error("Failed to resend OTP to email");
    } catch (err: any) {
      setFirebaseError(err.message || "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  }, [input, isEmail]);

  const handleGoogleSignIn = useCallback(async () => {
    setGoogleLoading(true);
    setFirebaseError("");
    try {
      const response = await fetch('/api/auth/google');
      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Failed to get Google auth URL');
      }
    } catch (error: any) {
      setFirebaseError(error.message || 'Failed to initiate Google sign-in');
      setGoogleLoading(false);
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Top artwork */}
      <div className="h-64 w-full flex items-end justify-center bg-[#ffe4ef] rounded-b-3xl relative overflow-hidden">
        <div className="relative w-full h-64 flex items-center justify-center overflow-hidden">
          <Image
            src={images[currentImage].src}
            alt={images[currentImage].alt}
            fill
            className="object-cover shadow-2xl transition-all duration-700"
            priority
          />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center px-6 pt-8">
        <h1 className="text-3xl font-extrabold text-[#e94e8a] text-center mb-2 drop-shadow-sm">
          Welcome to PickCreator
        </h1>
        <p className="text-base text-[#7d6c6c] text-center mb-6 font-medium">
          Create your journey. Connect.<br />Collaborate. Grow.
        </p>

        {step === 1 && (
          <form onSubmit={handleContinue} className="w-full max-w-sm flex flex-col gap-4" autoComplete="on" aria-label="Login form">
            <input
              ref={inputRef}
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="Email"
              aria-label="Email"
              className="w-full rounded-xl bg-white border-2 border-[#e94e8a] px-4 py-3 text-[#e94e8a] placeholder-[#e94e8a]/60 focus:outline-none focus:ring-2 focus:ring-[#e94e8a] text-base shadow font-semibold transition"
              value={input}
              onChange={e => setInput(e.target.value)}
              required
              aria-invalid={!isEmail}
            />
            <button
              type="submit"
              className="w-full rounded-full bg-[#e94e8a] text-white font-bold py-3 text-lg shadow-md hover:bg-[#c2185b] transition flex items-center justify-center"
              disabled={!isEmail || loading || isSubmitting.current}
              aria-disabled={!isEmail || loading || isSubmitting.current}
              title={!isEmail ? "Enter a valid email address" : loading ? "Loading..." : undefined}
            >
              {loading ? <span className="loader mr-2"></span> : null}Continue
            </button>
            {firebaseError && (
              <div className="text-[#e94e8a] bg-[#ffe4ef] rounded px-2 py-1 text-xs text-center mb-2 font-bold drop-shadow" tabIndex={-1}>{firebaseError}</div>
            )}
          </form>
        )}

        {step === 1 && (
          <div className="w-full max-w-sm mt-4">
            <div className="flex items-center justify-center mb-4">
              <div className="flex-1 h-px bg-[#e94e8a]/20"></div>
              <span className="px-3 text-sm text-[#7d6c6c] font-medium">or</span>
              <div className="flex-1 h-px bg-[#e94e8a]/20"></div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="w-full rounded-xl bg-white border-2 border-gray-300 px-4 py-3 text-gray-700 font-semibold text-base shadow hover:bg-gray-50 transition flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {googleLoading ? (
                <span className="loader"></span>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </>
              )}
            </button>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleOtpVerify} className="w-full max-w-sm flex flex-col gap-4" aria-label="OTP form">
            <input
              ref={otpRef}
              type="text"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              placeholder="Enter OTP"
              aria-label="Enter OTP"
              className="w-full rounded-xl bg-white border-2 border-[#e94e8a] px-4 py-3 text-[#e94e8a] placeholder-[#e94e8a]/60 focus:outline-none focus:ring-2 focus:ring-[#e94e8a] text-base shadow tracking-widest text-center font-semibold transition"
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
              required
              aria-invalid={otp.length !== 6}
            />
            <button
              type="submit"
              className="w-full rounded-full bg-[#e94e8a] text-white font-bold py-3 text-lg shadow-md hover:bg-[#c2185b] transition flex items-center justify-center"
              disabled={otp.length !== 6 || otpLoading || isSubmitting.current}
              aria-disabled={otp.length !== 6 || otpLoading || isSubmitting.current}
              title={otp.length !== 6 ? "Enter a valid 6-digit OTP" : otpLoading ? "Loading..." : undefined}
            >
              {otpLoading ? <span className="loader mr-2"></span> : null}Verify OTP
            </button>
            <div className="flex flex-row justify-between items-center mt-2">
              <button
                type="button"
                className="text-xs text-[#e94e8a] font-bold disabled:opacity-50 hover:text-[#b71c50]"
                onClick={handleResendOtp}
                disabled={!canResend || loading}
                aria-disabled={!canResend || loading}
                title={!canResend ? `Resend OTP in ${resendTimer}s` : loading ? "Loading..." : undefined}
              >
                {canResend ? "Resend OTP" : `Resend OTP in ${resendTimer}s`}
              </button>
              <button
                type="button"
                className="text-xs text-[#7d6c6c] underline font-bold hover:text-[#e94e8a]"
                onClick={() => { setStep(1); setOtp(""); setFirebaseError(""); setResendTimer(30); setCanResend(false); setTimeout(() => inputRef.current?.focus(), 100); }}
              >
                Change
              </button>
            </div>
            {firebaseError && (
              <div className="text-[#e94e8a] bg-[#ffe4ef] rounded px-2 py-1 text-xs text-center mb-2 font-bold drop-shadow" tabIndex={-1}>{firebaseError}</div>
            )}
          </form>
        )}

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mt-8 mb-4">
          <span className={`h-2 w-2 rounded-full ${step === 1 ? "bg-[#e94e8a]" : "bg-[#ffe4ef]"}`}></span>
          <span className={`h-2 w-2 rounded-full ${step === 2 ? "bg-[#e94e8a]" : "bg-[#ffe4ef]"}`}></span>
        </div>

        {/* Privacy Policy and Terms - inline, no underline, bold, faded color */}
        <div className="mt-auto pb-6 flex flex-row items-center justify-center gap-4 text-xs font-bold text-[#b7aeb0]">
          <a href="/legal/privacy-policy" className="hover:text-[#e94e8a] transition-colors">Privacy Policy</a>
          <span className="opacity-60">|</span>
          <a href="/legal/terms-of-service" className="hover:text-[#e94e8a] transition-colors">Terms & Services</a>
        </div>
      </div>

      {/* Add a simple loader spinner style */}
      <style jsx global>{`
        .loader {
          border: 2px solid #fff0f6;
          border-top: 2px solid #ff2d55;
          border-radius: 50%;
          width: 16px;
          height: 16px;
          animation: spin 1s linear infinite;
          display: inline-block;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
