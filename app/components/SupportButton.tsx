import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SupportButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isHighlighted, setIsHighlighted] = useState(true);
  const phoneNumber = '+919471953026';

  useEffect(() => {
    // Remove highlight after 5 seconds
    const timer = setTimeout(() => {
      setIsHighlighted(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleCall = () => {
    window.location.href = `tel:${phoneNumber}`;
  };

  const handleWhatsApp = () => {
    window.location.href = `https://wa.me/${phoneNumber}`;
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="flex flex-col gap-2 mb-4"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCall}
              className="bg-white text-pick-blue px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 hover:bg-pick-blue hover:text-white transition-all duration-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
              Call Support
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleWhatsApp}
              className="bg-white text-[#25D366] px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 hover:bg-[#25D366] hover:text-white transition-all duration-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824zm-3.423-14.416c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm.029 18.88c-1.161 0-2.305-.292-3.318-.844l-3.677.964.984-3.595c-.607-1.052-.927-2.246-.926-3.468.001-3.825 3.113-6.937 6.937-6.937 1.856.001 3.598.723 4.907 2.034 1.31 1.311 2.031 3.054 2.03 4.908-.001 3.825-3.113 6.938-6.937 6.938z"/>
              </svg>
              WhatsApp
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative">
        {/* Pulsing background effect */}
        {isHighlighted && (
          <motion.div
            initial={{ scale: 1, opacity: 0.5 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ 
              repeat: Infinity, 
              duration: 1.5,
              ease: "easeOut"
            }}
            className="absolute inset-0 bg-pick-blue rounded-full"
          />
        )}
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className={`
            relative bg-pick-blue text-white p-4 rounded-full shadow-lg 
            flex items-center justify-center gap-2 min-w-[160px]
            ${isHighlighted ? 'ring-4 ring-pick-blue/30' : ''}
          `}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 2H3a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h7l2.5 4 2.5-4h6a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z" />
            <path d="M9 12h6" />
            <path d="M9 8h6" />
          </svg>
          <span className="font-medium">Need Help?</span>
        </motion.button>
      </div>
    </div>
  );
};

export default SupportButton; 