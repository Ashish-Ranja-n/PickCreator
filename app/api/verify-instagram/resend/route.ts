import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/lib/mongoose';
import InstagramVerification from '@/models/instagramVerification';
import { getDataFromToken } from '@/helpers/getDataFromToken';

export async function POST(request: NextRequest) {
  await connect();
  const userData = await getDataFromToken(request);
  if (!userData) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }
  const userId = (userData as any).id || (userData as any)._id;
  // Delete rejected request if exists
  await InstagramVerification.deleteMany({ userId, status: 'rejected' });
  // Now user can submit a new request via /verify-instagram page
  return NextResponse.json({ success: true });
}
