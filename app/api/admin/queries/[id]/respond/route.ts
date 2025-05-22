
import { NextResponse } from 'next/server';
import { connect } from '@/lib/mongoose';
import Contact from '@/models/contact';
import nodemailer from 'nodemailer';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Parse the request body
    const body = await req.json();
    const { response, isPublicFaq, respondedBy, sendEmail } = body;
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

    // Send email to the user if sendEmail is true
    if (sendEmail) {
      try {
        const transporter = nodemailer.createTransport({
              host: "smtpout.secureserver.net", // You can use other providers or SMTP settings
              port: 465,
              secure: true,
              auth: {
                user: process.env.EMAIL_USER, // Your email
                pass: process.env.EMAIL_PASS, // App password (not your Gmail password)
              },
            });

        const mailOptions = {
          from: `"PickCreator" <${process.env.EMAIL_USER}>`,
          to: query.email,
          bcc: process.env.EMAIL_USER,
          subject: 'Pickcreator contact us response',
          html: `
            <div style="font-family: Arial, sans-serif;">
              <p>Hi ${query.name || ''},</p>
              <p>Thank you for reaching out to us regarding: <b>${query.subject || ''}</b></p>
              <p><b>Your Query:</b></p>
              <blockquote style="background:#f9f9f9;padding:10px;border-left:3px solid #0EA5E9;">${query.message || ''}</blockquote>
              <p><b>Our Response:</b></p>
              <blockquote style="background:#f1f5fb;padding:10px;border-left:3px solid #8B5CF6;">${response.replace(/\n/g, '<br>')}</blockquote>
              <p>If you have any further questions, feel free to reply to this email.</p>
              <p>Best regards,<br/>Pickcreator Team</p>
            </div>
          `,
        };

        await transporter.sendMail(mailOptions);
      } catch (emailError) {
        // Log but do not fail the API if email fails
        console.error('Failed to send response email:', emailError);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Response submitted and email sent (if possible)',
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