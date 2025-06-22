import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/lib/mongoose';
import InstagramVerification from '@/models/instagramVerification';
import { getDataFromToken } from '@/helpers/getDataFromToken';

export async function GET(request: NextRequest) {
  await connect();
  const userData = await getDataFromToken(request);
  if (!userData) {
    return NextResponse.json({ status: 'none' }, { status: 401 });
  }
  const userId = (userData as any).id || (userData as any)._id;
  if (!userId) {
    return NextResponse.json({ status: 'none' }, { status: 401 });
  }
  const reqDoc = await InstagramVerification.findOne({ userId });
  if (!reqDoc) {
    return NextResponse.json({ status: 'none' });
  }
  return NextResponse.json({ status: reqDoc.status });
}
