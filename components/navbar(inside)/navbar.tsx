import React from 'react';
import "@/app/globals.css";
import { motion } from 'framer-motion';
import { BellIcon, UsersIcon } from '@heroicons/react/24/outline';

const Navbar: React.FC = () => {
  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className="backdrop-blur-md bg-white/30 dark:bg-gray-900/50 border-b border-slate-200/20 dark:border-slate-700/30 h-[50px] flex items-center justify-between px-6 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 dark:bg-gradient-to-r dark:from-blue-900/20 dark:to-purple-900/20"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_0%,rgba(255,255,255,0.1)_20%,transparent_40%)] dark:bg-[linear-gradient(to_right,transparent_0%,rgba(255,255,255,0.03)_20%,transparent_40%)] animate-[shimmer_2s_infinite]"></div>
        
        {/* Gradient line at bottom */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-600 via-fuchsia-500 to-blue-500 dark:from-violet-500 dark:via-fuchsia-400 dark:to-blue-400"
          initial={{ opacity: 0.7, backgroundPosition: "0% 50%" }}
          animate={{
            opacity: [0.7, 0.9, 0.7],
            backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "linear"
          }}
        />

        {/* Logo section (70% width) */}
        <div className="flex-grow relative" style={{ maxWidth: '70%' }}>
          <motion.h1 
            className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-600 via-fuchsia-500 to-blue-500 dark:from-violet-400 dark:via-fuchsia-300 dark:to-blue-300"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            PICKCREATOR
          </motion.h1>
        </div>

        {/* Right section with online users and notifications */}
        <div className="flex items-center space-x-6 relative">
          {/* Online users */}
          <div className="flex items-center space-x-2">
            <div className="relative">
              <UsersIcon className="h-6 w-6 text-gray-600 dark:text-gray-300" />
              <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 dark:bg-green-400 rounded-full border-2 border-white dark:border-gray-900"></div>
            </div>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">1,234</span>
          </div>

          {/* Notification bell */}
          <motion.button
            className="relative"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <BellIcon className="h-6 w-6 text-gray-600 dark:text-gray-300" />
            <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 dark:bg-red-400 rounded-full border-2 border-white dark:border-gray-900"></div>
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default Navbar;