import { NextResponse } from 'next/server';
import { connect } from '@/lib/mongoose';
import Contact from '@/models/contact';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Connect to the database
    await connect();
    
    // Find the query by ID
    const query = await Contact.findById(id).lean();
    
    if (!query) {
      return NextResponse.json(
        { success: false, message: 'Query not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, query });
  } catch (error) {
    console.error('Error fetching query:', error);
    
    return NextResponse.json(
      { success: false, message: 'Failed to fetch query' },
      { status: 500 }
    );
  }
} 