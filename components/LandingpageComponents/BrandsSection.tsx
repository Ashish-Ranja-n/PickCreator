import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { MapPin, MessageSquare, TrendingUp } from 'lucide-react';
import Button from './Button';
import AnimatedText from './AnimatedText';

const BrandsSection: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-10% 0px" });

  const benefits = [
    {
      icon: <MapPin size={24} className="text-indigo-600" />,
      title: "Find Influencers in Your City",
      description: "Reach the perfect audience right in your local area."
    },
    {
      icon: <MessageSquare size={24} className="text-indigo-600" />,
      title: "Direct Communication, Clear Deals",
      description: "No middlemen - connect directly and finalize partnerships efficiently."
    },
    {
      icon: <TrendingUp size={24} className="text-indigo-600" />,
      title: "Boost Sales and Brand Awareness",
      description: "Attract new customers through authentic influencer content."
    }
  ];

  return (
    <section
      id="brands"
      ref={sectionRef}
      className="relative overflow-hidden section-padding bg-gradient-to-b from-white to-indigo-50 min-h-screen flex items-center"
    >
      <div className="container-custom relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Content */}
          <div className="order-2 lg:order-1">
            <motion.div
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-block bg-indigo-100 text-indigo-600 font-medium px-5 py-2 rounded-full text-sm mb-6 tracking-wide"
            >
              For Local Businesses
            </motion.div>

            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
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
              className="text-lg text-gray-700 mb-8 max-w-2xl leading-relaxed"
            >
              Partner with Instagram influencers in your city to elevate your brand's visibility. No need for massive budgets - just authentic connections that deliver real results!
            </motion.p>

            <div className="space-y-6 mb-10">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                  transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                  className="flex items-start"
                >
                  <div className="mr-4 p-3 bg-indigo-50 rounded-lg shadow-sm">
                    {benefit.icon}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-1">{benefit.title}</h3>
                    <p className="text-gray-600">{benefit.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.7 }}
            >
              <Button
                variant="brand"
                size="lg"
                hoverEffect
                glow
                className="bg-indigo-600 hover:bg-indigo-700"
                onClick={() => window.open('/sign-up?type=brand', '_blank')}
              >
                Connect with Influencers Now
              </Button>
            </motion.div>
          </div>

          {/* Image */}
          <motion.div
            className="order-1 lg:order-2 relative"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <div className="relative z-10 overflow-hidden rounded-2xl shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1887&q=80"
                alt="Local business owner with influencer"
                className="w-full h-full object-cover"
              />

              {/* Floating cards */}
              <div className="absolute -bottom-6 -right-6 glass p-4 rounded-xl shadow-lg max-w-[280px]">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">CM</div>
                  <div>
                    <div className="font-medium">City Mall</div>
                    <div className="text-xs text-gray-500">Partnered with 8 influencers</div>
                  </div>
                </div>
                <div className="text-sm">
                  &ldquo;Our weekend event saw a 32% increase in foot traffic thanks to local influencer partnerships!&rdquo;
                </div>
              </div>
            </div>

            {/* Background decorative elements */}
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-indigo-200 rounded-full opacity-20 blur-2xl"></div>
            <div className="absolute -bottom-12 -right-12 w-56 h-56 bg-purple-400 rounded-full opacity-10 blur-3xl"></div>
          </motion.div>
        </div>
      </div>

      {/* Background decorative elements */}
      <div className="absolute top-1/4 left-10 w-64 h-64 rounded-full bg-indigo-300 opacity-5 blur-3xl"></div>
      <div className="absolute bottom-1/4 right-10 w-80 h-80 rounded-full bg-indigo-500 opacity-5 blur-3xl"></div>
      <div className="absolute bottom-3/4 right-1/3 w-40 h-40 rounded-full bg-purple-300 opacity-5 blur-2xl"></div>
    </section>
  );
};

export default BrandsSection;
