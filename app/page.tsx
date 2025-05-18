'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Preloader from '@/components/LandingpageComponents/Preloader';
import Header from '@/components/LandingpageComponents/Header';
import BrandsSection from '@/components/LandingpageComponents/BrandsSection';
import InfluencersSection from '@/components/LandingpageComponents/InfluencersSection';
import PricingSection from '@/components/LandingpageComponents/PricingSection';
import Footer from '@/components/LandingpageComponents/Footer';


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

  // Add stylesheet for gradient and floating animations if it doesn't exist
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

        @keyframes float {
          0% { transform: translateY(0px) translateX(0px); }
          25% { transform: translateY(-10px) translateX(5px); }
          50% { transform: translateY(0px) translateX(10px); }
          75% { transform: translateY(10px) translateX(5px); }
          100% { transform: translateY(0px) translateX(0px); }
        }

        .animate-float {
          animation: float 15s ease-in-out infinite;
        }

        @keyframes pulse-glow {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.2; }
        }

        .animate-pulse-glow {
          animation: pulse-glow 8s ease-in-out infinite;
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
            <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-b from-indigo-50 via-white to-purple-50">
              <div className="container-custom relative z-10">
                <div className="text-center max-w-5xl mx-auto pt-16 sm:pt-20 md:pt-24">
                  <motion.span
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="inline-block bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-600 px-5 py-2 rounded-full text-sm mb-6 sm:mb-8 font-bold tracking-wide"
                  >
                    Elevate Your Influence, Amplify Your Reach
                  </motion.span>

                  <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="text-5xl md:text-7xl font-extrabold mb-8 flex flex-wrap justify-center items-baseline"
                  >
                    {/* "where" in small text */}
                    <span className="text-indigo-700 text-2xl md:text-3xl mr-2 font-medium">
                      where
                    </span>

                    {/* "influencer" with gradient */}
                    <span className="relative">
                      <span className="bg-[linear-gradient(to_right,#7c3aed,#ec4899,#8b5cf6,#d946ef)] bg-clip-text text-transparent animate-liquid-gradient absolute font-extrabold">
                        influencer
                      </span>
                      <span className="opacity-0">influencer&nbsp;</span>
                    </span>

                    {/* "meets" in purple */}
                    <span className="text-indigo-900 mx-2">
                      meets
                    </span>

                    {/* "brand" in bold purple */}
                    <span className="text-purple-700">
                      brand
                    </span>
                  </motion.h1>

                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="text-xl text-gray-600 font-medium mb-10 max-w-2xl mx-auto px-4"
                  >
                    Transform your social media presence into a thriving business. Connect with local brands seeking authentic voices like yours.
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.45 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 w-full max-w-2xl mx-auto px-4"
                  >
                    <a href="/sign-up?type=influencer" className="w-full sm:w-auto">
                      <motion.button
                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium py-4 px-8 rounded-full shadow-lg transition-all duration-200"
                        whileHover={{ y: -2, boxShadow: "0 10px 25px -5px rgba(124, 58, 237, 0.5)" }}
                        whileTap={{ y: 1 }}
                      >
                        <span className="flex items-center justify-center">
                          <span className="mr-2 text-lg">Join as Influencer</span>
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </span>
                      </motion.button>
                    </a>
                    <a href="/sign-up?type=brand" className="w-full sm:w-auto">
                      <motion.button
                        className="w-full bg-white border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 font-medium py-4 px-8 rounded-full shadow-md transition-all duration-200"
                        whileHover={{ y: -2 }}
                        whileTap={{ y: 1 }}
                      >
                        <span className="flex items-center justify-center">
                          <span className="mr-2 text-lg">I'm a Brand</span>
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </span>
                      </motion.button>
                    </a>
                  </motion.div>
                </div>

                {/* Platform Stats Section */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.7 }}
                  className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 max-w-5xl mx-auto mt-4 px-4"
                >
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 shadow-xl border border-indigo-100">
                    <div className="text-3xl font-bold text-indigo-600 mb-1">{analytics.verifiedBrands}+</div>
                    <div className="text-sm text-gray-600 font-medium">Active Brands</div>
                  </div>
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 shadow-xl border border-purple-100">
                    <div className="text-3xl font-bold text-purple-600 mb-1">{analytics.verifiedInfluencers}+</div>
                    <div className="text-sm text-gray-600 font-medium">Creators Earning</div>
                  </div>
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 shadow-xl border border-pink-100">
                    <div className="text-3xl font-bold text-pink-600 mb-1">₹10K+</div>
                    <div className="text-sm text-gray-600 font-medium">Avg. Monthly Income</div>
                  </div>
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 shadow-xl border border-indigo-100">
                    <div className="text-3xl font-bold text-indigo-600 mb-1">100%</div>
                    <div className="text-sm text-gray-600 font-medium">Payment Success</div>
                  </div>
                </motion.div>

                {/* Featured Creators */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.9 }}
                  className="mt-16 mb-10 text-center"
                >
                  <p className="text-sm font-medium text-indigo-600 mb-2">CREATORS THRIVING ON OUR PLATFORM</p>
                  <div className="flex justify-center items-center space-x-3 md:space-x-5 mt-4">
                    <a href="/influencer/profile/1" className="block">
                      <img
                        src="https://images.unsplash.com/photo-1747264466429-c868c612bfea?q=80&w=772&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                        alt="Creator 1"
                        className="w-12 h-12 md:w-14 md:h-14 rounded-full object-cover border-2 border-white shadow-md hover:scale-110 transition-transform duration-200"
                      />
                    </a>
                    <a href="/influencer/profile/2" className="block">
                      <img
                        src="https://images.unsplash.com/photo-1738079264549-50006a1826ca?q=80&w=735&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                        alt="Creator 2"
                        className="w-12 h-12 md:w-14 md:h-14 rounded-full object-cover border-2 border-white shadow-md hover:scale-110 transition-transform duration-200"
                      />
                    </a>
                    <a href="/influencer/profile/3" className="block">
                      <img
                        src="https://images.unsplash.com/photo-1664636404761-d3aa86169911?q=80&w=387&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                        alt="Creator 3"
                        className="w-12 h-12 md:w-14 md:h-14 rounded-full object-cover border-2 border-white shadow-md hover:scale-110 transition-transform duration-200"
                      />
                    </a>
                    <a href="/influencer/profile/4" className="block">
                      <img
                        src="https://images.unsplash.com/photo-1624610806209-82a4cbb4339a?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                        alt="Creator 4"
                        className="w-12 h-12 md:w-14 md:h-14 rounded-full object-cover border-2 border-white shadow-md hover:scale-110 transition-transform duration-200"
                      />
                    </a>
                  </div>
                </motion.div>
              </div>

              {/* Enhanced Background elements */}
              <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
                <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-gradient-to-r from-indigo-300 to-indigo-200 opacity-15 blur-3xl animate-float animate-pulse-glow"></div>
                <div className="absolute bottom-1/4 right-1/4 w-[700px] h-[700px] rounded-full bg-gradient-to-r from-purple-300 to-purple-200 opacity-15 blur-3xl animate-float animate-pulse-glow" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-3/4 right-1/3 w-[400px] h-[400px] rounded-full bg-gradient-to-r from-pink-300 to-pink-200 opacity-10 blur-3xl animate-float animate-pulse-glow" style={{ animationDelay: '2s' }}></div>
                <div className="absolute bottom-1/3 left-1/3 w-[300px] h-[300px] rounded-full bg-gradient-to-r from-blue-300 to-blue-200 opacity-10 blur-3xl animate-float animate-pulse-glow" style={{ animationDelay: '3s' }}></div>
                <div className="absolute top-1/2 right-1/2 w-[250px] h-[250px] rounded-full bg-gradient-to-r from-teal-300 to-teal-200 opacity-10 blur-3xl animate-float animate-pulse-glow" style={{ animationDelay: '4s' }}></div>
              </div>
            </section>

            {/* Why Choose Us Section */}
            <section className="py-20 bg-gradient-to-b from-white to-indigo-50 relative overflow-hidden">
              <div className="container-custom relative z-10">
                <div className="text-center mb-16">
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    viewport={{ once: true }}
                    className="inline-block bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-600 font-medium px-5 py-2 rounded-full text-sm mb-6 tracking-wide"
                  >
                    DESIGNED FOR CREATOR SUCCESS
                  </motion.div>

                  <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    viewport={{ once: true }}
                    className="text-3xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-700 bg-clip-text text-transparent"
                  >
                    Why Influencers Choose PickCreator
                  </motion.h2>

                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    viewport={{ once: true }}
                    className="text-lg text-gray-600 max-w-3xl mx-auto px-4"
                  >
                    Our platform is designed to help you monetize your influence and build lasting relationships with brands that value your unique voice.
                  </motion.p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    viewport={{ once: true }}
                    className="bg-white p-8 rounded-2xl shadow-xl border border-indigo-50 hover:shadow-2xl hover:border-indigo-100 transition-all duration-300"
                  >
                    <div className="w-16 h-16 rounded-2xl overflow-hidden mb-6 shadow-lg">
                      <img
                        src="https://images.unsplash.com/photo-1580048915913-4f8f5cb481c4?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=256&q=80"
                        alt="Direct Payments"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h3 className="text-2xl font-bold mb-3 text-gray-900">Direct Payments</h3>
                    <p className="text-gray-600 leading-relaxed">Get paid directly for your content without middlemen taking large cuts. Keep more of what you earn with our transparent payment system.</p>
                    <div className="mt-6 text-indigo-600 font-medium flex items-center">
                      <span>Learn more</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    viewport={{ once: true }}
                    className="bg-white p-8 rounded-2xl shadow-xl border border-purple-50 hover:shadow-2xl hover:border-purple-100 transition-all duration-300"
                  >
                    <div className="w-16 h-16 rounded-2xl overflow-hidden mb-6 shadow-lg">
                      <img
                        src="https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=256&q=80"
                        alt="Local Connections"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h3 className="text-2xl font-bold mb-3 text-gray-900">Local Connections</h3>
                    <p className="text-gray-600 leading-relaxed">Connect with brands in your city for authentic partnerships that resonate with your local audience and create meaningful impact.</p>
                    <div className="mt-6 text-purple-600 font-medium flex items-center">
                      <span>Learn more</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    viewport={{ once: true }}
                    className="bg-white p-8 rounded-2xl shadow-xl border border-pink-50 hover:shadow-2xl hover:border-pink-100 transition-all duration-300"
                  >
                    <div className="w-16 h-16 rounded-2xl overflow-hidden mb-6 shadow-lg">
                      <img
                        src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=256&q=80"
                        alt="Growth Analytics"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h3 className="text-2xl font-bold mb-3 text-gray-900">Growth Analytics</h3>
                    <p className="text-gray-600 leading-relaxed">Track your performance and growth with our advanced analytics tools designed specifically for creators to optimize your content strategy.</p>
                    <div className="mt-6 text-pink-600 font-medium flex items-center">
                      <span>Learn more</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </motion.div>
                </div>

                {/* Success Story */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                  viewport={{ once: true }}
                  className="mt-16 max-w-6xl mx-auto overflow-hidden"
                >
                  {/* Modern Image Slider Title */}
                  <div className="text-center mb-8">
                    <h3 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
                      Our Creator Showcase
                    </h3>
                    <p className="text-gray-600 mt-2 max-w-2xl mx-auto">
                      See how influencers are transforming their content into successful brand partnerships
                    </p>
                  </div>

                  {/* Image Slider Container */}
                  <div className="relative w-full h-[350px] md:h-[450px] overflow-hidden rounded-2xl bg-gradient-to-b from-gray-50/80 to-white/90 dark:from-gray-900/80 dark:to-black/90 shadow-xl border border-gray-100/50 dark:border-gray-800/50">
                    {/* Subtle overlay for depth */}
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-transparent to-purple-500/5"></div>

                    {/* This div will contain the sliding images */}
                    <div
                      className="absolute flex items-center gap-6 animate-slider-rtl md:animate-slider-rtl-md py-12"
                      style={{
                        width: "max-content", // Allow container to grow with images
                      }}
                    >
                      {/* Placeholder for images - these will be replaced with actual images */}
                      {/* First set of images */}
                      <div className="h-[350px] md:h-[280px] w-[280px] md:w-[350px] rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group">
                        <img
                          src="https://images.unsplash.com/photo-1742038107108-3bdda21485d2?q=80&w=1287&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                          alt="Description"
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      </div>
                      <div className="h-[350px] md:h-[280px] w-[280px] md:w-[350px] rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group">
                        <img
                          src="https://images.unsplash.com/photo-1691654640333-22335256a8e6?q=80&w=930&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                          alt="Description"
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      </div>
                     <div className="h-[350px] md:h-[280px] w-[280px] md:w-[350px] rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group">
                        <img
                          src="https://images.unsplash.com/photo-1634818117911-9ea12e10f61c?q=80&w=4740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                          alt="Description"
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      </div>
                      <div className="h-[350px] md:h-[280px] w-[280px] md:w-[350px] rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group">
                        <img
                          src="https://plus.unsplash.com/premium_photo-1734603747416-37a691f28482?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                          alt="Description"
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      </div>
                      <div className="h-[350px] md:h-[280px] w-[280px] md:w-[350px] rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group">
                        <img
                          src="https://images.unsplash.com/photo-1664636404761-d3aa86169911?q=80&w=1287&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                          alt="Description"
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      </div>

                      {/* Duplicate images to create seamless loop */}
                      <div className="h-[350px] md:h-[280px] w-[280px] md:w-[350px] rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group">
                        <img
                          src="https://images.unsplash.com/photo-1742038107108-3bdda21485d2?q=80&w=1287&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                          alt="Description"
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      </div>
                      <div className="h-[350px] md:h-[280px] w-[280px] md:w-[350px] rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group">
                        <img
                          src="https://images.unsplash.com/photo-1691654640333-22335256a8e6?q=80&w=930&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                          alt="Description"
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      </div>
                     <div className="h-[350px] md:h-[280px] w-[280px] md:w-[350px] rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group">
                        <img
                          src="https://images.unsplash.com/photo-1634818117911-9ea12e10f61c?q=80&w=4740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                          alt="Description"
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      </div>
                      <div className="h-[350px] md:h-[280px] w-[280px] md:w-[350px] rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group">
                        <img
                          src="https://plus.unsplash.com/premium_photo-1734603747416-37a691f28482?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                          alt="Description"
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      </div>
                      <div className="h-[350px] md:h-[280px] w-[280px] md:w-[350px] rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group">
                        <img
                          src="https://images.unsplash.com/photo-1664636404761-d3aa86169911?q=80&w=1287&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                          alt="Description"
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Background decorative elements */}
              <div className="absolute top-20 right-0 w-64 h-64 rounded-full bg-indigo-300 opacity-5 blur-3xl"></div>
              <div className="absolute bottom-20 left-0 w-80 h-80 rounded-full bg-purple-300 opacity-5 blur-3xl"></div>
            </section>

            <BrandsSection />
            <InfluencersSection />
            <PricingSection />
          </main>

          <Footer />
        </motion.div>
      </AnimatePresence>
    </>
  );
}
