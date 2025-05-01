'use client';

import { HelpCircle, MessageSquare } from 'lucide-react';

export default function QnAClient() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-20 h-20 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-fuchsia-500/20">
        <MessageSquare size={32} className="text-white" />
      </div>

      <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-violet-400 to-fuchsia-500 bg-clip-text text-transparent">
        Influencer Q&A Hub
      </h2>

      <p className="text-zinc-400 max-w-lg mb-6">
        Our Q&A platform is coming soon! Connect with other influencers, ask questions,
        share insights, and learn from industry experts.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mt-4">
        <div className="bg-zinc-900/70 border border-zinc-800/50 rounded-xl p-5 text-left">
          <div className="flex items-center mb-3">
            <HelpCircle className="h-5 w-5 text-fuchsia-400 mr-2" />
            <h3 className="text-white font-medium">Ask Questions</h3>
          </div>
          <p className="text-zinc-400 text-sm">
            Get answers to your questions about influencer marketing, content creation,
            and growing your audience.
          </p>
        </div>

        <div className="bg-zinc-900/70 border border-zinc-800/50 rounded-xl p-5 text-left">
          <div className="flex items-center mb-3">
            <MessageSquare className="h-5 w-5 text-fuchsia-400 mr-2" />
            <h3 className="text-white font-medium">Share Knowledge</h3>
          </div>
          <p className="text-zinc-400 text-sm">
            Help others by sharing your expertise and experiences in the influencer community.
          </p>
        </div>
      </div>

      <div className="mt-8 text-zinc-500 text-sm">
        Stay tuned for the launch of our Q&A platform!
      </div>
    </div>
  );
}
