import { NextRequest, NextResponse } from 'next/server';
import { createVideoUploadPreset } from '@/utils/cloudinary';

// Configure runtime for API route
export const runtime = 'nodejs';
export const maxDuration = 60; // 1 minute should be enough

/**
 * API route for initializing Cloudinary upload presets
 * GET /api/admin/init-cloudinary
 */
export async function GET(req: NextRequest) {
  try {
    console.log('Initializing Cloudinary upload presets...');
    
    // Create video upload preset
    const presetName = await createVideoUploadPreset();
    
    console.log('Cloudinary initialization completed successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Cloudinary upload presets initialized successfully',
      presetName
    });

  } catch (error: any) {
    console.error('Failed to initialize Cloudinary:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to initialize Cloudinary',
        details: error.http_code ? `HTTP ${error.http_code}` : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
