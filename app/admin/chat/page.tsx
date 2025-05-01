'use client';

import React, { useState, useEffect } from 'react';
import { ChatList } from '@/components/chat/ChatList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LayoutGrid, MessageSquare, User, Settings, HelpCircle, Clock, Tag, CheckSquare, XCircle, ArrowRight } from "lucide-react";
import { useParams, useRouter } from 'next/navigation';
import { AdminChatStats } from '@/components/chat/AdminChatStats';

interface ContactQuery {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  userType: string;
  status: 'new' | 'in-progress' | 'resolved';
  createdAt: string;
  response?: string;
  responseDate?: string;
  isPublicFaq: boolean;
}

export default function AdminChatPage() {
  const params = useParams();
  const router = useRouter();
  const hasConversation = !!params?.conversationId;
  
  const [activeUserTab, setActiveUserTab] = useState<'users' | 'queries'>('users');
  const [queries, setQueries] = useState<ContactQuery[]>([]);
  const [queriesLoading, setQueriesLoading] = useState(false);
  const [queriesError, setQueriesError] = useState('');
  const [queryFilter, setQueryFilter] = useState<'all' | 'new' | 'in-progress' | 'resolved'>('all');
  
  useEffect(() => {
    if (activeUserTab === 'queries') {
      fetchQueries();
    }
  }, [activeUserTab]);
  
  const fetchQueries = async () => {
    try {
      setQueriesLoading(true);
      // This endpoint will need to be implemented
      const response = await fetch('/api/admin/queries');
      if (!response.ok) {
        throw new Error('Failed to fetch queries');
      }
      
      const data = await response.json();
      setQueries(data.queries || []);
    } catch (err) {
      setQueriesError('Error loading queries. Please try again.');
      console.error(err);
    } finally {
      setQueriesLoading(false);
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const filteredQueries = queryFilter === 'all' 
    ? queries 
    : queries.filter(query => query.status === queryFilter);
  
  return (
    <div className="flex flex-col min-h-screen overflow-hidden">
      <div className="container mx-auto px-4 py-4 flex-none">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Admin Communication Center</h1>
          <Badge variant="outline" className="bg-purple-100 text-purple-800 px-3 py-1">
            Admin Mode
          </Badge>
        </div>
        
        <Tabs defaultValue="chats" className="w-full">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="chats" className="flex items-center justify-center gap-2">
              <MessageSquare size={16} />
              <span className="hidden sm:inline">Chats</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center justify-center gap-2">
              <User size={16} />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="flex items-center justify-center gap-2">
              <LayoutGrid size={16} />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center justify-center gap-2">
              <Settings size={16} />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="chats" className="mt-0">
            <Card className="shadow-sm rounded-md overflow-hidden">
              <CardContent className="p-0">
                <div className="grid grid-cols-1 md:grid-cols-3 h-[calc(100vh-12rem)]">
                  <div className={`col-span-1 ${hasConversation ? 'md:border-r' : ''} h-full`}>
                    <ChatList />
                  </div>
                  
                  {!hasConversation && (
                    <div className="hidden md:flex md:col-span-2 items-center justify-center bg-gray-50">
                      <div className="text-center p-8 max-w-md">
                        <MessageSquare size={64} className="mx-auto text-gray-300 mb-4" />
                        <h3 className="text-xl font-medium text-gray-700 mb-2">Select a conversation</h3>
                        <p className="text-gray-500">
                          Choose a conversation from the list or start a new one to begin messaging.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="users">
            <Card className="shadow-sm rounded-md">
              <CardContent className="p-4">
                <div className="border-b border-gray-200 mb-4">
                  <nav className="flex -mb-px">
                    <button
                      onClick={() => setActiveUserTab('users')}
                      className={`mr-8 py-4 px-1 ${
                        activeUserTab === 'users'
                          ? 'border-b-2 border-pick-blue text-pick-blue'
                          : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } font-medium text-sm flex items-center`}
                    >
                      <User size={16} className="mr-2" />
                      User Management
                    </button>
                    <button
                      onClick={() => setActiveUserTab('queries')}
                      className={`py-4 px-1 ${
                        activeUserTab === 'queries'
                          ? 'border-b-2 border-pick-blue text-pick-blue'
                          : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } font-medium text-sm flex items-center`}
                    >
                      <HelpCircle size={16} className="mr-2" />
                      Contact Queries
                      {queries.filter(q => q.status === 'new').length > 0 && (
                        <span className="ml-2 bg-red-100 text-red-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                          {queries.filter(q => q.status === 'new').length}
                        </span>
                      )}
                    </button>
                  </nav>
                </div>
                
                {activeUserTab === 'users' && (
                  <div className="flex items-center justify-center h-[calc(100vh-18rem)]">
                    <p className="text-muted-foreground">User management will be available here</p>
                  </div>
                )}
                
                {activeUserTab === 'queries' && (
                  <div className="h-[calc(100vh-18rem)] overflow-auto">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-bold text-gray-800">Contact Queries</h2>
                      
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => setQueryFilter('all')}
                          className={`px-3 py-1 rounded-md text-xs font-medium ${
                            queryFilter === 'all' ? 'bg-gray-200 text-gray-800' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                          }`}
                        >
                          All
                        </button>
                        <button 
                          onClick={() => setQueryFilter('new')}
                          className={`px-3 py-1 rounded-md text-xs font-medium ${
                            queryFilter === 'new' ? 'bg-blue-200 text-blue-800' : 'bg-blue-100 hover:bg-blue-200 text-blue-600'
                          }`}
                        >
                          New
                          {queries.filter(q => q.status === 'new').length > 0 && (
                            <span className="ml-1">{queries.filter(q => q.status === 'new').length}</span>
                          )}
                        </button>
                        <button 
                          onClick={() => setQueryFilter('in-progress')}
                          className={`px-3 py-1 rounded-md text-xs font-medium ${
                            queryFilter === 'in-progress' ? 'bg-yellow-200 text-yellow-800' : 'bg-yellow-100 hover:bg-yellow-200 text-yellow-600'
                          }`}
                        >
                          In Progress
                        </button>
                        <button 
                          onClick={() => setQueryFilter('resolved')}
                          className={`px-3 py-1 rounded-md text-xs font-medium ${
                            queryFilter === 'resolved' ? 'bg-green-200 text-green-800' : 'bg-green-100 hover:bg-green-200 text-green-600'
                          }`}
                        >
                          Resolved
                        </button>
                      </div>
                    </div>
                    
                    {queriesError && (
                      <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                        {queriesError}
                      </div>
                    )}
                    
                    {queriesLoading ? (
                      <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pick-blue"></div>
                      </div>
                    ) : filteredQueries.length === 0 ? (
                      <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
                        <HelpCircle size={36} className="text-gray-300 mx-auto mb-3" />
                        <h3 className="text-base font-medium text-gray-600 mb-1">No queries found</h3>
                        <p className="text-sm text-gray-500">
                          {queryFilter === 'all'
                            ? 'There are no contact queries yet.'
                            : `There are no ${queryFilter} queries at the moment.`}
                        </p>
                      </div>
                    ) : (
                      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Query
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Sender
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Status
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Date
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  FAQ
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Action
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {filteredQueries.map((query) => (
                                <tr key={query._id} className="hover:bg-gray-50">
                                  <td className="px-4 py-3">
                                    <div className="flex items-start">
                                      <MessageSquare size={16} className="text-gray-400 mr-2 mt-1 flex-shrink-0" />
                                      <div>
                                        <div className="text-xs font-medium text-gray-900 mb-1">{query.subject}</div>
                                        <div className="text-xs text-gray-500 line-clamp-1">{query.message.substring(0, 50)}...</div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex items-start">
                                      <User size={16} className="text-gray-400 mr-2 mt-1 flex-shrink-0" />
                                      <div>
                                        <div className="text-xs font-medium text-gray-900">{query.name}</div>
                                        <div className="text-xs text-gray-500">{query.email}</div>
                                        <div className="text-xs text-gray-400 mt-0.5">
                                          <Tag size={10} className="inline mr-1" />
                                          {query.userType}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(query.status)}`}>
                                      {query.status}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-xs text-gray-500">
                                    <div className="flex items-start">
                                      <Clock size={14} className="text-gray-400 mr-1.5 flex-shrink-0" />
                                      <div>
                                        {new Date(query.createdAt).toLocaleDateString()}
                                        <div className="text-xs text-gray-400">
                                          {new Date(query.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    {query.isPublicFaq ? (
                                      <CheckSquare size={16} className="text-green-500" />
                                    ) : (
                                      <XCircle size={16} className="text-gray-300" />
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                    <button
                                      onClick={() => router.push(`/admin/chat/query/${query._id}`)}
                                      className="text-pick-blue hover:text-pick-purple inline-flex items-center text-xs font-medium"
                                    >
                                      {query.status === 'resolved' ? 'View' : 'Respond'}
                                      <ArrowRight size={14} className="ml-1" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="dashboard">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="shadow-sm rounded-md col-span-1 md:col-span-2">
                <CardContent className="p-6">
                  <AdminChatStats />
                </CardContent>
              </Card>
              <Card className="shadow-sm rounded-md col-span-1">
                <CardContent className="p-6">
                  <div className="text-center py-8">
                    <LayoutGrid size={32} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-700 mb-2">Advanced Analytics</h3>
                    <p className="text-sm text-gray-500">
                      Detailed analytics and reporting features will be available soon.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="settings">
            <Card className="shadow-sm rounded-md">
              <CardContent className="p-6">
                <div className="flex items-center justify-center h-[calc(100vh-14rem)]">
                  <p className="text-muted-foreground">Chat settings will be available here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 