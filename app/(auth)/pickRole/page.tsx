"use client";
import React, { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

export default function PickRolePage() {
  const router = useRouter();
  const [loadingRole, setLoadingRole] = useState<null | "Brand" | "Influencer">(null);
  const isSubmitting = useRef(false);

  const handleRoleSelect = useCallback(async (role: "Brand" | "Influencer") => {
    if (isSubmitting.current || loadingRole) return;
    isSubmitting.current = true;
    setLoadingRole(role);
    try {
      // Save role to backend (update user role)
      const res = await fetch("/api/auth/set-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to set role");
      // Refresh the token after role update
      const refreshRes = await fetch("/api/auth/refresh-token", {
        method: "GET",
        credentials: "include",
      });
      if (!refreshRes.ok) throw new Error("Failed to refresh token");
      if (role === "Brand") {
        router.replace("/brand/onboarding?success=true");
      } else {
        router.replace("/influencer/onboarding/basic-info?success=true");
      }
    } catch (err) {
      // Use a more user-friendly error display
      window.alert("There was a problem setting your role. Please try again.");
    } finally {
      setLoadingRole(null);
      isSubmitting.current = false;
    }
  }, [router, loadingRole]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-[#fff6f9] px-4 py-0">
      {/* Top Row: Pickcreator and Help Icon */}
      <div className="w-full max-w-xl flex items-center justify-between px-2 pt-6 pb-2">
        <div className="w-8" />
        <span className="font-extrabold text-[#2d2323] text-lg text-center flex-1 tracking-wider">
          Pickcreator
        </span>
        <button
          className="w-9 h-9 flex items-center justify-center rounded-full border border-[#e0e0e0] bg-white hover:bg-[#f3f3f3] transition"
          aria-label="Help"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="10"
              cy="10"
              r="9"
              stroke="#2d2323"
              strokeWidth="1.5"
              fill="none"
            />
            <text
              x="10"
              y="14"
              textAnchor="middle"
              fontSize="12"
              fill="#2d2323"
              fontFamily="Arial, sans-serif"
            >
              ?
            </text>
          </svg>
        </button>
      </div>
      {/* Header */}
      <h1 className="mb-1 text-3xl font-black text-[#2d2323] text-center tracking-tight leading-tight">
        Welcome to Pickcreator
      </h1>
      {/* Subheader: Who are you? */}
      <div className="w-full max-w-xs">
        <h2 className="mb-8 text-lg font-semibold text-[#c03a5b] text-center tracking-wide">
          Who are you?
        </h2>
      </div>
      {/* Role Cards */}
      <div className="w-full max-w-xs flex flex-col gap-7">
        {/* Business Card */}
        <button
          className="flex flex-row items-center gap-5 bg-[#eaf2ff] rounded-3xl px-5 py-7 w-full shadow-lg transition-all duration-150 active:scale-95 hover:shadow-xl focus:outline-none border-2 border-transparent hover:border-[#1976f7] relative"
          onClick={() => handleRoleSelect("Brand")}
          style={{
            boxShadow: "0 6px 24px 0 rgba(25, 118, 247, 0.10)",
            opacity: loadingRole ? 0.7 : 1,
            pointerEvents: loadingRole ? "none" : "auto",
          }}
          disabled={!!loadingRole || isSubmitting.current}
          aria-disabled={!!loadingRole || isSubmitting.current}
          aria-busy={loadingRole === "Brand"}
        >
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-sm">
            {/* Storefront Icon */}
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect x="3" y="7" width="18" height="13" rx="3" fill="#fff" />
              <rect
                x="3"
                y="7"
                width="18"
                height="13"
                rx="3"
                stroke="#1976f7"
                strokeWidth="2"
              />
              <rect x="8" y="4" width="8" height="5" rx="2" fill="#fff" />
              <rect
                x="8"
                y="4"
                width="8"
                height="5"
                rx="2"
                stroke="#1976f7"
                strokeWidth="2"
              />
              <rect x="11" y="13" width="2" height="4" rx="1" fill="#1976f7" />
            </svg>
          </div>
          <div className="flex flex-col items-start text-left">
            <span className="text-xl font-extrabold text-[#1976f7] mb-1 leading-tight">
              Business
            </span>
            <span className="text-base text-[#1976f7] font-medium opacity-80">
              Promote your brand
            </span>
          </div>
          {loadingRole === "Brand" && (
            <span className="absolute right-4 top-4">
              <svg className="animate-spin" width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="#1976f7" strokeWidth="4" opacity="0.2" />
                <path d="M22 12a10 10 0 0 1-10 10" stroke="#1976f7" strokeWidth="4" strokeLinecap="round" />
              </svg>
            </span>
          )}
        </button>
        {/* Influencer Card */}
        <button
          className="flex flex-row items-center gap-5 bg-[#ffe3ef] rounded-3xl px-5 py-7 w-full shadow-lg transition-all duration-150 active:scale-95 hover:shadow-xl focus:outline-none border-2 border-transparent hover:border-[#ff5ca8] relative"
          onClick={() => handleRoleSelect("Influencer")}
          style={{
            boxShadow: "0 6px 24px 0 rgba(255, 92, 168, 0.10)",
            opacity: loadingRole ? 0.7 : 1,
            pointerEvents: loadingRole ? "none" : "auto",
          }}
          disabled={!!loadingRole || isSubmitting.current}
          aria-disabled={!!loadingRole || isSubmitting.current}
          aria-busy={loadingRole === "Influencer"}
        >
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-sm">
            {/* Person Icon */}
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="12" cy="9" r="4" fill="#ff5ca8" />
              <rect x="6" y="15" width="12" height="6" rx="3" fill="#ff5ca8" />
            </svg>
          </div>
          <div className="flex flex-col items-start text-left">
            <span className="text-xl font-extrabold text-[#ff5ca8] mb-1 leading-tight">
              Influencer
            </span>
            <span className="text-base text-[#ff5ca8] font-medium opacity-80">
              Work with brands
            </span>
          </div>
          {loadingRole === "Influencer" && (
            <span className="absolute right-4 top-4">
              <svg className="animate-spin" width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="#ff5ca8" strokeWidth="4" opacity="0.2" />
                <path d="M22 12a10 10 0 0 1-10 10" stroke="#ff5ca8" strokeWidth="4" strokeLinecap="round" />
              </svg>
            </span>
          )}
        </button>
      </div>
      {/* Extra spacing for mobile bottom safe area */}
      <div className="h-8" />
    </div>
  );
}
