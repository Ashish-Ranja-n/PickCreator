import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { RefreshCcw, ShieldCheck, TrendingUp, CreditCard, ArrowDown, MoveRight, MoveLeft, Sparkles, Zap, Lock, Gift } from 'lucide-react';
import Link from 'next/link';
import Button from './Button';
import AnimatedText from './AnimatedText';

const PricingSection: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-10% 0px" });

  const features = [
    {
      icon: <Gift size={28} className="text-emerald-600" />,
      title: "Completely Free",
      description: "No subscription fees, no hidden charges. 100% free forever.",
      gradient: "from-emerald-500 to-teal-600",
      highlight: true
    },
    {
      icon: <ShieldCheck size={28} className="text-blue-600" />,
      title: "Secure Payment Protection",
      description: "Our advanced escrow system keeps all transactions completely safe.",
      gradient: "from-blue-500 to-indigo-600"
    },
    {
      icon: <RefreshCcw size={28} className="text-purple-600" />,
      title: "Quick Refund Process",
      description: "Lightning-fast refunds when conditions are met, no questions asked.",
      gradient: "from-purple-500 to-violet-600"
    },
    {
      icon: <Zap size={28} className="text-orange-600" />,
      title: "Instant Payments",
      description: "Get paid immediately after content approval. No waiting periods.",
      gradient: "from-orange-500 to-red-600"
    }
  ];

  return (
    <section
      id="pricing"
      ref={sectionRef}
      className="relative overflow-hidden section-padding bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20 dark:from-zinc-900 dark:via-indigo-950/30 dark:to-purple-950/20 min-h-screen flex items-center py-16 md:py-24"
    >
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-indigo-500/5 to-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="container-custom relative z-10">
        <div className="text-center mb-12 md:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10 backdrop-blur-sm border border-indigo-200/50 dark:border-indigo-800/50 text-indigo-700 dark:text-indigo-300 px-6 py-3 rounded-full text-sm mb-8 font-semibold tracking-wide shadow-lg shadow-indigo-500/10"
          >
            <Lock className="h-4 w-4 text-indigo-500" />
            <span>Our Payment System</span>
            <div className="flex space-x-1">
              <div className="w-1 h-1 bg-indigo-500 rounded-full animate-pulse" />
              <div className="w-1 h-1 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
            </div>
          </motion.div>

          <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white mb-6 md:mb-8 leading-tight">
            <AnimatedText
              text="How Money and Content Flow Works"
              animation="slide"
              delay={0.1}
              as="span"
            />
          </h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-base md:text-xl text-gray-700 dark:text-gray-300 mb-8 md:mb-10 max-w-3xl mx-auto px-4 leading-relaxed font-medium"
          >
            We make collaborations between brands and influencers simple, secure, and transparent with our trusted platform.
          </motion.p>
        </div>

        {/* Enhanced Flow Diagram - Mobile & Desktop Versions */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="relative max-w-5xl mx-auto mb-16 md:mb-20"
        >
          {/* Desktop Flow (hidden on mobile) */}
          <div className="hidden md:block relative">
            <div className="grid grid-cols-3 gap-8 items-center">
              {/* Brand */}
              <motion.div
                className="text-center"
                initial={{ opacity: 0, x: -50 }}
                animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <div className="w-32 h-32 lg:w-36 lg:h-36 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full shadow-2xl shadow-blue-500/30 flex items-center justify-center mx-auto mb-6 border-4 border-white/20 backdrop-blur-sm">
                  <div className="w-16 h-16 lg:w-20 lg:h-20 bg-white rounded-full flex items-center justify-center">
                    <span className="text-2xl lg:text-3xl font-black text-blue-600">B</span>
                  </div>
                </div>
                <h3 className="font-black text-xl lg:text-2xl mb-3 text-gray-900 dark:text-white">Brand</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm lg:text-base font-medium">Makes secure payment for collaboration</p>
              </motion.div>

              {/* PickCreator */}
              <motion.div
                className="text-center relative"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                <div className="w-40 h-40 lg:w-44 lg:h-44 bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-600 rounded-full shadow-2xl shadow-indigo-500/40 flex items-center justify-center mx-auto mb-6 border-4 border-white/30 backdrop-blur-sm relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/20 to-white/10 animate-pulse" />
                  <Sparkles className="w-20 h-20 lg:w-24 lg:h-24 text-white relative z-10" />
                </div>
                <h3 className="font-black text-xl lg:text-2xl mb-3 text-gray-900 dark:text-white">PickCreator</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm lg:text-base font-medium">Safely holds payment in escrow<br/><span className="text-emerald-600 font-bold">Completely FREE service</span></p>
              </motion.div>

              {/* Influencer */}
              <motion.div
                className="text-center"
                initial={{ opacity: 0, x: 50 }}
                animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
                transition={{ duration: 0.6, delay: 0.8 }}
              >
                <div className="w-32 h-32 lg:w-36 lg:h-36 bg-gradient-to-br from-fuchsia-500 to-pink-600 rounded-full shadow-2xl shadow-fuchsia-500/30 flex items-center justify-center mx-auto mb-6 border-4 border-white/20 backdrop-blur-sm">
                  <div className="w-16 h-16 lg:w-20 lg:h-20 bg-white rounded-full flex items-center justify-center">
                    <span className="text-2xl lg:text-3xl font-black text-fuchsia-600">I</span>
                  </div>
                </div>
                <h3 className="font-black text-xl lg:text-2xl mb-3 text-gray-900 dark:text-white">Influencer</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm lg:text-base font-medium">Creates engaging content and gets paid</p>
              </motion.div>
            </div>

            {/* Enhanced Desktop Arrows */}
            <motion.div
              className="absolute top-1/2 -translate-y-1/2 left-1/4 transform -translate-x-1/2"
              initial={{ opacity: 0, x: -20 }}
              animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
              transition={{ duration: 0.6, delay: 1.0 }}
            >
              <div className="flex flex-col items-center">
                <MoveRight size={48} className="text-indigo-600 drop-shadow-lg" strokeWidth={2} />
                <span className="text-xs font-semibold text-indigo-600 mt-2">Payment</span>
              </div>
            </motion.div>

            <motion.div
              className="absolute top-1/2 -translate-y-1/2 right-1/4 transform translate-x-1/2"
              initial={{ opacity: 0, x: 20 }}
              animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
              transition={{ duration: 0.6, delay: 1.2 }}
            >
              <div className="flex flex-col items-center">
                <MoveLeft size={48} className="text-purple-600 drop-shadow-lg" strokeWidth={2} />
                <span className="text-xs font-semibold text-purple-600 mt-2">Content</span>
              </div>
            </motion.div>
          </div>

          {/* Enhanced Mobile Flow (vertical stack, hidden on desktop) */}
          <div className="md:hidden flex flex-col items-center">
            {/* Brand */}
            <motion.div
              className="text-center mb-8"
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full shadow-2xl shadow-blue-500/30 flex items-center justify-center mx-auto mb-4 border-4 border-white/20">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                  <span className="text-2xl font-black text-blue-600">B</span>
                </div>
              </div>
              <h3 className="font-black text-xl mb-2 text-gray-900 dark:text-white">Brand</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Makes secure payment</p>
            </motion.div>

            {/* Enhanced Down Arrow */}
            <motion.div
              className="mb-6 text-indigo-600"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.4, delay: 0.6 }}
            >
              <div className="flex flex-col items-center">
                <ArrowDown size={28} strokeWidth={3} className="drop-shadow-lg" />
                <span className="text-xs font-semibold mt-1">Payment</span>
              </div>
            </motion.div>

            {/* PickCreator */}
            <motion.div
              className="text-center mb-8"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <div className="w-36 h-36 bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-600 rounded-full shadow-2xl shadow-indigo-500/40 flex items-center justify-center mx-auto mb-4 border-4 border-white/30 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/20 to-white/10 animate-pulse" />
                <Sparkles className="w-20 h-20 text-white relative z-10" />
              </div>
              <h3 className="font-black text-xl mb-2 text-gray-900 dark:text-white">PickCreator</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Safely holds payment in escrow<br/><span className="text-emerald-600 font-bold">Completely FREE</span></p>
            </motion.div>

            {/* Enhanced Down Arrow */}
            <motion.div
              className="mb-6 text-purple-600"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.4, delay: 1.0 }}
            >
              <div className="flex flex-col items-center">
                <ArrowDown size={28} strokeWidth={3} className="drop-shadow-lg" />
                <span className="text-xs font-semibold mt-1">Content</span>
              </div>
            </motion.div>

            {/* Influencer */}
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.6, delay: 1.2 }}
            >
              <div className="w-32 h-32 bg-gradient-to-br from-fuchsia-500 to-pink-600 rounded-full shadow-2xl shadow-fuchsia-500/30 flex items-center justify-center mx-auto mb-4 border-4 border-white/20">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                  <span className="text-2xl font-black text-fuchsia-600">I</span>
                </div>
              </div>
              <h3 className="font-black text-xl mb-2 text-gray-900 dark:text-white">Influencer</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Creates content & gets paid</p>
            </motion.div>
          </div>
        </motion.div>

        {/* Enhanced Features */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 mb-16 px-4 md:px-0">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
              className={`group relative bg-white/70 dark:bg-zinc-800/70 backdrop-blur-sm p-6 md:p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 border border-white/20 dark:border-zinc-700/20 hover:scale-105 ${
                feature.highlight ? 'ring-2 ring-emerald-500/50 bg-gradient-to-br from-emerald-50/50 to-white/70 dark:from-emerald-950/50 dark:to-zinc-800/70' : ''
              }`}
            >
              {feature.highlight && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                    MOST POPULAR
                  </span>
                </div>
              )}

              <div className={`mb-6 p-4 bg-gradient-to-r ${feature.gradient} inline-flex rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                {feature.icon}
              </div>

              <h3 className="font-black text-xl md:text-2xl mb-3 text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300">
                {feature.title}
              </h3>

              <p className="text-gray-700 dark:text-gray-300 text-sm md:text-base leading-relaxed font-medium">
                {feature.description}
              </p>

              {/* Decorative gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-indigo-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </motion.div>
          ))}
        </div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center"
        >
          <motion.button
            className="relative group bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:200%_100%] hover:bg-[position:100%_0] text-white font-bold py-4 px-10 rounded-2xl shadow-2xl shadow-indigo-500/25 transition-all duration-500 overflow-hidden"
            whileHover={{ y: -3, scale: 1.02 }}
            whileTap={{ y: 1, scale: 0.98 }}
            onClick={() => window.open('/welcome', '_blank')}
          >
            <span className="relative z-10 flex items-center justify-center">
              <Sparkles className="mr-3 h-6 w-6" />
              <span className="text-xl">Get Started for FREE</span>
              <svg className="ml-3 w-6 h-6 group-hover:translate-x-1 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};

export default PricingSection;