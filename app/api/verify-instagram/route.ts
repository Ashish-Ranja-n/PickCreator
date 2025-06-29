
import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/lib/mongoose';
import { Influencer } from '@/models/index';
import InstagramVerification from '@/models/instagramVerification';
import { randomBytes } from 'crypto';
import { uploadToCloudinary, CLOUDINARY_FOLDERS } from '@/utils/cloudinary';

export async function POST(req: NextRequest) {
  await connect();
  try {
    // Try to get userId from header or formData
    let userId = req.headers.get('x-user-id');
    let formData: FormData | null = null;
    if (!userId) {
      formData = await req.formData();
      userId = formData.get('userId') as string | null;
    }
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized: userId missing' }, { status: 401 });
    }

    // Always parse formData (if not already parsed)
    if (!formData) {
      formData = await req.formData();
    }

    // Validate and sanitize input
    const instagramId = (formData.get('instagramId') || '').toString().trim();
    const followerCountRaw = formData.get('followerCount');
    const followerCount = followerCountRaw ? parseInt(followerCountRaw.toString(), 10) : NaN;
    const profilePic = formData.get('profilePic') as File | null;

    if (!instagramId || isNaN(followerCount) || !profilePic) {
      return NextResponse.json({ message: 'All fields are required and must be valid' }, { status: 400 });
    }

    // Delete previous verification requests for this user
    await InstagramVerification.deleteMany({ userId });

    // Upload profile picture to Cloudinary
    let profilePicUrl = '';
    try {
      const buffer = Buffer.from(await profilePic.arrayBuffer());
      const uploadResult = (await uploadToCloudinary(
        buffer,
        CLOUDINARY_FOLDERS.PROFILE_PICTURES
      )) as { secure_url: string };
      profilePicUrl = uploadResult.secure_url;
    } catch (err) {
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
    } catch (err) {
      return NextResponse.json({ message: 'Failed to create verification request' }, { status: 500 });
    }

    // Update influencer model
    try {
      await Influencer.findOneAndUpdate(
        { _id: userId },
        {
          profilePictureUrl: profilePicUrl,
          instagramUsername: instagramId,
          followerCount,
          instagramVerification: verification._id,
        }
      );
    } catch (err) {
      // Optionally, you could delete the verification if influencer update fails
      return NextResponse.json({ message: 'Failed to update influencer profile' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Verification request sent' });
  } catch (err) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
// End of file
}
