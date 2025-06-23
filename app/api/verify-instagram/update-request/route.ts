import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/lib/mongoose';
import { Influencer } from '@/models/index';
import InstagramVerification from '@/models/instagramVerification';
import { randomBytes } from 'crypto';

// This endpoint handles update requests for Instagram ID and follower count
export async function POST(req: NextRequest) {
  await connect();
  let userId = req.headers.get('x-user-id');
  if (!userId) {
    const formData = await req.formData();
    userId = formData.get('userId') as string;
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized: userId missing' }, { status: 401 });
    }
    const instagramId = formData.get('instagramId') as string;
    const followerCount = parseInt(formData.get('followerCount') as string, 10);
    if (!instagramId || !followerCount) {
      return NextResponse.json({ message: 'All fields are required' }, { status: 400 });
    }
    // Generate 8-character random code
    const randomCode = randomBytes(4).toString('hex');
    // Create InstagramVerification entry (type: update)
    const verification = await InstagramVerification.create({
      userId,
      username: instagramId,
      followerCount,
      randomCode,
      status: 'pending',
      type: 'update',
    });
    return NextResponse.json({ message: 'Update request sent' });
  } else {
    const formData = await req.formData();
    const instagramId = formData.get('instagramId') as string;
    const followerCount = parseInt(formData.get('followerCount') as string, 10);
    if (!instagramId || !followerCount) {
      return NextResponse.json({ message: 'All fields are required' }, { status: 400 });
    }
    const randomCode = randomBytes(4).toString('hex');
    const verification = await InstagramVerification.create({
      userId,
      username: instagramId,
      followerCount,
      randomCode,
      status: 'pending',
      type: 'update',
    });
    return NextResponse.json({ message: 'Update request sent' });
  }
}
