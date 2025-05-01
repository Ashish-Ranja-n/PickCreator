'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link 
            href="/" 
            className="inline-flex items-center text-pick-blue hover:text-pick-purple transition-colors mb-8 group"
          >
            <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to Home
          </Link>
          
          <h1 className="text-4xl font-bold bg-gradient-to-r from-pick-blue to-pick-purple bg-clip-text text-transparent mb-8">
            Terms of Service
          </h1>
          
          <div className="bg-white rounded-lg shadow-sm p-8 space-y-6">
            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Welcome to PickCreator</h2>
              <p className="text-gray-700">
                These Terms of Service govern your use of the PickCreator platform, which connects 
                local businesses with influencers for collaborations. By accessing or using PickCreator, 
                you agree to be bound by these Terms.
              </p>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Use of Services</h2>
              <p className="text-gray-700 mb-4">
                PickCreator provides a platform for businesses and influencers to connect, communicate, 
                and collaborate. Users must:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Be at least 18 years old or the age of legal majority in your jurisdiction</li>
                <li>Create only one account per person or business entity</li>
                <li>Provide accurate, truthful, and complete information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Comply with all applicable laws and regulations</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">User Content</h2>
              <p className="text-gray-700 mb-4">
                You retain all ownership rights to the content you provide through PickCreator. However, 
                by posting content, you grant PickCreator a non-exclusive, worldwide, royalty-free license 
                to use, display, and distribute your content within the platform.
              </p>
              <p className="text-gray-700 mb-4">
                You are responsible for all content you post and must not post content that:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Infringes upon intellectual property rights</li>
                <li>Contains false, misleading, or deceptive information</li>
                <li>Is unlawful, harmful, threatening, abusive, or harassing</li>
                <li>Promotes discrimination or hate speech</li>
                <li>Contains viruses or malicious code</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Collaborations and Transactions</h2>
              <p className="text-gray-700 mb-4">
                PickCreator facilitates connections between brands and influencers but is not a party to any 
                agreements between users. Users are responsible for:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Negotiating and agreeing to the terms of collaborations</li>
                <li>Compliance with applicable laws, including disclosure of sponsored content</li>
                <li>Resolving any disputes between users</li>
                <li>Payment of all applicable taxes and fees</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Prohibited Activities</h2>
              <p className="text-gray-700 mb-4">
                You agree not to:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Use the platform for any illegal purposes</li>
                <li>Impersonate another person or entity</li>
                <li>Harass, threaten, or intimidate other users</li>
                <li>Attempt to access restricted areas of the platform</li>
                <li>Use automated programs or bots to access the platform</li>
                <li>Interfere with the proper functioning of the platform</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Termination</h2>
              <p className="text-gray-700">
                PickCreator reserves the right to suspend or terminate your access to the platform for violations 
                of these Terms, or for any other reason at our discretion. You may also terminate your account at any time.
              </p>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Limitation of Liability</h2>
              <p className="text-gray-700">
                PickCreator is provided "as is" without warranties of any kind. To the maximum extent permitted by law, 
                PickCreator will not be liable for any indirect, incidental, special, consequential, or punitive damages 
                arising out of your use of the platform.
              </p>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Changes to Terms</h2>
              <p className="text-gray-700">
                We may modify these Terms at any time by posting updated Terms on the platform. Your continued use of 
                PickCreator after changes constitutes acceptance of the modified Terms.
              </p>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Governing Law</h2>
              <p className="text-gray-700">
                These Terms shall be governed by and construed in accordance with the laws of India, without regard 
                to its conflict of law provisions.
              </p>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Contact Us</h2>
              <p className="text-gray-700">
                If you have any questions about these Terms, please contact us at legal@pickcreator.com.
              </p>
            </section>
            
            <div className="text-sm text-gray-500 pt-6 border-t border-gray-100">
              Last Updated: 26th March, 2025
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 