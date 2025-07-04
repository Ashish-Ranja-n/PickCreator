import React from 'react';
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRightLeft,
  Loader2
} from 'lucide-react';
import { StatusBadgeProps, DealStatus, PaymentStatus } from './types';

const getStatusColor = (status: DealStatus | PaymentStatus, type: 'deal' | 'payment') => {
  if (type === 'payment') {
    switch (status as PaymentStatus) {
      case 'unpaid':
        return 'bg-yellow-100/80 text-yellow-700 border border-yellow-300/50 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700/50';
      case 'paid':
        return 'bg-green-100/80 text-green-700 border border-green-300/50 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700/50';
      default:
        return 'bg-gray-100 text-gray-700 border border-gray-300 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700';
    }
  }

  // Deal status colors
  switch (status as DealStatus) {
    case 'requested':
      return 'bg-blue-100/80 text-blue-700 border border-blue-300/50 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700/50';
    case 'counter-offered':
      return 'bg-indigo-100/80 text-indigo-700 border border-indigo-300/50 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-700/50';
    case 'accepted':
      return 'bg-yellow-100/80 text-yellow-700 border border-yellow-300/50 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700/50';
    case 'ongoing':
      return 'bg-green-100/80 text-green-700 border border-green-300/50 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700/50';
    case 'content_approved':
      return 'bg-teal-100/80 text-teal-700 border border-teal-300/50 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-700/50';
    case 'completed':
      return 'bg-violet-100/80 text-violet-700 border border-violet-300/50 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-700/50';
    case 'cancelled':
      return 'bg-red-100/80 text-red-700 border border-red-300/50 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700/50';
    default:
      return 'bg-gray-100 text-gray-700 border border-gray-300 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700';
  }
};

const getStatusIcon = (status: DealStatus | PaymentStatus, type: 'deal' | 'payment') => {
  if (type === 'payment') {
    switch (status as PaymentStatus) {
      case 'paid':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'unpaid':
        return <Clock className="h-4 w-4" />;
      default:
        return null;
    }
  }

  // Deal status icons
  switch (status as DealStatus) {
    case 'requested':
      return <Clock className="h-4 w-4" />;
    case 'counter-offered':
      return <ArrowRightLeft className="h-4 w-4" />;
    case 'accepted':
      return <AlertCircle className="h-4 w-4" />;
    case 'ongoing':
      return <Loader2 className="h-4 w-4 animate-spin" />;
    case 'content_approved':
      return <CheckCircle2 className="h-4 w-4 text-teal-600" />;
    case 'completed':
      return <CheckCircle2 className="h-4 w-4" />;
    case 'cancelled':
      return <XCircle className="h-4 w-4" />;
    default:
      return null;
  }
};

const formatStatusText = (status: DealStatus | PaymentStatus) => {
  if (status === 'content_approved') {
    return 'Content Approved';
  }
  return status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ');
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  type, 
  className = '' 
}) => {
  const colorClass = getStatusColor(status, type);
  const icon = getStatusIcon(status, type);
  const text = formatStatusText(status);

  return (
    <Badge className={`${colorClass} ${className}`}>
      {icon}
      {text}
    </Badge>
  );
};

export default StatusBadge;
