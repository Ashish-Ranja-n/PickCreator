import React, { useEffect, useState } from 'react';
import { useCurrentUser } from '@/hook/useCurrentUser';
import { CheckCircle, MessageSquare } from 'lucide-react';

interface BugReport {
  _id: string;
  title: string;
  description: string;
  createdAt: string;
  resolved: boolean;
  userId: string;
}

export default function BugReportsPanel() {
  const [bugs, setBugs] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchBugs = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/bug-report/admin');
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to fetch');
      setBugs(data.bugs);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch bug reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBugs(); }, []);

  const resolveBug = async (id: string) => {
    try {
      const res = await fetch('/api/bug-report/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to resolve');
      setBugs(bugs => bugs.map(b => b._id === id ? { ...b, resolved: true } : b));
    } catch (err: any) {
      alert(err.message || 'Failed to resolve bug');
    }
  };

  const currentUser = useCurrentUser();
  const startChat = async (userId: string) => {
    if (!currentUser?._id) {
      alert('Current user not found.');
      return;
    }
    try {
      const res = await fetch('/api/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentUserId: currentUser._id, otherUserId: userId })
      });
      const data = await res.json();
      if (!res.ok || !data.conversationId) throw new Error(data.message || 'Failed to start chat');
      window.location.href = `/admin/chat/${data.conversationId}`;
    } catch (err: any) {
      alert(err.message || 'Failed to start chat');
    }
  };

  return (
    <div>
      <h2 className="text-lg font-bold mb-4">Bug Reports</h2>
      {loading && <div>Loading...</div>}
      {error && <div className="text-red-500 mb-2">{error}</div>}
      <div className="space-y-3">
        {bugs.length === 0 && !loading && <div className="text-gray-500">No bug reports found.</div>}
        {bugs.map(bug => (
          <div key={bug._id} className="border rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between bg-white shadow-sm">
            <div>
              <div className="font-semibold text-gray-800 flex items-center gap-2">
                <MessageSquare size={16} /> {bug.title}
                {bug.resolved && <span className="ml-2 text-green-600 flex items-center"><CheckCircle size={14} /> Resolved</span>}
              </div>
              <div className="text-gray-600 text-sm mt-1 mb-2">{bug.description}</div>
              <div className="text-xs text-gray-400">Reported: {new Date(bug.createdAt).toLocaleString()}</div>
              <div className="text-xs text-gray-400">User ID: {bug.userId}</div>
            </div>
            <div className="flex gap-2 mt-2 md:mt-0">
              {!bug.resolved && (
                <button
                  className="px-3 py-1 rounded bg-green-600 text-white text-xs font-semibold hover:bg-green-700"
                  onClick={() => resolveBug(bug._id)}
                >
                  Resolve
                </button>
              )}
              <button
                className="px-3 py-1 rounded bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
                onClick={() => startChat(bug.userId)}
              >
                Chat
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
