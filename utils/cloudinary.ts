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

export { CLOUDINARY_FOLDERS };
export default cloudinary; 