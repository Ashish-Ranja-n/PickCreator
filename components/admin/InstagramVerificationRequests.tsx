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
    <div className="px-2 sm:px-0">
      <h2 className="text-xl font-bold mb-4 text-center">Instagram Verification Requests</h2>
      <div className="space-y-4">
        {requests.map(req => (
          <div
            key={req._id}
            className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 p-4 bg-white rounded-2xl shadow-md border border-gray-100"
          >
            <div className="flex-shrink-0 flex items-center justify-center w-20 h-20 sm:w-16 sm:h-16 rounded-full bg-gray-100 overflow-hidden">
              <img
                src={req.profilePicUrl}
                alt="Profile"
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <div className="flex-1 w-full text-center sm:text-left">
              <div className="font-semibold text-base sm:text-lg break-all">{req.username}</div>
              <div className="text-sm text-gray-700">
                Followers:{' '}
                <span className="font-medium">{req.followerCount}</span>
              </div>
              <div className="text-xs text-gray-400 mt-1">Code: {req.randomCode}</div>
            </div>
            <div className="flex flex-row flex-wrap gap-2 mt-2 sm:mt-0 justify-center sm:justify-end w-full sm:w-auto">
              <a
                href={`https://instagram.com/${req.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 text-xs sm:text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-sm transition"
              >
                Instagram
              </a>
              <a
                href={`https://ig.me/m/${req.username}?text=${VERIFICATION_MESSAGE(req.randomCode)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 text-xs sm:text-sm bg-green-500 hover:bg-green-600 text-white rounded-lg shadow-sm transition"
                title={VERIFICATION_MESSAGE(req.randomCode)}
              >
                Chat
              </a>
              <button
                onClick={() => handleAction(req._id, 'approved')}
                className="px-3 py-1 text-xs sm:text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-sm transition"
              >
                Complete
              </button>
              <button
                onClick={() => handleAction(req._id, 'rejected')}
                className="px-3 py-1 text-xs sm:text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-sm transition"
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
