'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, User, Mail, Tag, Clock, CheckCircle, XCircle, Send, CheckSquare } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";

interface ContactQuery {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  userType: string;
  status: 'new' | 'in-progress' | 'resolved';
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  response?: string;
  responseDate?: string;
  respondedBy?: string;
  isPublicFaq: boolean;
}

export default function QueryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  
  const [query, setQuery] = useState<ContactQuery | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [responseText, setResponseText] = useState('');
  const [makePublicFaq, setMakePublicFaq] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [responseSuccess, setResponseSuccess] = useState(false);
  const [sendEmail, setSendEmail] = useState(true);
  
  useEffect(() => {
    if (id) {
      fetchQuery();
    }
  }, [id]);
  
  const fetchQuery = async () => {
    try {
      setLoading(true);
      // This endpoint will need to be implemented
      const response = await fetch(`/api/admin/queries/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch query');
      }
      
      const data = await response.json();
      setQuery(data.query);
      
      // Pre-fill the response text if there's an existing response
      if (data.query.response) {
        setResponseText(data.query.response);
        setMakePublicFaq(data.query.isPublicFaq);
      }
    } catch (err) {
      setError('Error loading query. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!responseText.trim()) {
      return;
    }
    
    try {
      setSubmitting(true);
      // This endpoint will need to be implemented
      const response = await fetch(`/api/admin/queries/${id}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          response: responseText,
          isPublicFaq: makePublicFaq,
          // In a real app, you'd include the current admin's ID
          respondedBy: 'Admin User',
          sendEmail,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit response');
      }
      
      setResponseSuccess(true);
      
      // Refresh the query data
      fetchQuery();
      
      // Reset the success message after a delay
      setTimeout(() => {
        setResponseSuccess(false);
      }, 3000);
    } catch (err) {
      setError('Error submitting response. Please try again.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">New</span>;
      case 'in-progress':
        return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">In Progress</span>;
      case 'resolved':
        return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">Resolved</span>;
      default:
        return null;
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pick-blue"></div>
      </div>
    );
  }
  
  if (error || !query) {
    return (
      <div className="p-6">
        <button 
          onClick={() => router.back()} 
          className="flex items-center text-pick-blue mb-6"
        >
          <ArrowLeft size={18} className="mr-2" />
          Back to Queries
        </button>
        
        <Card className="shadow-sm rounded-md">
          <CardContent className="p-6">
            <div className="text-center py-8">
              <XCircle size={48} className="text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-700 mb-2">Error Loading Query</h3>
              <p className="text-gray-600 mb-4">{error || "The requested query could not be found."}</p>
              <button
                onClick={() => router.back()}
                className="px-4 py-2 bg-pick-blue text-white rounded-md"
              >
                Go Back
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      <button 
        onClick={() => router.back()} 
        className="flex items-center text-pick-blue mb-6"
      >
        <ArrowLeft size={18} className="mr-2" />
        Back to Queries
      </button>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Query Details */}
        <div className="md:col-span-2">
          <Card className="shadow-sm rounded-md overflow-hidden">
            <div className="bg-gradient-to-r from-pick-blue to-pick-purple px-6 py-4">
              <div className="flex justify-between items-start">
                <h1 className="text-xl font-bold text-white">{query.subject}</h1>
                {getStatusBadge(query.status)}
              </div>
            </div>
            
            <CardContent className="p-6">
              <div className="prose max-w-none mb-8">
                <p className="whitespace-pre-wrap">{query.message}</p>
              </div>
              
              {query.response && (
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <h2 className="text-lg font-bold mb-3 flex items-center">
                    <CheckCircle size={18} className="text-green-500 mr-2" />
                    Response
                  </h2>
                  
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="whitespace-pre-wrap mb-4">{query.response}</p>
                    
                    <div className="text-sm text-gray-500 flex items-center justify-between">
                      <div>
                        Responded by: {query.respondedBy || 'Admin'}
                      </div>
                      
                      <div className="flex items-center">
                        <Clock size={14} className="mr-1.5" />
                        {query.responseDate ? new Date(query.responseDate).toLocaleString() : 'Unknown'}
                      </div>
                    </div>
                  </div>
                  
                  {query.isPublicFaq && (
                    <div className="mt-4 bg-green-50 text-green-700 px-4 py-3 rounded-md flex items-center">
                      <CheckSquare size={18} className="mr-2" />
                      This query and response is published as a public FAQ
                    </div>
                  )}
                </div>
              )}
              
              {query.status !== 'resolved' && (
                <form onSubmit={handleSubmitResponse} className="mt-8 pt-8 border-t border-gray-200">
                  <h2 className="text-lg font-bold mb-3">Reply to this query</h2>
                  
                  <div className="mb-4">
                    <label htmlFor="response" className="block text-sm font-medium text-gray-700 mb-1">
                      Your Response
                    </label>
                    <textarea
                      id="response"
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pick-blue"
                      placeholder="Write your response here..."
                      required
                    ></textarea>
                  </div>
                  
                  <div className="mb-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={makePublicFaq}
                        onChange={() => setMakePublicFaq(!makePublicFaq)}
                        className="h-4 w-4 text-pick-blue focus:ring-pick-blue border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Add this query and response to public FAQs</span>
                    </label>
                  </div>
                  <div className="mb-6">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={sendEmail}
                        onChange={() => setSendEmail(!sendEmail)}
                        className="h-4 w-4 text-pick-blue focus:ring-pick-blue border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Send response to user via email</span>
                    </label>
                  </div>
                  
                  {responseSuccess && (
                    <div className="mb-4 bg-green-50 text-green-700 px-4 py-3 rounded-md flex items-center">
                      <CheckCircle size={18} className="mr-2" />
                      Response submitted successfully
                    </div>
                  )}
                  
                  {error && (
                    <div className="mb-4 bg-red-50 text-red-700 px-4 py-3 rounded-md">
                      {error}
                    </div>
                  )}
                  
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={submitting || !responseText.trim()}
                      className={`px-4 py-2 bg-pick-blue text-white rounded-md flex items-center ${
                        submitting || !responseText.trim() ? 'opacity-60 cursor-not-allowed' : 'hover:bg-pick-purple'
                      }`}
                    >
                      {submitting ? 'Submitting...' : 'Send Response'}
                      {!submitting && <Send size={16} className="ml-2" />}
                    </button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Sender Information */}
        <div className="md:col-span-1">
          <Card className="shadow-sm rounded-md">
            <CardContent className="p-6">
              <h2 className="text-lg font-bold mb-4">Sender Information</h2>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <User size={18} className="text-gray-400 mr-3 flex-shrink-0 mt-1" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{query.name}</div>
                    <div className="text-sm text-gray-500">Name</div>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Mail size={18} className="text-gray-400 mr-3 flex-shrink-0 mt-1" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{query.email}</div>
                    <div className="text-sm text-gray-500">Email</div>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Tag size={18} className="text-gray-400 mr-3 flex-shrink-0 mt-1" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{query.userType}</div>
                    <div className="text-sm text-gray-500">User Type</div>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Clock size={18} className="text-gray-400 mr-3 flex-shrink-0 mt-1" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {new Date(query.createdAt).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(query.createdAt).toLocaleTimeString()}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">Submission Date</div>
                  </div>
                </div>
              </div>
              
              {query.notes && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Admin Notes</h3>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{query.notes}</p>
                </div>
              )}
              
              {query.status === 'resolved' && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="bg-green-50 p-3 rounded-md flex items-center text-green-700">
                    <CheckCircle size={18} className="mr-2" />
                    <span className="text-sm">This query has been resolved</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 