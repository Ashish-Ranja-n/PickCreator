import React from 'react';
import { 
  InfoIcon, 
  AlertCircle, 
  Building2,
  CheckCircle2
} from 'lucide-react';
import { EmptyStateProps } from './types';

const getDefaultIcon = (title: string) => {
  const lowerTitle = title.toLowerCase();
  
  if (lowerTitle.includes('requested')) {
    return <InfoIcon className="h-6 w-6 text-blue-500 dark:text-blue-400" />;
  }
  if (lowerTitle.includes('pending')) {
    return <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-500" />;
  }
  if (lowerTitle.includes('ongoing')) {
    return <Building2 className="h-6 w-6 text-green-500 dark:text-green-400" />;
  }
  if (lowerTitle.includes('history') || lowerTitle.includes('completed')) {
    return <CheckCircle2 className="h-6 w-6 text-gray-500 dark:text-gray-400" />;
  }
  
  return <Building2 className="h-6 w-6 text-blue-500 dark:text-blue-400" />;
};

const getIconBackgroundColor = (title: string) => {
  const lowerTitle = title.toLowerCase();
  
  if (lowerTitle.includes('requested')) {
    return 'bg-blue-100/80 dark:bg-blue-900/30 border border-blue-300/50 dark:border-blue-700/50';
  }
  if (lowerTitle.includes('pending')) {
    return 'bg-yellow-100/80 dark:bg-yellow-900/30 border border-yellow-300/50 dark:border-yellow-700/50';
  }
  if (lowerTitle.includes('ongoing')) {
    return 'bg-green-100/80 dark:bg-green-900/30 border border-green-300/50 dark:border-green-700/50';
  }
  if (lowerTitle.includes('history') || lowerTitle.includes('completed')) {
    return 'bg-gray-100/80 dark:bg-gray-900/30 border border-gray-300/50 dark:border-gray-700/50';
  }
  
  return 'bg-blue-100/80 dark:bg-blue-900/30 border border-blue-300/50 dark:border-blue-700/50';
};

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  title, 
  description, 
  icon,
  className = '' 
}) => {
  const displayIcon = icon || getDefaultIcon(title);
  const iconBgColor = getIconBackgroundColor(title);

  return (
    <div className={`col-span-full flex justify-center items-center py-16 ${className}`}>
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl px-8 py-10 max-w-md shadow-lg">
        <div className="flex flex-col items-center text-center">
          <div className={`${iconBgColor} p-3 rounded-full mb-4`}>
            {displayIcon}
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {title}
          </h3>
          <p className="text-gray-500 dark:text-zinc-400">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmptyState;
