import React from 'react';
import { Badge } from "@/components/ui/badge";
import { DealProgressProps } from './types';

export const DealProgress: React.FC<DealProgressProps> = ({ 
  progress, 
  variant = 'compact',
  className = '' 
}) => {
  if (variant === 'detailed') {
    // Timeline style layout (like brand page)
    return (
      <div className={`relative pl-6 border-l-2 border-gray-200 dark:border-zinc-700 ${className}`}>
        <div className="space-y-6">
          {/* Payment Made */}
          <div className="relative">
            <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-3 h-3 -ml-[7px] rounded-full ${progress.paid ? 'bg-green-500' : 'bg-gray-300'} ring-4 ring-white dark:ring-black`} />
            <div className="ml-4">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {progress.paid ? '✓ Payment Made' : 'Payment Made'}
              </span>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                Payment has been processed
              </p>
            </div>
          </div>

          {/* Content Published */}
          <div className="relative">
            <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-3 h-3 -ml-[7px] rounded-full ${progress.contentPublished ? 'bg-green-500' : 'bg-gray-300'} ring-4 ring-white dark:ring-black`} />
            <div className="ml-4">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {progress.contentPublished ? '✓ Content Published' : 'Content Published'}
              </span>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                Content has been published and approved
              </p>
            </div>
          </div>

          {/* Payment Released */}
          <div className="relative">
            <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-3 h-3 -ml-[7px] rounded-full ${progress.paymentReleased ? 'bg-green-500' : 'bg-gray-300'} ring-4 ring-white dark:ring-black`} />
            <div className="ml-4">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {progress.paymentReleased ? '✓ Payment Released' : 'Payment Released'}
              </span>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                Payment has been released to influencer
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Compact style layout (like influencer page)
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500 dark:text-zinc-400">Payment Status</span>
        <Badge className={progress.paid ? 'bg-green-100/80 text-green-700 border border-green-300/50 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700/50' : 'bg-yellow-100/80 text-yellow-700 border border-yellow-300/50 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700/50'}>
          {progress.paid ? 'Paid' : 'Unpaid'}
        </Badge>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500 dark:text-zinc-400">Content Status</span>
        <Badge className={progress.contentPublished ? 'bg-green-100/80 text-green-700 border border-green-300/50 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700/50' : 'bg-yellow-100/80 text-yellow-700 border border-yellow-300/50 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700/50'}>
          {progress.contentPublished ? 'Published' : 'Pending'}
        </Badge>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500 dark:text-zinc-400">Payment Release</span>
        <Badge className={progress.paymentReleased ? 'bg-green-100/80 text-green-700 border border-green-300/50 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700/50' : 'bg-yellow-100/80 text-yellow-700 border border-yellow-300/50 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700/50'}>
          {progress.paymentReleased ? 'Released' : 'Pending'}
        </Badge>
      </div>
    </div>
  );
};

export default DealProgress;
