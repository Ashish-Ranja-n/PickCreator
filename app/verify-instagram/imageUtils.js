// Utility to dynamically import and use heic2any and browser-image-compression
// This avoids issues with SSR and Next.js bundling
export async function convertAndCompressImage(file) {
  // Only run in browser
  if (typeof window === 'undefined') return file;

  // Dynamically import libraries
  const [heic2any, imageCompression] = await Promise.all([
    import('heic2any'),
    import('browser-image-compression')
  ]);

  let processedFile = file;

  // Convert HEIC/HEIF to JPEG
  if (
    file.type === 'image/heic' ||
    file.type === 'image/heif' ||
    file.name.toLowerCase().endsWith('.heic') ||
    file.name.toLowerCase().endsWith('.heif')
  ) {
    try {
      const blob = await heic2any.default({
        blob: file,
        toType: 'image/jpeg',
        quality: 0.8
      });
      processedFile = new File([blob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), { type: 'image/jpeg' });
    } catch (err) {
      throw new Error('Failed to convert HEIC/HEIF image. Please use a different format.');
    }
  }

  // Compress image (JPEG/PNG/WebP)
  try {
    processedFile = await imageCompression.default(processedFile, {
      maxSizeMB: 1,
      maxWidthOrHeight: 1024,
      useWebWorker: true
    });
  } catch (err) {
    // If compression fails, fallback to original
  }

  return processedFile;
}
