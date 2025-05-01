'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useSocket } from '@/lib/useSocket';
import { useCurrentUser } from '@/hook/useCurrentUser';
import { CalendarDays, MessageSquare, Activity, Clock } from "lucide-react";

interface ConversationStats {
  totalConversations: number;
  activeConversations: number;
  averageResponseTime: string;
  messageVolume: number;
}

interface ActiveUser {
  _id: string;
  name: string;
  lastActive: Date;
  role: string;
}

export function AdminChatStats() {
  const { onlineUsers, isConnected } = useSocket();
  const [stats, setStats] = useState<ConversationStats>({
    totalConversations: 0,
    activeConversations: 0,
    averageResponseTime: '0m',
    messageVolume: 0
  });
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const currentUser = useCurrentUser();

  // Simulated data fetch - in a real implementation this would call an API
  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      // Mock data
      setStats({
        totalConversations: 124,
        activeConversations: onlineUsers.size,
        averageResponseTime: '4m',
        messageVolume: 1872
      });

      // Generate mock active users
      const mockUsers: ActiveUser[] = Array.from(onlineUsers.keys()).map(userId => ({
        _id: userId,
        name: `User ${userId.substring(0, 5)}...`,
        lastActive: new Date(),
        role: Math.random() > 0.5 ? 'Brand' : 'Influencer'
      }));

      // Add some offline users for the demo
      mockUsers.push(
        {
          _id: 'offline1',
          name: 'Jane Cooper',
          lastActive: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
          role: 'Brand'
        },
        {
          _id: 'offline2',
          name: 'Alex Morgan',
          lastActive: new Date(Date.now() - 1000 * 60 * 43), // 43 minutes ago
          role: 'Influencer'
        }
      );

      setActiveUsers(mockUsers);
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [onlineUsers, currentUser]);

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="flex justify-center items-center h-64">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-8 w-32 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 w-48 bg-gray-200 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Helper function to format time ago
  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg font-medium">Chat Insights</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="overview">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Active Users</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Conversations</p>
                    <h4 className="text-2xl font-bold">{stats.totalConversations}</h4>
                  </div>
                  <MessageSquare className="h-8 w-8 text-purple-500 opacity-80" />
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Now</p>
                    <h4 className="text-2xl font-bold">{stats.activeConversations}</h4>
                  </div>
                  <Activity className="h-8 w-8 text-green-500 opacity-80" />
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg. Response</p>
                    <h4 className="text-2xl font-bold">{stats.averageResponseTime}</h4>
                  </div>
                  <Clock className="h-8 w-8 text-blue-500 opacity-80" />
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Messages</p>
                    <h4 className="text-2xl font-bold">{stats.messageVolume}</h4>
                  </div>
                  <MessageSquare className="h-8 w-8 text-orange-500 opacity-80" />
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader className="py-2 px-4">
                <CardTitle className="text-sm font-medium">Connection Status</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className={`h-3 w-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-sm">{isConnected ? 'Connected to chat server' : 'Disconnected'}</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="users" className="space-y-4">
            <div className="px-4 py-2 flex justify-between items-center">
              <h4 className="text-sm font-medium">Recent Users</h4>
              <Badge variant="outline" className="text-xs">
                {activeUsers.length} users
              </Badge>
            </div>
            
            <div className="h-[280px] overflow-y-auto px-4">
              <div className="space-y-2">
                {activeUsers.map((user) => (
                  <React.Fragment key={user._id}>
                    <div className="flex justify-between items-center py-2">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                            {user.name.charAt(0)}
                          </div>
                          {onlineUsers.has(user._id) && (
                            <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-white"></div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.role}</p>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <CalendarDays size={12} />
                        {onlineUsers.has(user._id) 
                          ? <span>Online now</span> 
                          : <span>{formatTimeAgo(user.lastActive)}</span>
                        }
                      </div>
                    </div>
                    <Separator />
                  </React.Fragment>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 