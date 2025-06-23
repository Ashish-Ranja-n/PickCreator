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
    <div className="min-h-screen flex flex-col items-center justify-start bg-[#fff6f9] px-4 py-0">
      {/* Top Row: Pickcreator and Help Icon */}
      <div className="w-full max-w-xl flex items-center justify-between px-4 pt-6 pb-2">
        <div className="w-8" />
        <span className="font-semibold text-[#2d2323] text-base text-center flex-1">
          Pickcreator
        </span>
        <button
          className="w-8 h-8 flex items-center justify-center rounded-full border border-[#e0e0e0] bg-white hover:bg-[#f3f3f3] transition"
          aria-label="Help"
        >
          <svg
            width="18"
            height="18"
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
      <h1 className="mb-2 text-2xl font-extrabold text-[#2d2323] text-center tracking-tight">
        Welcome to Pickcreator
      </h1>
      {/* Subheader: Who are you? */}
      <div className="w-full max-w-xs">
        <h2 className="mb-6 text-xl font-bold text-[#c03a5b] text-center">
          Who are you?
        </h2>
      </div>
      {/* Role Cards */}
      <div className="w-full max-w-xs flex flex-col gap-6">
        {/* Business Card */}
        <button
          className="flex flex-row items-center gap-4 bg-[#eaf2ff] rounded-2xl px-4 py-6 w-full shadow-md transition-all duration-150 active:scale-95 hover:shadow-lg focus:outline-none border-2 border-transparent hover:border-[#1976f7]"
          onClick={() => handleRoleSelect("Brand")}
          style={{
            boxShadow: "0 4px 16px 0 rgba(25, 118, 247, 0.08)",
          }}
        >
          <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-white">
            {/* Storefront Icon */}
            <svg
              width="36"
              height="36"
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
            <span className="text-lg font-bold text-[#1976f7] mb-1">
              Business
            </span>
            <span className="text-sm text-[#1976f7] font-medium">
              Promote your brand
            </span>
          </div>
        </button>
        {/* Influencer Card */}
        <button
          className="flex flex-row items-center gap-4 bg-[#ffe3ef] rounded-2xl px-4 py-6 w-full shadow-md transition-all duration-150 active:scale-95 hover:shadow-lg focus:outline-none border-2 border-transparent hover:border-[#ff5ca8]"
          onClick={() => handleRoleSelect("Influencer")}
          style={{
            boxShadow: "0 4px 16px 0 rgba(255, 92, 168, 0.08)",
          }}
        >
          <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-white">
            {/* Person Icon */}
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="12" cy="9" r="4" fill="#ff5ca8" />
              <rect x="6" y="15" width="12" height="6" rx="3" fill="#ff5ca8" />
            </svg>
          </div>
          <div className="flex flex-col items-start text-left">
            <span className="text-lg font-bold text-[#ff5ca8] mb-1">
              Influencer
            </span>
            <span className="text-sm text-[#ff5ca8] font-medium">
              Work with brands
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}
