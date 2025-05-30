'use client';
import React, { useState } from "react";
import { INDIAN_CITIES } from "../../influencer/onboarding/data/indianCities";

const BUSINESS_TYPES = [
  { value: "shop", label: "Shop" },
  { value: "company", label: "Company" },
  { value: "website", label: "Website" },
  { value: "app", label: "App" },
  { value: "other", label: "Other" },
];

export default function BrandOnboarding() {
  const [form, setForm] = useState({
    businessType: "",
    businessName: "",
    location: "",
    mobile: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/brand/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessType: form.businessType,
          businessName: form.businessName,
          location: form.location,
          mobile: form.mobile,
        }),
      });
      if (!res.ok) throw new Error("Failed to save data");
      setSuccess("Business information saved successfully!");
      // Redirect to /brand after successful onboarding
      window.location.href = "/brand";
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Brand Onboarding</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">Type of Business</label>
          <select
            name="businessType"
            value={form.businessType}
            onChange={handleChange}
            required
            className="w-full border rounded px-3 py-2"
          >
            <option value="">Select type</option>
            {BUSINESS_TYPES.map((type) => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-1 font-medium">Name of the Business</label>
          <input
            type="text"
            name="businessName"
            value={form.businessName}
            onChange={handleChange}
            required
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Location (City)</label>
          <select
            name="location"
            value={form.location}
            onChange={handleChange}
            required
            className="w-full border rounded px-3 py-2"
          >
            <option value="">Select city</option>
            {INDIAN_CITIES.map((city: string) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-1 font-medium">Mobile Number</label>
          <input
            type="tel"
            name="mobile"
            value={form.mobile}
            onChange={handleChange}
            required
            pattern="[0-9]{10}"
            className="w-full border rounded px-3 py-2"
          />
          <span className="text-xs text-gray-500">This number is used to verify the business</span>
        </div>
        {error && <div className="text-red-600">{error}</div>}
        {success && <div className="text-green-600">{success}</div>}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Saving..." : "Save"}
        </button>
      </form>
    </div>
  );
}
