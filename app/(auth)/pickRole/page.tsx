"use client";
import React from "react";
import { useRouter } from "next/navigation";

export default function PickRolePage() {
  const router = useRouter();

  const handleRoleSelect = async (role: "Brand" | "Influencer") => {
    try {
      // Save role to backend (update user role)
      const res = await fetch("/api/auth/set-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to set role");
      const data = await res.json();
      // Optionally, update localStorage for client-side use
      localStorage.setItem("userRole", role);
      // Set cookie with userId and role
      if (data && data.userId && data.role) {
        document.cookie = `pickcreator_user=${JSON.stringify({ userId: data.userId, role: data.role })}; path=/;`;
      }
      // Redirect to onboarding or dashboard as per role
      if (role === "Brand") {
        router.push("/brand/onboarding");
      } else {
        router.push("/influencer/onboarding/basic-info");
      }
    } catch (err) {
      alert("There was a problem setting your role. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fdf7fa] px-0 py-0">
      {/* Header */}
      <div className="flex items-center px-4 pt-6 pb-2">
        <button
          className="mr-2 text-[#7d6c6c] text-2xl font-bold"
          onClick={() => router.back()}
          aria-label="Back"
        >
          &#8592;
        </button>
        <h1 className="flex-1 text-center text-lg font-semibold text-[#2d2323] tracking-tight">
          PickCreator
        </h1>
        <div className="w-8" />
      </div>
      {/* Main Content */}
      <div className="flex flex-col flex-1 px-4 pt-4 pb-0">
        <h2 className="text-xl font-bold text-[#2d2323] mb-1 mt-2">What are you here to do?</h2>
        <p className="text-[#7d6c6c] text-base mb-6">We'll personalize your PickCreator experience.</p>
        <div className="flex flex-col gap-6">
          {/* Business Card */}
          <button
            className="flex flex-row items-center gap-4 bg-white rounded-2xl shadow-md px-4 py-5 w-full transition hover:shadow-lg focus:outline-none"
            onClick={() => handleRoleSelect("Brand")}
          >
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-[#1976f7]">
              {/* Briefcase SVG Icon */}
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="7" width="18" height="13" rx="3" fill="#fff" />
                <rect x="3" y="7" width="18" height="13" rx="3" stroke="#1976f7" strokeWidth="2" />
                <rect x="8" y="4" width="8" height="5" rx="2" fill="#fff" />
                <rect x="8" y="4" width="8" height="5" rx="2" stroke="#1976f7" strokeWidth="2" />
                <rect x="11" y="13" width="2" height="4" rx="1" fill="#1976f7" />
              </svg>
            </div>
            <div className="flex flex-col items-start text-left">
              <span className="text-xs font-bold text-[#1976f7] tracking-widest mb-1">BUSINESS</span>
              <span className="text-lg font-bold text-[#2d2323] mb-1">I'm a Business</span>
              <span className="text-[#7d6c6c] text-sm">Promote your brand and discover talented influencers to collaborate with.</span>
            </div>
          </button>
          {/* Influencer Card */}
          <button
            className="flex flex-row items-center gap-4 bg-white rounded-2xl shadow-md px-4 py-5 w-full transition hover:shadow-lg focus:outline-none"
            onClick={() => handleRoleSelect("Influencer")}
          >
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-[#ff5ca8]">
              {/* Megaphone SVG Icon */}
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 13V11C3 9.89543 3.89543 9 5 9H7V15H5C3.89543 15 3 14.1046 3 13Z" fill="#fff" />
                <path d="M7 9V15L19 19V5L7 9Z" fill="#fff" stroke="#ff5ca8" strokeWidth="2" />
                <circle cx="17.5" cy="12" r="1.5" fill="#ff5ca8" />
                <rect x="9" y="17" width="3" height="4" rx="1.5" fill="#ff5ca8" />
              </svg>
            </div>
            <div className="flex flex-col items-start text-left">
              <span className="text-xs font-bold text-[#ff5ca8] tracking-widest mb-1">INFLUENCER</span>
              <span className="text-lg font-bold text-[#2d2323] mb-1">I'm an Influencer</span>
              <span className="text-[#7d6c6c] text-sm">Find exciting brand collaborations and grow your influence.</span>
            </div>
          </button>
        </div>
        <div className="flex-1" />
        <div className="text-center text-xs text-[#b7aeb0] font-medium mt-8 mb-4">
          PickCreator will help you find the perfect match.
        </div>
      </div>
    </div>
  );
}
