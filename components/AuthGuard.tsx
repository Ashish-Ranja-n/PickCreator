import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUserWithStatus } from '@/hook/useCurrentUser';
import { Loader2 } from 'lucide-react';
import React from 'react';
import axios from 'axios';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: 'Brand' | 'Influencer' | 'Admin';
}

export const AuthGuard = React.memo(({ children, requiredRole }: AuthGuardProps) => {
  const { user, isLoading, error, refetch } = useCurrentUserWithStatus();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [checkingInstagram, setCheckingInstagram] = useState(false);
  const hasCheckedInstagram = useRef(false);
  const MAX_RETRIES = 3;
  const [shouldForceContinue, setShouldForceContinue] = useState(false);
  
  // Set isClient to true when component mounts (client-side only)
  useEffect(() => {
    setIsClient(true);
    
    // Add a timeout to force continue after 10 seconds regardless of loading state
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.warn('AuthGuard: Force continuing after timeout');
        setShouldForceContinue(true);
      }
    }, 10000);
    
    return () => {
      clearTimeout(timeout);
    };
  }, [isLoading]);
  
  // Handle authentication and authorization
  useEffect(() => {
    // We don't want to do anything until we're on the client
    if (!isClient) return;
    
    // If we're still loading but shouldForceContinue is true, we want to proceed anyway
    if (isLoading && !shouldForceContinue) return;
    
    // If we're retrying, wait
    if (isRetrying) return;
    
    // If we're checking Instagram status, wait
    if (checkingInstagram) return;
    
    // If no user is found and we've force continued, try to refresh
    if (!user && shouldForceContinue) {
      refetch();
      // Reset the force continue flag
      setShouldForceContinue(false);
      return;
    }
    
    // If no user is found, redirect to login
    if (!user && !error) {
      router.push('/log-in');
      return;
    }
    
    // If there's an error and we've given up retrying, redirect to login
    if (error && !isRetrying) {
      router.push('/log-in');
      return;
    }
    
    // If a specific role is required, check for it
    if (requiredRole && user && user.role !== requiredRole) {
      // Redirect based on user's actual role
      switch (user.role) {
        case 'Brand':
          router.push('/brand');
          break;
        case 'Influencer':
          router.push('/influencer');
          break;
        case 'Admin':
          router.push('/admin');
          break;
        default:
          router.push('/log-in');
      }
      return;
    }
    
    // Check Instagram connection status for influencers
    // and we're not already on the connect-instagram page and we haven't checked already
    if (user && user.role === 'Influencer' && 
        !window.location.pathname.includes('/connect-instagram') && 
        !hasCheckedInstagram.current) {
      
      hasCheckedInstagram.current = true; // Mark as checked to prevent infinite loop
      
      const checkInstagramStatus = async () => {
        try {
          setCheckingInstagram(true);
          
          // First check status via the status API
          const response = await axios.get('/api/influencer/status', {
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          });
          
          // If status API says not connected, redirect immediately
          if (!response.data.isConnected) {
            console.log("Instagram not connected according to status API, redirecting to connect-instagram");
            router.push('/connect-instagram');
            setCheckingInstagram(false);
            return;
          }
          
          // Double-check with the minimal API to ensure we really can access Instagram data
          try {
            const minimalResponse = await axios.get('/api/influencer/instagram/minimal', {
              headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'Expires': '0'
              },
              timeout: 5000 // Add timeout to prevent hanging
            });
            
            // If minimal API says not connected, that overrides the status API
            if (!minimalResponse.data.isConnected) {
              console.log("Instagram appears connected in database but minimal API says not connected, redirecting");
              
              // Also attempt to fix the database status
              try {
                await axios.post('/api/influencer/fix-instagram-status', { isConnected: false });
              } catch (fixError) {
                console.error("Failed to fix Instagram status:", fixError);
              }
              
              router.push('/connect-instagram?error=connection_invalid');
              setCheckingInstagram(false);
              return;
            }
          } catch (minimalError) {
            console.error("Error in minimal Instagram check:", minimalError);
            // On error accessing minimal API, assume connection issue
            router.push('/connect-instagram?error=connection_validation_failed');
            setCheckingInstagram(false);
            return;
          }
          
          setCheckingInstagram(false);
        } catch (error) {
          console.error('Error checking Instagram status:', error);
          setCheckingInstagram(false);
          
          // On error, redirect to connect page
          router.push('/connect-instagram');
        }
      };
      
      checkInstagramStatus();
    }
  }, [isLoading, user, requiredRole, router, isClient, error, isRetrying, shouldForceContinue]);
  
  // Reset the check flag when user changes
  useEffect(() => {
    if (user) {
      hasCheckedInstagram.current = false;
    }
  }, [user?.email]); // Only reset when user email changes (proxy for user identity change)
  
  // Handle retry on error
  useEffect(() => {
    if (!error || !isClient) return;
    
    if (retryCount < MAX_RETRIES) {
      setIsRetrying(true);
      setRetryCount(prev => prev + 1);
      
      // If there was an error fetching the user, try again after a delay
      const timer = setTimeout(() => {
        refetch();
      }, 1000 * Math.pow(2, retryCount)); // Exponential backoff
      
      return () => {
        clearTimeout(timer);
      };
    } else {
      // We've reached max retries, give up
      setIsRetrying(false);
    }
  }, [error, refetch, isClient, retryCount, MAX_RETRIES]);
  
  // Show loading state with force continue option
  if ((isLoading && !shouldForceContinue) || !isClient || isRetrying || checkingInstagram) {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-black">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-200 ">
            {isRetrying 
              ? `Retrying... (${retryCount}/${MAX_RETRIES})` 
              : checkingInstagram 
                ? "Checking Instagram connection..."
                : "Loading your profile..."}
          </p>
          {error && (
            <p className="text-red-500 text-xs mt-2">
              {error.message || "Error loading profile"}
            </p>
          )}
        </div>
      </div>
    );
  }
  
  // If user is not authenticated, show nothing (will redirect in useEffect)
  if (!user) {
    return null;
  }
  
  // If role is required but user doesn't have it, show nothing (will redirect in useEffect)
  if (requiredRole && user.role !== requiredRole) {
    return null;
  }
  
  // User is authenticated and authorized, render children
  return <>{children}</>;
});

AuthGuard.displayName = 'AuthGuard'; 