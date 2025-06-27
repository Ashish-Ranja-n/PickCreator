import React from 'react';
import { createPortal } from 'react-dom';
import "@/app/globals.css";
import { motion } from 'framer-motion';
import { BellIcon, SunIcon, MoonIcon, BugAntIcon } from '@heroicons/react/24/outline';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useTheme } from 'next-themes';

const Navbar: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [bugDialogOpen, setBugDialogOpen] = React.useState(false);
  const [bugTitle, setBugTitle] = React.useState('');
  const [bugDescription, setBugDescription] = React.useState('');
  const [bugSubmitting, setBugSubmitting] = React.useState(false);
  const [bugSuccess, setBugSuccess] = React.useState(false);
  const [bugError, setBugError] = React.useState('');

  const handleBugSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBugSubmitting(true);
    setBugError('');
    setBugSuccess(false);
    try {
      const res = await fetch('/api/bug-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: bugTitle, description: bugDescription }),
      });
      if (!res.ok) throw new Error('Failed to submit bug report');
      setBugSuccess(true);
      setBugTitle('');
      setBugDescription('');
      setTimeout(() => setBugDialogOpen(false), 1200);
    } catch (err: any) {
      setBugError(err.message || 'Failed to submit bug report');
    } finally {
      setBugSubmitting(false);
    }
  };
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
        
        {/* Logo section with modern tech style */}
        <div className="flex items-center justify-start relative">
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

          {/* Bug report button and dialog */}
          {/* Bug report button */}
          <motion.button
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Report a bug"
            onClick={() => setBugDialogOpen(true)}
            type="button"
          >
            <BugAntIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          </motion.button>
          {/* Bug report dialog rendered in a portal to escape navbar stacking context */}
          {bugDialogOpen && typeof window !== 'undefined' && (() => {
            const modalRoot = document.getElementById('modal-root') || (() => {
              const el = document.createElement('div');
              el.id = 'modal-root';
              document.body.appendChild(el);
              return el;
            })();
            return createPortal(
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <div
                  style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    background: 'rgba(0,0,0,0.4)',
                    backdropFilter: 'blur(6px)',
                    zIndex: 9998,
                  }}
                  onClick={() => setBugDialogOpen(false)}
                />
                <div
                  style={{
                    position: 'relative',
                    zIndex: 10000,
                    background: theme === 'dark' ? '#18181b' : '#fff',
                    borderRadius: '1rem',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
                    padding: '1.5rem',
                    width: '100%',
                    maxWidth: 400,
                    border: theme === 'dark' ? '1px solid #374151' : '1px solid #e5e7eb',
                  }}
                >
                  <h2 className="text-lg font-bold mb-2 text-gray-800 dark:text-gray-100">Report a Bug</h2>
                  <form onSubmit={handleBugSubmit} className="space-y-3">
                    <Input
                      placeholder="Bug title"
                      value={bugTitle}
                      onChange={e => setBugTitle(e.target.value)}
                      required
                      className="border-gray-300 dark:border-gray-700"
                    />
                    <Textarea
                      placeholder="Describe the bug..."
                      value={bugDescription}
                      onChange={e => setBugDescription(e.target.value)}
                      rows={4}
                      required
                      className="border-gray-300 dark:border-gray-700"
                    />
                    {bugError && <div className="text-red-500 text-sm">{bugError}</div>}
                    {bugSuccess && <div className="text-green-600 text-sm">Thank you for your report!</div>}
                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        type="button"
                        className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                        onClick={() => setBugDialogOpen(false)}
                        disabled={bugSubmitting}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 rounded bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-60"
                        disabled={bugSubmitting}
                      >
                        {bugSubmitting ? 'Submitting...' : 'Submit'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>,
              modalRoot
            );
          })()}
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
    </div>
  );
};

export default Navbar;