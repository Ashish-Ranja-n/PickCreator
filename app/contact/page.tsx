'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, ArrowRight, CheckCircle } from 'lucide-react';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'General Inquiry',
    message: '',
    userType: 'brand' // Default selection
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit the form. Please try again later.');
      }
      
      setSubmitted(true);
      setFormData({
        name: '',
        email: '',
        subject: 'General Inquiry',
        message: '',
        userType: 'brand'
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="bg-gradient-to-b from-white to-blue-50 min-h-screen pt-24 pb-20">
      <div className="container mx-auto max-w-5xl px-4">
        {/* Header Section */}
        <div className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="inline-block bg-gradient-to-r from-pick-blue/10 to-pick-purple/10 text-pick-blue font-medium px-4 py-1.5 rounded-full text-sm mb-4"
          >
            Contact Us
          </motion.span>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-pick-blue to-pick-purple bg-clip-text text-transparent"
          >
            Get in Touch
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-xl text-gray-700 mb-10 max-w-3xl mx-auto"
          >
            Have questions about PickCreator? We're here to help! Fill out the form below, 
            and our team will get back to you as soon as possible.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="lg:col-span-2 bg-white rounded-3xl shadow-xl p-8"
          >
            <h2 className="text-2xl font-bold mb-6">Send Us a Message</h2>
            
            {submitted ? (
              <div className="text-center py-8">
                <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2">Thank You!</h3>
                <p className="text-gray-700 mb-6">
                  Your message has been sent successfully. We'll get back to you shortly.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="px-6 py-2 rounded-full bg-pick-blue text-white font-medium hover:shadow-lg transition-all duration-300"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pick-blue focus:border-transparent outline-none transition-all"
                      placeholder="Enter your name"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pick-blue focus:border-transparent outline-none transition-all"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                      Subject *
                    </label>
                    <select
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pick-blue focus:border-transparent outline-none transition-all"
                    >
                      <option value="General Inquiry">General Inquiry</option>
                      <option value="Technical Support">Technical Support</option>
                      <option value="Billing Question">Billing Question</option>
                      <option value="Partnership Opportunity">Partnership Opportunity</option>
                      <option value="Feature Request">Feature Request</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="userType" className="block text-sm font-medium text-gray-700 mb-1">
                      I am a *
                    </label>
                    <select
                      id="userType"
                      name="userType"
                      value={formData.userType}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pick-blue focus:border-transparent outline-none transition-all"
                    >
                      <option value="brand">Brand/Business</option>
                      <option value="influencer">Influencer</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                
                <div className="mb-6">
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                    Your Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pick-blue focus:border-transparent outline-none transition-all"
                    placeholder="What would you like to ask or tell us?"
                  ></textarea>
                </div>
                
                {error && (
                  <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg">
                    {error}
                  </div>
                )}
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-8 py-3 rounded-full bg-pick-blue text-white font-medium hover:shadow-lg transition-all duration-300 flex items-center ${
                    isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                  {!isSubmitting && <ArrowRight size={18} className="ml-2" />}
                </button>
              </form>
            )}
          </motion.div>
          
          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="bg-gradient-to-br from-pick-blue to-pick-purple rounded-3xl p-8 text-white"
          >
            <h2 className="text-2xl font-bold mb-6">Contact Information</h2>
            
            <div className="space-y-6">
              <div className="flex items-start">
                <Mail className="mr-4 flex-shrink-0 mt-1" size={20} />
                <div>
                  <h3 className="font-semibold mb-1">Email Us</h3>
                  <p className="opacity-90 mb-1 mt-2">Support:</p>
                  <a href="mailto:support@pickcreator.com" className="block hover:underline">
                    support@pickcreator.com
                  </a>
                </div>
              </div>
              
              <div className="flex items-start">
                <Phone className="mr-4 flex-shrink-0 mt-1" size={20} />
                <div>
                  <h3 className="font-semibold mb-1">Call Us</h3>
                  <p>Monday - Saturday, 9am - 5pm</p>
                  <a href="tel:+11234567890" className="block hover:underline">
                    +91 xxxxxxxxxx
                  </a>
                </div>
              </div>
              
              <div className="flex items-start">
                <MapPin className="mr-4 flex-shrink-0 mt-1" size={20} />
                <div>
                  <h3 className="font-semibold mb-1">Location</h3>
                  <p>
                   Sitamarhi, Bihar, India
                  </p>
                </div>
              </div>
            </div>
            
          </motion.div>
        </div>
        
        {/* FAQ Section */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6 }}
          className="bg-white rounded-3xl shadow-xl p-8 mb-16"
        >
          <h2 className="text-2xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-3">How quickly will I receive a response?</h3>
              <p className="text-gray-700">
                We aim to respond to all inquiries within 24-48 business hours. For urgent matters, 
                please indicate so in your message subject.
              </p>
            </div>
            
            <div>
              <h3 className="text-xl font-bold mb-3">How can I report a technical issue?</h3>
              <p className="text-gray-700">
                Please select "Technical Support" from the subject dropdown and provide details 
                about the issue, including any error messages and steps to reproduce the problem.
              </p>
            </div>
            
            <div>
              <h3 className="text-xl font-bold mb-3">I'm interested in partnering with PickCreator</h3>
              <p className="text-gray-700">
                For partnership inquiries, select "Partnership Opportunity" from the subject dropdown. 
                Our partnerships team will reach out to discuss potential collaboration opportunities.
              </p>
            </div>
            
            <div>
              <h3 className="text-xl font-bold mb-3">Where can I find help with using the platform?</h3>
              <p className="text-gray-700">
                Check out our <Link href="/help" className="text-pick-blue hover:underline">Help Center</Link> for 
                guides and tutorials. If you can't find what you're looking for, feel free to contact us.
              </p>
            </div>
          </div>
        </motion.section>
        
        {/* What Happens Next */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.7 }}
          className="bg-gradient-to-r from-pick-blue/10 to-pick-purple/10 rounded-3xl p-8"
        >
          <h2 className="text-2xl font-bold mb-6 text-center">What Happens Next?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-pick-blue text-white flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                1
              </div>
              <h3 className="font-bold mb-2">We Receive Your Message</h3>
              <p className="text-gray-700">
                Your inquiry is logged in our system and assigned to the appropriate team member.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-pick-blue text-white flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2
              </div>
              <h3 className="font-bold mb-2">We Review & Respond</h3>
              <p className="text-gray-700">
                Our team reviews your message and prepares a thoughtful response to address your needs.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-pick-blue text-white flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                3
              </div>
              <h3 className="font-bold mb-2">Resolution & Follow-up</h3>
              <p className="text-gray-700">
                We work with you to ensure your question is answered or issue is resolved satisfactorily.
              </p>
            </div>
          </div>
        </motion.section>
      </div>
    </main>
  );
};

export default ContactPage; 