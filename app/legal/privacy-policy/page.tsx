'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy() {
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
            Privacy Policy
          </h1>

          <div className="bg-white rounded-lg shadow-sm p-8 space-y-6 max-h-[80vh] overflow-y-auto">
            <p className="text-gray-700 font-semibold">Effective Date: April 9, 2025</p>

            <h2 className="text-2xl font-semibold text-gray-800 mt-6">1. Introduction</h2>
            <p className="text-gray-700">
              Welcome to <strong>PickCreator</strong> (the “App”), available at{' '}
              <a href="https://pickcreator.com" className="text-pick-blue hover:underline">https://pickcreator.com</a>.
              At PickCreator, we value your privacy and are committed to safeguarding your personal data.
              This Privacy Policy explains how we collect, use, share, and protect your information in accordance with applicable data protection laws and in compliance with the Instagram Graph API policies and Facebook Platform Terms.
            </p>
            <p className="text-gray-700">
              By accessing or using our App and services, you agree to the practices described in this Privacy Policy.
            </p>

            <h2 className="text-2xl font-semibold text-gray-800 mt-6">2. Scope of This Policy</h2>
            <p className="text-gray-700">This policy applies to:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Visitors to our website,</li>
              <li>Users of our App, and</li>
              <li>Any individuals or entities whose data is processed in connection with our services.</li>
            </ul>
            <p className="text-gray-700">
              If you do not agree with our policies or practices, please do not use our App.
            </p>

            <h2 className="text-2xl font-semibold text-gray-800 mt-6">3. Information We Collect</h2>
            <p className="text-gray-700">
              We collect various types of information to provide and continually improve our service. The data we gather includes:
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mt-4">3.1. Personal Data Provided by You</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li><strong>Registration Information:</strong> When you sign up, we may ask for your name, email address, username, and other contact details.</li>
              <li><strong>Profile Information:</strong> For users logging in via Instagram or Facebook, we receive data (e.g., profile picture, basic account details) solely for identification and personalization.</li>
              <li><strong>Content Data:</strong> Any content you post, share, or create via the App (for example, creative projects, portfolios, or messages).</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-4">3.2. Automatically Collected Data</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li><strong>Usage Information:</strong> Details about how you use the App, such as pages viewed, interaction logs, and time spent.</li>
              <li><strong>Device Information:</strong> Information about your device, IP address, browser type, and operating system.</li>
              <li><strong>Cookies and Similar Technologies:</strong> We use cookies and similar tracking technologies for session management, analytics, and to enhance user experience. (For more details, please refer to our Cookie Policy if available.)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-4">3.3. Data from Third Parties</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li><strong>Social Media Platforms:</strong> When you choose to use social sign-on (such as Instagram), we may receive personal data from those platforms. This data is used solely to facilitate a streamlined login process and enhance your user experience, in accordance with their respective API policies.</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-800 mt-6">4. How We Use Your Information</h2>
            <p className="text-gray-700">
              PickCreator uses your data for several purposes, including:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li><strong>Providing and Improving Services:</strong> To operate and maintain the App, personalize your experience, and improve our offerings.</li>
              <li><strong>Communication:</strong> To send important updates, respond to inquiries, and communicate about promotional offers (subject to your consent when required).</li>
              <li><strong>Analytics and Research:</strong> To analyze usage patterns and improve functionality.</li>
              <li><strong>Compliance and Security:</strong> To ensure compliance with legal obligations and protect against fraud, misuse, or security incidents.</li>
            </ul>
            <p className="text-gray-700">
              We commit to processing your data following the Instagram Graph API and Facebook Platform policies, ensuring that data is used only as permitted to enhance user functionality and experience.
            </p>

            <h2 className="text-2xl font-semibold text-gray-800 mt-6">5. Data Sharing and Disclosure</h2>
            <p className="text-gray-700">
              We do not sell your personal data. We share your information only in the following circumstances:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li><strong>With Your Consent:</strong> Any disclosure made based on your explicit consent.</li>
              <li><strong>Service Providers:</strong> With third-party vendors and service providers who perform services on our behalf (such as hosting, analytics, or maintenance). These vendors are bound by confidentiality and data protection obligations.</li>
              <li><strong>Compliance with Laws:</strong> When required by law, regulation, legal process, or governmental request.</li>
              <li><strong>Business Transfers:</strong> In connection with any merger, acquisition, sale of company assets, or financing, provided that the receiving party agrees to protect your data in a manner consistent with this Privacy Policy.</li>
              <li><strong>Social Network Integration:</strong> Data received from third parties such as Instagram and Facebook is used only for the stated purposes and in compliance with their policies.</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-800 mt-6">6. Data Retention</h2>
            <p className="text-gray-700">
              We retain your personal data only for as long as necessary to fulfill the purposes described in this Privacy Policy unless a longer retention period is required or permitted by law. Once your data is no longer needed, we will securely delete or anonymize it.
            </p>

            <h2 className="text-2xl font-semibold text-gray-800 mt-6">7. Data Security</h2>
            <p className="text-gray-700">
              We implement a variety of security measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction. These measures include:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li><strong>Access Controls:</strong> Strict access limitations ensure data is accessed only on a need-to-know basis.</li>
              <li><strong>Secure Storage and Backups:</strong> We perform regular data backups and utilize secure storage practices.</li>
            </ul>
            <p className="text-gray-700">
              While we strive to secure your data, no method of electronic storage or transmission over the Internet is 100% secure. If you have any questions about security on our App, please contact us.
            </p>

            <h2 className="text-2xl font-semibold text-gray-800 mt-6">8. International Data Transfers</h2>
            <p className="text-gray-700">
              If you access our App from outside the India, please be aware that your information may be transferred to, stored, and processed in the India and other countries. We ensure that any such transfers comply with applicable laws and that adequate safeguards are in place.
            </p>

            <h2 className="text-2xl font-semibold text-gray-800 mt-6">9. Your Rights and Choices</h2>
            <p className="text-gray-700">
              Depending on your location, you may have the following rights regarding your personal data:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li><strong>Access:</strong> The right to request access to your personal information.</li>
              <li><strong>Correction:</strong> The right to request correction or updating of your personal data.</li>
              <li><strong>Deletion:</strong> The right to request deletion of your personal data.</li>
              <li><strong>Objection or Restriction:</strong> The right to object to, or restrict, the processing of your data.</li>
              <li><strong>Data Portability:</strong> The right to request that your data be provided in a structured, commonly used format.</li>
            </ul>
            <p className="text-gray-700">
              To exercise any of these rights, please contact us using the details provided in Section 12.
            </p>

            <h2 className="text-2xl font-semibold text-gray-800 mt-6">10. Compliance with Instagram Graph API & Facebook Platform Policies</h2>
            <p className="text-gray-700">
              We are fully committed to complying with all applicable Instagram Graph API and Facebook Platform policies. This includes:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li><strong>Data Minimization:</strong> Only collecting data necessary for providing our services.</li>
              <li><strong>User Consent:</strong> Obtaining proper consent when accessing data from social platforms.</li>
              <li><strong>Usage Restrictions:</strong> Using data obtained from Instagram and Facebook solely for permissible purposes.</li>
              <li><strong>Regular Monitoring:</strong> Continually reviewing updates to these policies and adjusting our practices accordingly.</li>
            </ul>
            <p className="text-gray-700">
              Any necessary updates mandated by Instagram or Facebook will be incorporated into this Privacy Policy in a timely manner.
            </p>

            <h2 className="text-2xl font-semibold text-gray-800 mt-6">11. Changes to This Privacy Policy</h2>
            <p className="text-gray-700">
              We may update this Privacy Policy periodically to reflect changes in our practices or legal requirements. When we make changes, we will update the “Effective Date” at the top of this document and, when necessary, notify users via the App or email (where applicable).
            </p>
            <p className="text-gray-700">
              We encourage you to review this Privacy Policy regularly for any updates.
            </p>

            <h2 className="text-2xl font-semibold text-gray-800 mt-6">12. Contact Us</h2>
            <p className="text-gray-700">
              If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us at:
            </p>
            <p className="text-gray-700">
              <strong>Ask us:</strong> <a href="https://pickcreator.com/contact" className="text-pick-blue hover:underline">Contact us.</a><br />
              <strong>Website:</strong> <a href="https://pickcreator.com/legal/privacy-policy" className="text-pick-blue hover:underline">https://pickcreator.com/legal/privacy-policy</a>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
