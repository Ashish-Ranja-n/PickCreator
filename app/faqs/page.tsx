'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, HelpCircle, Search, MessageSquare } from 'lucide-react';

interface FAQ {
  _id: string;
  subject: string;
  message: string;
  response: string;
  userType: string;
  faqOrder?: number;
}

export default function FAQsPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [filteredFaqs, setFilteredFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  useEffect(() => {
    const fetchFAQs = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/faqs');
        if (!response.ok) {
          throw new Error('Failed to fetch FAQs');
        }
        
        const data = await response.json();
        setFaqs(data.faqs);
        setFilteredFaqs(data.faqs);
      } catch (err) {
        setError('Error loading FAQs. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFAQs();
  }, []);
  
  useEffect(() => {
    // Filter FAQs based on search term and category
    let filtered = faqs;
    
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        faq => 
          faq.subject.toLowerCase().includes(term) || 
          faq.message.toLowerCase().includes(term) ||
          faq.response.toLowerCase().includes(term)
      );
    }
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(faq => faq.userType === selectedCategory);
    }
    
    setFilteredFaqs(filtered);
  }, [searchTerm, selectedCategory, faqs]);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pick-blue"></div>
      </div>
    );
  }
  
  return (
    <main className="bg-gradient-to-b from-white to-blue-50 min-h-screen pt-24 pb-20">
      <div className="container mx-auto max-w-5xl px-4">
        <Link href="/" className="inline-flex items-center text-pick-blue hover:text-pick-purple mb-8">
          <ArrowLeft size={18} className="mr-2" />
          Back to Homepage
        </Link>
        
        <div className="text-center mb-12">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-pick-blue to-pick-purple bg-clip-text text-transparent"
          >
            Frequently Asked Questions
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-xl text-gray-700 mb-10 max-w-3xl mx-auto"
          >
            Find answers to common questions about PickCreator and how it works.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
          >
            <div className="relative">
              <input
                type="text"
                placeholder="Search FAQs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full sm:w-80 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pick-blue focus:border-transparent"
              />
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            </div>
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pick-blue focus:border-transparent"
            >
              <option value="all">All Categories</option>
              <option value="brand">For Brands</option>
              <option value="influencer">For Influencers</option>
              <option value="agency">For Agencies</option>
              <option value="other">General</option>
            </select>
          </motion.div>
        </div>
        
        {error && (
          <div className="mb-8 p-4 bg-red-50 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        
        {filteredFaqs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <MessageSquare size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-700 mb-2">No FAQs Found</h3>
            <p className="text-gray-600">
              {searchTerm 
                ? `No FAQs match your search for "${searchTerm}".` 
                : 'There are no FAQs in this category yet.'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredFaqs.map((faq, index) => (
              <motion.div
                key={faq._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
                className="bg-white rounded-lg shadow-md overflow-hidden"
              >
                <div className="bg-gradient-to-r from-pick-blue/10 to-pick-purple/10 px-6 py-4">
                  <div className="flex items-center">
                    <HelpCircle className="text-pick-blue mr-3 flex-shrink-0" size={20} />
                    <h3 className="text-lg font-semibold text-gray-800">{faq.subject}</h3>
                  </div>
                  <div className="mt-1 ml-8">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      faq.userType === 'brand' ? 'bg-blue-100 text-blue-800' :
                      faq.userType === 'influencer' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {faq.userType === 'brand' ? 'For Brands' :
                       faq.userType === 'influencer' ? 'For Influencers' :
                       faq.userType === 'agency' ? 'For Agencies' : 'General'}
                    </span>
                  </div>
                </div>
                
                <div className="px-6 py-4">
                  <div className="text-gray-700 mb-4">
                    <p className="whitespace-pre-wrap">{faq.message}</p>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-md font-medium text-gray-900 mb-2">Answer:</h4>
                    <p className="text-gray-700 whitespace-pre-wrap">{faq.response}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
        
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">Still have questions?</p>
          <Link 
            href="/contact" 
            className="inline-flex items-center px-6 py-3 rounded-full bg-pick-blue text-white hover:bg-pick-purple transition-colors"
          >
            Contact Us
            <ArrowLeft size={18} className="ml-2 rotate-180" />
          </Link>
        </div>
      </div>
    </main>
  );
} 