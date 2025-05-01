'use client';
import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { MessageCircle, Shield, MapPin, ArrowRight, Instagram } from 'lucide-react';

const AboutPage = () => {
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
            About PickCreator
          </motion.span>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-pick-blue to-pick-purple bg-clip-text text-transparent"
          >
            Connecting Local Brands with Instagram Influencers
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-xl text-gray-700 mb-10 max-w-3xl mx-auto"
          >
            PickCreator is a platform that bridges the gap between brands and Instagram influencers, 
            making collaborations seamless and secure. We focus on connecting local influencers (5K–1M followers) 
            with businesses looking for authentic promotions.
          </motion.p>
        </div>

        {/* How It Works Section */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="bg-white rounded-3xl shadow-xl p-8 mb-16"
        >
          <h2 className="text-3xl font-bold mb-8 text-center">How It Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <MapPin className="text-pick-blue" size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">Discover Locally</h3>
              <p className="text-gray-700">
                Find influencers or brands in your city through our location-based search system.
                No more searching through hashtags or dealing with out-of-town partnerships.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="text-pick-purple" size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">Connect Directly</h3>
              <p className="text-gray-700">
                Our built-in messaging system lets you discuss collaboration details privately without 
                sharing personal contact information until you're ready.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-blue-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Shield className="text-pick-blue" size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">Secure Transactions</h3>
              <p className="text-gray-700">
                Our escrow payment system protects both parties: brands only pay for approved content, 
                and influencers are guaranteed payment for their work.
              </p>
            </div>
          </div>
        </motion.section>
        
        {/* Why PickCreator Section */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold mb-8 text-center">Why PickCreator?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-start mb-4">
                <div className="bg-blue-50 rounded-lg p-3 mr-4">
                  <Instagram className="text-pick-blue" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">No Instagram ID Sharing</h3>
                  <p className="text-gray-700">
                    Your privacy matters. Connect with potential partners without sharing personal 
                    contact details until you're ready to collaborate.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-start mb-4">
                <div className="bg-blue-50 rounded-lg p-3 mr-4">
                  <Shield className="text-pick-blue" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Escrow Payment System</h3>
                  <p className="text-gray-700">
                    Our secure payment system holds funds until content is approved, 
                    protecting both brands and influencers throughout the collaboration.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-start mb-4">
                <div className="bg-blue-50 rounded-lg p-3 mr-4">
                  <MapPin className="text-pick-blue" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">City-Based Discovery</h3>
                  <p className="text-gray-700">
                    Find partners in your local area for in-person events, store visits, and authentic 
                    local promotion that resonates with nearby audiences.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-start mb-4">
                <div className="bg-blue-50 rounded-lg p-3 mr-4">
                  <MessageCircle className="text-pick-blue" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Dedicated Tools</h3>
                  <p className="text-gray-700">
                    Custom profile management, content delivery systems, and campaign tracking 
                    tools designed specifically for influencer marketing.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.section>
        
        {/* Mission & Vision Section */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6 }}
          className="bg-gradient-to-r from-pick-blue to-pick-purple rounded-3xl p-8 mb-16 text-white"
        >
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">Our Mission & Vision</h2>
            <p className="text-xl mb-6">
              We believe in giving local influencers fair opportunities while helping brands 
              find the right voices to promote their products effectively.
            </p>
            <p className="text-lg">
              PickCreator was born from the realization that local businesses struggle to connect 
              with relevant influencers, while influencers lack tools to find genuine collaboration 
              opportunities in their area. Our vision is to create an ecosystem where local influencers 
              and businesses thrive together through authentic partnerships.
            </p>
          </div>
        </motion.section>
        
        {/* Call to Action */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.7 }}
          className="bg-white rounded-3xl shadow-xl p-8 text-center"
        >
          <h2 className="text-3xl font-bold mb-6">Ready to Start Collaborating?</h2>
          <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
            Join PickCreator today and discover the perfect local partnerships for your brand or 
            influencer career. It takes just minutes to create your profile.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/brand/signup">
              <button className="px-8 py-4 rounded-full bg-pick-blue text-white font-medium shadow-lg shadow-blue-300/30 hover:shadow-blue-300/50 transition-all duration-300 flex items-center">
                For Businesses
                <ArrowRight size={18} className="ml-2" />
              </button>
            </Link>
            
            <Link href="/influencer/signup">
              <button className="px-8 py-4 rounded-full bg-white text-pick-purple border-2 border-pick-purple font-medium hover:bg-pick-purple/5 transition-all duration-300 flex items-center">
                For Influencers
                <ArrowRight size={18} className="ml-2" />
              </button>
            </Link>
          </div>
        </motion.section>
      </div>
    </main>
  );
};

export default AboutPage; 