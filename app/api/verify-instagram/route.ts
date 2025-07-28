
import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/lib/mongoose';
import { Influencer } from '@/models/index';
import InstagramVerification from '@/models/instagramVerification';
import { randomBytes } from 'crypto';
import { uploadToCloudinary, CLOUDINARY_FOLDERS } from '@/utils/cloudinary';

export async function POST(req: NextRequest) {
  await connect();
  // LOG: Start request
  console.log('[VerifyInstagram] POST request received');
  try {
    // Get user from token (automatically checks Authorization header and cookies)
    const userData = await (await import('@/helpers/getDataFromToken')).getDataFromToken(req);
    if (!userData) {
      console.error('[VerifyInstagram] Unauthorized: no userData from token');
      return NextResponse.json({ message: 'Unauthorized: user not authenticated' }, { status: 401 });
    }
    const userId = userData.id || userData._id;
    console.log('[VerifyInstagram] userId:', userId);
    if (!userId) {
      console.error('[VerifyInstagram] Unauthorized: userId missing in token');
      return NextResponse.json({ message: 'Unauthorized: userId missing' }, { status: 401 });
    }

    // Parse formData
    const formData = await req.formData();

    // Validate and sanitize input
    const instagramId = (formData.get('instagramId') || '').toString().trim();
    const followerCountRaw = formData.get('followerCount');
    const followerCount = followerCountRaw ? parseInt(followerCountRaw.toString(), 10) : NaN;
    const profilePic = formData.get('profilePic') as File | null;
    console.log('[VerifyInstagram] instagramId:', instagramId, 'followerCount:', followerCount, 'profilePic:', !!profilePic);

    if (!instagramId || isNaN(followerCount) || !profilePic) {
      console.error('[VerifyInstagram] Invalid input');
      return NextResponse.json({ message: 'All fields are required and must be valid' }, { status: 400 });
    }

    // Delete previous verification requests for this user
    const deleteResult = await InstagramVerification.deleteMany({ userId });
    console.log('[VerifyInstagram] Deleted previous verifications:', deleteResult.deletedCount);

    // Upload profile picture to Cloudinary
    let profilePicUrl = '';
    try {
      const buffer = Buffer.from(await profilePic.arrayBuffer());
      const uploadResult = (await uploadToCloudinary(
        buffer,
        CLOUDINARY_FOLDERS.PROFILE_PICTURES
      )) as { secure_url: string };
      profilePicUrl = uploadResult.secure_url;
      console.log('[VerifyInstagram] Uploaded profile pic:', profilePicUrl);
    } catch (err) {
      console.error('[VerifyInstagram] Profile picture upload failed', err);
      return NextResponse.json({ message: 'Profile picture upload failed' }, { status: 500 });
    }

    // Generate 8-character random code
    const randomCode = randomBytes(4).toString('hex');

    // Create InstagramVerification entry
    let verification;
    try {
      verification = await InstagramVerification.create({
        userId,
        profilePicUrl,
        username: instagramId,
        followerCount,
        randomCode,
        status: 'pending',
      });
      console.log('[VerifyInstagram] Created verification:', verification._id);
    } catch (err) {
      console.error('[VerifyInstagram] Failed to create verification request', err);
      return NextResponse.json({ message: 'Failed to create verification request' }, { status: 500 });
    }

    // Update influencer model
    try {
      const influencerUpdate = await Influencer.findByIdAndUpdate(
        userId,
        {
          profilePictureUrl: profilePicUrl,
          instagramUsername: instagramId,
          followerCount,
          instagramVerification: verification._id,
        },
        { new: true }
      );
      if (!influencerUpdate) {
        console.error('[VerifyInstagram] Influencer not found or not updated:', userId);
        // Optionally, you could delete the verification if influencer update fails
        return NextResponse.json({ message: 'Failed to update influencer profile' }, { status: 500 });
      }
      console.log('[VerifyInstagram] Influencer updated:', influencerUpdate._id);
    } catch (err) {
      console.error('[VerifyInstagram] Failed to update influencer profile', err);
      // Optionally, you could delete the verification if influencer update fails
      return NextResponse.json({ message: 'Failed to update influencer profile' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Verification request sent' });
  } catch (err) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
// End of file
}
