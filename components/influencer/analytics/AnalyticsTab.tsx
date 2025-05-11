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
    <div className="py-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Announcements & Updates
        </h2>

        {isAdmin && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600">
                <Plus className="h-4 w-4 mr-2" />
                Create Notice
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Notice</DialogTitle>
              </DialogHeader>
              <form onSubmit={createNotice} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <label htmlFor="title" className="text-sm font-medium">
                    Title
                  </label>
                  <Input
                    id="title"
                    ref={titleRef}
                    placeholder="Enter notice title"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="content" className="text-sm font-medium">
                    Content
                  </label>
                  <Textarea
                    id="content"
                    ref={contentRef}
                    placeholder="Enter notice content"
                    rows={5}
                    required
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isPinned"
                    checked={isPinned}
                    onCheckedChange={(checked) => setIsPinned(checked as boolean)}
                  />
                  <label
                    htmlFor="isPinned"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Pin this notice
                  </label>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {isSubmitting ? 'Creating...' : 'Create Notice'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-fuchsia-500" />
        </div>
      ) : notices.length === 0 ? (
        <Alert className="bg-gray-50 dark:bg-zinc-800/50 border border-gray-200/50 dark:border-zinc-700/50">
          <AlertCircle className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          <AlertDescription className="text-gray-600 dark:text-gray-300">
            No announcements available at the moment.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-4">
          {notices.map((notice) => (
            <div
              key={notice._id}
              className={`
                relative border border-gray-200/70 dark:border-zinc-700/70
                rounded-lg p-4 transition-all duration-200
                ${notice.isPinned
                  ? 'bg-gradient-to-r from-violet-50/80 to-fuchsia-50/80 dark:from-violet-950/30 dark:to-fuchsia-950/30'
                  : 'bg-white/80 dark:bg-zinc-800/50 hover:bg-gray-50 dark:hover:bg-zinc-800/80'
                }
              `}
            >
              {notice.isPinned && (
                <div className="absolute top-4 right-4">
                  <Pin className="h-4 w-4 text-fuchsia-500" />
                </div>
              )}

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-medium">
                  {notice.createdBy.avatar ? (
                    <img
                      src={notice.createdBy.avatar}
                      alt={notice.createdBy.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    notice.createdBy.name.charAt(0)
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {notice.title}
                    </h3>

                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-500 hover:text-red-500 -mt-1 -mr-1"
                        onClick={() => deleteNotice(notice._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <p className="mt-1 text-gray-700 dark:text-gray-300 whitespace-pre-line">
                    {notice.content}
                  </p>

                  <div className="mt-2 flex items-center text-xs text-gray-500 dark:text-gray-400">
                    <span>Posted by {notice.createdBy.name}</span>
                    <span className="mx-1">•</span>
                    <span>{formatDistanceToNow(new Date(notice.createdAt), { addSuffix: true })}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}