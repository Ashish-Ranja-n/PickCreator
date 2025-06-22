'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/hook/useCurrentUser';

export default function VerifyInstagram() {
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [instagramId, setInstagramId] = useState('');
  const [followerCount, setFollowerCount] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const user = useCurrentUser();

  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProfilePic(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    const formData = new FormData();
    if (profilePic) formData.append('profilePic', profilePic);
    formData.append('instagramId', instagramId);
    formData.append('followerCount', followerCount);
    if (user && user._id) {
      formData.append('userId', user._id);
    }
    try {
      const res = await fetch('/api/verify-instagram', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        setSuccess(true);
        router.push('/influencer/onboarding/basic-info');
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to send request');
      }
    } catch (err) {
      setError('Failed to send request');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F6FA] px-4 pt-0 pb-0">
      <div className="flex flex-col flex-1 w-full max-w-md mx-auto">
        <div className="flex items-center justify-between pt-6 px-1">
          <h2 className="text-[#A07BA6] text-base font-semibold tracking-wide">Verification</h2>
          <button type="button" className="text-[#A07BA6] hover:text-[#FF2DAF] text-xl" title="Help">
            <span className="text-2xl">?</span>
          </button>
        </div>
        <h3 className="text-2xl font-bold text-[#23111A] mt-2 mb-6 px-1">Instagram Verification</h3>
        <div className="flex flex-col items-center mb-6">
          <div className="w-32 h-32 rounded-full bg-[#F9D6C7] flex items-center justify-center mb-2 overflow-hidden border-4 border-white shadow-md cursor-pointer relative">
            <label className="w-full h-full flex items-center justify-center cursor-pointer">
              {profilePic ? (
                <img src={URL.createObjectURL(profilePic)} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="40" cy="40" r="40" fill="#F9D6C7" />
                  <ellipse cx="40" cy="32" rx="16" ry="16" fill="#E2B6C6" />
                  <ellipse cx="40" cy="60" rx="22" ry="12" fill="#E2B6C6" />
                </svg>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={handleProfilePicChange} />
            </label>
          </div>
          <div className="text-lg font-bold text-[#23111A] mb-1">Upload Profile Picture</div>
          <div className="text-sm text-[#A07BA6] mb-2">Tap to upload your profile picture</div>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full flex-1 px-1">
          <input
            type="text"
            placeholder="Instagram ID"
            className="rounded-xl px-4 py-3 bg-[#F8E6F4] text-[#A07BA6] placeholder-[#A07BA6] focus:outline-none border-none text-base font-medium"
            value={instagramId}
            onChange={e => setInstagramId(e.target.value)}
            required
          />
          <input
            type="number"
            placeholder="Follower Count"
            className="rounded-xl px-4 py-3 bg-[#F8E6F4] text-[#A07BA6] placeholder-[#A07BA6] focus:outline-none border-none text-base font-medium"
            value={followerCount}
            onChange={e => setFollowerCount(e.target.value)}
            required
          />
          <span className="text-xs text-[#A07BA6] -mt-2 mb-2">Must be over 5,000 followers</span>
          {success && <div className="text-green-500 text-center font-medium">Request sent!</div>}
          {error && <div className="text-red-500 text-center font-medium">{error}</div>}
        </form>
      </div>
      <button
        type="submit"
        form=""
        onClick={handleSubmit}
        className="w-full py-4 rounded-none bg-[#FF2DAF] text-white font-bold text-lg hover:bg-[#e0269b] transition shadow-md fixed bottom-0 left-0 right-0 z-10"
        disabled={loading}
        style={{ borderRadius: 0 }}
      >
        {loading ? 'Sending...' : 'Send Verification Request'}
      </button>
    </div>
  );
}
