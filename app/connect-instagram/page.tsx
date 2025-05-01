"use client";

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Instagram, Check, AlertCircle, Loader, LogOut, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useCurrentUser } from '@/hook/useCurrentUser';
import axios from 'axios';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useLogout } from '@/hook/useLogout';

// Error messages with more helpful guidance
const errorMessages = {
  default: "We couldn't connect to your Instagram account. Please try again.",
  api_error: "Our server encountered an issue. Please try again in a few moments.",
  missing_code: "Instagram didn't provide the necessary code. Please try connecting again.",
  access_denied: "Instagram access was denied. Please ensure you authorize all required permissions.",
  unauthorized_client: "Your session has expired. Please log out and log back in.",
  unsupported_response_type: "Instagram authorization failed. Please try again later.",
  server_error: "Instagram servers encountered an issue. Please try again later.",
  temporarily_unavailable: "Instagram's API is temporarily unavailable. Please try again later.",
  redirect_loop: "We detected a redirection issue. Try using the Safe Mode option below.",
  invalid_request: "Instagram rejected the connection request. Please try again.",
  insufficient_followers: (count?: string) => 
    `Your account needs at least ${count || '5,000'} followers to be eligible. This helps ensure our platform maintains high-quality content creators.`,
  already_connected: "This Instagram account is already connected to another user.",
  unkownerror: "An unexpected error occurred. Please try again or contact support.",
  business_account_required: "Instagram requires a Business or Creator account to connect. Please convert your account and try again."
};

// Function to manage redirect counts to prevent loops
const manageRedirectCount = (action: 'check' | 'increment' | 'reset', threshold = 5) => {
  if (typeof window === 'undefined') return false;
  
  const countKey = 'instagram_redirect_count';
  const timestampKey = 'instagram_redirect_timestamp';
  const now = Date.now();
  
  // Reset count if it's been more than 3 minutes since last redirect
  const lastTimestamp = parseInt(sessionStorage.getItem(timestampKey) || '0');
  if (now - lastTimestamp > 180000) { // 3 minutes
    sessionStorage.setItem(countKey, '0');
  }
  
  if (action === 'check') {
    const count = parseInt(sessionStorage.getItem(countKey) || '0');
    return count >= threshold;
  } else if (action === 'increment') {
    const count = parseInt(sessionStorage.getItem(countKey) || '0');
    sessionStorage.setItem(countKey, (count + 1).toString());
    sessionStorage.setItem(timestampKey, now.toString());
    return count + 1 >= threshold;
  } else if (action === 'reset') {
    sessionStorage.setItem(countKey, '0');
    sessionStorage.setItem(timestampKey, now.toString());
    return false;
  }
  
  return false;
};

// Create a client component that uses the search params
function InstagramConnectContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentUser = useCurrentUser();
  const error = searchParams?.get('error') || null;
  const followerCount = searchParams?.get('required_followers');
  const noRedirect = searchParams?.get('noRedirect') === 'true';
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState(0);
  
  // Call the useLogout hook unconditionally at the top level
  const logoutFn = useLogout('/');
  
  // Create a stable logout handler function
  const handleLogout = useCallback(async () => {
    try {
      await logoutFn();
    } catch (error) {
      console.error('Error logging out:', error);
      router.replace('/');
    }
  }, [logoutFn, router]);
  
  // Safe redirect function to prevent loops
  const safeRedirect = useCallback((path: string) => {
    if (noRedirect) {
      console.log(`Redirect suppressed to: ${path}`);
      setIsLoading(false);
      return;
    }
    
    // Check for potential redirect loop
    if (manageRedirectCount('increment')) {
      console.error('Redirect loop detected!');
      setAuthError('redirect_loop');
      setIsLoading(false);
      return;
    }
    
    console.log(`Redirecting to: ${path}`);
    router.replace(path);
  }, [router, noRedirect]);
  
  // Handle Instagram connection
  const handleConnectInstagram = useCallback(async () => {
    try {
      // Reset redirect count before initiating new connection
      manageRedirectCount('reset');
      setRetryAttempt(0);
      setAuthError(null);
      
      console.log("Initiating Instagram connection");
      setIsLoading(true);
      
      // Add a short timeout to ensure UI renders first
      await new Promise(resolve => setTimeout(resolve, 100));
      
      try {
        const response = await axios.get('/api/auth/instagram', {
          timeout: 8000 // Add timeout to prevent hanging requests
        });
        
        if (response.data.url) {
          console.log("Redirecting to Instagram auth URL");
          window.location.href = response.data.url;
        } else {
          console.log("No URL in response, redirecting to API endpoint");
          window.location.href = '/api/auth/instagram';
        }
      } catch (error) {
        console.error('Error initiating Instagram connection:', error);
        setAuthError('api_error');
        setIsLoading(false);
        
        // Auto-refresh if we suspect it's a token issue
        if (axios.isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403)) {
          console.log("Authentication error detected, refreshing page");
          setTimeout(() => {
            window.location.href = '/connect-instagram?fresh=true';
          }, 1500);
        }
      }
    } catch (error) {
      console.error('Unexpected error in handleConnectInstagram:', error);
      setAuthError('default');
      setIsLoading(false);
    }
  }, []);
  
  useEffect(() => {
    console.log("Connect Instagram page loaded");
    
    let isMounted = true;
    
    // Check for parameters but don't auto-connect
    const shouldAutoRetry = searchParams?.get('auto_retry') === 'true';
    const freshSignup = searchParams?.get('fresh') === 'true';
    
    // Log but don't auto-connect for any case
    if (freshSignup) {
      console.log("Fresh signup detected, showing Instagram connection UI");
      setIsLoading(false);
    } else if (shouldAutoRetry) {
      console.log("Auto-retry parameter detected, but manual connection required");
      setIsLoading(false);
      // Show an error if there was one
      if (error) {
        setAuthError(error);
      }
    } else if (error) {
      console.log("Error parameter detected:", error);
      setAuthError(error);
      setIsLoading(false);
    } else {
      // Run normal status check for other cases
      const checkUserStatus = async () => {
        try {
          // Check if user is logged in
          if (!currentUser) {
            console.log("No current user");
            if (!noRedirect) {
              safeRedirect('/log-in');
            } else {
              setIsLoading(false);
            }
            return;
          }
          
          // Check if user is an influencer
          if (currentUser.role !== 'Influencer') {
            console.log("User is not an influencer");
            if (!noRedirect) {
              if (currentUser.role === 'Admin') {
                safeRedirect('/admin/profile');
              } else if (currentUser.role === 'Brand') {
                safeRedirect('/brand');
              } else {
                safeRedirect('/');
              }
            } else {
              setIsLoading(false);
            }
            return;
          }
          
          console.log("Checking user status from combined endpoint");
          
          // Use a single API call to get all status information
          try {
            const statusResponse = await axios.get('/api/influencer/status', {
              headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'Expires': '0'
              }
            });
            
            const { isConnected, onboardingCompleted } = statusResponse.data;
            console.log("Status check result:", { isConnected, onboardingCompleted });
            
            if (isMounted) {
              if (isConnected) {
                if (onboardingCompleted) {
                  console.log("Instagram is connected and onboarding is complete, redirecting to influencer dashboard");
                  if (!noRedirect) {
                    safeRedirect('/influencer');
                  } else {
                    setIsLoading(false);
                  }
                } else {
                  console.log("Instagram is connected but onboarding is incomplete, redirecting to onboarding");
                  if (!noRedirect) {
                    safeRedirect('/influencer/onboarding/basic-info');
                  } else {
                    setIsLoading(false);
                  }
                }
              } else {
                console.log("Instagram not connected");
                setIsLoading(false);
              }
            }
          } catch (error: any) {
            console.error('Error checking user status:', error);
            
            // If unauthorized, redirect to login
            if (error.response?.status === 401) {
              console.log("401 Unauthorized");
              if (!noRedirect) {
                safeRedirect('/log-in');
              } else {
                setIsLoading(false);
              }
              return;
            }
            
            if (isMounted) {
              setAuthError('api_error');
              setIsLoading(false);
            }
          }
        } catch (error) {
          console.error('Error in checkUserStatus:', error);
          if (isMounted) {
            setAuthError('default');
            setIsLoading(false);
          }
        }
      };
      
      // Check status
      checkUserStatus();
    }
    
    // Add this at the end of the useEffect to ensure loading state is released
    // if none of the other conditions were met
    if (isLoading && isMounted) {
      // This is important to prevent infinite loading when redirected from signup
      console.log("Setting loading to false as fallback");
      setIsLoading(false);
    }
    
    // Safety timeout to prevent indefinite loading
    const safetyTimeout = setTimeout(() => {
      if (isMounted && isLoading) {
        console.log("Safety timeout triggered - forcing loading state to end");
        setIsLoading(false);
        // If we suspect we're stuck in a bad state, show an error
        if (!authError) {
          setAuthError('default');
        }
      }
    }, 10000);
    
    return () => {
      clearTimeout(safetyTimeout);
      isMounted = false;
    };
  }, [currentUser, error, noRedirect, safeRedirect, searchParams, isLoading, authError]);
  
  // Handle logout and account deletion
  const handleLogoutAndDelete = async () => {
    setIsDeleteDialogOpen(true);
  };
  
  // Confirm account deletion
  const confirmDeleteAccount = useCallback(async () => {
    try {
      setIsDeleting(true);
      
      const userEmail = currentUser?.email;
      
      if (!userEmail) {
        console.error("No user email found");
        setIsDeleting(false);
        return;
      }
      
      await axios.delete('/api/auth/delete-account', {
        data: { email: userEmail }
      });
      
      await handleLogout();
    } catch (error) {
      console.error('Error deleting account:', error);
      setIsDeleting(false);
      
      await handleLogout();
    }
  }, [currentUser?.email, handleLogout]);
  
  // Add a function to get the error message
  const getErrorMessage = useCallback((errorCode: string | null) => {
    if (!errorCode) return '';
    const message = errorMessages[errorCode as keyof typeof errorMessages];
    if (errorCode === 'insufficient_followers' && typeof message === 'function') {
      return message(followerCount || undefined);
    }
    return typeof message === 'string' ? message : errorMessages.default;
  }, [followerCount]);
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="container flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin">
            <Loader className="h-10 w-10 text-primary" />
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  
  // Display the redirect loop error specifically
  if (authError === 'redirect_loop') {
    return (
      <div className="container max-w-xl px-6 py-12">
        <Card className="w-full border-destructive/50 bg-destructive/5">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <CardTitle className="text-destructive">Redirect Loop Detected</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-destructive/90">
              {errorMessages.redirect_loop}
            </p>
            <div className="flex flex-col space-y-2">
              <Button 
                onClick={handleLogout}
                variant="outline" 
                className="w-full"
              >
                Log Out
              </Button>
              <Button 
                onClick={() => window.location.href = '/connect-instagram?noRedirect=true'}
                className="w-full"
              >
                Try Again in Safe Mode
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container max-w-5xl px-6 py-12">
      <div className="flex flex-col items-center space-y-6">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
          <Instagram className="w-8 h-8 text-primary" />
        </div>
        
        <h1 className="text-3xl font-bold text-center tracking-tight">Connect Your Instagram Account</h1>
        <p className="text-center text-muted-foreground max-w-2xl">
          <span className="font-semibold text-red-500">Required Step:</span> To continue as an influencer on PickCreator, you need to connect your Instagram Business account with at least 5000 followers.
        </p>
        
        <div className="flex items-center justify-center w-full max-w-md">
          <div className="h-px flex-1 bg-muted"></div>
          <span className="px-4 text-sm text-muted-foreground">You cannot proceed without connecting</span>
          <div className="h-px flex-1 bg-muted"></div>
        </div>
        
        {(error || authError) && (
          <Card className="w-full max-w-lg border-destructive/50 bg-destructive/5">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <CardTitle className="text-destructive">Connection Error</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-destructive font-medium">Connection Error</p>
                    <p className="text-sm text-destructive/90 mt-1">
                      {getErrorMessage(error || authError)}
                    </p>
                    {(error === 'insufficient_followers' || authError === 'insufficient_followers') && (
                      <div className="mt-3 text-sm">
                        <p className="font-medium text-destructive/90">Why do we have this requirement?</p>
                        <ul className="list-disc list-inside mt-1 text-destructive/80 space-y-1">
                          <li>Ensures high-quality content for brands</li>
                          <li>Validates your influence in your niche</li>
                          <li>Helps maintain platform standards</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full" 
                onClick={handleConnectInstagram}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}
        
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Why Connect Your Instagram?</CardTitle>
            <CardDescription>
              Connecting your Instagram account allows brands to discover you and your content.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="mt-0.5 bg-primary/10 p-1.5 rounded-full">
                  <Check className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Verify Your Influence</h3>
                  <p className="text-sm text-muted-foreground">Your follower count and engagement metrics are used to match you with appropriate brands.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="mt-0.5 bg-primary/10 p-1.5 rounded-full">
                  <Check className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Display Your Content</h3>
                  <p className="text-sm text-muted-foreground">Your posts will be displayed on your profile, showcasing your style and creativity to potential brand partners.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="mt-0.5 bg-primary/10 p-1.5 rounded-full">
                  <Check className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Unlock Platform Features</h3>
                  <p className="text-sm text-muted-foreground">Access to all platform features requires a connected Instagram account.</p>
                </div>
              </div>
            </div>
            
            <Button 
              className="w-full" 
              size="lg" 
              onClick={handleConnectInstagram}
            >
              <Instagram className="mr-2 h-5 w-5" />
              Connect Instagram
            </Button>
            
            <p className="text-xs text-center text-muted-foreground">
              By connecting your Instagram account, you agree to our Terms of Service and Privacy Policy.
            </p>
          </CardContent>
          
          <Separator className="my-2" />
          
          <CardFooter className="flex flex-col space-y-4 pt-4">
            <p className="text-sm text-muted-foreground text-center">
              Can't connect your Instagram account? You can log out and delete your account.
            </p>
            <Button 
              variant="outline" 
              className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleLogoutAndDelete}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log Out & Delete Account
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      {/* Delete Account Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete Your Account?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. Your account and all associated data will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            If you're having trouble connecting your Instagram account, you can try:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-muted-foreground">
            <li>Making sure your Instagram account is a Business or Creator account</li>
            <li>Ensuring your Instagram account has at least 5000 followers</li>
            <li>Checking your Instagram permissions</li>
          </ul>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
              className="sm:flex-1"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteAccount}
              className="sm:flex-1"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Account'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Main page component with Suspense boundary
export default function ConnectInstagramPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8 max-w-3xl flex justify-center items-center min-h-[70vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader className="h-8 w-8 animate-spin" />
          <p className="text-lg">Loading...</p>
        </div>
      </div>
    }>
      <InstagramConnectContent />
    </Suspense>
  );
} 