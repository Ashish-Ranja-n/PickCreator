import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/lib/mongoose';
import BugReport from '@/models/bugReport';
import { getDataFromToken } from '@/helpers/getDataFromToken';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description } = body;
    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 });
    }
    // Get userId directly from token
    const userData = await getDataFromToken(req);
    const userId = userData?.id || userData?._id || null;
    if (!userId) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }
    await connect();
    const bug = await BugReport.create({ title, description, userId });
    return NextResponse.json({ success: true, bug }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to save bug report' }, { status: 500 });
  }
}
