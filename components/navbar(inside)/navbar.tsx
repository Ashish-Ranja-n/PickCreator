import React from 'react';
import "@/app/globals.css";
import { motion, AnimatePresence } from 'framer-motion';
import { BellIcon, UserIcon, SunIcon, MoonIcon, Bars3Icon } from '@heroicons/react/24/outline';
import { useTheme } from 'next-themes';

const Navbar: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const logoVariants = {
    hidden: { 
      opacity: 0,
      x: -10
    },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className="backdrop-blur-md bg-slate-50 dark:bg-gray-950 border-b border-slate-200/20 dark:border-slate-900 h-[50px] flex items-center justify-between px-6 relative overflow-hidden">
        {/* Background Elements with enhanced gradient */}
        <div className="absolute inset-0 dark:bg-black"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_0%,rgba(255,255,255,0.1)_20%,transparent_40%)] dark:bg-[linear-gradient(to_right,transparent_0%,rgba(255,255,255,0.05)_20%,transparent_40%)] animate-[shimmer_3s_infinite]"></div>
        
        {/* Mobile menu button */}
        <motion.button
          className="lg:hidden relative z-10"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <Bars3Icon className="h-6 w-6 text-gray-600 dark:text-gray-300" />
        </motion.button>

        {/* Logo section with modern tech style */}
        <div className="flex-grow flex items-center justify-center lg:justify-start relative">
          <motion.div
            variants={logoVariants}
            initial="hidden"
            animate="visible"
            className="relative group"
          >
            <div className="flex items-center">
              <span className="text-2xl font-semibold tracking-tight relative px-1 py-0.5">
                <span className="relative z-10 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-gray-100 dark:to-white">
                  pick
                </span>
                <motion.span
                  className="relative z-10 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-violet-600 dark:from-blue-400 dark:to-violet-400 font-bold"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  creator
                </motion.span>
                <div className="absolute inset-0 bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </span>
              <div className="h-4 w-[1px] mx-1 bg-gradient-to-b from-transparent via-slate-300 to-transparent dark:via-slate-600"></div>
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400 tracking-wider uppercase">
                Studio
              </span>
            </div>
          </motion.div>
        </div>

        {/* Right section with improved layout */}
        <div className="flex items-center space-x-4 relative">
          {mounted && (
            <motion.button
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? (
                <SunIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              ) : (
                <MoonIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              )}
            </motion.button>
          )}

          {/* Notification bell with animation */}
          <motion.button
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="relative">
              <BellIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              <motion.div 
                className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 dark:bg-red-400 rounded-full border-2 border-white dark:border-gray-900"
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </motion.button>

          {/* User profile */}
          <motion.button
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <UserIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          </motion.button>
        </div>

        {/* Animated bottom border - subtle tech style */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-[1px]"
          style={{
            background: theme === 'dark' 
              ? 'linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.2), transparent)'
              : 'linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.1), transparent)'
          }}
        />
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden backdrop-blur-md bg-white/90 dark:bg-gray-900/90 border-b border-slate-200/20 dark:border-slate-700/30"
          >
            <div className="px-4 py-4 space-y-3">
              <a href="#" className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                Dashboard
              </a>
              <a href="#" className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                Profile
              </a>
              <a href="#" className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                Settings
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Navbar;