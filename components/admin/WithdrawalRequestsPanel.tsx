'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { 
  BadgeIndianRupee, 
  User, 
  CreditCard, 
  Clock, 
  CheckCircle, 
  MessageSquare, 
  RefreshCw,
  Loader,
  Calendar
} from 'lucide-react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/hook/useCurrentUser';

interface WithdrawalRequest {
  _id: string;
  influencerId: string;
  amount: number;
  upiId: string;
  upiUsername: string;
  status: 'pending' | 'completed';
  requestedAt: string;
  completedAt?: string;
  influencer?: {
    _id: string;
    name: string;
    email: string;
    city?: string;
  };
}

const WithdrawalRequestsPanel: React.FC = () => {
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [completingIds, setCompletingIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const router = useRouter();
  const currentUser = useCurrentUser();

  const fetchWithdrawalRequests = async (showRefreshLoader = false) => {
    try {
      if (showRefreshLoader) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const response = await axios.get('/api/admin/withdrawal-requests');
      
      if (response.data.success) {
        setRequests(response.data.data || []);
      } else {
        throw new Error(response.data.error || 'Failed to fetch withdrawal requests');
      }
    } catch (error: any) {
      console.error('Error fetching withdrawal requests:', error);
      toast({
        title: "Error",
        description: error.response?.data?.error || error.message || "Failed to fetch withdrawal requests",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleCompleteWithdrawal = async (requestId: string) => {
    try {
      setCompletingIds(prev => new Set(prev).add(requestId));

      const response = await axios.patch(`/api/admin/withdrawal-requests/${requestId}/complete`);
      
      if (response.data.success) {
        toast({
          title: "Withdrawal Completed",
          description: "The withdrawal request has been marked as completed successfully.",
          variant: "default",
        });

        // Refresh the list
        await fetchWithdrawalRequests();
      } else {
        throw new Error(response.data.error || 'Failed to complete withdrawal');
      }
    } catch (error: any) {
      console.error('Error completing withdrawal:', error);
      toast({
        title: "Error",
        description: error.response?.data?.error || error.message || "Failed to complete withdrawal request",
        variant: "destructive",
      });
    } finally {
      setCompletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const handleChatWithInfluencer = async (influencerId: string) => {
    try {
      // Check if current user (admin) is available
      if (!currentUser?._id) {
        toast({
          title: "Error",
          description: "Unable to identify current user",
          variant: "destructive",
        });
        return;
      }

      // Create or get conversation
      const response = await axios.post('/api/conversation', {
        currentUserId: currentUser._id,
        otherUserId: influencerId
      });

      if (response.data.conversationId) {
        // Navigate to admin chat window with conversation ID
        router.push(`/admin/chat/${response.data.conversationId}`);
      } else {
        toast({
          title: "Error",
          description: "Failed to create conversation",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error creating conversation:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to start chat",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchWithdrawalRequests();
  }, []);

  const pendingRequests = requests.filter(req => req.status === 'pending');
  const completedRequests = requests.filter(req => req.status === 'completed');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="h-8 w-8 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500">Loading withdrawal requests...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Withdrawal Requests</h2>
          <p className="text-gray-500 dark:text-gray-400">Manage influencer withdrawal requests</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchWithdrawalRequests(true)}
          disabled={isRefreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mr-3">
                <Clock className="h-4 w-4 text-orange-500 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{pendingRequests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center mr-3">
                <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Completed</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{completedRequests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-3">
                <BadgeIndianRupee className="h-4 w-4 text-blue-500 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ₹{pendingRequests.reduce((sum, req) => sum + req.amount, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              Pending Withdrawal Requests
            </CardTitle>
            <CardDescription>
              Requests that require your attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <div
                  key={request._id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                          <User className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {request.influencer?.name || 'Unknown Influencer'}
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {request.influencer?.email}
                            {request.influencer?.city && ` • ${request.influencer.city}`}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                        <div className="flex items-center gap-2">
                          <BadgeIndianRupee className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            Amount: <span className="font-semibold">₹{request.amount.toLocaleString()}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-blue-500" />
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            UPI: <span className="font-mono">{request.upiId}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            {new Date(request.requestedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="mt-2">
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          <span className="font-medium">UPI Name:</span> {request.upiUsername}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      <Button
                        onClick={() => handleCompleteWithdrawal(request._id)}
                        disabled={completingIds.has(request._id)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                        size="sm"
                      >
                        {completingIds.has(request._id) ? (
                          <>
                            <Loader className="h-4 w-4 mr-2 animate-spin" />
                            Completing...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Complete
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleChatWithInfluencer(request.influencerId)}
                        size="sm"
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Chat
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Pending Requests */}
      {pendingRequests.length === 0 && (
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                All Caught Up!
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                There are no pending withdrawal requests at the moment.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WithdrawalRequestsPanel;
