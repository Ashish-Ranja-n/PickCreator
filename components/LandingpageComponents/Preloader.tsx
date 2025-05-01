'use client'
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Store, Smartphone } from 'lucide-react';

interface PreloaderProps {
  onComplete: () => void;
}

const Preloader: React.FC<PreloaderProps> = ({ onComplete }) => {
  const [animationComplete, setAnimationComplete] = useState(false);
  const [animationType, setAnimationType] = useState<'text' | 'icons'>('text');
  
  useEffect(() => {
    console.log('Preloader mounted');
    // Simulate loading time
    const timer = setTimeout(() => {
      console.log('Preloader animation complete');
      setAnimationComplete(true);
      
      // Add a small delay before calling onComplete
      setTimeout(() => {
        console.log('Calling onComplete callback');
        try {
          onComplete();
        } catch (error) {
          console.error('Error in preloader onComplete:', error);
          // Fallback: force complete after error
          setAnimationComplete(true);
        }
      }, 500);
    }, 2800);

    // Fallback timer in case the animation doesn't complete
    const fallbackTimer = setTimeout(() => {
      console.log('Fallback: Forcing preloader completion');
      setAnimationComplete(true);
      onComplete();
    }, 5000);
    
    return () => {
      console.log('Preloader unmounting, clearing timers');
      clearTimeout(timer);
      clearTimeout(fallbackTimer);
    };
  }, [onComplete]);

  // Toggle between animation types (you can implement this if needed)
  useEffect(() => {
    // In a real app, you could randomly choose an animation
    // or base it on user preferences
    setAnimationType(Math.random() > 0.5 ? 'text' : 'icons');
  }, []);

  // Text-based animation
  const TextAnimation = () => (
    <div className="flex flex-col items-center justify-center">
      <h1 className="text-4xl md:text-6xl font-bold text-pick-blue relative overflow-hidden">
        {['P', 'i', 'c', 'k', 'C', 'r', 'e', 'a', 't', 'o', 'r'].map((letter, index) => (
          <motion.span
            key={index}
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              duration: 0.3,
              delay: 0.1 * index,
              ease: [0.22, 1, 0.36, 1]
            }}
            className="inline-block"
          >
            {letter}
          </motion.span>
        ))}
      </h1>
      <motion.span 
        className="mt-4 text-gray-500 text-lg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.6 }}
      >
        Where Brands & Influencers Meet
      </motion.span>
      <motion.div 
        className="mt-8 h-1 w-24 bg-gradient-to-r from-pick-blue to-pick-purple rounded-full"
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: 96, opacity: 1 }}
        transition={{ delay: 1.8, duration: 0.6 }}
      />
    </div>
  );

  // Icon-based animation
  const IconAnimation = () => (
    <div className="flex flex-col items-center justify-center">
      <div className="relative h-20 w-80 flex items-center justify-center">
        <motion.div
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="absolute"
        >
          <Store className="w-12 h-12 text-pick-orange" />
        </motion.div>
        
        <motion.div
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="absolute"
        >
          <Smartphone className="w-12 h-12 text-pick-purple" />
        </motion.div>
        
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 1, duration: 0.8, ease: "easeOut" }}
          className="absolute z-10 bg-white rounded-full p-2 shadow-xl"
        >
          <div className="text-3xl font-bold bg-gradient-to-r from-pick-blue to-pick-purple bg-clip-text text-transparent">
            PC
          </div>
        </motion.div>
      </div>
      
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.6 }}
        className="mt-8 text-xl text-gray-700 font-medium"
      >
        PickCreator
      </motion.h2>
      
      <motion.div 
        className="mt-6 h-1 w-24 bg-gradient-to-r from-pick-orange to-pick-purple rounded-full"
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: 96, opacity: 1 }}
        transition={{ delay: 1.8, duration: 0.6 }}
      />
    </div>
  );

  return (
    <AnimatePresence mode="wait">
      {!animationComplete && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-white"
        >
          {animationType === 'text' ? <TextAnimation /> : <IconAnimation />}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Preloader;
