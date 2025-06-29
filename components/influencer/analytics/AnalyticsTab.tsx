'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Pin, Trash2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';
import { MarqueeText } from './MarqueeText';
import { useCurrentUser } from '@/hook/useCurrentUser';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Notice {
  _id: string;
  title: string;
  content: string;
  createdBy: {
    _id: string;
    name: string;
    avatar?: string;
  };
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AnalyticsTab() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [verifiedInfluencers, setVerifiedInfluencers] = useState<any[]>([]);
  const [loadingInfluencers, setLoadingInfluencers] = useState(true);
  const slideInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const slideContainer = useRef<HTMLDivElement>(null);
  const touchStart = useRef<number>(0);
  const touchEnd = useRef<number>(0);
  const { toast } = useToast();
  const currentUser = useCurrentUser();
  const isAdmin = currentUser?.role === 'Admin';

  // Form refs
  const titleRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  // Fetch notices
  const fetchNotices = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/notices');
      if (!response.ok) {
        throw new Error('Failed to fetch notices');
      }
      const data = await response.json();
      setNotices(data);
    } catch (error) {
      console.error('Error fetching notices:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch notices',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Create a new notice
  const createNotice = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!titleRef.current?.value || !contentRef.current?.value) {
      toast({
        title: 'Error',
        description: 'Title and content are required',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch('/api/notices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: titleRef.current.value,
          content: contentRef.current.value,
          isPinned: isPinned,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create notice');
      }

      const newNotice = await response.json();
      setNotices([newNotice, ...notices]);

      toast({
        title: 'Success',
        description: 'Notice created successfully',
      });

      // Reset form and close dialog
      if (titleRef.current) titleRef.current.value = '';
      if (contentRef.current) contentRef.current.value = '';
      setIsPinned(false);
      setOpen(false);
    } catch (error: any) {
      console.error('Error creating notice:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create notice',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete a notice
  const deleteNotice = async (id: string) => {
    if (!confirm('Are you sure you want to delete this notice?')) {
      return;
    }

    try {
      const response = await fetch(`/api/notices/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete notice');
      }

      setNotices(notices.filter(notice => notice._id !== id));

      toast({
        title: 'Success',
        description: 'Notice deleted successfully',
      });
    } catch (error: any) {
      console.error('Error deleting notice:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete notice',
        variant: 'destructive',
      });
    }
  };

  const handleSlideTransition = useCallback(() => {
    setIsTransitioning(true);
    setTimeout(() => setIsTransitioning(false), 500);
  }, []);

  const handlePrevSlide = useCallback(() => {
    if (!isTransitioning) {
      setCurrentSlide((prev) => (prev - 1 + notices.length) % notices.length);
      handleSlideTransition();
    }
  }, [notices.length, isTransitioning, handleSlideTransition]);

  const handleNextSlide = useCallback(() => {
    if (!isTransitioning) {
      setCurrentSlide((prev) => (prev + 1) % notices.length);
      handleSlideTransition();
    }
  }, [notices.length, isTransitioning, handleSlideTransition]);

  // Touch event handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStart.current = e.touches[0].clientX;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchEnd.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(() => {
    const swipeDistance = touchStart.current - touchEnd.current;
    if (Math.abs(swipeDistance) > 100) { // Minimum swipe distance
      if (swipeDistance > 0) {
        handleNextSlide();
      } else {
        handlePrevSlide();
      }
    }
    // Reset touch values
    touchStart.current = 0;
    touchEnd.current = 0;
  }, [handleNextSlide, handlePrevSlide]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePrevSlide();
      } else if (e.key === 'ArrowRight') {
        handleNextSlide();
      } else if (e.key === 'Space') {
        e.preventDefault(); // Prevent page scroll
        setIsPaused(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrevSlide, handleNextSlide]);

  // Auto-slide setup with pause functionality
  useEffect(() => {
    if (notices.length > 1 && !isPaused) {
      if (slideInterval.current) {
        clearInterval(slideInterval.current);
      }
      
      slideInterval.current = setInterval(() => {
        handleNextSlide();
      }, 5000);
    }

    return () => {
      if (slideInterval.current) {
        clearInterval(slideInterval.current);
        slideInterval.current = null;
      }
    };
  }, [notices.length, isPaused, handleNextSlide]);

  // Reset interval on manual navigation
  const resetInterval = () => {
    if (slideInterval.current) {
      clearInterval(slideInterval.current);
      slideInterval.current = null;
    }

    if (notices.length > 1) {
      slideInterval.current = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % notices.length);
      }, 5000);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchNotices();
  }, []);

  // Fetch verified influencers
  useEffect(() => {
    async function fetchInfluencers() {
      try {
        setLoadingInfluencers(true);
        const res = await fetch('/api/influencer/search?sortBy=followers&sortOrder=desc&limit=30');
        if (!res.ok) throw new Error('Failed to fetch influencers');
        const data = await res.json();
        setVerifiedInfluencers(data.influencers || []);
      } catch (e) {
        setVerifiedInfluencers([]);
      } finally {
        setLoadingInfluencers(false);
      }
    }
    fetchInfluencers();
  }, []);

  return (
    <div className="py-6 px-2 md:px-8 bg-gradient-to-br from-indigo-50 to-sky-100 dark:from-black dark:to-neutral-900 min-h-screen transition-colors">
      {/* Notice Board Section - Compact Marquee Style */}
      <div className="mb-6">
        {isAdmin && (
          <div className="flex justify-end mb-2">
            <Button
              onClick={() => setOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2 rounded-xl shadow-md transition"
            >
              <Plus className="mr-2 h-5 w-5" /> Add Notice
            </Button>
          </div>
        )}
        <div className="relative w-full flex flex-col items-center">
          {loading ? (
            <div className="flex justify-center items-center h-[80px] bg-white/80 dark:bg-neutral-900/90 rounded-2xl shadow-md w-full">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-400 dark:text-yellow-200" />
            </div>
          ) : notices.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[80px] bg-white/80 dark:bg-neutral-900/90 rounded-2xl shadow-md w-full">
              <AlertCircle className="h-10 w-10 text-slate-400 dark:text-yellow-200 mb-1" />
              <p className="text-base text-slate-500 dark:text-yellow-200">No updates yet</p>
            </div>
          ) : (
            <div className="relative w-full max-w-3xl flex items-center bg-yellow-100 dark:bg-neutral-900 rounded-2xl shadow-lg border-2 border-yellow-200 dark:border-yellow-800 h-[70px] px-4 overflow-hidden">
              {/* Prev Button */}
              {notices.length > 1 && (
                <button
                  className="absolute left-2 z-10 p-1 rounded-full bg-white/70 dark:bg-black/40 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition"
                  onClick={() => { handlePrevSlide(); resetInterval(); }}
                  aria-label="Previous notice"
                  style={{ top: '50%', transform: 'translateY(-50%)' }}
                >
                  <ChevronLeft className="h-5 w-5 text-yellow-700 dark:text-yellow-200" />
                </button>
              )}
              {/* Notice Marquee */}
              <div className="flex-1 flex flex-col items-center justify-center h-full select-none">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-base text-yellow-900 dark:text-yellow-200 truncate max-w-[180px]">{notices[currentSlide]?.title}</span>
                  {notices[currentSlide]?.isPinned && (
                    <Pin className="h-4 w-4 text-yellow-500" />
                  )}
                </div>
                <MarqueeText text={notices[currentSlide]?.content || ''} />
              </div>
              {/* Delete button for admin */}
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2 text-yellow-400 dark:text-yellow-200 hover:text-red-500"
                  onClick={() => deleteNotice(notices[currentSlide]._id)}
                  aria-label="Delete notice"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              {/* Next Button */}
              {notices.length > 1 && (
                <button
                  className="absolute right-2 z-10 p-1 rounded-full bg-white/70 dark:bg-black/40 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition"
                  onClick={() => { handleNextSlide(); resetInterval(); }}
                  aria-label="Next notice"
                  style={{ top: '50%', transform: 'translateY(-50%)' }}
                >
                  <ChevronRight className="h-5 w-5 text-yellow-700 dark:text-yellow-200" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      {/* Dialog for creating new notice */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md bg-white/90 dark:bg-neutral-900/95 rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-indigo-700 dark:text-indigo-300">Create Notice</DialogTitle>
          </DialogHeader>
          <form onSubmit={createNotice} className="space-y-4">
            <div className="space-y-2">
              <Input
                ref={titleRef}
                placeholder="Title"
                required
                className="h-10 border-indigo-200 dark:border-slate-600 focus:ring-indigo-400"
              />
              <Textarea
                ref={contentRef}
                placeholder="Write your announcement..."
                rows={6}
                required
                className="resize-none border-indigo-200 dark:border-slate-600 focus:ring-indigo-400"
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="isPinned"
                checked={isPinned}
                onCheckedChange={(checked) => setIsPinned(checked as boolean)}
                className="accent-indigo-500"
              />
              <label htmlFor="isPinned" className="text-sm text-slate-700 dark:text-slate-200">
                Pin this notice
              </label>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Posting...
                  </>
                ) : (
                  'Post'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* Influencer section below notice board */}
      <div className="mt-14">
        <h3 className="text-2xl font-bold text-slate-800 dark:text-yellow-100 mb-6 tracking-tight">Influencers on Our platform</h3>
        {loadingInfluencers ? (
          <div className="flex justify-center items-center h-24">
            <Loader2 className="h-7 w-7 animate-spin text-yellow-200" />
          </div>
        ) : verifiedInfluencers.length === 0 ? (
          <div className="text-center text-yellow-200 text-base">No verified influencers found.</div>
        ) : (
          <div className="flex gap-8 overflow-x-auto pb-2 hide-scrollbar">
            {verifiedInfluencers.map((influencer) => (
              <InfluencerCard key={influencer._id} influencer={influencer} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ...existing code...

// InfluencerCard component for verified influencers
function InfluencerCard({ influencer }: { influencer: any }) {
  // Use profilePictureUrl for avatar, name for display, followers for count
  const instaUrl = influencer.instagramUsername ? `https://instagram.com/${influencer.instagramUsername}` : undefined;
  return (
    <div className="flex flex-col items-center bg-white/80 dark:bg-slate-800/80 rounded-2xl p-6 min-w-[210px] max-w-[240px] shadow-lg border border-indigo-100 dark:border-slate-700 transition-transform hover:scale-105 cursor-pointer scrollbar-hide">
      <div className="w-24 h-24 rounded-full overflow-hidden mb-3 bg-indigo-100 flex items-center justify-center dark:bg-slate-700">
        {influencer.profilePictureUrl ? (
          <img
            src={influencer.profilePictureUrl}
            alt={influencer.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-3xl font-bold text-indigo-400 dark:text-indigo-200">
            {influencer.name ? influencer.name.charAt(0).toUpperCase() : '?'}
          </span>
        )}
      </div>
      <div className="text-base font-semibold text-slate-800 mb-1 dark:text-indigo-100">
        {instaUrl ? (
          <a
            href={instaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline text-indigo-500 dark:text-indigo-300"
          >
            @{influencer.instagramUsername}
          </a>
        ) : (
          `@${influencer.name}`
        )}
      </div>
      <div className="text-sm text-indigo-400 dark:text-indigo-200">{formatFollowers(influencer.followers || 0)} followers</div>
    </div>
  );
}

function formatFollowers(count: number) {
  if (count >= 1000) {
    return (count / 1000).toFixed(count % 1000 === 0 ? 0 : 1) + 'K';
  }
  return count.toLocaleString();
}