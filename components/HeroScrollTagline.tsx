"use client";
import React from "react";
import { motion, useScroll, useTransform } from "framer-motion";

// Mobile-friendly scroll-animated tagline hero
export default function HeroScrollTagline() {
  // Attach scroll to the hero section
  const ref = React.useRef<HTMLDivElement>(null);
  // Animate within a very small scroll range for best UX
  // END controls how much scroll triggers the full animation (0.07 = 7% of section)
  const END = 0.07;
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  // Tagline scale: 1 -> 2.1, opacity: 1 -> 0, y: 0 -> -48px, all within END scroll
  const scale = useTransform(scrollYProgress, [0, END], [1, 2.1]);
  const opacity = useTransform(scrollYProgress, [0, END * 0.7, END], [1, 0.7, 0]);
  const y = useTransform(scrollYProgress, [0, END], [0, -48]);
  // Reveal content after tagline is gone, starts just before END, finishes soon after
  const contentOpacity = useTransform(scrollYProgress, [END * 0.7, END, END + 0.08], [0, 0.5, 1]);
  const contentY = useTransform(scrollYProgress, [END, END + 0.08], [40, 0]);

  return (
    <div ref={ref} className="relative min-h-[70vh] flex flex-col items-center justify-center select-none">
      {/* Tagline */}
      <motion.div
        style={{ scale, opacity, y, zIndex: 10 }}
        className="w-full flex flex-col items-center justify-center"
      >
        <span className="inline-block bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-600 px-5 py-2 rounded-full text-sm mb-6 sm:mb-8 font-bold tracking-wide">
          Elevate Your Influence, Amplify Your Income.
        </span>
        <h1 className="text-5xl md:text-7xl font-extrabold mb-8 flex flex-wrap justify-center items-baseline">
          <span className="text-indigo-700 text-2xl md:text-3xl mr-2 font-medium">where</span>
          <span className="relative">
            <span className="bg-[linear-gradient(to_right,#7c3aed,#ec4899,#8b5cf6,#d946ef)] bg-clip-text text-transparent animate-liquid-gradient absolute font-extrabold">
              influencer
            </span>
            <span className="opacity-0">influencer&nbsp;</span>
          </span>
          <span className="text-indigo-900 mx-2">meets</span>
          <span className="text-purple-700">brand</span>
        </h1>
      </motion.div>

      {/* Rest of hero content, revealed after scroll */}
      <motion.div
        style={{ opacity: contentOpacity, y: contentY, pointerEvents: "auto" }}
        className="w-full flex flex-col items-center justify-center mt-2"
      >
        <p className="text-lg md:text-xl text-gray-700 font-medium mb-7 max-w-xl mx-auto px-4 text-center">
          Join our community of verified influencers and brands. Collaborate with local shops, businesses, and global brands. Be seen 🛸 and get paid 💵.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8 w-full max-w-xl mx-auto px-4">
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
        </div>
      </motion.div>
    </div>
  );
}
