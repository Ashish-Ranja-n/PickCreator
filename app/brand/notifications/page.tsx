'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useNotifications } from '@/hook/useNotifications';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, BellOff, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function NotificationSettings() {
  const router = useRouter();
  const [userId, setUserId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get user data from local storage
    const storedUser = localStorage.getItem('userData');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUserId(userData._id);
      } catch (err) {
        console.error('Error parsing user data:', err);
      }
    }
    setLoading(false);
  }, []);

  const { 
    isSupported, 
    isSubscribed, 
    isLoading, 
    error, 
    unsubscribe, 
    requestPermission 
  } = useNotifications();

  const handleToggleNotifications = async () => {
    if (isSubscribed) {
      const success = await unsubscribe();
      if (success) {
        toast.success('Notifications turned off');
      } else {
        toast.error('Failed to turn off notifications');
      }
    } else {
      const success = await requestPermission();
      if (success) {
        toast.success('Notifications turned on');
      } else {
        toast.error('Failed to turn on notifications. Please check your browser settings.');
      }
    }
  };

  if (loading || isLoading || !userId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl mx-auto py-8 px-4">
      <div className="flex items-center mb-8">
        <Button 
          variant="ghost" 
          className="mr-2 p-2" 
          onClick={() => router.push('/brand/profile')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Notification Settings</h1>
      </div>

      {!isSupported ? (
        <Card className="mb-6 border-yellow-500">
          <CardHeader>
            <CardTitle className="flex items-center">
              <XCircle className="h-5 w-5 mr-2 text-yellow-500" />
              Notifications Not Supported
            </CardTitle>
            <CardDescription>
              Your browser does not support push notifications.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>
              To receive notifications, please use a modern browser like Chrome, Firefox, Edge, or Safari.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              {isSubscribed ? (
                <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
              ) : (
                <BellOff className="h-5 w-5 mr-2 text-gray-500" />
              )}
              Push Notifications
            </CardTitle>
            <CardDescription>
              Receive notifications about new deals and chat messages.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center space-x-2">
                <Label htmlFor="notifications" className="text-base">
                  {isSubscribed ? 'Notifications are enabled' : 'Notifications are disabled'}
                </Label>
              </div>
              <Switch
                id="notifications"
                checked={isSubscribed}
                onCheckedChange={handleToggleNotifications}
              />
            </div>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </CardContent>
          <CardFooter className="flex flex-col items-start">
            <p className="text-sm text-gray-500">
              You&apos;ll receive notifications for:
            </p>
            <ul className="list-disc pl-5 mt-2 text-sm text-gray-500">
              <li>New deal proposals</li>
              <li>Deal status updates</li>
              <li>New chat messages</li>
            </ul>
          </CardFooter>
        </Card>
      )}
    </div>
  );
} 