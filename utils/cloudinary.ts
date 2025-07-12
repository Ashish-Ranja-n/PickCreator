import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Folder structure for different types of media
const CLOUDINARY_FOLDERS = {
  PROFILE_PICTURES: 'profile_pictures',
  CHAT_MEDIA: 'chat_media',
  INSTAGRAM_MEDIA: 'instagram_media',
  VIDEO_SHOWCASE: 'video_showcase',
};

// Profile picture upload configuration
const PROFILE_PICTURE_CONFIG = {
  max_bytes: 25 * 1024 * 1024, // 25MB limit for profile pictures
  allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
  transformation: [
    { width: 800, height: 800, crop: 'limit' }, // Maximum dimensions
    { quality: 'auto:good' }, // Automatic quality optimization
  ]
};

// Video showcase upload configuration for reel format (9:16 aspect ratio)
const VIDEO_SHOWCASE_CONFIG = {
  max_bytes: 500 * 1024 * 1024, // 500MB limit for videos
  allowed_formats: ['mp4', 'mov', 'avi', 'mkv', 'webm'],
  transformation: [
    { width: 1080, height: 1920, crop: 'limit', aspect_ratio: '9:16' }, // Reel format dimensions
    { quality: 'auto:good' }, // Automatic quality optimization
    { format: 'mp4' }, // Convert to MP4 for better compatibility
    { video_codec: 'h264' }, // Use H.264 codec for better compression
    { audio_codec: 'aac' }, // Use AAC audio codec
    { flags: 'progressive' }, // Progressive loading for better mobile performance
  ]
};

/**
 * Upload a file to Cloudinary
 * @param file - File buffer or URL to upload
 * @param folder - Folder to upload to
 * @param options - Additional upload options
 * @returns Promise with upload result
 */
export const uploadToCloudinary = async (
  file: string | Buffer,
  folder: string = CLOUDINARY_FOLDERS.CHAT_MEDIA,
  options: any = {}
) => {
  try {
    const uploadOptions = {
      folder,
      resource_type: 'auto',
      chunk_size: 50000000, // 50MB chunks for large file upload (increased from 20MB)
      timeout: 300000, // 5-minute timeout
      ...options,
    };

    // Add profile picture specific configurations
    if (folder === CLOUDINARY_FOLDERS.PROFILE_PICTURES) {
      uploadOptions.max_bytes = PROFILE_PICTURE_CONFIG.max_bytes;
      uploadOptions.allowed_formats = PROFILE_PICTURE_CONFIG.allowed_formats;
      uploadOptions.transformation = PROFILE_PICTURE_CONFIG.transformation;
    }

    // Add video showcase specific configurations
    if (folder === CLOUDINARY_FOLDERS.VIDEO_SHOWCASE) {
      uploadOptions.max_bytes = VIDEO_SHOWCASE_CONFIG.max_bytes;
      uploadOptions.allowed_formats = VIDEO_SHOWCASE_CONFIG.allowed_formats;
      uploadOptions.transformation = VIDEO_SHOWCASE_CONFIG.transformation;
      uploadOptions.resource_type = 'video'; // Explicitly set as video
    }

    // If file is a buffer, use upload API with buffer
    if (Buffer.isBuffer(file)) {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        
        // Convert buffer to stream and pipe to uploadStream
        const Readable = require('stream').Readable;
        const stream = new Readable();
        stream.push(file);
        stream.push(null);
        stream.pipe(uploadStream);
      });
    }
    
    // If file is a URL, use upload API with URL
    return await cloudinary.uploader.upload(file, uploadOptions);
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
};

/**
 * Delete a file from Cloudinary
 * @param publicId - Public ID of the file to delete
 * @returns Promise with deletion result
 */
export const deleteFromCloudinary = async (publicId: string) => {
  try {
    return await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw error;
  }
};

/**
 * Get a signed URL for a file in Cloudinary
 * @param publicId - Public ID of the file
 * @param options - Additional options for the URL
 * @returns Signed URL
 */
export const getSignedUrl = (publicId: string, options: any = {}) => {
  return cloudinary.url(publicId, {
    secure: true,
    ...options,
  });
};

/**
 * Create or update upload preset for direct video uploads
 * This should be called during app initialization
 */
export const createVideoUploadPreset = async () => {
  try {
    const presetName = 'video_showcase_unsigned';

    // Check if preset already exists
    try {
      await cloudinary.api.upload_preset(presetName);
      console.log('Upload preset already exists:', presetName);
      return presetName;
    } catch (error: any) {
      if (error.http_code !== 404) {
        throw error;
      }
    }

    // Create new unsigned upload preset
    const preset = await cloudinary.api.create_upload_preset({
      name: presetName,
      unsigned: true, // Allow unsigned uploads for easier client-side usage
      folder: CLOUDINARY_FOLDERS.VIDEO_SHOWCASE,
      resource_type: 'video',
      allowed_formats: ['mp4', 'mov', 'avi', 'mkv', 'webm', 'quicktime'],
      max_bytes: 500 * 1024 * 1024, // 500MB limit
      transformation: [
        { width: 1080, height: 1920, crop: 'limit', aspect_ratio: '9:16' },
        { quality: 'auto:good' },
        { format: 'mp4' },
        { video_codec: 'h264' },
        { audio_codec: 'aac' },
        { flags: 'progressive' }
      ],
      // Enable automatic optimization
      quality_analysis: true,
      auto_tagging: 0.7,
    });

    console.log('Created unsigned upload preset:', preset.name);
    return preset.name;
  } catch (error) {
    console.error('Error creating upload preset:', error);
    throw error;
  }
};

export { CLOUDINARY_FOLDERS, VIDEO_SHOWCASE_CONFIG };
export default cloudinary;