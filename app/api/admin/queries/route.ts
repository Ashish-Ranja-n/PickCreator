import { NextResponse } from 'next/server';
import { connect } from '@/lib/mongoose';
import Contact from '@/models/contact';

export async function GET(req: Request) {
  try {
    // Connect to the database
    await connect();
    
    // Get queries with the most recent ones first
    const queries = await Contact.find({})
      .sort({ createdAt: -1 })
      .lean();
    
    return NextResponse.json({ success: true, queries });
  } catch (error) {
    console.error('Error fetching queries:', error);
    
    return NextResponse.json(
      { success: false, message: 'Failed to fetch queries' },
      { status: 500 }
    );
  }
} 