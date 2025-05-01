'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare, ArrowRight, CheckCircle, PlusCircle, Clock, User, CheckSquare, XCircle, Tag } from 'lucide-react';

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

const QueriesPage = () => {
  const router = useRouter();
  const [queries, setQueries] = useState<ContactQuery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'new' | 'in-progress' | 'resolved'>('all');
  
  useEffect(() => {
    const fetchQueries = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/queries');
        if (!response.ok) {
          throw new Error('Failed to fetch queries');
        }
        
        const data = await response.json();
        setQueries(data.queries);
      } catch (err) {
        setError('Error loading queries. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchQueries();
  }, []);
  
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
  
  const filteredQueries = filter === 'all' 
    ? queries 
    : queries.filter(query => query.status === filter);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pick-blue"></div>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Contact Queries</h1>
        
        <div className="flex space-x-2">
          <button 
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              filter === 'all' ? 'bg-gray-200 text-gray-800' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
            }`}
          >
            All
          </button>
          <button 
            onClick={() => setFilter('new')}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              filter === 'new' ? 'bg-blue-200 text-blue-800' : 'bg-blue-100 hover:bg-blue-200 text-blue-600'
            }`}
          >
            New
          </button>
          <button 
            onClick={() => setFilter('in-progress')}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              filter === 'in-progress' ? 'bg-yellow-200 text-yellow-800' : 'bg-yellow-100 hover:bg-yellow-200 text-yellow-600'
            }`}
          >
            In Progress
          </button>
          <button 
            onClick={() => setFilter('resolved')}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              filter === 'resolved' ? 'bg-green-200 text-green-800' : 'bg-green-100 hover:bg-green-200 text-green-600'
            }`}
          >
            Resolved
          </button>
        </div>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}
      
      {filteredQueries.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <MessageSquare size={48} className="text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-600 mb-2">No queries found</h3>
          <p className="text-gray-500">
            {filter === 'all'
              ? 'There are no contact queries yet.'
              : `There are no ${filter} queries at the moment.`}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Query
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sender
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  FAQ
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredQueries.map((query) => (
                <tr key={query._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-start">
                      <MessageSquare size={20} className="text-gray-400 mr-3 mt-1 flex-shrink-0" />
                      <div>
                        <div className="text-sm font-medium text-gray-900 mb-1">{query.subject}</div>
                        <div className="text-sm text-gray-500 line-clamp-2">{query.message.substring(0, 100)}...</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-start">
                      <User size={20} className="text-gray-400 mr-3 mt-1 flex-shrink-0" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{query.name}</div>
                        <div className="text-sm text-gray-500">{query.email}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          <Tag size={12} className="inline mr-1" />
                          {query.userType}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(query.status)}`}>
                      {query.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div className="flex items-start">
                      <Clock size={16} className="text-gray-400 mr-2 flex-shrink-0" />
                      <div>
                        {new Date(query.createdAt).toLocaleDateString()}
                        <div className="text-xs text-gray-400">
                          {new Date(query.createdAt).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {query.isPublicFaq ? (
                      <CheckSquare size={20} className="text-green-500" />
                    ) : (
                      <XCircle size={20} className="text-gray-300" />
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => router.push(`/admin/queries/${query._id}`)}
                      className="text-pick-blue hover:text-pick-purple inline-flex items-center"
                    >
                      {query.status === 'resolved' ? 'View' : 'Respond'}
                      <ArrowRight size={16} className="ml-1" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default QueriesPage; 