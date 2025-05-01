'use client';

import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { useNotifications } from '@/hook/useNotifications';

interface NotificationBellProps {
  userType: 'brand' | 'influencer' | 'admin';
}

export default function NotificationBell({ userType }: NotificationBellProps) {
  const router = useRouter();
  const [hasNewNotifications, setHasNewNotifications] = useState(false);
  
  // Use the notification hook
  const { 
    isSupported, 
    isSubscribed, 
    requestPermission
  } = useNotifications();
  
  useEffect(() => {
    // Get user ID from local storage
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        // Parse data but don't store the ID since we're not using it
        JSON.parse(userData);
      } catch (err) {
        console.error('Error parsing user data:', err);
      }
    }
    
    // Check for new notifications (simplified version)
    // In a full implementation, this would connect to your backend
    // to check for new notifications
    const hasUnread = localStorage.getItem('hasUnreadNotifications') === 'true';
    setHasNewNotifications(hasUnread);
  }, []);
  
  const handleNotificationClick = () => {
    // Clear the unread state
    localStorage.setItem('hasUnreadNotifications', 'false');
    setHasNewNotifications(false);
    
    // Navigate to notifications page based on user type
    router.push(`/${userType}/notifications`);
  };
  
  const enableNotifications = async () => {
    if (!isSupported) return;
    
    try {
      await requestPermission();
      // We could show a success message here
    } catch (err) {
      console.error('Error enabling notifications:', err);
    }
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {hasNewNotifications && (
            <Badge className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500 p-0 border-0" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuItem onClick={handleNotificationClick}>
          View all notifications
        </DropdownMenuItem>
        {!isSubscribed && (
          <DropdownMenuItem onClick={enableNotifications}>
            Enable push notifications
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 