import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { MapPin, MessageSquare, TrendingUp, Target, Users, BarChart3, Sparkles, Building2 } from 'lucide-react';
import Button from './Button';
import AnimatedText from './AnimatedText';

const BrandsSection: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-10% 0px" });

  const benefits = [
    {
      icon: (
        <svg viewBox="0 0 32 32" className="w-8 h-8" fill="none">
          <defs>
            <radialGradient id="locationGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.8"/>
              <stop offset="70%" stopColor="currentColor" stopOpacity="0.4"/>
              <stop offset="100%" stopColor="currentColor" stopOpacity="0.1"/>
            </radialGradient>
            <radialGradient id="searchGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.9"/>
              <stop offset="100%" stopColor="currentColor" stopOpacity="0.3"/>
            </radialGradient>
          </defs>

          {/* Outer location ring with gradient */}
          <circle cx="16" cy="16" r="13" fill="url(#locationGradient)" stroke="currentColor" strokeWidth="1.5" opacity="0.2"/>

          {/* Middle location ring */}
          <circle cx="16" cy="16" r="9" stroke="currentColor" strokeWidth="2" opacity="0.6"/>

          {/* Inner location ring */}
          <circle cx="16" cy="16" r="5" stroke="currentColor" strokeWidth="2.5"/>

          {/* Location center dot with gradient */}
          <circle cx="16" cy="16" r="2.5" fill="url(#searchGradient)"/>

          {/* Magnifying glass lens with subtle gradient */}
          <circle cx="20" cy="20" r="5" fill="url(#searchGradient)" stroke="currentColor" strokeWidth="2.5" opacity="0.8"/>

          {/* Magnifying glass handle */}
          <path d="m25 25 4 4" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>

          {/* Search result indicators - pulsing dots */}
          <circle cx="18" cy="18.5" r="1.2" fill="currentColor" opacity="0.7">
            <animate attributeName="opacity" values="0.3;0.9;0.3" dur="2s" repeatCount="indefinite"/>
          </circle>
          <circle cx="19.5" cy="19.8" r="0.9" fill="currentColor" opacity="0.5">
            <animate attributeName="opacity" values="0.2;0.7;0.2" dur="2s" begin="0.3s" repeatCount="indefinite"/>
          </circle>
          <circle cx="21" cy="20.5" r="0.7" fill="currentColor" opacity="0.4">
            <animate attributeName="opacity" values="0.1;0.5;0.1" dur="2s" begin="0.6s" repeatCount="indefinite"/>
          </circle>

          {/* Highlight ring for premium feel */}
          <circle cx="16" cy="16" r="11" stroke="currentColor" strokeWidth="0.8" opacity="0.3" fill="none"/>
        </svg>
      ),
      title: "Find Influencers in Your City",
      description: "Reach the perfect audience right in your local area with verified creators.",
      gradient: "from-blue-500 to-indigo-600"
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8 9h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M8 13h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ),
      title: "Direct Communication, Clear Deals",
      description: "No middlemen - connect directly and finalize partnerships efficiently.",
      gradient: "from-indigo-500 to-purple-600"
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none">
          <path d="M23 6l-8.5 8.5-5-5L1 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M17 6h6v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      title: "Boost Sales and Brand Awareness",
      description: "Attract new customers through authentic influencer content that converts.",
      gradient: "from-purple-500 to-pink-600"
    }
  ];

  const stats = [
    { number: "300+", label: "Partner Brands", icon: <Building2 size={20} /> },
    { number: "85%", label: "ROI Increase", icon: <BarChart3 size={20} /> },
    { number: "50K+", label: "Reach Per Campaign", icon: <Target size={20} /> }
  ];

  return (
    <section
      id="brands"
      ref={sectionRef}
      className="relative overflow-hidden section-padding bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20 dark:from-zinc-900 dark:via-blue-950/30 dark:to-indigo-950/20 min-h-screen flex items-center"
    >
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-blue-500/5 to-indigo-500/5 rounded-full blur-3xl" />
      </div>

      <div className="container-custom relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Content */}
          <div className="order-2 lg:order-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-blue-500/10 backdrop-blur-sm border border-blue-200/50 dark:border-blue-800/50 text-blue-700 dark:text-blue-300 px-6 py-3 rounded-full text-sm mb-8 font-semibold tracking-wide shadow-lg shadow-blue-500/10"
            >
              <Building2 className="h-4 w-4 text-blue-500" />
              <span>For Local Businesses</span>
              <div className="flex space-x-1">
                <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse" />
                <div className="w-1 h-1 bg-indigo-500 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
              </div>
            </motion.div>

            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white mb-8 leading-tight">
              <AnimatedText
                text="Boost Your Business with Local Influencers"
                animation="slide"
                delay={0.1}
                as="span"
              />
            </h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-xl text-gray-700 dark:text-gray-300 mb-10 max-w-2xl leading-relaxed font-medium"
            >
              Partner with Instagram influencers in your city to elevate your brand's visibility. No need for massive budgets - just authentic connections that deliver real results!
            </motion.p>

            {/* Stats Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="grid grid-cols-3 gap-4 mb-10"
            >
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <div className="p-2 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-lg">
                      {stat.icon}
                    </div>
                  </div>
                  <div className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white">{stat.number}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">{stat.label}</div>
                </div>
              ))}
            </motion.div>

            {/* Enhanced Benefits */}
            <div className="space-y-6 mb-12">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                  transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                  className="group flex items-start p-6 rounded-2xl bg-white/50 dark:bg-zinc-800/50 backdrop-blur-sm border border-white/20 dark:border-zinc-700/20 hover:bg-white/70 dark:hover:bg-zinc-800/70 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10"
                >
                  <div className={`mr-5 p-4 bg-gradient-to-r ${benefit.gradient} rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    {benefit.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">{benefit.title}</h3>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{benefit.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Enhanced CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <motion.button
                className="relative group bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 bg-[length:200%_100%] hover:bg-[position:100%_0] text-white font-bold py-4 px-8 rounded-2xl shadow-2xl shadow-blue-500/25 transition-all duration-500 overflow-hidden"
                whileHover={{ y: -3, scale: 1.02 }}
                whileTap={{ y: 1, scale: 0.98 }}
                onClick={() => window.open('/sign-up?type=brand', '_blank')}
              >
                <span className="relative z-10 flex items-center justify-center">
                  <Building2 className="mr-3 h-5 w-5" />
                  <span className="text-lg">Connect with Influencers</span>
                  <svg className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              </motion.button>

              <motion.button
                className="relative group bg-white dark:bg-zinc-800 border-2 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/50 font-semibold py-4 px-8 rounded-2xl shadow-xl shadow-blue-500/10 transition-all duration-300"
                whileHover={{ y: -3, scale: 1.02 }}
                whileTap={{ y: 1, scale: 0.98 }}
                onClick={() => window.open('/case-studies', '_blank')}
              >
                <span className="flex items-center justify-center">
                  <span className="text-lg">View Case Studies</span>
                </span>
              </motion.button>
            </motion.div>
          </div>

          {/* Image */}
          <motion.div
            className="order-1 lg:order-2 relative"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <div className="relative z-10 overflow-hidden rounded-3xl shadow-2xl shadow-blue-500/20">
              <img
                src="https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1887&q=80"
                alt="Local business owner with influencer"
                className="w-full h-full object-cover"
              />

              {/* Enhanced Floating cards */}
              <motion.div
                className="absolute -bottom-6 -right-6 glass p-5 rounded-2xl shadow-xl shadow-blue-500/20 max-w-[300px] border border-white/30"
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.6, delay: 0.8 }}
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-lg">CM</div>
                  <div>
                    <div className="font-semibold text-gray-900">City Mall</div>
                    <div className="text-xs text-gray-600 flex items-center">
                      <Users size={12} className="mr-1 text-blue-500" />
                      Partnered with 8 influencers
                    </div>
                  </div>
                </div>
                <div className="text-sm text-gray-700 font-medium">
                  &ldquo;Our weekend event saw a 32% increase in foot traffic thanks to local influencer partnerships!&rdquo;
                </div>
                <div className="mt-3 flex items-center text-xs text-blue-600 font-semibold">
                  <TrendingUp size={12} className="mr-1" />
                  +32% foot traffic
                </div>
              </motion.div>

              {/* Additional floating ROI card */}
              <motion.div
                className="absolute -top-4 -left-4 glass p-4 rounded-xl shadow-lg shadow-indigo-500/20 border border-white/30"
                initial={{ opacity: 0, x: -20 }}
                animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                transition={{ duration: 0.6, delay: 1.0 }}
              >
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
                    <BarChart3 size={16} className="text-white" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">ROI</div>
                    <div className="font-bold text-gray-900">+85%</div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Enhanced Background decorative elements */}
            <div className="absolute -top-10 -left-10 w-48 h-48 bg-gradient-to-r from-blue-300/30 to-indigo-300/30 rounded-full blur-2xl animate-pulse" />
            <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-gradient-to-r from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default BrandsSection;
