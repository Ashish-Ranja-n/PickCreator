import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { DollarSign, Camera, Handshake, IndianRupee, Sparkles, TrendingUp, Users } from 'lucide-react';
import Button from './Button';
import AnimatedText from './AnimatedText';

const InfluencersSection: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-10% 0px" });

  const benefits = [
    {
      icon: <DollarSign size={28} className="text-violet-600" />,
      title: "Earn Money Easily",
      description: "Generate direct income through brand collaborations with transparent payment system.",
      gradient: "from-violet-500 to-purple-600"
    },
    {
      icon: <Camera size={28} className="text-fuchsia-600" />,
      title: "Showcase Your Creativity",
      description: "Create engaging content and grow your follower base with authentic storytelling.",
      gradient: "from-fuchsia-500 to-pink-600"
    },
    {
      icon: <Handshake size={28} className="text-indigo-600" />,
      title: "Work With Local Brands",
      description: "Support businesses in your city and secure exciting partnership deals that matter.",
      gradient: "from-indigo-500 to-blue-600"
    }
  ];

  const stats = [
    { number: "₹50K+", label: "Average Monthly Earnings", icon: <TrendingUp size={20} /> },
    { number: "2000+", label: "Active Creators", icon: <Users size={20} /> },
    { number: "95%", label: "Success Rate", icon: <Sparkles size={20} /> }
  ];

  return (
    <section
      id="influencers"
      ref={sectionRef}
      className="relative overflow-hidden section-padding bg-gradient-to-br from-slate-50 via-violet-50/30 to-fuchsia-50/20 dark:from-zinc-900 dark:via-violet-950/30 dark:to-fuchsia-950/20 min-h-screen flex items-center"
    >
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-violet-400/20 to-fuchsia-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-fuchsia-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-violet-500/5 to-fuchsia-500/5 rounded-full blur-3xl" />
      </div>

      <div className="container-custom relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Image */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <div className="relative z-10 overflow-hidden rounded-3xl shadow-2xl shadow-violet-500/20">
              <img
                src="https://images.unsplash.com/photo-1586335963805-7b603f62a048?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1760&q=80"
                alt="Young influencer creating content"
                className="w-full h-full object-cover"
              />

              {/* Enhanced Floating cards */}
              <motion.div
                className="absolute -top-6 -right-6 glass p-5 rounded-2xl shadow-xl shadow-violet-500/20 max-w-[300px] border border-white/30"
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.6, delay: 0.8 }}
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white flex items-center justify-center font-bold text-lg shadow-lg">SP</div>
                  <div>
                    <div className="font-semibold text-gray-900">Sophia P.</div>
                    <div className="text-xs text-gray-600 flex items-center">
                      <Sparkles size={12} className="mr-1 text-violet-500" />
                      Fashion & Lifestyle • 12K followers
                    </div>
                  </div>
                </div>
                <div className="text-sm text-gray-700 font-medium">
                  &ldquo;I earned ₹25,000 last month from just 3 brand collaborations!&rdquo;
                </div>
                <div className="mt-3 flex items-center text-xs text-violet-600 font-semibold">
                  <TrendingUp size={12} className="mr-1" />
                  +40% this month
                </div>
              </motion.div>

              {/* Additional floating stats card */}
              <motion.div
                className="absolute -bottom-4 -left-4 glass p-4 rounded-xl shadow-lg shadow-fuchsia-500/20 border border-white/30"
                initial={{ opacity: 0, x: -20 }}
                animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                transition={{ duration: 0.6, delay: 1.0 }}
              >
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-fuchsia-500 to-pink-500 flex items-center justify-center">
                    <DollarSign size={16} className="text-white" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">This Week</div>
                    <div className="font-bold text-gray-900">₹8,500</div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Enhanced Background decorative elements */}
            <div className="absolute -top-10 -right-10 w-48 h-48 bg-gradient-to-r from-violet-300/30 to-fuchsia-300/30 rounded-full blur-2xl animate-pulse" />
            <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-gradient-to-r from-fuchsia-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          </motion.div>

          {/* Content */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-violet-500/10 via-fuchsia-500/10 to-violet-500/10 backdrop-blur-sm border border-violet-200/50 dark:border-violet-800/50 text-violet-700 dark:text-violet-300 px-6 py-3 rounded-full text-sm mb-8 font-semibold tracking-wide shadow-lg shadow-violet-500/10"
            >
              <Sparkles className="h-4 w-4 text-violet-500" />
              <span>For Content Creators</span>
              <div className="flex space-x-1">
                <div className="w-1 h-1 bg-violet-500 rounded-full animate-pulse" />
                <div className="w-1 h-1 bg-fuchsia-500 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
              </div>
            </motion.div>

            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white mb-8 leading-tight">
              <AnimatedText
                text="Monetize Your Instagram, Build Your Future"
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
              Love creating content? Earn money by promoting local brands in your city. No experience needed—just showcase your creativity and authentic style!
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
                    <div className="p-2 bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 rounded-lg">
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
                  className="group flex items-start p-6 rounded-2xl bg-white/50 dark:bg-zinc-800/50 backdrop-blur-sm border border-white/20 dark:border-zinc-700/20 hover:bg-white/70 dark:hover:bg-zinc-800/70 transition-all duration-300 hover:shadow-xl hover:shadow-violet-500/10"
                >
                  <div className={`mr-5 p-4 bg-gradient-to-r ${benefit.gradient} rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    {benefit.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-2 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors duration-300">{benefit.title}</h3>
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
                className="relative group bg-gradient-to-r from-violet-600 via-fuchsia-600 to-violet-600 bg-[length:200%_100%] hover:bg-[position:100%_0] text-white font-bold py-4 px-8 rounded-2xl shadow-2xl shadow-violet-500/25 transition-all duration-500 overflow-hidden"
                whileHover={{ y: -3, scale: 1.02 }}
                whileTap={{ y: 1, scale: 0.98 }}
                onClick={() => window.open('/sign-up?type=influencer', '_blank')}
              >
                <span className="relative z-10 flex items-center justify-center">
                  <Sparkles className="mr-3 h-5 w-5" />
                  <span className="text-lg">Start Earning Now</span>
                  <svg className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              </motion.button>

              <motion.button
                className="relative group bg-white dark:bg-zinc-800 border-2 border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-950/50 font-semibold py-4 px-8 rounded-2xl shadow-xl shadow-violet-500/10 transition-all duration-300"
                whileHover={{ y: -3, scale: 1.02 }}
                whileTap={{ y: 1, scale: 0.98 }}
                onClick={() => window.open('/learn-more', '_blank')}
              >
                <span className="flex items-center justify-center">
                  <span className="text-lg">Learn More</span>
                </span>
              </motion.button>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default InfluencersSection;
