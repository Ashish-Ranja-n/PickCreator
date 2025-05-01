'use client';

import { useState, useRef } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface ImageCropperProps {
  imageUrl: string;
  onCropComplete: (croppedImage: Blob) => void;
  onCancel: () => void;
  aspectRatio?: number;
}

export default function ImageCropper({ 
  imageUrl, 
  onCropComplete, 
  onCancel,
  aspectRatio = 1 
}: ImageCropperProps) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const newCrop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 90,
        },
        1, // Fixed square aspect ratio
        width,
        height
      ),
      width,
      height
    );
    setCrop(newCrop);
  };

  const handleCropComplete = async () => {
    if (!imgRef.current || !completedCrop) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Calculate scaled dimensions
    const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
    const scaleY = imgRef.current.naturalHeight / imgRef.current.height;

    // Set canvas dimensions to the cropped size
    canvas.width = completedCrop.width * scaleX;
    canvas.height = completedCrop.height * scaleY;

    // Draw the image
    ctx.drawImage(
      imgRef.current,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY
    );

    // Create high-quality JPEG blob
    canvas.toBlob(
      (blob) => {
        if (blob) {
          onCropComplete(blob);
        }
      },
      'image/jpeg',
      0.95
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-auto overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-medium">Crop Profile Picture</h3>
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 bg-gray-50 flex items-center justify-center">
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={1} // Fixed square aspect ratio
            circularCrop={false}
            className="max-h-[400px] mx-auto"
          >
            <img
              ref={imgRef}
              src={imageUrl}
              alt="Crop me"
              onLoad={onImageLoad}
              className="max-w-full max-h-[400px]"
              crossOrigin="anonymous"
            />
          </ReactCrop>
        </div>
        
        <div className="flex justify-end gap-2 p-4 border-t">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleCropComplete}>
            Save
          </Button>
        </div>
      </div>
    </div>
  );
} 