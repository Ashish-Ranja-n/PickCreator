'use client';

import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Pin, Trash2, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';
import { useCurrentUser } from '@/hook/useCurrentUser';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

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
  const [verifiedInfluencers, setVerifiedInfluencers] = useState<any[]>([]);
  const [loadingInfluencers, setLoadingInfluencers] = useState(true);
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

  // Shuffle influencers for random order per user session
  function shuffleArray(array: any[]) {
    // Fisher-Yates shuffle
    const arr = array.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // Memoize the shuffled influencers for the session
  const [shuffledInfluencers, setShuffledInfluencers] = useState<any[]>([]);
  useEffect(() => {
    if (verifiedInfluencers.length > 0) {
      setShuffledInfluencers(shuffleArray(verifiedInfluencers));
    }
  }, [verifiedInfluencers]);

  return (
    <div className="min-h-screen px-2 sm:px-6 py-10 bg-white dark:bg-black transition-colors">
      {/* Notice Board Section - Mobile-First Compact Design */}
      <section className="mb-6 w-full max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-2 px-1">
          <h2 className="text-base sm:text-lg font-bold bg-gradient-to-r from-fuchsia-400 to-violet-400 bg-clip-text text-transparent tracking-tight">Notice Board</h2>
          {isAdmin && (
            <Button
              onClick={() => setOpen(true)}
              className="bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-800 dark:text-white font-medium px-2 py-1 rounded-lg shadow-sm text-xs border border-gray-200 dark:border-zinc-700"
            >
              <Plus className="mr-1 h-3 w-3" /> Add
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-16 bg-white dark:bg-zinc-900 rounded-xl shadow-sm w-full">
            <Loader2 className="h-5 w-5 animate-spin text-fuchsia-500 dark:text-white" />
          </div>
        ) : notices.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-16 bg-white dark:bg-zinc-900 rounded-xl shadow-sm w-full">
            <AlertCircle className="h-5 w-5 text-blue-400 dark:text-zinc-500 mb-1" />
            <p className="text-xs text-gray-500 dark:text-zinc-400">No updates yet</p>
          </div>
        ) : (
          <div className="relative">
            {/* Horizontal Scrollable Notice Cards */}
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 snap-x snap-mandatory">
              {/* Pinned Notices First */}
              {notices
                .filter(notice => notice.isPinned)
                .map((notice) => (
                  <CompactNoticeCard key={notice._id} notice={notice} isPinned={true} isAdmin={isAdmin} onDelete={deleteNotice} />
                ))}

              {/* Regular Notices */}
              {notices
                .filter(notice => !notice.isPinned)
                .map((notice) => (
                  <CompactNoticeCard key={notice._id} notice={notice} isPinned={false} isAdmin={isAdmin} onDelete={deleteNotice} />
                ))}
            </div>

            {/* Notice Count Indicator */}
            {notices.length > 1 && (
              <div className="flex justify-center mt-2">
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-zinc-800 rounded-full px-2 py-1">
                  <div className="flex gap-1">
                    {notices.slice(0, Math.min(notices.length, 5)).map((_, index) => (
                      <div
                        key={index}
                        className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-zinc-600"
                      />
                    ))}
                    {notices.length > 5 && (
                      <span className="text-xs text-gray-500 dark:text-zinc-400 ml-1">+{notices.length - 5}</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </section>
      {/* Dialog for creating new notice */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">Create Notice</DialogTitle>
          </DialogHeader>
          <form onSubmit={createNotice} className="space-y-4">
            <div className="space-y-2">
              <Input
                ref={titleRef}
                placeholder="Title"
                required
                className="h-10 border-gray-300 dark:border-zinc-700 focus:ring-violet-500 dark:focus:ring-fuchsia-500 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white"
              />
              <Textarea
                ref={contentRef}
                placeholder="Write your announcement..."
                rows={6}
                required
                className="resize-none border-gray-300 dark:border-zinc-700 focus:ring-violet-500 dark:focus:ring-fuchsia-500 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="isPinned"
                checked={isPinned}
                onCheckedChange={(checked) => setIsPinned(checked as boolean)}
                className="accent-violet-500 dark:accent-fuchsia-500"
              />
              <label htmlFor="isPinned" className="text-sm text-gray-700 dark:text-zinc-400">
                Pin this notice
              </label>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-violet-500 to-fuchsia-500 dark:from-violet-600 dark:to-fuchsia-600 text-white">
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
        <h3 className="text-2xl sm:text-3xl font-extrabold mb-2 tracking-tight text-center bg-gradient-to-r from-fuchsia-400 to-violet-400 bg-clip-text text-transparent">
          Influencers on our Platform
        </h3>
        {loadingInfluencers ? (
          <div className="flex justify-center items-center h-24">
            <Loader2 className="h-7 w-7 animate-spin text-fuchsia-500 dark:text-white" />
          </div>
        ) : shuffledInfluencers.length === 0 ? (
          <div className="text-center text-gray-700 dark:text-zinc-400 text-base">No verified influencers found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 w-full max-w-3xl mx-auto">
            {shuffledInfluencers.map((influencer) => (
              <InfluencerFlatBlock key={influencer._id} influencer={influencer} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// Compact Notice Card Component for Mobile-First Horizontal Scrolling
interface CompactNoticeCardProps {
  notice: Notice;
  isPinned: boolean;
  isAdmin: boolean;
  onDelete: (id: string) => void;
}

function CompactNoticeCard({ notice, isPinned, isAdmin, onDelete }: CompactNoticeCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const contentPreview = notice.content.length > 80 ? notice.content.slice(0, 80) + '...' : notice.content;
  const needsExpansion = notice.content.length > 80;

  return (
    <div className={`relative group flex-shrink-0 w-72 sm:w-80 bg-white dark:bg-zinc-900 rounded-xl border transition-all duration-200 hover:shadow-lg snap-start ${
      isPinned
        ? 'border-amber-300 dark:border-amber-700/50 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 shadow-amber-100 dark:shadow-amber-900/20'
        : 'border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700'
    }`}>
      {/* Pin indicator */}
      {isPinned && (
        <div className="absolute top-2 right-2 z-10">
          <Pin className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
        </div>
      )}

      {/* Delete button for admin */}
      {isAdmin && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-red-500 h-6 w-6"
          onClick={() => onDelete(notice._id)}
          aria-label="Delete notice"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      )}

      <div className="p-3">
        {/* Header */}
        <div className="mb-2">
          <h3 className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-1 pr-6">
            {notice.title}
          </h3>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-xs text-gray-500 dark:text-zinc-400 truncate">
              {notice.createdBy.name}
            </span>
            <span className="text-xs text-gray-400 dark:text-zinc-500">•</span>
            <span className="text-xs text-gray-500 dark:text-zinc-400">
              {formatDistanceToNow(new Date(notice.createdAt), { addSuffix: true })}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="text-xs text-gray-700 dark:text-zinc-300 leading-relaxed">
          <div className={isExpanded ? '' : 'line-clamp-3'}>
            {isExpanded ? notice.content : contentPreview}
          </div>
          {needsExpansion && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-1 text-fuchsia-600 dark:text-fuchsia-400 hover:text-fuchsia-700 dark:hover:text-fuchsia-300 font-medium text-xs"
            >
              {isExpanded ? 'Less' : 'More'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Flat, minimal influencer block with improved design and dark mode
function InfluencerFlatBlock({ influencer }: { influencer: any }) {
  const instaUrl = influencer.instagramUsername ? `https://instagram.com/${influencer.instagramUsername}` : undefined;

  // Use a larger image size, similar to the original vertical card (full width, aspect-square)
  return (
    <div className="flex flex-row items-start min-w-[340px] max-w-[500px] w-full mx-1 transition-transform duration-200 hover:scale-105 group" style={{ borderRadius: 18, padding: 0 }}>
      {/* Profile Picture: cover half the horizontal space, always square */}
      <div className="flex-shrink-0 flex items-center justify-center" style={{ width: '50%', aspectRatio: '1 / 1' }}>
        {influencer.profilePictureUrl ? (
          <img
            src={influencer.profilePictureUrl}
            alt={influencer.name}
            className="w-full h-full object-cover rounded-[18px] border-2 border-[#b0b8c1] dark:border-zinc-700 group-hover:border-[#3a4250] group-hover:shadow-xl"
            style={{ borderRadius: 18, marginBottom: 0, width: '100%', height: '100%', aspectRatio: '1 / 1' }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#e3e6ea] dark:bg-zinc-800 rounded-[18px] text-5xl font-extrabold text-[#3a4250] dark:text-white" style={{ aspectRatio: '1 / 1' }}>
            {influencer.name ? influencer.name.charAt(0).toUpperCase() : '?'}
          </div>
        )}
      </div>
      {/* Info to the right of the picture */}
      <div className="flex flex-col justify-center flex-1 pl-4 min-w-0">
        <div className="text-base font-bold text-[#2d3a4a] dark:text-white mb-0.5 truncate">
          {instaUrl ? (
            <a
              href={instaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline hover:text-[#353c47] dark:hover:text-zinc-400 transition-colors"
            >
              @{influencer.instagramUsername}
            </a>
          ) : (
            `@${influencer.name}`
          )}
        </div>
        <div className="text-sm font-medium text-[#353c47] dark:text-zinc-400 tracking-wide">
          {formatFollowers(influencer.followers || 0)} followers
        </div>
        {influencer.bio && (
          <div className="text-sm text-gray-700 dark:text-zinc-300 mt-2 break-words line-clamp-3 max-w-full">
            {influencer.bio}
          </div>
        )}
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