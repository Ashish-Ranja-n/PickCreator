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

  return (
    <div className="py-4">
      <div className="flex items-center gap-2 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Notice Board
        </h2>
        {notices.length > 0 && (
          <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full">
            {notices.length}
          </span>
        )}
        {isAdmin && (
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto"
            onClick={() => setOpen(true)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>

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
                  className="w-full flex-shrink-0"
                  style={{ width: '100%' }}
                >
                  <div className="p-5 h-[360px] flex flex-col">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`
                          relative h-9 w-9 rounded-full flex items-center justify-center text-sm font-medium overflow-hidden
                          ${notice.isPinned 
                            ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 ring-1 ring-violet-200 dark:ring-violet-800' 
                            : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                          }
                        `}>
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
                          <h3 className={`
                            font-medium text-sm
                            ${notice.isPinned 
                              ? 'text-violet-600 dark:text-violet-400' 
                              : 'text-gray-900 dark:text-gray-100'
                            }
                          `}>
                            {notice.title}
                          </h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {notice.createdBy.name}
                            </span>
                            <span className="text-xs text-gray-400 dark:text-gray-500 tabular-nums">
                              {formatDistanceToNow(new Date(notice.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      </div>
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-400 hover:text-red-500"
                          onClick={() => deleteNotice(notice._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent">
                      <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                        {notice.content}
                      </p>
                    </div>

                    {notice.isPinned && (
                      <div className="mt-4 flex items-center gap-1.5 text-violet-600 dark:text-violet-400">
                        <Pin className="h-3.5 w-3.5" />
                        <span className="text-xs font-medium">Pinned</span>
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
                    className={`
                      h-1.5 rounded-full transition-all
                      ${currentSlide === index 
                        ? 'w-4 bg-violet-600 dark:bg-violet-400' 
                        : 'w-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                      }
                    `}
                    onClick={() => setCurrentSlide(index)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

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
    </div>
  );
}