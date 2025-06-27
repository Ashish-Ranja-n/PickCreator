import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/lib/mongoose';
import BugReport from '@/models/bugReport';
import User from '@/models/user';

// GET all bug reports for admin
export async function GET(req: NextRequest) {
  try {
    await connect();
    const bugs = await BugReport.find().sort({ createdAt: -1 });
    return NextResponse.json({ success: true, bugs });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch bug reports' }, { status: 500 });
  }
}

// PATCH to resolve a bug report
export async function PATCH(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'Bug report id required' }, { status: 400 });
    await connect();
    const bug = await BugReport.findByIdAndUpdate(id, { resolved: true }, { new: true });
    if (!bug) return NextResponse.json({ error: 'Bug report not found' }, { status: 404 });
    return NextResponse.json({ success: true, bug });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to resolve bug report' }, { status: 500 });
  }
}
