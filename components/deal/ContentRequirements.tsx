import React from 'react';
import {
  Film,
  Image as ImageIcon,
  CircleDashed,
  Video
} from 'lucide-react';
import { ContentRequirementsProps } from './types';

export const ContentRequirements: React.FC<ContentRequirementsProps> = ({ 
  requirements, 
  variant = 'compact',
  className = '' 
}) => {
  const hasRequirements = requirements.reels > 0 || requirements.posts > 0 || 
                         requirements.stories > 0 || requirements.lives > 0;

  if (!hasRequirements) {
    return null;
  }

  if (variant === 'detailed') {
    // Block style layout (like brand page)
    return (
      <div className={`flex flex-wrap gap-3 ${className}`}>
        {requirements.reels > 0 && (
          <div className="w-24 h-24 flex flex-col items-center justify-center bg-gray-50 dark:bg-zinc-800/50 rounded-md p-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 dark:text-zinc-400 mb-1">
              <path d="M19 2H5a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Z"></path>
              <path d="m15 11-5-3v6l5-3Z"></path>
            </svg>
            <span className="text-xl font-medium text-gray-900 dark:text-white">{requirements.reels}</span>
            <span className="text-sm text-gray-500 dark:text-zinc-400">Reels</span>
          </div>
        )}
        {requirements.posts > 0 && (
          <div className="w-24 h-24 flex flex-col items-center justify-center bg-gray-50 dark:bg-zinc-800/50 rounded-md p-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 dark:text-zinc-400 mb-1">
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
              <circle cx="9" cy="9" r="2"></circle>
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
            </svg>
            <span className="text-xl font-medium text-gray-900 dark:text-white">{requirements.posts}</span>
            <span className="text-sm text-gray-500 dark:text-zinc-400">Posts</span>
          </div>
        )}
        {requirements.stories > 0 && (
          <div className="w-24 h-24 flex flex-col items-center justify-center bg-gray-50 dark:bg-zinc-800/50 rounded-md p-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 dark:text-zinc-400 mb-1">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 8v8"></path>
              <path d="M8 12h8"></path>
            </svg>
            <span className="text-xl font-medium text-gray-900 dark:text-white">{requirements.stories}</span>
            <span className="text-sm text-gray-500 dark:text-zinc-400">Stories</span>
          </div>
        )}
        {requirements.lives > 0 && (
          <div className="w-24 h-24 flex flex-col items-center justify-center bg-gray-50 dark:bg-zinc-800/50 rounded-md p-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 dark:text-zinc-400 mb-1">
              <path d="m22 8-6 4 6 4V8Z"></path>
              <rect width="14" height="12" x="2" y="6" rx="2" ry="2"></rect>
            </svg>
            <span className="text-xl font-medium text-gray-900 dark:text-white">{requirements.lives}</span>
            <span className="text-sm text-gray-500 dark:text-zinc-400">Lives</span>
          </div>
        )}
      </div>
    );
  }

  // Compact style layout (like influencer page)
  return (
    <div className={`space-y-2 ${className}`}>
      <p className="text-sm text-gray-500 dark:text-zinc-400">Content Requirements</p>
      <div className="flex flex-wrap gap-2">
        {requirements.reels > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-fuchsia-50 dark:bg-fuchsia-900/20 text-fuchsia-700 dark:text-fuchsia-300 text-xs font-medium">
            <Film className="h-3.5 w-3.5 text-fuchsia-500 dark:text-fuchsia-400" />
            {requirements.reels} Reel{requirements.reels > 1 ? 's' : ''}
          </div>
        )}
        {requirements.posts > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 text-xs font-medium">
            <ImageIcon className="h-3.5 w-3.5 text-violet-500 dark:text-violet-400" />
            {requirements.posts} Post{requirements.posts > 1 ? 's' : ''}
          </div>
        )}
        {requirements.stories > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-medium">
            <CircleDashed className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400" />
            {requirements.stories} Stor{requirements.stories > 1 ? 'ies' : 'y'}
          </div>
        )}
        {requirements.lives > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-xs font-medium">
            <Video className="h-3.5 w-3.5 text-red-500 dark:text-red-400" />
            {requirements.lives} Live{requirements.lives > 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContentRequirements;
