import { NextRequest, NextResponse } from 'next/server';
import { uploadToCloudinary, CLOUDINARY_FOLDERS } from '@/utils/cloudinary';
import { Influencer } from '@/models/influencer';
import { connect } from '@/lib/mongoose';
import { getDataFromToken } from '@/helpers/getDataFromToken';

// Set bodyParser config for large video uploads
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '500mb', // 500MB limit for videos
    },
    responseLimit: false,
  },
  maxDuration: 900, // 15 minutes timeout for video processing
};

/**
 * API route for uploading showcase videos
 * POST /api/influencer/videos
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

    // Parse the form data
    const formData = await req.formData();
    const file = formData.get('video') as File;
    const title = formData.get('title') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No video file provided' },
        { status: 400 }
      );
    }

    if (!title || title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Video title is required' },
        { status: 400 }
      );
    }

    if (title.length > 100) {
      return NextResponse.json(
        { error: 'Video title must be 100 characters or less' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['video/mp4', 'video/mov', 'video/avi', 'video/mkv', 'video/webm', 'video/quicktime'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid video format. Supported formats: MP4, MOV, AVI, MKV, WebM' },
        { status: 400 }
      );
    }

    // Validate file size (500MB limit)
    const maxSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Video file must be less than 500MB' },
        { status: 400 }
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

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary with video compression
    const result = await uploadToCloudinary(buffer, CLOUDINARY_FOLDERS.VIDEO_SHOWCASE, {
      public_id: `showcase_${userId}_${Date.now()}`,
      resource_type: 'video',
    }) as any;

    if (!result || !result.secure_url) {
      return NextResponse.json(
        { error: 'Failed to upload video' },
        { status: 500 }
      );
    }

    // Add video object to influencer's videos array
    const newVideo = {
      url: result.secure_url,
      title: title.trim(),
      uploadedAt: new Date()
    };
    const updatedVideos = [...currentVideos, newVideo];

    // Update influencer profile
    await Influencer.findByIdAndUpdate(
      userId,
      { videos: updatedVideos },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Video uploaded successfully',
      video: newVideo,
      totalVideos: updatedVideos.length,
    });

  } catch (error: any) {
    console.error('Error uploading video:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload video' },
      { status: 500 }
    );
  }
}

/**
 * API route for deleting showcase videos
 * DELETE /api/influencer/videos
 */
export async function DELETE(req: NextRequest) {
  try {
    // Get user from token
    const userId = await getDataFromToken(req);
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const { videoUrl } = await req.json();
    if (!videoUrl) {
      return NextResponse.json(
        { error: 'Video URL is required' },
        { status: 400 }
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

    // Check if video exists in user's videos
    const currentVideos = influencer.videos || [];
    const videoExists = currentVideos.some((video: any) => video.url === videoUrl);
    if (!videoExists) {
      return NextResponse.json(
        { error: 'Video not found in your showcase' },
        { status: 404 }
      );
    }

    // Remove video from array
    const updatedVideos = currentVideos.filter((video: any) => video.url !== videoUrl);
    
    // Update influencer profile
    await Influencer.findByIdAndUpdate(
      userId,
      { videos: updatedVideos },
      { new: true }
    );

    // Extract public ID from Cloudinary URL and delete from Cloudinary
    try {
      const publicId = videoUrl.split('/').pop()?.split('.')[0];
      if (publicId) {
        // Note: You might want to import deleteFromCloudinary function
        // await deleteFromCloudinary(publicId);
      }
    } catch (cloudinaryError) {
      console.error('Error deleting from Cloudinary:', cloudinaryError);
      // Continue even if Cloudinary deletion fails
    }

    return NextResponse.json({
      success: true,
      message: 'Video deleted successfully',
      totalVideos: updatedVideos.length,
    });

  } catch (error: any) {
    console.error('Error deleting video:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete video' },
      { status: 500 }
    );
  }
}

/**
 * API route for getting showcase videos
 * GET /api/influencer/videos
 */
export async function GET(req: NextRequest) {
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
    const influencer = await Influencer.findById(userId).select('videos isInstagramVerified');
    if (!influencer) {
      return NextResponse.json(
        { error: 'Influencer profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      videos: influencer.videos || [],
      canUpload: influencer.isInstagramVerified && (influencer.videos?.length || 0) < 2,
      isVerified: influencer.isInstagramVerified,
    });

  } catch (error: any) {
    console.error('Error fetching videos:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch videos' },
      { status: 500 }
    );
  }
}
