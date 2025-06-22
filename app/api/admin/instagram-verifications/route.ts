import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/lib/mongoose';
import InstagramVerification from '@/models/instagramVerification';
import { Influencer } from '@/models/index';

export async function GET(req: NextRequest) {
  await connect();
  // Get all pending verifications, populate influencer info
  const verifications = await InstagramVerification.find({ status: 'pending' })
    .populate('userId', 'instagramUsername profilePictureUrl followerCount');
  return NextResponse.json(verifications);
}

export async function PATCH(req: NextRequest) {
  await connect();
  const { verificationId, action } = await req.json();
  if (!verificationId || !['approved', 'rejected'].includes(action)) {
    return NextResponse.json({ message: 'Invalid request' }, { status: 400 });
  }
  const verification = await InstagramVerification.findByIdAndUpdate(
    verificationId,
    { status: action },
    { new: true }
  );
  if (!verification) {
    return NextResponse.json({ message: 'Verification not found' }, { status: 404 });
  }
  // Optionally update influencer model if approved
  if (action === 'approved') {
    await Influencer.findByIdAndUpdate(verification.userId, {
      instagramVerification: verification._id,
    });
  }
  return NextResponse.json({ message: `Verification ${action}` });
}
