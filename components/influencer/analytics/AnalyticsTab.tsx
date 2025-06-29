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
    <div className="py-6 px-2 sm:px-6 min-h-screen transition-colors bg-gradient-to-br from-[#f5f6fa] to-[#e9eafc] dark:from-[#181c20] dark:to-[#23272e]">
      {/* Notice Board Section - Professional & Mobile First */}
  <section className="mb-6 w-full max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-2 px-1">
          <h2 className="text-lg sm:text-xl font-bold text-[#2d3a4a] dark:text-[#e3e6ea] tracking-tight">Notice Board</h2>
          {isAdmin && (
            <Button
              onClick={() => setOpen(true)}
              className="bg-[#3a4250] hover:bg-[#232a34] text-[#e3e6ea] font-semibold px-4 py-1.5 rounded-lg shadow-md text-sm sm:text-base border border-[#232a34] dark:border-[#232a34]"
            >
              <Plus className="mr-1 h-4 w-4" /> Add Notice
            </Button>
          )}
        </div>
        <div className="relative w-full flex flex-col items-center">
          {loading ? (
            <div className="flex justify-center items-center h-16 bg-white/80 dark:bg-[#23272e] rounded-xl shadow-md w-full">
              <Loader2 className="h-7 w-7 animate-spin text-[#3a4250] dark:text-[#e3e6ea]" />
            </div>
          ) : notices.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-16 bg-white/80 dark:bg-[#23272e] rounded-xl shadow-md w-full">
              <AlertCircle className="h-8 w-8 text-[#b0b8c1] dark:text-[#7a8599] mb-1" />
              <p className="text-sm text-[#6b7a8f] dark:text-[#aeb4bb]">No updates yet</p>
            </div>
          ) : (
            <div className="relative w-full flex items-center bg-white dark:bg-[#23272e] rounded-xl shadow-lg border border-slate-200 dark:border-[#232a34] h-16 px-2 sm:px-4 overflow-hidden">
              {/* Prev Button */}
              {notices.length > 1 && (
                <button
                  className="absolute left-1 sm:left-2 z-10 p-1 rounded-full bg-white/80 dark:bg-[#232a34] hover:bg-[#e3e6ea] dark:hover:bg-[#353c47] transition"
                  onClick={() => { handlePrevSlide(); resetInterval(); }}
                  aria-label="Previous notice"
                  style={{ top: '50%', transform: 'translateY(-50%)' }}
                >
                  <ChevronLeft className="h-4 w-4 text-[#3a4250] dark:text-[#e3e6ea]" />
                </button>
              )}
              {/* Notice Marquee */}
              <div className="flex-1 flex flex-col items-center justify-center h-full select-none min-w-0">
                <div className="flex items-center gap-2 mb-0.5 w-full min-w-0">
                  <span className="font-semibold text-sm sm:text-base text-[#2d3a4a] dark:text-[#e3e6ea] truncate max-w-[120px] sm:max-w-[180px]">{notices[currentSlide]?.title}</span>
                  {notices[currentSlide]?.isPinned && (
                    <Pin className="h-3.5 w-3.5 text-[#3a4250] dark:text-[#aeb4bb]" />
                  )}
                </div>
                <MarqueeText text={notices[currentSlide]?.content || ''} speed={40} />
              </div>
              {/* Delete button for admin */}
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2 text-[#3a4250] dark:text-[#e3e6ea] hover:text-red-500"
                  onClick={() => deleteNotice(notices[currentSlide]._id)}
                  aria-label="Delete notice"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              {/* Next Button */}
              {notices.length > 1 && (
                <button
                  className="absolute right-1 sm:right-2 z-10 p-1 rounded-full bg-white/80 dark:bg-[#232a34] hover:bg-[#e3e6ea] dark:hover:bg-[#353c47] transition"
                  onClick={() => { handleNextSlide(); resetInterval(); }}
                  aria-label="Next notice"
                  style={{ top: '50%', transform: 'translateY(-50%)' }}
                >
                  <ChevronRight className="h-4 w-4 text-[#3a4250] dark:text-[#e3e6ea]" />
                </button>
              )}
            </div>
          )}
        </div>
      </section>
      {/* Dialog for creating new notice */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md bg-white/90 dark:bg-[#23272e] rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-[#2d3a4a] dark:text-[#e3e6ea]">Create Notice</DialogTitle>
          </DialogHeader>
          <form onSubmit={createNotice} className="space-y-4">
            <div className="space-y-2">
              <Input
                ref={titleRef}
                placeholder="Title"
                required
                className="h-10 border-[#b0b8c1] dark:border-[#353c47] focus:ring-[#3a4250] dark:focus:ring-[#e3e6ea] bg-white dark:bg-[#23272e] text-[#2d3a4a] dark:text-[#e3e6ea]"
              />
              <Textarea
                ref={contentRef}
                placeholder="Write your announcement..."
                rows={6}
                required
                className="resize-none border-[#b0b8c1] dark:border-[#353c47] focus:ring-[#3a4250] dark:focus:ring-[#e3e6ea] bg-white dark:bg-[#23272e] text-[#2d3a4a] dark:text-[#e3e6ea]"
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="isPinned"
                checked={isPinned}
                onCheckedChange={(checked) => setIsPinned(checked as boolean)}
                className="accent-[#3a4250] dark:accent-[#e3e6ea]"
              />
              <label htmlFor="isPinned" className="text-sm text-[#2d3a4a] dark:text-[#aeb4bb]">
                Pin this notice
              </label>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting} className="bg-[#3a4250] hover:bg-[#232a34] text-[#e3e6ea]">
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
  <section className="mt-16 px-2 sm:px-8 py-6 max-w-6xl mx-auto">
    <h3 className="text-xl sm:text-3xl font-extrabold mb-2 tracking-tight text-center text-[#3a4250] dark:text-[#e3e6ea]">
      Influencer on our Platform
    </h3>
   {loadingInfluencers ? (
      <div className="flex justify-center items-center h-24">
        <Loader2 className="h-7 w-7 animate-spin text-[#3a4250] dark:text-[#e3e6ea]" />
      </div>
    ) : verifiedInfluencers.length === 0 ? (
      <div className="text-center text-[#3a4250] dark:text-[#aeb4bb] text-base">No verified influencers found.</div>
    ) : (
      <div className="flex flex-row gap-7 w-full max-w-5xl mx-auto overflow-x-auto pb-4 hide-scrollbar">
        {verifiedInfluencers.map((influencer, idx) => (
          <InfluencerFlatBlock key={influencer._id} influencer={influencer} index={idx} />
        ))}
      </div>
    )}
  </section>
    </div>
  );
}

// ...existing code...

// Flat, minimal influencer block with improved design and dark mode
function InfluencerFlatBlock({ influencer, index }: { influencer: any, index: number }) {
  const instaUrl = influencer.instagramUsername ? `https://instagram.com/${influencer.instagramUsername}` : undefined;
  // Appealing, soft colors for both modes
  const pastelColors = [
    '#f7fafc', '#e3e6ea', '#f0f4ef', '#f9f9f9', '#f6f8fa', '#e3e6ea', '#f5f7fa', '#f3f8f2',
    '#f8f6fa', '#eaf2fb', '#f6faff', '#f9f6fa', '#f6f9fa', '#f8f6f9', '#f6f8fa', '#f3f7fa'
  ];
  const darkPastelColors = [
    '#23272e', '#232a34', '#232d3a', '#181c20', '#353c47', '#232a34', '#23272e', '#232d3a',
    '#232a34', '#232d3a', '#23272e', '#353c47', '#232a34', '#23272e', '#232a34', '#232d3a'
  ];
  const borderColor = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? '#353c47' : '#b0b8c1';
  const bg = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? darkPastelColors[index % darkPastelColors.length]
    : pastelColors[index % pastelColors.length];
  return (
    <div
      className="flex flex-col items-center justify-start min-w-[180px] max-w-[200px] w-[180px] mx-1 transition-transform duration-200 hover:scale-105 group"
      style={{ background: bg, borderRadius: 18, padding: 0, border: `2px solid ${borderColor}` }}
    >
      <div className="w-full flex flex-col items-center">
        {influencer.profilePictureUrl ? (
          <img
            src={influencer.profilePictureUrl}
            alt={influencer.name}
            className="w-full aspect-square object-cover rounded-[18px] border-2 border-[#b0b8c1] dark:border-[#353c47] group-hover:border-[#3a4250] group-hover:shadow-xl"
            style={{ borderRadius: 18, marginBottom: 0 }}
          />
        ) : (
          <div className="w-full aspect-square flex items-center justify-center bg-[#e3e6ea] dark:bg-[#232a34] rounded-[18px] text-5xl font-extrabold text-[#3a4250] dark:text-[#e3e6ea]">
            {influencer.name ? influencer.name.charAt(0).toUpperCase() : '?'}
          </div>
        )}
      </div>
      <div className="w-full flex flex-col items-center mt-3">
        <div className="text-base font-bold text-[#2d3a4a] dark:text-[#e3e6ea] mb-0.5 text-center w-full truncate">
          {instaUrl ? (
            <a
              href={instaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline hover:text-[#353c47] dark:hover:text-[#aeb4bb] transition-colors"
            >
              @{influencer.instagramUsername}
            </a>
          ) : (
            `@${influencer.name}`
          )}
        </div>
        <div className="text-sm font-medium text-[#353c47] dark:text-[#aeb4bb] text-center w-full tracking-wide">
          {formatFollowers(influencer.followers || 0)} followers
        </div>
      </div>
    </div>
  );
}

function formatFollowers(count: number) {
  if (count >= 1000) {
    return (count / 1000).toFixed(count % 1000 === 0 ? 0 : 1) + 'K';
  }
  return count.toLocaleString();
}