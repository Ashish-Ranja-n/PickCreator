'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Preloader from '@/components/LandingpageComponents/Preloader';
import Header from '@/components/LandingpageComponents/Header';
import BrandsSection from '@/components/LandingpageComponents/BrandsSection';
import InfluencersSection from '@/components/LandingpageComponents/InfluencersSection';
import PricingSection from '@/components/LandingpageComponents/PricingSection';
import Footer from '@/components/LandingpageComponents/Footer';
import SupportButton from '@/app/components/SupportButton';


export default function Home() {


    const [loading, setLoading] = useState(true);
    const [analytics, setAnalytics] = useState({
      totalBrands: 0,
      verifiedBrands: 0,
      totalInfluencers: 0,
      verifiedInfluencers: 0
    });

  useEffect(() => {
    console.log('Page mounted, loading state:', loading);
    // Add preloader class to body
    if (loading) {
      document.body.classList.add('preloader-active');
    } else {
      document.body.classList.remove('preloader-active');
    }

    return () => {
      console.log('Page unmounting, removing preloader class');
      document.body.classList.remove('preloader-active');
    };
  }, [loading]);

  // Fetch analytics data only after preloader is complete
  useEffect(() => {
    if (!loading) {
      async function fetchAnalytics() {
        try {
          const response = await fetch('/api/analytics');
          if (response.ok) {
            const data = await response.json();
            setAnalytics(data);
          }
        } catch (error) {
          console.error('Error fetching analytics:', error);
        }
      }

      fetchAnalytics();
    }
  }, [loading]);

  const handlePreloaderComplete = () => {
    console.log('Preloader complete callback received');
    try {
      setLoading(false);
    } catch (error) {
      console.error('Error in handlePreloaderComplete:', error);
    }
  };

  // Add stylesheet for gradient animations if it doesn't exist
  useEffect(() => {
    const styleId = 'gradient-animations';
    if (!document.getElementById(styleId) && typeof document !== 'undefined') {
      const styleTag = document.createElement('style');
      styleTag.id = styleId;
      styleTag.innerHTML = `
        @keyframes liquid-flow {
          0% { background-position: 0% 50% }
          50% { background-position: 100% 50% }
          100% { background-position: 0% 50% }
        }

        .animate-liquid-gradient {
          background-size: 400% 100%;
          animation: liquid-flow 6s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
          transition: background-position 0.1s;
        }


      `;
      document.head.appendChild(styleTag);
    }
  }, []);

  return (
    <>
      <Preloader onComplete={handlePreloaderComplete} />

      <AnimatePresence mode="wait">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: loading ? 0 : 1 }}
          transition={{ duration: 0.3 }}
          className={loading ? 'invisible' : 'visible'}
        >
          <Header />

          <main>
            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-b from-slate-50 via-white to-blue-50">
              <div className="container-custom relative z-10">
                <div className="text-center max-w-5xl mx-auto pt-16 sm:pt-20 md:pt-20">
                  <motion.span
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="inline-block bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-600 px-5 py-2 rounded-full text-sm mb-6 sm:mb-8 font-bold tracking-wide"
                  >
                  The Ultimate Platform for Local Businesses & Influencers
                  </motion.span>


                  <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="text-5xl md:text-7xl font-extrabold mb-8 flex flex-wrap justify-center items-baseline"
                  >
                    {/* First part in deep purple */}
                    <span className="text-indigo-900">
                      Connect&nbsp;
                    </span>

                    {/* Animated "With" with liquid-like flowing gradient */}
                    <span className="relative">
                      <span className="bg-[linear-gradient(to_right,#7c3aed,#ec4899,#3b82f6,#8b5cf6,#d946ef,#3b82f6,#7c3aed)] bg-clip-text text-transparent animate-liquid-gradient absolute font-extrabold">
                        With
                      </span>
                      <span className="opacity-0">With&nbsp;</span>
                    </span>

                    {/* "Creators" in black */}
                    <span className="text-purple-900">
                      Creators
                    </span>
                  </motion.h1>

                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="text-xl text-gray-600 font-semibold mb-10 max-w-2xl mx-auto"
                  >
                   Find the right local creators to promote your brand — simple, fast, and effective.
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.45 }}
                    className="mb-8 w-full max-w-2xl mx-auto"
                  >
                    <a href="/sign-up" className="inline-block">
                      <motion.button
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-4 px-10 rounded-full shadow-md transition-all duration-200"
                        whileHover={{ y: -2 }}
                        whileTap={{ y: 1 }}
                      >
                        <span className="flex items-center justify-center">
                          <span className="mr-2 text-lg">Get Started Now</span>
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </span>
                      </motion.button>
                    </a>
                  </motion.div>
                </div>

                {/* Stats Section */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.7 }}
                  className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 max-w-4xl mx-auto mt-8"
                >
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-gray-100">
                    <div className="text-3xl font-bold text-indigo-600 mb-1">{analytics.verifiedBrands}+</div>
                    <div className="text-sm text-gray-600">Verified Brands</div>
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-gray-100">
                    <div className="text-3xl font-bold text-purple-600 mb-1">{analytics.verifiedInfluencers}+</div>
                    <div className="text-sm text-gray-600">Connected Influencers</div>
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-gray-100">
                    <div className="text-3xl font-bold text-pink-600 mb-1">0+</div>
                    <div className="text-sm text-gray-600">Collaborations</div>
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-gray-100">
                    <div className="text-3xl font-bold text-indigo-600 mb-1">1+</div>
                    <div className="text-sm text-gray-600">Cities Covered</div>
                  </div>
                </motion.div>
              </div>

              {/* Background elements */}
              <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
                <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-indigo-200 opacity-20 blur-3xl animate-float"></div>
                <div className="absolute bottom-1/4 right-1/4 w-[700px] h-[700px] rounded-full bg-purple-200 opacity-20 blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-3/4 right-1/3 w-[400px] h-[400px] rounded-full bg-pink-200 opacity-15 blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
              </div>
            </section>

            <BrandsSection />
            <InfluencersSection />
            <PricingSection />
          </main>

          <Footer />
          <SupportButton />
        </motion.div>
      </AnimatePresence>
    </>
  );
}
