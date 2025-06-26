'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Pin, Trash2, AlertCircle, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';
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
    <div className="py-4">
      {/* Remove Notice Board heading, make notice area wider and bigger */}
      <div className="mb-6">
        {/* Admin Add Note Button - always visible for admins */}
        {isAdmin && (
          <div className="flex justify-end mb-2">
            <Button
              onClick={() => setOpen(true)}
              className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold px-4 py-2 rounded-full shadow-lg dark:bg-gradient-to-r dark:from-fuchsia-700 dark:to-yellow-600 dark:text-yellow-100 dark:hover:from-fuchsia-800 dark:hover:to-yellow-700 transition"
            >
              <Plus className="mr-2 h-5 w-5" /> Add Notice
            </Button>
          </div>
        )}
        {loading ? (
          <div className="flex justify-center items-center h-[360px] bg-white dark:bg-gray-900 rounded-xl">
            <svg className="animate-spin h-5 w-5 text-gray-400" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        ) : notices.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[360px] bg-white dark:bg-gray-900 rounded-xl">
            <AlertCircle className="h-8 w-8 text-gray-400 mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No updates yet
            </p>
          </div>
        ) : (
          <div className="relative">
            <div 
              ref={slideContainer}
              className="overflow-hidden bg-white dark:bg-gray-900 rounded-xl"
            >
              <div
                className="flex transition-transform duration-300 ease-out"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {notices.map((notice, index) => (
                  <div
                    key={notice._id}
                    className="relative w-full flex-shrink-0 flex justify-center items-start"
                    style={{ width: '100%' }}
                  >
                    <div
                      className="sticky-note w-full max-w-3xl mx-auto mt-8 mb-8 px-8 py-6 relative dark:bg-gradient-to-br dark:from-[#2a1746] dark:to-[#1a102b] dark:border-yellow-400 dark:shadow-[0_0_32px_0_rgba(255,221,77,0.18)]"
                      style={{
                        minHeight: '160px',
                        background: 'linear-gradient(135deg, #fffbe6 90%, #ffe066 100%)',
                        boxShadow: '0 6px 32px 0 rgba(0,0,0,0.13), 0 2px 8px 0 rgba(80,80,80,0.13)',
                        borderRadius: '16px',
                        border: '2px solid #ffe066',
                        fontFamily: '"Comic Sans MS", "Comic Sans", cursive',
                        position: 'relative',
                        overflow: 'visible',
                      }}
                    >
                      {/* Folded corner */}
                      <div
                        style={{
                          position: 'absolute',
                          right: 0,
                          bottom: 0,
                          width: '48px',
                          height: '48px',
                          background: 'linear-gradient(135deg, #ffe066 60%, #fffbe6 100%)',
                          clipPath: 'polygon(100% 0, 0 100%, 100% 100%)',
                          boxShadow: '-2px 2px 8px 0 rgba(0,0,0,0.10)',
                          zIndex: 2,
                        }}
                        className="dark:bg-gradient-to-br dark:from-yellow-500 dark:to-yellow-700"
                      />
                      <div className="flex items-center gap-3 mb-2">
                        <div className="relative h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium overflow-hidden bg-yellow-200 text-yellow-900 border border-yellow-300 dark:bg-yellow-700 dark:text-yellow-100 dark:border-yellow-400">
                          {notice.createdBy.avatar ? (
                            <img
                              src={notice.createdBy.avatar}
                              alt={notice.createdBy.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            notice.createdBy.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-base text-yellow-900 dark:text-yellow-100 dark:drop-shadow-[0_1px_2px_rgba(255,221,77,0.25)]">
                            {notice.title}
                          </h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-yellow-700 dark:text-yellow-200">
                              {notice.createdBy.name}
                            </span>
                            <span className="text-xs text-yellow-500 tabular-nums dark:text-yellow-300">
                              {formatDistanceToNow(new Date(notice.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-yellow-500 hover:text-red-500 ml-auto"
                            onClick={() => deleteNotice(notice._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      {/* Collapsible content */}
                      <NoticeContentPreview content={notice.content} />
                      {notice.isPinned && (
                        <div className="mt-1 flex items-center gap-1.5 text-yellow-700 text-[13px] dark:text-yellow-200">
                          <span className="font-medium">Pinned</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {notices.length > 1 && (
              <>
                <div className="absolute inset-y-0 left-0 flex items-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 bg-white/90 dark:bg-gray-900/90 shadow-sm border border-gray-200/50 dark:border-gray-800/50 rounded-full -ml-4"
                    onClick={handlePrevSlide}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </div>
                <div className="absolute inset-y-0 right-0 flex items-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 bg-white/90 dark:bg-gray-900/90 shadow-sm border border-gray-200/50 dark:border-gray-800/50 rounded-full -mr-4"
                    onClick={handleNextSlide}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {notices.map((_, index) => (
                    <button
                      key={index}
                      className={
                        `h-1.5 rounded-full transition-all ${currentSlide === index 
                          ? 'w-4 bg-violet-600 dark:bg-violet-400' 
                          : 'w-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'}`
                      }
                      onClick={() => setCurrentSlide(index)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
      {/* Dialog for creating new notice */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Notice</DialogTitle>
          </DialogHeader>
          <form onSubmit={createNotice} className="space-y-4">
            <div className="space-y-2">
              <Input
                ref={titleRef}
                placeholder="Title"
                required
                className="h-9"
              />
              <Textarea
                ref={contentRef}
                placeholder="Write your announcement..."
                rows={6}
                required
                className="resize-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="isPinned"
                checked={isPinned}
                onCheckedChange={(checked) => setIsPinned(checked as boolean)}
              />
              <label htmlFor="isPinned" className="text-sm">
                Pin this notice
              </label>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
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
      <div className="mt-10">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Meet the Creators & Brands</h3>
        {loadingInfluencers ? (
          <div className="flex justify-center items-center h-24">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : verifiedInfluencers.length === 0 ? (
          <div className="text-center text-gray-400 text-sm">No verified influencers found.</div>
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

// Add this helper component above the return statement:

function NoticeContentPreview({ content }: { content: string }) {
  const [expanded, setExpanded] = useState(false);
  const maxChars = 90;
  const isLong = content.length > maxChars;
  return (
    <div
      className="text-lg leading-relaxed whitespace-pre-wrap mt-3 mb-2 font-[Comic_Sans_MS] tracking-wide text-yellow-900 dark:text-yellow-100 dark:drop-shadow-[0_2px_8px_rgba(255,221,77,0.25)] dark:font-semibold"
      style={{ lineHeight: 1.8, letterSpacing: '0.02em' }}
    >
      {expanded || !isLong ? content : content.slice(0, maxChars) + '...'}
      {isLong && (
        <button
          className="ml-2 text-yellow-700 hover:underline text-base font-semibold dark:text-yellow-300 dark:hover:text-yellow-100"
          onClick={() => setExpanded((e) => !e)}
        >
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}
    </div>
  );
}

// InfluencerCard component for verified influencers
function InfluencerCard({ influencer }: { influencer: any }) {
  // Use profilePictureUrl for avatar, name for display, followers for count
  const instaUrl = influencer.instagramUsername ? `https://instagram.com/${influencer.instagramUsername}` : undefined;
  return (
    <div className="flex flex-col items-center bg-[#fdf6f0] rounded-2xl p-6 min-w-[210px] max-w-[240px] shadow-md border border-[#f5e6d6] transition-transform hover:scale-105 cursor-pointer scrollbar-hide dark:bg-gradient-to-br dark:from-[#2a1746] dark:to-[#1a102b] dark:border-yellow-400 dark:shadow-[0_0_16px_0_rgba(255,221,77,0.18)]">
      <div className="w-28 h-28 rounded-2xl overflow-hidden mb-3 bg-[#fbead9] flex items-center justify-center dark:bg-yellow-700">
        {influencer.profilePictureUrl ? (
          <img
            src={influencer.profilePictureUrl}
            alt={influencer.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-4xl font-bold text-[#c2a07e] dark:text-yellow-200">
            {influencer.name ? influencer.name.charAt(0).toUpperCase() : '?'}
          </span>
        )}
      </div>
      <div className="text-base font-semibold text-gray-900 mb-1 dark:text-yellow-100">
        {instaUrl ? (
          <a
            href={instaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline text-[#b48b5e] dark:text-yellow-300"
          >
            @{influencer.instagramUsername}
          </a>
        ) : (
          `@${influencer.name}`
        )}
      </div>
      <div className="text-sm text-[#b48b5e] dark:text-yellow-200">{formatFollowers(influencer.followers || 0)} followers</div>
    </div>
  );
}

function formatFollowers(count: number) {
  if (count >= 1000) {
    return (count / 1000).toFixed(count % 1000 === 0 ? 0 : 1) + 'K';
  }
  return count.toLocaleString();
}