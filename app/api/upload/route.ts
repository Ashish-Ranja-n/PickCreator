import { NextRequest, NextResponse } from 'next/server';
import { uploadToCloudinary, CLOUDINARY_FOLDERS } from '@/utils/cloudinary';
import Upload, { MediaType, UploadType } from '@/models/upload';
import { connect } from '@/lib/mongoose';

// Set bodyParser config for large file uploads
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '100mb', // Increased limit for larger files
    },
    responseLimit: false, // No response size limit
  },
  maxDuration: 300, // Increase timeout to 5 minutes for large file uploads
};

// Define the Cloudinary result type
interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  resource_type: string;
  [key: string]: any;
}

// Helper function to determine media type from resource type
const getMediaType = (resourceType: string, format?: string): MediaType => {
  switch (resourceType) {
    case 'image':
      return MediaType.IMAGE;
    case 'video':
      return MediaType.VIDEO;
    case 'audio':
      return MediaType.AUDIO;
    case 'raw':
      // Check if it's a document based on format
      if (format && ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(format)) {
        return MediaType.DOCUMENT;
      }
      return MediaType.OTHER;
    default:
      return MediaType.OTHER;
  }
};

// Helper function to determine upload type from type string
const getUploadType = (type: string): UploadType => {
  switch (type) {
    case 'profile':
      return UploadType.PROFILE_PICTURE;
    case 'instagram':
      return UploadType.INSTAGRAM_MEDIA;
    case 'chat':
    default:
      return UploadType.CHAT_MEDIA;
  }
};

/**
 * API route for uploading files to Cloudinary
 * POST /api/upload
 */
export async function POST(req: NextRequest) {
  try {
    // Parse the form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string || 'chat'; // Default to chat media
    const messageId = formData.get('messageId') as string;
    const userId = formData.get('userId') as string; // Get userId directly from form data
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Determine the folder based on the type
    let folder;
    switch (type) {
      case 'profile':
        folder = CLOUDINARY_FOLDERS.PROFILE_PICTURES;
        break;
      case 'instagram':
        folder = CLOUDINARY_FOLDERS.INSTAGRAM_MEDIA;
        break;
      case 'video_showcase':
        folder = CLOUDINARY_FOLDERS.VIDEO_SHOWCASE;
        break;
      case 'chat':
      default:
        folder = CLOUDINARY_FOLDERS.CHAT_MEDIA;
        break;
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const result = await uploadToCloudinary(buffer, folder, {
      public_id: `${type}_${Date.now()}`,
      resource_type: 'auto', // Automatically detect if it's an image, video, or audio
    }) as CloudinaryUploadResult;

    // Connect to the database
    await connect();

    // Create upload data with all required fields
    const uploadData: any = {
      userId, // Use the userId from form data
      cloudinaryPublicId: result.public_id,
      cloudinaryUrl: result.secure_url,
      resourceType: result.resource_type,
      originalFilename: file.name,
      fileSize: file.size,
      mediaType: getMediaType(result.resource_type, result.format),
      uploadType: getUploadType(type),
      metadata: {
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
        duration: result.duration,
      }
    };
    
    // Add optional messageId if provided
    if (messageId) {
      uploadData.messageId = messageId;
    }

    // Save upload information to the database
    const upload = new Upload(uploadData);
    await upload.save();

    return NextResponse.json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      resourceType: result.resource_type,
      uploadId: upload._id,
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

/**
 * API route for handling URL uploads to Cloudinary
 * POST /api/upload/url
 */
export async function PUT(req: NextRequest) {
  try {
    // Parse the request body
    const body = await req.json();
    const { url, type = 'instagram', instagramId, messageId, userId } = body;
    
    if (!url) {
      return NextResponse.json(
        { error: 'No URL provided' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Determine the folder based on the type
    let folder;
    switch (type) {
      case 'profile':
        folder = CLOUDINARY_FOLDERS.PROFILE_PICTURES;
        break;
      case 'instagram':
        folder = CLOUDINARY_FOLDERS.INSTAGRAM_MEDIA;
        break;
      case 'video_showcase':
        folder = CLOUDINARY_FOLDERS.VIDEO_SHOWCASE;
        break;
      case 'chat':
      default:
        folder = CLOUDINARY_FOLDERS.CHAT_MEDIA;
        break;
    }

    // Upload to Cloudinary
    const result = await uploadToCloudinary(url, folder, {
      public_id: `${type}_${Date.now()}`,
      resource_type: 'auto', // Automatically detect if it's an image, video, or audio
    }) as CloudinaryUploadResult;

    // Connect to the database
    await connect();

    // Create upload data with all required fields
    const uploadData: any = {
      userId, // Use the userId from request body
      cloudinaryPublicId: result.public_id,
      cloudinaryUrl: result.secure_url,
      resourceType: result.resource_type,
      originalUrl: url,
      mediaType: getMediaType(result.resource_type, result.format),
      uploadType: getUploadType(type),
      metadata: {
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
        duration: result.duration,
      }
    };
    
    // Add optional fields if provided
    if (instagramId) {
      uploadData.instagramId = instagramId;
    }
    
    if (messageId) {
      uploadData.messageId = messageId;
    }

    // Save upload information to the database
    const upload = new Upload(uploadData);
    await upload.save();

    return NextResponse.json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      resourceType: result.resource_type,
      uploadId: upload._id,
    });
  } catch (error) {
    console.error('Error uploading URL:', error);
    return NextResponse.json(
      { error: 'Failed to upload URL' },
      { status: 500 }
    );
  }
} 