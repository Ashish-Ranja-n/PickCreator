import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/lib/mongoose';
import Contact from '@/models/contact';

interface ContactRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
  userType: 'brand' | 'influencer' | 'agency' | 'other';
}

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json() as ContactRequest;
    
    // Validate required fields
    const { name, email, subject, message, userType } = body;
    
    if (!name || !email || !subject || !message || !userType) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Connect to the database
    await connect();
    
    // Create a new contact entry
    const contact = await Contact.create({
      name,
      email,
      subject,
      message,
      userType,
      status: 'new',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    // You could add email notification here
    // sendNotificationEmail(contact);
    
    return NextResponse.json(
      { success: true, message: 'Contact form submitted successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in contact form submission:', error);
    
    return NextResponse.json(
      { success: false, message: 'Failed to submit contact form' },
      { status: 500 }
    );
  }
} 