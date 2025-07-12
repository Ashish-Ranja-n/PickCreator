import { createVideoUploadPreset } from '@/utils/cloudinary';

/**
 * Initialize Cloudinary upload presets
 * This script should be run during deployment or app startup
 */
async function initCloudinary() {
  try {
    console.log('Initializing Cloudinary upload presets...');
    
    // Create video upload preset
    await createVideoUploadPreset();
    
    console.log('Cloudinary initialization completed successfully');
  } catch (error) {
    console.error('Failed to initialize Cloudinary:', error);
    // Don't throw error to prevent app startup failure
    // The direct upload will work without presets using signed uploads
  }
}

// Run if called directly
if (require.main === module) {
  initCloudinary();
}

export default initCloudinary;
