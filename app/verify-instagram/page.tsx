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
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#23111A] text-white p-4">
      <div className="w-full max-w-md rounded-2xl shadow-lg p-8 bg-[#2D1823]">
        <h2 className="text-center text-2xl font-bold mb-2">Verification</h2>
        <h3 className="text-center text-3xl font-bold mb-6">Instagram Verification</h3>
        <div className="flex flex-col items-center mb-6">
          <div className="w-32 h-32 rounded-full bg-[#F9D6C7] flex items-center justify-center mb-2 overflow-hidden">
            {profilePic ? (
              <img src={URL.createObjectURL(profilePic)} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-6xl text-[#23111A]">👤</span>
            )}
          </div>
          <label className="text-lg font-semibold mb-1">Upload Profile Picture</label>
          <label className="text-sm text-[#E2B6C6] cursor-pointer mb-2">
            Tap to upload your profile picture
            <input type="file" accept="image/*" className="hidden" onChange={handleProfilePicChange} />
          </label>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Instagram ID"
            className="rounded-lg px-4 py-3 bg-[#4B2B3B] text-white placeholder-[#E2B6C6] focus:outline-none"
            value={instagramId}
            onChange={e => setInstagramId(e.target.value)}
            required
          />
          <input
            type="number"
            placeholder="Follower Count"
            className="rounded-lg px-4 py-3 bg-[#4B2B3B] text-white placeholder-[#E2B6C6] focus:outline-none"
            value={followerCount}
            onChange={e => setFollowerCount(e.target.value)}
            required
          />
          <span className="text-xs text-[#E2B6C6]">Must be over 5,000 followers</span>
          <button
            type="submit"
            className="mt-4 py-3 rounded-lg bg-[#FF2DAF] text-white font-bold text-lg hover:bg-[#e0269b] transition"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Verification Request'}
          </button>
          {success && <div className="text-green-400 text-center">Request sent!</div>}
          {error && <div className="text-red-400 text-center">{error}</div>}
        </form>
      </div>
    </div>
  );
}
