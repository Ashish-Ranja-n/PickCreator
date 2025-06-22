import React, { useEffect, useState } from 'react';

const VERIFICATION_MESSAGE = (code: string) =>
  `To verify your account, please enter this code in the verification section of your profile page on PickCreator: ${code}. Do not share this code.`;

export default function InstagramVerificationRequests() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/instagram-verifications')
      .then(res => res.json())
      .then(data => {
        setRequests(data);
        setLoading(false);
      });
  }, []);

  const handleAction = async (id: string, action: 'approved' | 'rejected') => {
    await fetch('/api/admin/instagram-verifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verificationId: id, action }),
    });
    setRequests(reqs => reqs.filter(r => r._id !== id));
  };

  if (loading) return <div>Loading...</div>;
  if (!requests.length) return <div>No pending Instagram verifications.</div>;

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Instagram Verification Requests</h2>
      <div className="space-y-6">
        {requests.map(req => (
          <div key={req._id} className="flex items-center gap-4 p-4 bg-white rounded shadow">
            <img src={req.profilePicUrl} alt="Profile" className="w-16 h-16 rounded-full object-cover" />
            <div className="flex-1">
              <div className="font-semibold">{req.username}</div>
              <div>Followers: {req.followerCount}</div>
              <div className="text-xs text-gray-500">Code: {req.randomCode}</div>
            </div>
            <a
              href={`https://instagram.com/${req.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 bg-blue-500 text-white rounded"
            >
              Instagram
            </a>
            <a
              href={`https://ig.me/m/${req.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 bg-green-500 text-white rounded"
              title={VERIFICATION_MESSAGE(req.randomCode)}
            >
              Chat
            </a>
            <div className="text-xs text-gray-600 ml-2 select-all">
              {VERIFICATION_MESSAGE(req.randomCode)}
            </div>
            <button
              onClick={() => handleAction(req._id, 'approved')}
              className="px-3 py-1 bg-purple-600 text-white rounded"
            >
              Complete
            </button>
            <button
              onClick={() => handleAction(req._id, 'rejected')}
              className="px-3 py-1 bg-red-500 text-white rounded"
            >
              Reject
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
