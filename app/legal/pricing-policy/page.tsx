'use client';
import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, CreditCard, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';

const PricingPolicyPage = () => {
  return (
    <main className="bg-gradient-to-b from-white to-blue-50 min-h-screen pt-24 pb-20">
      {/* Navigation & Header */}
      <div className="container mx-auto max-w-4xl px-4">
        <Link href="/#pricing" className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors mb-6">
          <ArrowLeft size={18} className="mr-2" />
          Back to Homepage
        </Link>

        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-pick-blue to-pick-purple bg-clip-text text-transparent">
            Refund Policy
          </h1>
          

        {/* Pricing Model Section */}
        <section id="pricing-model" className="bg-white rounded-xl shadow-md p-6 md:p-8 mb-8">
          <div className="flex items-start mb-4">
            <CreditCard className="text-pick-blue mr-4 flex-shrink-0 mt-1" size={24} />
            <div>
              <p className="text-gray-700 mb-4">
               
              Approved refund will be credited to original mode of payment in 7 business days
              </p>
          </div>
          </div>

        </section>
      </div>
      </div>
    </main>
  );
};

export default PricingPolicyPage; 