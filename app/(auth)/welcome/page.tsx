"use client";
import React, { useState } from "react";
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

  // Detect if input is email or phone (simple check)
  const isEmail = input.includes("@") && input.includes(".");
  const isPhone = /^\d{10,15}$/.test(input.replace(/\D/g, ""));

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    setFirebaseError("");
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
    }
  };

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setFirebaseError("");
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
      return;
    }
    if (isPhone) {
      if (!confirmationResult) {
        setFirebaseError("No OTP session found. Please try again.");
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
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fdf7fa]">
      {/* Top artwork */}
      <div className="h-64 flex items-end justify-center bg-[#eac6b6] rounded-b-3xl">
        <div className="relative w-48 h-60 mb-2">
          <Image
            src="/icon0.svg"
            alt="Artwork"
            fill
            className="object-contain rounded-xl shadow-lg"
            priority
          />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center px-6 pt-8">
        <h1 className="text-2xl font-bold text-[#7d6c6c] text-center mb-2">
          Welcome to PickCreator
        </h1>
        <p className="text-base text-[#b7aeb0] text-center mb-6">
          Create your journey. Connect.<br />Collaborate. Grow.
        </p>

        {step === 1 && (
          <form onSubmit={handleContinue} className="w-full max-w-sm flex flex-col gap-4">
            <input
              type="text"
              autoComplete="on"
              inputMode="email"
              placeholder="Email or mobile number"
              className="w-full rounded-xl bg-[#f5e6ed] px-4 py-3 text-[#7d6c6c] placeholder-[#b7aeb0] focus:outline-none focus:ring-2 focus:ring-[#e94e8a] text-base shadow-sm"
              value={input}
              onChange={e => setInput(e.target.value)}
              required
            />
            <button
              type="submit"
              className="w-full rounded-full bg-[#e94e8a] text-white font-semibold py-3 text-lg shadow-md hover:bg-[#d13c7a] transition"
              disabled={!isEmail && !isPhone}
            >
              Continue
            </button>
            {firebaseError && (
              <div className="text-red-500 text-xs text-center mb-2">{firebaseError}</div>
            )}
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleOtpVerify} className="w-full max-w-sm flex flex-col gap-4">
            <input
              type="text"
              inputMode="numeric"
              pattern="\\d*"
              maxLength={6}
              placeholder="Enter OTP"
              className="w-full rounded-xl bg-[#f5e6ed] px-4 py-3 text-[#7d6c6c] placeholder-[#b7aeb0] focus:outline-none focus:ring-2 focus:ring-[#e94e8a] text-base shadow-sm tracking-widest text-center"
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
              required
            />
            <button
              type="submit"
              className="w-full rounded-full bg-[#e94e8a] text-white font-semibold py-3 text-lg shadow-md hover:bg-[#d13c7a] transition"
              disabled={otp.length !== 6}
            >
              Verify OTP
            </button>
          </form>
        )}

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mt-8 mb-4">
          <span className={`h-2 w-2 rounded-full ${step === 1 ? "bg-[#e94e8a]" : "bg-[#eac6b6]"}`}></span>
          <span className={`h-2 w-2 rounded-full ${step === 2 ? "bg-[#e94e8a]" : "bg-[#eac6b6]"}`}></span>
        </div>

        {/* Privacy Policy and Terms - inline, no underline, bold, faded color */}
        <div className="mt-auto pb-6 flex flex-row items-center justify-center gap-4 text-xs font-bold text-[#b7aeb0]">
          <a href="/legal/privacy-policy" className="hover:text-[#a06b7b] transition-colors">Privacy Policy</a>
          <span className="opacity-60">|</span>
          <a href="/legal/terms-of-service" className="hover:text-[#a06b7b] transition-colors">Terms & Services</a>
        </div>
      </div>

      {/* Firebase reCAPTCHA container (invisible) */}
      <div id="recaptcha-container"></div>
    </div>
  );
}
