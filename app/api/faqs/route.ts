import { NextResponse } from 'next/server';
import { connect } from '@/lib/mongoose';
import Contact from '@/models/contact';

export async function GET(req: Request) {
  try {
    await connect();
    
    // Fetch only contacts that are marked as public FAQs and have responses
    const faqs = await Contact.find({
      isPublicFaq: true,
      response: { $exists: true, $ne: '' }
    })
    .sort({ faqOrder: 1, responseDate: -1 }) // Sort by faqOrder first, then by responseDate
    .lean();
    
    return NextResponse.json({ success: true, faqs }, { status: 200 });
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch FAQs' },
      { status: 500 }
    );
  }
} 