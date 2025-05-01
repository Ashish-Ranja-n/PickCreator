import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";
import Link from 'next/link';

const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(0);

  // Track both scroll position and viewport size
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    const handleResize = () => {
      setViewportWidth(window.innerWidth);
    };

    // Initial setting
    handleResize();

    // Event listeners
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Add neon effect styles
  useEffect(() => {
    const styleId = 'neon-logo-style';
    if (!document.getElementById(styleId) && typeof document !== 'undefined') {
      const styleTag = document.createElement('style');
      styleTag.id = styleId;
      styleTag.innerHTML = `
        .neon-text {
          color: #4f46e5;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-shadow: 0 0 5px rgba(79, 70, 229, 0.7);
          display: flex;
          position: relative;
        }

        @keyframes damaged-flicker-1 {
          0%, 10%, 12%, 20%, 22%, 36%, 37%, 41%, 42%, 48%, 49.5%, 65%, 67%, 82%, 100% {
            opacity: 1;
            text-shadow: 0 0 5px rgba(79, 70, 229, 0.7);
          }
          10.5%, 20.5%, 38%, 41.5%, 50%, 66%, 83%, 91% {
            opacity: 0.2;
            text-shadow: none;
          }
          11%, 21%, 36.5%, 49%, 65.5%, 82.5% {
            opacity: 0.7;
            text-shadow: 0 0 3px rgba(79, 70, 229, 0.5);
          }
        }

        @keyframes damaged-flicker-2 {
          0%, 35%, 37%, 43%, 45%, 58%, 60%, 73%, 90%, 100% {
            opacity: 1;
            text-shadow: 0 0 5px rgba(79, 70, 229, 0.7);
          }
          36%, 44%, 59%, 74%, 91%, 96% {
            opacity: 0.15;
            text-shadow: none;
          }
          36.5%, 44.5%, 59.5%, 90.5%, 95.5% {
            opacity: 0.6;
            text-shadow: 0 0 3px rgba(79, 70, 229, 0.5);
          }
        }

        @keyframes slight-sway {
          0%, 100% { transform: rotate(-1deg); }
          50% { transform: rotate(1deg); }
        }

        .neon-container {
          display: inline-flex;
          position: relative;
          padding: 0.25rem;
          overflow: visible;
        }

        .letter-container {
          position: relative;
          display: inline-flex;
          align-items: center;
          animation: slight-sway 3s ease-in-out infinite;
          animation-delay: calc(var(--letter-index) * 0.2s);
        }

        .letter-string {
          width: 1px;
          height: 18px;
          background-color: rgba(79, 70, 229, 0.4);
          position: absolute;
          top: -18px;
          left: 50%;
          transform: translateX(-50%);
        }

        .letter-string::before {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 3px;
          height: 3px;
          background-color: rgba(79, 70, 229, 0.7);
          border-radius: 50%;
        }

        .neon-letter {
          display: inline-block;
          transform-origin: top center;
          position: relative;
        }

        /* Damaged letter styles - K and A */
        .letter-container:nth-child(3) .neon-letter {
          transform: translateY(3px) rotate(8deg);
          animation: damaged-flicker-1 7.3s infinite;
        }

        .letter-container:nth-child(3) .letter-string {
          height: 22px;
          top: -22px;
        }

        .letter-container:nth-child(8) .neon-letter {
          transform: translateY(-3px) rotate(-7deg);
          animation: damaged-flicker-2 8.1s infinite;
        }

        .letter-container:nth-child(8) .letter-string {
          height: 15px;
          top: -15px;
        }

        /* Responsive adjustments */
        @media (max-width: 480px) {
          .neon-text {
            font-size: 0.9em;
            letter-spacing: 0;
          }
        }

        @media (min-width: 481px) and (max-width: 768px) {
          .neon-text {
            font-size: 0.95em;
          }
        }
      `;
      document.head.appendChild(styleTag);
    }
  }, []);

  // Get dynamic header height based on viewport width
  const getHeaderSize = () => {
    if (viewportWidth <= 360) {
      return isScrolled ? 'py-2' : 'py-3';
    } else if (viewportWidth <= 480) {
      return isScrolled ? 'py-2.5' : 'py-4';
    } else {
      return isScrolled ? 'py-3' : 'py-5';
    }
  };

  // Get logo size based on viewport width - increased sizes
  const getLogoSize = () => {
    if (viewportWidth <= 360) {
      return 'text-2xl lg:text-3xl';
    } else if (viewportWidth <= 480) {
      return 'text-3xl lg:text-4xl';
    } else {
      return 'text-4xl lg:text-5xl';
    }
  };

  // Get button size based on viewport width
  const getButtonSize = () => {
    if (viewportWidth <= 360) {
      return 'py-1.5 px-4 text-sm';
    } else if (viewportWidth <= 480) {
      return 'py-2 px-5 text-sm';
    } else {
      return 'py-2.5 px-6';
    }
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-40 transition-all duration-300",
        isScrolled
          ? "bg-white/80 backdrop-blur-lg shadow-sm"
          : "bg-transparent",
        getHeaderSize()
      )}
    >
      <div className="container-custom flex items-center justify-between">
        {/* Logo with neon style - adjusted size for mobile */}
        <a href="#" className="inline-flex items-center">
          <span className={`${getLogoSize()} font-black tracking-tight neon-container`}>
            <span className="neon-text">
              {'PICKCREATOR'.split('').map((letter, index) => (
                <span key={index} className="letter-container" style={{"--letter-index": index} as React.CSSProperties}>
                  <span className="letter-string"></span>
                  <span className="neon-letter">{letter}</span>
                </span>
              ))}
            </span>
          </span>
        </a>

        <div className="flex items-center gap-3 md:gap-4">
          {/* Search Bar - Hidden on mobile */}
          <div className="hidden md:flex items-center bg-gray-100 rounded-full px-4 py-2">
            <input
              type="text"
              placeholder="What are you looking for?"
              className="bg-transparent outline-none text-gray-700 w-48 text-sm"
            />
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Button with subtler gradient border - responsive size */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="relative group"
          >
            {/* Subtler animated gradient border */}
            <div className="absolute -inset-px rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 opacity-50 blur-[1.5px] group-hover:opacity-70 transition duration-1000 group-hover:duration-200 animate-gradient-xy"></div>

            {/* Button with glass effect - responsive size */}
            <Link
              href="/sign-up"
              className={`relative flex items-center text-gray-800 font-medium rounded-full border border-transparent bg-white shadow-sm hover:bg-white/90 transition-all duration-300 ${getButtonSize()}`}
            >
              Sign-up
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1.5 md:ml-2 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </Link>
          </motion.div>
        </div>
      </div>
    </header>
  );
};

export default Header;
