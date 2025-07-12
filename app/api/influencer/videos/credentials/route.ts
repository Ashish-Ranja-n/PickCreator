import { NextRequest, NextResponse } from 'next/server';
import { getDataFromToken } from '@/helpers/getDataFromToken';
import { Influencer } from '@/models/influencer';
import { connect } from '@/lib/mongoose';
import crypto from 'crypto';


// Configure runtime for API route
export const runtime = 'nodejs';
export const maxDuration = 30; // 30 seconds should be enough for credentials

/**
 * API route for getting Cloudinary upload credentials
 * POST /api/influencer/videos/credentials
 */
export async function POST(req: NextRequest) {
  try {
    // Get user from token
    const userId = await getDataFromToken(req);
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Connect to database
    await connect();

    // Get influencer profile
    const influencer = await Influencer.findById(userId);
    if (!influencer) {
      return NextResponse.json(
        { error: 'Influencer profile not found' },
        { status: 404 }
      );
    }

    // Check if user is Instagram verified
    if (!influencer.isInstagramVerified) {
      return NextResponse.json(
        { error: 'Instagram verification required to upload videos' },
        { status: 403 }
      );
    }

    // Check if user already has 2 videos
    const currentVideos = influencer.videos || [];
    if (currentVideos.length >= 2) {
      return NextResponse.json(
        { error: 'Maximum 2 videos allowed. Please delete an existing video first.' },
        { status: 400 }
      );
    }

    // Parse request body
    const { filename, filesize, title } = await req.json();

    if (!filename || !filesize || !title) {
      return NextResponse.json(
        { error: 'Filename, filesize, and title are required' },
        { status: 400 }
      );
    }

    // Validate file size (500MB limit)
    const maxSize = 500 * 1024 * 1024; // 500MB
    if (filesize > maxSize) {
      return NextResponse.json(
        { error: 'Video file must be less than 500MB' },
        { status: 400 }
      );
    }

    // Validate title
    if (title.length > 100) {
      return NextResponse.json(
        { error: 'Video title must be 100 characters or less' },
        { status: 400 }
      );
    }

    // Get Cloudinary credentials from environment
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      console.error('Missing Cloudinary credentials');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Generate unique public ID
    const timestamp = Math.round(Date.now() / 1000);
    const publicId = `video_showcase/${userId}_${timestamp}`;

    // Generate signature for signed upload
    const paramsToSign = {
      public_id: publicId,
      timestamp: timestamp,
      folder: 'video_showcase'
    };

    // Create signature string
    const sortedParams = Object.keys(paramsToSign)
      .sort()
      .map(key => `${key}=${paramsToSign[key as keyof typeof paramsToSign]}`)
      .join('&');

    const signature = crypto
      .createHash('sha1')
      .update(sortedParams + apiSecret)
      .digest('hex');

    // Return signed upload credentials
    return NextResponse.json({
      success: true,
      uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`,
      publicId,
      timestamp,
      signature,
      apiKey,
      folder: 'video_showcase'
    });

  } catch (error: any) {
    console.error('Error generating upload credentials:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate upload credentials' },
      { status: 500 }
    );
  }
}
