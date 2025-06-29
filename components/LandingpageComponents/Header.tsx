import React, { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";

const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    const handleResize = () => {
      setViewportWidth(window.innerWidth);
    };
    handleResize();
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const getHeaderSize = () => {
    if (viewportWidth <= 360) {
      return isScrolled ? 'py-2' : 'py-3';
    } else if (viewportWidth <= 480) {
      return isScrolled ? 'py-2.5' : 'py-4';
    } else {
      return isScrolled ? 'py-3' : 'py-5';
    }
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-40 transition-all duration-200",
        isScrolled ? "bg-white shadow-sm" : "bg-transparent backdrop-blur-md",
        getHeaderSize()
      )}
    >
      <div className="container-custom flex items-center justify-center">
        <div className="flex flex-col items-center justify-center select-none py-2">
          <span className="font-extrabold tracking-tight text-2xl md:text-4xl lg:text-5xl text-gray-900 dark:text-white" style={{ letterSpacing: '0.08em', fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>
            <span>
              <span style={{ color: '#222B45' }}>pick</span>
              <span style={{ background: 'linear-gradient(90deg, #3B82F6 0%, #A855F7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>creator</span>
            </span>
            <span className="mx-2 text-gray-400 font-light">|</span> <span className="text-indigo-600">STUDIO</span>
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;
