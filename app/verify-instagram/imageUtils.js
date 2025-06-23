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

  // Crop image to square (centered)
  try {
    const imageBitmap = await createImageBitmap(processedFile);
    const size = Math.min(imageBitmap.width, imageBitmap.height);
    const offsetX = (imageBitmap.width - size) / 2;
    const offsetY = (imageBitmap.height - size) / 2;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(imageBitmap, offsetX, offsetY, size, size, 0, 0, size, size);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.95));
    processedFile = new File([blob], processedFile.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' });
  } catch (err) {
    // If cropping fails, fallback to original
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
