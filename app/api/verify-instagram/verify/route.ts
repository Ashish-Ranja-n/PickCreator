import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/lib/mongoose';
import InstagramVerification from '@/models/instagramVerification';
import { Influencer } from '@/models/influencer';
import { getDataFromToken } from '@/helpers/getDataFromToken';

export async function POST(request: NextRequest) {
  await connect();
  const userData = await getDataFromToken(request);
  if (!userData) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }
  const userId = (userData as any).id || (userData as any)._id;
  const { code } = await request.json();
  const reqDoc = await InstagramVerification.findOne({ userId, status: 'approved' });
  if (!reqDoc) {
    return NextResponse.json({ success: false, message: 'No approved request found.' }, { status: 400 });
  }
  if (reqDoc.randomCode !== code) {
    return NextResponse.json({ success: false, message: 'Invalid code.' }, { status: 400 });
  }
  // Mark influencer as verified
  await Influencer.findOneAndUpdate(
    { _id: userId },
    { $set: { isInstagramVerified: true } }
  );
  // Delete the verification request
  await InstagramVerification.deleteOne({ _id: reqDoc._id });
  return NextResponse.json({ success: true });
}
