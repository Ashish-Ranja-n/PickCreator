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





  return (
    <div className="w-full max-w-md mx-auto mb-8 px-3 py-6 bg-gradient-to-br from-white via-blue-50/30 to-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-black transition-colors overflow-hidden">
      {/* Notice Board Section - Mobile-First Compact Design */}
      <section className="mb-8 w-full">
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-base sm:text-lg font-bold text-black dark:text-white tracking-tight">Notice Board</h2>
          {isAdmin && (
            <Button
              onClick={() => setOpen(true)}
              className="bg-[#3B82F6] hover:bg-blue-600 text-white font-medium px-2 py-1 rounded-lg shadow-sm text-xs border-0"
            >
              <Plus className="mr-1 h-3 w-3" /> Add
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-16 bg-white dark:bg-gray-800 rounded-xl shadow-sm w-full border border-[#C4B5FD]/20 dark:border-gray-700/50">
            <Loader2 className="h-5 w-5 animate-spin text-[#C4B5FD] dark:text-white" />
          </div>
        ) : notices.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-16 bg-white dark:bg-gray-800 rounded-xl shadow-sm w-full border border-[#C4B5FD]/20 dark:border-gray-700/50">
            <AlertCircle className="h-5 w-5 text-[#3B82F6] dark:text-gray-400 mb-1" />
            <p className="text-xs text-gray-600 dark:text-gray-300">No updates yet</p>
          </div>
        ) : (
          <div className="relative w-full">
            {/* Single Notice Display with Horizontal Scrolling */}
            <div className="overflow-x-auto scrollbar-hide snap-x snap-mandatory">
              <div className="flex">
                {/* Pinned Notices First */}
                {notices
                  .filter(notice => notice.isPinned)
                  .map((notice) => (
                    <div key={notice._id} className="flex-shrink-0 w-full snap-center px-1">
                      <CompactNoticeCard
                        notice={notice}
                        isPinned={true}
                        isAdmin={isAdmin}
                        onDelete={deleteNotice}
                      />
                    </div>
                  ))}

                {/* Regular Notices */}
                {notices
                  .filter(notice => !notice.isPinned)
                  .map((notice) => (
                    <div key={notice._id} className="flex-shrink-0 w-full snap-center px-1">
                      <CompactNoticeCard
                        notice={notice}
                        isPinned={false}
                        isAdmin={isAdmin}
                        onDelete={deleteNotice}
                      />
                    </div>
                  ))}
              </div>
            </div>

            {/* Notice Count Indicator */}
            {notices.length > 1 && (
              <div className="flex justify-center mt-3">
                <div className="flex items-center gap-1 bg-[#C4B5FD]/20 dark:bg-gray-700 rounded-full px-2 py-1">
                  <div className="flex gap-1">
                    {notices.slice(0, Math.min(notices.length, 5)).map((_, index) => (
                      <div
                        key={index}
                        className="w-1.5 h-1.5 rounded-full bg-[#C4B5FD] dark:bg-gray-500"
                      />
                    ))}
                    {notices.length > 5 && (
                      <span className="text-xs text-gray-600 dark:text-gray-300 ml-1">+{notices.length - 5}</span>
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
        <DialogContent className="sm:max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-[#C4B5FD]/30 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">Create Notice</DialogTitle>
          </DialogHeader>
          <form onSubmit={createNotice} className="space-y-4">
            <div className="space-y-2">
              <Input
                ref={titleRef}
                placeholder="Title"
                required
                className="h-10 border-[#C4B5FD]/30 dark:border-gray-600 focus:ring-[#3B82F6] dark:focus:ring-[#3B82F6] bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <Textarea
                ref={contentRef}
                placeholder="Write your announcement..."
                rows={6}
                required
                className="resize-none border-[#C4B5FD]/30 dark:border-gray-600 focus:ring-[#3B82F6] dark:focus:ring-[#3B82F6] bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="isPinned"
                checked={isPinned}
                onCheckedChange={(checked) => setIsPinned(checked as boolean)}
                className="accent-[#3B82F6] dark:accent-[#3B82F6]"
              />
              <label htmlFor="isPinned" className="text-sm text-gray-700 dark:text-gray-300">
                Pin this notice
              </label>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting} className="bg-[#3B82F6] hover:bg-blue-600 text-white">
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

  // Define color schemes for different notices
  const colorSchemes = [
    {
      // Yellow/Amber scheme
      bg: 'bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20',
      border: 'border-amber-200 dark:border-amber-700/50',
      shadow: 'shadow-amber-100 dark:shadow-amber-900/20',
      text: 'text-amber-800 dark:text-amber-200',
      moreBtn: 'text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300'
    },
    {
      // Blue scheme
      bg: 'bg-gradient-to-br from-blue-50 to-sky-50 dark:from-blue-900/20 dark:to-sky-900/20',
      border: 'border-blue-200 dark:border-blue-700/50',
      shadow: 'shadow-blue-100 dark:shadow-blue-900/20',
      text: 'text-blue-800 dark:text-blue-200',
      moreBtn: 'text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300'
    },
    {
      // Pink scheme
      bg: 'bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20',
      border: 'border-pink-200 dark:border-pink-700/50',
      shadow: 'shadow-pink-100 dark:shadow-pink-900/20',
      text: 'text-pink-800 dark:text-pink-200',
      moreBtn: 'text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300'
    },
    {
      // Purple scheme
      bg: 'bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20',
      border: 'border-purple-200 dark:border-purple-700/50',
      shadow: 'shadow-purple-100 dark:shadow-purple-900/20',
      text: 'text-purple-800 dark:text-purple-200',
      moreBtn: 'text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300'
    },
    {
      // Green scheme
      bg: 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20',
      border: 'border-green-200 dark:border-green-700/50',
      shadow: 'shadow-green-100 dark:shadow-green-900/20',
      text: 'text-green-800 dark:text-green-200',
      moreBtn: 'text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300'
    }
  ];

  // Create a more random but consistent color assignment
  const getRandomColorIndex = (noticeId: string) => {
    // Use notice ID to create a consistent but seemingly random color
    let hash = 0;
    for (let i = 0; i < noticeId.length; i++) {
      const char = noticeId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) % (colorSchemes.length - 1) + 1; // Exclude amber (index 0) for regular notices
  };

  const currentScheme = isPinned
    ? colorSchemes[0] // Always use amber/yellow for pinned notices
    : colorSchemes[getRandomColorIndex(notice._id)]; // Random but consistent color based on notice ID

  return (
    <div className={`relative group w-full bg-white dark:bg-gray-800 rounded-xl border transition-all duration-200 hover:shadow-lg ${
      isPinned
        ? `${currentScheme.bg} ${currentScheme.border} ${currentScheme.shadow}`
        : `${currentScheme.bg} ${currentScheme.border} hover:shadow-md`
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

      <div className="p-4">
        {/* Header */}
        <div className="mb-3">
          <h3 className={`font-bold text-base ${currentScheme.text} line-clamp-1 pr-6`}>
            {notice.title}
          </h3>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-xs text-gray-600 dark:text-gray-300 truncate">
              {notice.createdBy.name}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">•</span>
            <span className="text-xs text-gray-600 dark:text-gray-300">
              {formatDistanceToNow(new Date(notice.createdAt), { addSuffix: true })}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">
          <div className={isExpanded ? '' : 'line-clamp-3'}>
            {isExpanded ? notice.content : contentPreview}
          </div>
          {needsExpansion && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`mt-2 ${currentScheme.moreBtn} font-medium text-sm`}
            >
              {isExpanded ? 'Less' : 'More'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

