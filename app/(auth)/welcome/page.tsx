"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { getFirebaseAuth, RecaptchaVerifier, signInWithPhoneNumber } from "@/lib/firebase";

declare global {
  interface Window {
    recaptchaVerifier?: any;
  }
}

export default function WelcomeAuthPage() {
  const [input, setInput] = useState("");
  // Placeholder for step (1: input, 2: otp)
  const [step, setStep] = useState(1);

  // Placeholder for OTP input
  const [otp, setOtp] = useState("");

  // For Firebase phone OTP
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [firebaseError, setFirebaseError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [currentImage, setCurrentImage] = useState<number>(0);
  const images: { src: string; alt: string }[] = [
    { src: "/welcome1.png", alt: "Welcome 1" },
    { src: "/welcome2.png", alt: "Welcome 2" },
  ];

  // Detect if input is email or phone (simple check)
  const isEmail = input.includes("@") && input.includes(".");
  const isPhone = /^\d{10,15}$/.test(input.replace(/\D/g, ""));

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
    }, 3000); // Slower: 3 seconds
    return () => clearInterval(interval);
  }, [images.length]);

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    setFirebaseError("");
    setLoading(true);
    if (isEmail) {
      try {
        // Send OTP to email via backend
        const res = await fetch("/api/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: input }),
        });
        if (!res.ok) throw new Error("Failed to send OTP to email");
        setStep(2);
      } catch (err: any) {
        setFirebaseError(err.message || "Failed to send OTP to email");
      }
      setLoading(false);
      return;
    }
    if (isPhone) {
      try {
        // Setup invisible reCAPTCHA
        const auth = getFirebaseAuth();
        // Add to allow window.recaptchaVerifier
        if (!window.recaptchaVerifier) {
          window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
            size: 'invisible',
            callback: () => {},
          });
        }
        const appVerifier = window.recaptchaVerifier;
        const result = await signInWithPhoneNumber(auth, "+" + input.replace(/\D/g, ""), appVerifier);
        setConfirmationResult(result);
        setStep(2);
      } catch (err: any) {
        setFirebaseError(err.message || "Failed to send OTP");
      }
      setLoading(false);
    }
  };

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setFirebaseError("");
    setOtpLoading(true);
    if (isEmail) {
      // Email OTP verification
      try {
        const res = await fetch("/api/verify-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: input, otp }),
          credentials: "include",
        });
        if (!res.ok) throw new Error("Invalid OTP or verification failed");
        // On success, call backend to check user existence and set cookie
        const loginRes = await fetch("/api/auth/otp-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: input }),
          credentials: "include",
        });
        if (!loginRes.ok) throw new Error("Failed to login. Try again.");
        const data = await loginRes.json();
        if (data.isNewUser) {
          window.location.href = "/(auth)/pickRole";
        } else {
          if (data.role === "Brand") {
            window.location.href = "/brand";
          } else if (data.role === "Influencer") {
            window.location.href = "/influencer";
          } else {
            window.location.href = "/";
          }
        }
      } catch (err: any) {
        setFirebaseError(err.message || "OTP verification failed");
      }
      setOtpLoading(false);
      return;
    }
    if (isPhone) {
      if (!confirmationResult) {
        setFirebaseError("No OTP session found. Please try again.");
        setOtpLoading(false);
        return;
      }
      try {
        // Verify OTP with Firebase
        const result = await confirmationResult.confirm(otp);
        // Get user info from Firebase result
        const user = result.user;
        // Call backend to check user existence and set cookie
        const res = await fetch("/api/auth/otp-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: input }),
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to login. Try again.");
        const data = await res.json();
        if (data.isNewUser) {
          window.location.href = "/(auth)/pickRole";
        } else {
          if (data.role === "Brand") {
            window.location.href = "/brand";
          } else if (data.role === "Influencer") {
            window.location.href = "/influencer";
          } else {
            window.location.href = "/";
          }
        }
      } catch (err: any) {
        setFirebaseError(err.message || "OTP verification failed");
      }
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setFirebaseError("");
    setResendTimer(30);
    setCanResend(false);
    if (isEmail) {
      try {
        setLoading(true);
        const res = await fetch("/api/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: input }),
        });
        if (!res.ok) throw new Error("Failed to resend OTP to email");
      } catch (err: any) {
        setFirebaseError(err.message || "Failed to resend OTP to email");
      } finally {
        setLoading(false);
      }
    } else if (isPhone) {
      try {
        setLoading(true);
        const auth = getFirebaseAuth();
        if (!window.recaptchaVerifier) {
          window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
            size: 'invisible',
            callback: () => {},
          });
        }
        const appVerifier = window.recaptchaVerifier;
        await signInWithPhoneNumber(auth, "+" + input.replace(/\D/g, ""), appVerifier);
      } catch (err: any) {
        setFirebaseError(err.message || "Failed to resend OTP");
      } finally {
        setLoading(false);
      }
    }
  };

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
          <form onSubmit={handleContinue} className="w-full max-w-sm flex flex-col gap-4">
            <input
              type="text"
              autoComplete="on"
              inputMode="email"
              placeholder="Email"
              className="w-full rounded-xl bg-white border-2 border-[#e94e8a] px-4 py-3 text-[#e94e8a] placeholder-[#e94e8a]/60 focus:outline-none focus:ring-2 focus:ring-[#e94e8a] text-base shadow font-semibold transition"
              value={input}
              onChange={e => setInput(e.target.value)}
              required
            />
            <button
              type="submit"
              className="w-full rounded-full bg-[#e94e8a] text-white font-bold py-3 text-lg shadow-md hover:bg-[#c2185b] transition flex items-center justify-center"
              disabled={(!isEmail && !isPhone) || loading}
            >
              {loading ? <span className="loader mr-2"></span> : null}Continue
            </button>
            {firebaseError && (
              <div className="text-[#e94e8a] bg-[#ffe4ef] rounded px-2 py-1 text-xs text-center mb-2 font-bold drop-shadow">{firebaseError}</div>
            )}
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleOtpVerify} className="w-full max-w-sm flex flex-col gap-4">
            <input
              type="text"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              placeholder="Enter OTP"
              className="w-full rounded-xl bg-white border-2 border-[#e94e8a] px-4 py-3 text-[#e94e8a] placeholder-[#e94e8a]/60 focus:outline-none focus:ring-2 focus:ring-[#e94e8a] text-base shadow tracking-widest text-center font-semibold transition"
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
              required
            />
            <button
              type="submit"
              className="w-full rounded-full bg-[#e94e8a] text-white font-bold py-3 text-lg shadow-md hover:bg-[#c2185b] transition flex items-center justify-center"
              disabled={otp.length !== 6 || otpLoading}
            >
              {otpLoading ? <span className="loader mr-2"></span> : null}Verify OTP
            </button>
            <div className="flex flex-row justify-between items-center mt-2">
              <button
                type="button"
                className="text-xs text-[#e94e8a] font-bold disabled:opacity-50 hover:text-[#b71c50]"
                onClick={handleResendOtp}
                disabled={!canResend || loading}
              >
                {canResend ? "Resend OTP" : `Resend OTP in ${resendTimer}s`}
              </button>
              <button
                type="button"
                className="text-xs text-[#7d6c6c] underline font-bold hover:text-[#e94e8a]"
                onClick={() => { setStep(1); setOtp(""); setFirebaseError(""); setResendTimer(30); setCanResend(false); }}
              >
                Change
              </button>
            </div>
            {firebaseError && (
              <div className="text-[#e94e8a] bg-[#ffe4ef] rounded px-2 py-1 text-xs text-center mb-2 font-bold drop-shadow">{firebaseError}</div>
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

      {/* Firebase reCAPTCHA container (invisible) */}
      <div id="recaptcha-container"></div>

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
