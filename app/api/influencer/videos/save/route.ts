import { NextRequest, NextResponse } from 'next/server';
import { getDataFromToken } from '@/helpers/getDataFromToken';
import { Influencer } from '@/models/influencer';
import { connect } from '@/lib/mongoose';

// Configure runtime for API route
export const runtime = 'nodejs';
export const maxDuration = 30; // 30 seconds should be enough for saving metadata

/**
 * API route for saving video metadata after successful Cloudinary upload
 * POST /api/influencer/videos/save
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

    // Parse request body
    const { title, url, publicId, duration, format, bytes } = await req.json();

    if (!title || !url || !publicId) {
      return NextResponse.json(
        { error: 'Title, URL, and public ID are required' },
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

    // Check if user already has 2 videos (double-check)
    const currentVideos = influencer.videos || [];
    if (currentVideos.length >= 2) {
      return NextResponse.json(
        { error: 'Maximum 2 videos allowed. Please delete an existing video first.' },
        { status: 400 }
      );
    }

    // Create new video object
    const newVideo = {
      title: title.trim(),
      url: url,
      publicId: publicId,
      duration: duration || null,
      format: format || null,
      bytes: bytes || null,
      uploadedAt: new Date(),
    };

    // Add video to influencer's videos array
    const updatedVideos = [...currentVideos, newVideo];

    // Update influencer profile
    await Influencer.findByIdAndUpdate(
      userId,
      { videos: updatedVideos },
      { new: true }
    );

    console.log('Video metadata saved successfully:', {
      userId,
      title: newVideo.title,
      url: newVideo.url,
      totalVideos: updatedVideos.length
    });

    return NextResponse.json({
      success: true,
      message: 'Video metadata saved successfully',
      video: newVideo,
      totalVideos: updatedVideos.length,
    });

  } catch (error: any) {
    console.error('Error saving video metadata:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save video metadata' },
      { status: 500 }
    );
  }
}
