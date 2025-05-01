import { NextResponse } from 'next/server';
import { connect } from '@/lib/mongoose';
import Contact from '@/models/contact';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Parse the request body
    const body = await req.json();
    const { response, isPublicFaq, respondedBy } = body;
    const { id } = await params;
    
    if (!response) {
      return NextResponse.json(
        { success: false, message: 'Response is required' },
        { status: 400 }
      );
    }
    
    // Connect to the database
    await connect();
    
    // Find the query by ID
    const query = await Contact.findById(id);
    
    if (!query) {
      return NextResponse.json(
        { success: false, message: 'Query not found' },
        { status: 404 }
      );
    }
    
    // Update the query with the response
    query.response = response;
    query.responseDate = new Date();
    query.respondedBy = respondedBy;
    query.status = 'resolved';
    query.isPublicFaq = isPublicFaq || false;
    query.updatedAt = new Date();
    
    await query.save();
    
    return NextResponse.json({
      success: true,
      message: 'Response submitted successfully',
      query
    });
  } catch (error) {
    console.error('Error responding to query:', error);
    
    return NextResponse.json(
      { success: false, message: 'Failed to submit response' },
      { status: 500 }
    );
  }
} 