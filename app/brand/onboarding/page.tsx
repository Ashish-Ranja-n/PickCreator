'use client';
import React, { useState } from "react";
import { INDIAN_CITIES } from "../../influencer/onboarding/data/indianCities";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Alert, AlertDescription } from "@/components/ui/alert";

const BUSINESS_TYPES = [
  { value: "shop", label: "Shop" },
  { value: "website/app", label: "Website/app" },
  { value: "Mall / Store", label: "Mall / Store" },
  { value: "Ecommerce", label: "Ecommerce" },
  { value: "company", label: "Company" },
  { value: "other", label: "Other" },
];

export default function BrandOnboarding() {
  const [form, setForm] = useState({
    businessType: "",
    businessName: "",
    location: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [openCity, setOpenCity] = useState(false);
  const [openBusinessType, setOpenBusinessType] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    <div className="max-w-md mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Brand Onboarding</h2>
          <p className="text-gray-600">Tell us about your business</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block mb-2 font-medium text-gray-700">Type of Business</label>
            <Popover open={openBusinessType} onOpenChange={setOpenBusinessType}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  type="button"
                  className={cn(
                    "w-full justify-between h-12 px-4",
                    "bg-background border-2",
                    !form.businessType && "text-muted-foreground"
                  )}
                >
                  {form.businessType ? BUSINESS_TYPES.find(type => type.value === form.businessType)?.label : "Select business type"}
                  <ChevronsUpDown className="ml-2 h-5 w-5 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <div className="max-h-[300px] overflow-auto">
                  {BUSINESS_TYPES.map((type) => (
                    <div
                      key={type.value}
                      className={cn(
                        "relative flex cursor-pointer select-none items-center px-4 py-3 text-base",
                        "hover:bg-accent/5",
                        "border-b border-input/10",
                        form.businessType === type.value && "bg-accent/5 font-medium"
                      )}
                      onClick={() => {
                        setForm({ ...form, businessType: type.value });
                        setOpenBusinessType(false);
                      }}
                    >
                      {type.label}
                      {form.businessType === type.value && (
                        <Check className="ml-auto h-5 w-5 text-primary" />
                      )}
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <label className="block mb-2 font-medium text-gray-700">Name of the Business</label>
            <input
              type="text"
              name="businessName"
              value={form.businessName}
              onChange={handleChange}
              required
              className="w-full h-12 px-4 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Enter business name"
            />
          </div>

          <div>
            <label className="block mb-2 font-medium text-gray-700">Location (City)</label>
            <Popover open={openCity} onOpenChange={setOpenCity}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  type="button"
                  className={cn(
                    "w-full justify-between h-12 px-4",
                    "bg-background border-2",
                    !form.location && "text-muted-foreground"
                  )}
                >
                  {form.location || "Select your city"}
                  <ChevronsUpDown className="ml-2 h-5 w-5 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <div className="sticky top-0 bg-white p-2 rounded-t-md">
                  <div className="relative">
                    <input
                      className="flex h-12 w-full rounded-lg border-2 border-input bg-background px-4 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      placeholder="Type to search cities..."
                      onChange={(e) => {
                        const list = document.querySelector('.cities-list');
                        const items = list?.querySelectorAll('.city-item');
                        const search = e.target.value.toLowerCase();
                        
                        items?.forEach((item) => {
                          const text = item.textContent?.toLowerCase() || '';
                          item.classList.toggle('hidden', !text.includes(search));
                        });
                      }}
                    />
                  </div>
                </div>
                <div className="cities-list max-h-[300px] overflow-auto">
                  {INDIAN_CITIES.map((city) => (
                    <div
                      key={city}
                      className={cn(
                        "city-item relative flex cursor-pointer select-none items-center px-4 py-3 text-base",
                        "hover:bg-accent/5",
                        "border-b border-input/10",
                        form.location === city && "bg-accent/5 font-medium"
                      )}
                      onClick={() => {
                        setForm({ ...form, location: city });
                        setOpenCity(false);
                      }}
                    >
                      {city}
                      {form.location === city && (
                        <Check className="ml-auto h-5 w-5 text-primary" />
                      )}
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            <p className="mt-1 text-sm text-gray-500">Your location helps connect with local influencers</p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert>
              <AlertDescription className="text-green-600">{success}</AlertDescription>
            </Alert>
          )}

          <button
            type="submit"
            className={cn(
              "w-full bg-blue-600 text-white py-3 rounded-lg font-medium",
              "hover:bg-blue-700 transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
              loading && "opacity-50 cursor-not-allowed"
            )}
            disabled={loading}
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </form>
      </div>
    </div>
  );
}
