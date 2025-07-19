import React from 'react';
import { createPortal } from 'react-dom';
import "@/app/globals.css";
import { motion } from 'framer-motion';
import { BellIcon, SunIcon, MoonIcon, PhoneIcon } from '@heroicons/react/24/outline';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useTheme } from 'next-themes';
import { LucideBugPlay } from 'lucide-react';
import { useCurrentUser } from '@/hook/useCurrentUser';
import { RiCustomerService2Fill } from 'react-icons/ri';

const Navbar: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [bugDialogOpen, setBugDialogOpen] = React.useState(false);
  const [bugTitle, setBugTitle] = React.useState('');
  const [bugDescription, setBugDescription] = React.useState('');
  const [bugSubmitting, setBugSubmitting] = React.useState(false);
  const [bugSuccess, setBugSuccess] = React.useState(false);
  const [bugError, setBugError] = React.useState('');
  const [helpDialogOpen, setHelpDialogOpen] = React.useState(false);
  const currentUser = useCurrentUser();

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

  const handleCall = () => {
    window.location.href = 'tel:+917301677612';
  };

  const handleWhatsApp = () => {
    window.location.href = 'https://wa.me/917301677612';
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

          {/* Help/Bug button - conditional based on user role */}
          {currentUser?.role === 'Brand' ? (
            <motion.button
              className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300 group overflow-hidden"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Get help"
              onClick={() => setHelpDialogOpen(true)}
              type="button"
            >
              {/* Enhanced shine effects */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400/20 via-blue-300/30 to-blue-400/20 dark:from-blue-500/15 dark:via-blue-400/25 dark:to-blue-500/15 animate-pulse"></div>
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/40 to-transparent dark:via-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-[shimmer_2s_ease-in-out_infinite]"></div>
              <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 dark:from-blue-400/15 dark:to-purple-400/15 blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              <RiCustomerService2Fill className="relative h-5 w-5 text-gray-600 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300" />
            </motion.button>
          ) : (
            <motion.button
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Report a bug"
              onClick={() => setBugDialogOpen(true)}
              type="button"
            >
              <LucideBugPlay className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </motion.button>
          )}
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

          {/* Help dialog for brand users */}
          {helpDialogOpen && currentUser?.role === 'Brand' && typeof window !== 'undefined' && (() => {
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
                  onClick={() => setHelpDialogOpen(false)}
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
                  <h2 className="text-lg font-bold mb-4 text-gray-800 dark:text-gray-100 text-center">Need Help?</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 text-center">
                    Get in touch with our support team
                  </p>
                  <div className="space-y-3">
                    <button
                      onClick={handleCall}
                      className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
                    >
                      <PhoneIcon className="h-5 w-5" />
                      Call Support
                    </button>
                    <button
                      onClick={handleWhatsApp}
                      className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition-colors"
                    >
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.515z"/>
                      </svg>
                      WhatsApp
                    </button>
                  </div>
                  <div className="flex justify-center mt-4">
                    <button
                      type="button"
                      className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                      onClick={() => setHelpDialogOpen(false)}
                    >
                      Close
                    </button>
                  </div>
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