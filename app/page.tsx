'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Preloader from '@/components/LandingpageComponents/Preloader';
import BrandsSection from '@/components/LandingpageComponents/BrandsSection';
import InfluencersSection from '@/components/LandingpageComponents/InfluencersSection';
import PricingSection from '@/components/LandingpageComponents/PricingSection';
import Footer from '@/components/LandingpageComponents/Footer';
import Header from '@/components/LandingpageComponents/Header';
import { Star } from 'lucide-react';



// Type for beforeinstallprompt event (for PWA install prompt)
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; }>;
};

export default function Home() {

  // PWA install prompt state
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstall, setShowInstall] = useState(false);
  useEffect(() => {
    const handler = (e: Event) => {
      const promptEvent = e as BeforeInstallPromptEvent;
      promptEvent.preventDefault();
      setDeferredPrompt(promptEvent);
      setShowInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowInstall(false);
        setDeferredPrompt(null);
      }
    }
  };


    const [loading, setLoading] = useState(true);
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
          25% { background-position: 100% 50% }
          50% { background-position: 200% 50% }
          75% { background-position: 300% 50% }
          100% { background-position: 400% 50% }
        }

        .animate-liquid-gradient {
          background-size: 400% 100%;
          animation: liquid-flow 8s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
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
      {/* Install as PWA button at the very top */}
      {showInstall && (
        <div
          className="fixed bottom-6 right-6 z-50 flex items-center"
          style={{ minWidth: 0, minHeight: 0 }}
        >
          <div className="relative flex items-center rounded-xl shadow-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 overflow-hidden" style={{ minWidth: 0, minHeight: 0 }}>
            {/* Shine effect */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="shine-effect w-full h-full" />
            </div>
            <span className="pl-5 pr-2 py-2 text-white font-semibold text-base whitespace-nowrap z-10 drop-shadow">Install as App</span>
            <button
              onClick={handleInstallClick}
              className="flex items-center justify-center bg-white/20 hover:bg-white/30 text-white font-bold px-3 py-2 rounded-r-xl transition-all duration-200 z-10"
              style={{ minWidth: '40px', minHeight: '40px' }}
              aria-label="Install App"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v12m0 0l-4-4m4 4l4-4m-7 8h10" />
              </svg>
            </button>
            <style>{`
              .shine-effect {
                position: absolute;
                top: 0; left: 0; right: 0; bottom: 0;
                background: linear-gradient(120deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.15) 35%, rgba(255,255,255,0.7) 50%, rgba(255,255,255,0.15) 65%, rgba(255,255,255,0.05) 100%);
                background-size: 300% 100%;
                animation: shine-move 2.8s cubic-bezier(0.4,0.0,0.2,1) infinite;
                border-radius: 0.75rem;
                pointer-events: none;
                z-index: 1;
              }
              @keyframes shine-move {
                0% { background-position: -150% 0; }
                100% { background-position: 150% 0; }
              }
            `}</style>
          </div>
        </div>
      )}
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
            <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-slate-50 via-white to-violet-50/30 dark:from-zinc-900 dark:via-zinc-900 dark:to-violet-950/30">
              {/* Background Effects */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-violet-400/20 to-fuchsia-400/20 rounded-full blur-3xl animate-pulse-glow" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-blue-400/20 to-violet-400/20 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '2s' }} />
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-violet-500/5 to-fuchsia-500/5 rounded-full blur-3xl" />
              </div>

              <div className="container-custom relative z-10">
                <div className="text-center max-w-6xl mx-auto pt-8 sm:pt-14 md:pt-16">
                  

                  <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="text-5xl md:text-7xl lg:text-8xl font-black mt-12 mb-10 leading-tight"
                  >
                    <div className="flex flex-wrap justify-center items-center gap-2 md:gap-4">
                      {/* "where" in elegant text */}
                      <span className="text-zinc-600 dark:text-zinc-400 text-2xl md:text-4xl lg:text-5xl font-light italic">
                        where
                      </span>

                      {/* "influencer" with animated gradient */}
                      <span className="relative">
                        <span className="absolute inset-0 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-fuchsia-600 bg-clip-text text-transparent animate-liquid-gradient bg-[length:400%_100%] font-black">
                          influencer
                        </span>
                        <span className="opacity-0 font-black">influencer</span>
                      </span>
                    </div>

                    <div className="flex flex-wrap justify-center items-center gap-2 md:gap-4 mt-2">
                      {/* "meets" with subtle animation */}
                      <span className="text-zinc-800 dark:text-zinc-200 font-light italic text-2xl md:text-4xl lg:text-5xl">
                        meets
                      </span>

                      {/* "brand" with solid gradient */}
                      <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent font-black">
                        brand
                      </span>
                    </div>
                  </motion.h1>

                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="text-xl md:text-2xl text-zinc-600 dark:text-zinc-300 font-medium mb-12 max-w-4xl mx-auto px-4 leading-relaxed"
                  >
                    Join our community of <span className="text-violet-600 dark:text-violet-400 font-semibold">verified influencers</span> and <span className="text-blue-600 dark:text-blue-400 font-semibold">brands</span> to collaborate with nearby shops, businesses and global brands.
                    <span className="block mt-2 text-lg text-zinc-500 dark:text-zinc-400">Be seen 🛸 and get paid 💵</span>
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.45 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16 w-full max-w-3xl mx-auto px-4"
                  >
                    <a href="/welcome" className="w-full sm:w-auto group">
                      <motion.button
                        className="relative w-full bg-gradient-to-r from-violet-600 via-fuchsia-600 to-violet-600 bg-[length:200%_100%] hover:bg-[position:100%_0] text-white font-semibold py-4 px-10 rounded-2xl shadow-2xl shadow-violet-500/25 transition-all duration-500 overflow-hidden"
                        whileHover={{ y: -3, scale: 1.02 }}
                        whileTap={{ y: 1, scale: 0.98 }}
                      >
                        <span className="relative z-10 flex items-center justify-center">
                          <Star className="mr-3 h-5 w-5" />
                          <span className="text-lg">Join as Influencer</span>
                          <svg className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                      </motion.button>
                    </a>
                    <a href="/welcome" className="w-full sm:w-auto group">
                      <motion.button
                        className="relative w-full bg-white dark:bg-zinc-800 border-2 border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-950/50 font-semibold py-4 px-10 rounded-2xl shadow-xl shadow-violet-500/10 transition-all duration-300 overflow-hidden"
                        whileHover={{ y: -3, scale: 1.02 }}
                        whileTap={{ y: 1, scale: 0.98 }}
                      >
                        <span className="relative z-10 flex items-center justify-center">
                          <div className="mr-3 w-5 h-5 bg-gradient-to-r from-blue-500 to-violet-500 rounded-full" />
                          <span className="text-lg">I'm a Brand</span>
                          <svg className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </span>
                      </motion.button>
                    </a>
                  </motion.div>
                </div>

                

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
