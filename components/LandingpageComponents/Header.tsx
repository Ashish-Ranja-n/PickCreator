import React, { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";
import { Menu, X, Sparkles, ArrowRight, Star } from 'lucide-react';

const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
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
      return isScrolled ? 'py-3' : 'py-4';
    } else if (viewportWidth <= 480) {
      return isScrolled ? 'py-3' : 'py-5';
    } else {
      return isScrolled ? 'py-4' : 'py-6';
    }
  };

  const navItems = [
    { name: 'Features', href: '#features' },
    { name: 'For Brands', href: '#brands' },
    { name: 'For Creators', href: '#creators' },
    { name: 'Pricing', href: '#pricing' },
  ];

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out",
          isScrolled
            ? "bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border-b border-zinc-200/20 dark:border-zinc-700/20 shadow-lg shadow-black/5"
            : "bg-transparent backdrop-blur-sm",
          getHeaderSize()
        )}
      >
        {/* Gradient border effect */}
        <div className={cn(
          "absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent transition-opacity duration-500",
          isScrolled ? "opacity-100" : "opacity-0"
        )} />

        <div className="container-custom">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-2 select-none">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-lg blur opacity-20 animate-pulse" />
                <div className="relative bg-gradient-to-r from-violet-600 to-fuchsia-600 p-2 rounded-lg">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-black tracking-tight text-xl md:text-2xl lg:text-3xl" style={{ letterSpacing: '0.05em', fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>
                  <span className="text-zinc-900 dark:text-white">pick</span>
                  <span className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-violet-600 bg-clip-text text-transparent animate-pulse">creator</span>
                </span>
                <span className="text-xs font-semibold text-violet-600 dark:text-violet-400 tracking-widest uppercase">STUDIO</span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-8">
              {navItems.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="relative text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition-colors duration-200 group"
                >
                  {item.name}
                  <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-200" />
                </a>
              ))}
            </nav>

            {/* CTA Buttons */}
            <div className="hidden lg:flex items-center space-x-4">
              <a
                href="/welcome"
                className="text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition-colors duration-200"
              >
                Sign In
              </a>
              <a
                href="/welcome"
                className="group relative inline-flex items-center px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-full hover:from-violet-700 hover:to-fuchsia-700 transition-all duration-200 shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30 hover:-translate-y-0.5"
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-0.5 transition-transform duration-200" />
              </a>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden relative p-2 text-zinc-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition-colors duration-200"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <div className={cn(
        "fixed inset-0 z-[60] lg:hidden transition-all duration-300 ease-out",
        isMobileMenuOpen ? "opacity-100 visible" : "opacity-0 invisible"
      )}>
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
        <div className={cn(
          "absolute top-0 right-0 h-full w-80 max-w-[85vw] bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl shadow-2xl border-l border-zinc-200/50 dark:border-zinc-700/50 transition-transform duration-300 ease-out",
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        )}>
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-700">
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-lg blur opacity-20" />
                  <div className="relative bg-gradient-to-r from-violet-600 to-fuchsia-600 p-1.5 rounded-lg">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                </div>
                <span className="font-black text-lg">
                  <span className="text-zinc-900 dark:text-white">pick</span>
                  <span className="bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">creator</span>
                </span>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 px-6 py-8 space-y-6">
              {navItems.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block text-lg font-medium text-zinc-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition-colors duration-200"
                >
                  {item.name}
                </a>
              ))}
            </nav>

            <div className="p-6 border-t border-zinc-200 dark:border-zinc-700 space-y-4">
              <a
                href="/welcome"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block w-full text-center py-3 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition-colors duration-200"
              >
                Sign In
              </a>
              <a
                href="/welcome"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block w-full text-center py-3 px-6 text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-full hover:from-violet-700 hover:to-fuchsia-700 transition-all duration-200 shadow-lg shadow-violet-500/25"
              >
                Get Started
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;
