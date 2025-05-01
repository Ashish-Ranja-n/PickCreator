import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { RefreshCcw, ShieldCheck, TrendingUp, CreditCard, ArrowDown, MoveRight, MoveLeft } from 'lucide-react';
import Link from 'next/link';
import Button from './Button';
import AnimatedText from './AnimatedText';

const PricingSection: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-10% 0px" });

  const features = [
    {
      icon: <RefreshCcw size={24} className="text-indigo-600" />,
      title: "Quick Refund Process",
      description: "Fast refunds when conditions are met."
    },
    {
      icon: <ShieldCheck size={24} className="text-indigo-600" />,
      title: "Secure Payment Protection",
      description: "Our escrow system keeps your transactions safe."
    },
    {
      icon: <TrendingUp size={24} className="text-indigo-600" />,
      title: "Pricing",
      description: "COMPLETELY FREE"
    },
    {
      icon: <CreditCard size={24} className="text-indigo-600" />,
      title: "No Hidden Charges",
      description: "What you see is what you pay, no surprises."
    }
  ];

  return (
    <section
      id="pricing"
      ref={sectionRef}
      className="relative overflow-hidden section-padding bg-gradient-to-b from-indigo-50 to-purple-50 min-h-screen flex items-center py-16 md:py-24"
    >
      <div className="container-custom relative z-10">
        <div className="text-center mb-12 md:mb-16">
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-block bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-600 font-medium px-5 py-2 rounded-full text-sm mb-6 md:mb-8 tracking-wide"
          >
            Our Payment System
          </motion.div>

          <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 md:mb-8 leading-tight">
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
            className="text-base md:text-lg text-gray-700 mb-8 md:mb-10 max-w-2xl mx-auto px-4 leading-relaxed"
          >
            We make collaborations between brands and influencers simple, secure, and transparent with our trusted platform.
          </motion.p>
        </div>

        {/* Flow Diagram - Mobile & Desktop Versions */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="relative max-w-4xl mx-auto mb-16 md:mb-20"
        >
          {/* Desktop Flow (hidden on mobile) */}
          <div className="hidden md:block relative">
            <div className="grid grid-cols-3 gap-8 items-center">
              {/* Brand */}
              <div className="text-center">
                <div className="w-28 h-28 lg:w-32 lg:h-32 bg-white rounded-full shadow-lg flex items-center justify-center mx-auto mb-4">
                  <img src="/images/brand-icon.svg" alt="Brand" className="w-14 h-14 lg:w-16 lg:h-16" />
                </div>
                <h3 className="font-bold text-xl mb-2">Brand</h3>
                <p className="text-gray-600 text-sm">Makes payment for collaboration</p>
              </div>

              {/* PickCreator */}
              <div className="text-center">
                <div className="w-36 h-36 lg:w-40 lg:h-40 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full shadow-lg flex items-center justify-center mx-auto mb-4 border-4 border-white">
                  <img src="/logo.svg" alt="PickCreator" className="w-20 h-20 lg:w-24 lg:h-24" />
                </div>
                <h3 className="font-bold text-xl mb-2">PickCreator</h3>
                <p className="text-gray-600 text-sm">Safely holds payment in escrow <br/>
                </p>
              </div>

              {/* Influencer */}
              <div className="text-center">
                <div className="w-28 h-28 lg:w-32 lg:h-32 bg-white rounded-full shadow-lg flex items-center justify-center mx-auto mb-4">
                  <img src="/images/influencer-icon.svg" alt="Influencer" className="w-14 h-14 lg:w-16 lg:h-16" />
                </div>
                <h3 className="font-bold text-xl mb-2">Influencer</h3>
                <p className="text-gray-600 text-sm">Creates engaging content</p>
              </div>
            </div>

            {/* Desktop Arrows */}
            <div className="absolute top-1/2 -translate-y-1/2 left-1/4 transform -translate-x-1/2">
              <MoveRight size={48} className="text-indigo-600" strokeWidth={1.5} />
            </div>

            <div className="absolute top-1/2 -translate-y-1/2 right-1/4 transform translate-x-1/2">
              <MoveLeft size={48} className="text-purple-600" strokeWidth={1.5} />
            </div>
          </div>

          {/* Mobile Flow (vertical stack, hidden on desktop) */}
          <div className="md:hidden flex flex-col items-center">
            {/* Brand */}
            <div className="text-center mb-10">
              <div className="w-28 h-28 bg-white rounded-full shadow-lg flex items-center justify-center mx-auto mb-4">
                <img src="/images/brand-icon.svg" alt="Brand" className="w-14 h-14" />
              </div>
              <h3 className="font-bold text-xl mb-2">Brand</h3>
              <p className="text-gray-600 text-sm">Makes payment for collaboration</p>
            </div>

            {/* Down Arrow */}
            <div className="mb-4 text-indigo-600">
              <ArrowDown size={24} strokeWidth={3} />
            </div>

            {/* PickCreator */}
            <div className="text-center mb-10">
              <div className="w-36 h-36 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full shadow-lg flex items-center justify-center mx-auto mb-4 border-4 border-white">
                <img src="/logo.svg" alt="PickCreator" className="w-20 h-20" />
              </div>
              <h3 className="font-bold text-xl mb-2">PickCreator</h3>
              <p className="text-gray-600 text-sm">Safely holds payment in escrow <br/>(Completely free service)</p>
            </div>

            {/* Down Arrow */}
            <div className="mb-4 text-purple-600">
              <ArrowDown size={24} strokeWidth={3} />
            </div>

            {/* Influencer */}
            <div className="text-center">
              <div className="w-28 h-28 bg-white rounded-full shadow-lg flex items-center justify-center mx-auto mb-4">
                <img src="/images/influencer-icon.svg" alt="Influencer" className="w-14 h-14" />
              </div>
              <h3 className="font-bold text-xl mb-2">Influencer</h3>
              <p className="text-gray-600 text-sm">Creates engaging content</p>
            </div>
          </div>
        </motion.div>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-8 mb-12 px-4 md:px-0">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
              className="bg-white p-4 md:p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300"
            >
              <div className="mb-4 p-3 bg-indigo-50 inline-flex rounded-lg shadow-sm">
                {feature.icon}
              </div>
              <h3 className="font-bold text-lg md:text-xl mb-2">{feature.title}</h3>
              <p className="text-gray-600 text-sm md:text-base">{feature.description}</p>
            </motion.div>
          ))}
        </div>


      </div>

      {/* Background decorative elements */}
      <div className="absolute top-1/4 left-10 w-64 h-64 rounded-full bg-indigo-300 opacity-5 blur-3xl"></div>
      <div className="absolute bottom-1/4 right-10 w-80 h-80 rounded-full bg-purple-500 opacity-5 blur-3xl"></div>
      <div className="absolute top-3/4 right-1/3 w-40 h-40 rounded-full bg-pink-300 opacity-5 blur-2xl"></div>
    </section>
  );
};

export default PricingSection;