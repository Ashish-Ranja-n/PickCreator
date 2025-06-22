import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/lib/mongoose';
import { Influencer } from '@/models/index';
import InstagramVerification from '@/models/instagramVerification';
import { randomBytes } from 'crypto';
import { uploadToCloudinary, CLOUDINARY_FOLDERS } from '@/utils/cloudinary';

export async function POST(req: NextRequest) {
  await connect();
  // Get userId from header or body (adjust as per your auth logic)
  let userId = req.headers.get('x-user-id');
  if (!userId) {
    // Try to get from formData if sent that way
    const formData = await req.formData();
    userId = formData.get('userId') as string;
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized: userId missing' }, { status: 401 });
    }
    // Continue with formData already parsed
    const instagramId = formData.get('instagramId') as string;
    const followerCount = parseInt(formData.get('followerCount') as string, 10);
    const profilePic = formData.get('profilePic') as File | null;
    if (!instagramId || !followerCount || !profilePic) {
      return NextResponse.json({ message: 'All fields are required' }, { status: 400 });
    }
    // Upload profile picture to Cloudinary
    const buffer = Buffer.from(await profilePic.arrayBuffer());
    const uploadResult = (await uploadToCloudinary(
      buffer,
      CLOUDINARY_FOLDERS.PROFILE_PICTURES
    )) as { secure_url: string };
    const profilePicUrl = uploadResult.secure_url;
    // Generate 8-character random code
    const randomCode = randomBytes(4).toString('hex');
    // Create InstagramVerification entry
    const verification = await InstagramVerification.create({
      userId,
      profilePicUrl,
      username: instagramId,
      followerCount,
      randomCode,
      status: 'pending',
    });
    // Update influencer model
    await Influencer.findOneAndUpdate(
      { _id: userId },
      {
        profilePictureUrl: profilePicUrl,
        instagramUsername: instagramId,
        followerCount,
        instagramVerification: verification._id,
      }
    );
    return NextResponse.json({ message: 'Verification request sent' });
  } else {
    // If userId is in header, parse formData as usual
    const formData = await req.formData();
    const instagramId = formData.get('instagramId') as string;
    const followerCount = parseInt(formData.get('followerCount') as string, 10);
    const profilePic = formData.get('profilePic') as File | null;
    if (!instagramId || !followerCount || !profilePic) {
      return NextResponse.json({ message: 'All fields are required' }, { status: 400 });
    }
    // Upload profile picture to Cloudinary
    const buffer = Buffer.from(await profilePic.arrayBuffer());
    const uploadResult = (await uploadToCloudinary(
      buffer,
      CLOUDINARY_FOLDERS.PROFILE_PICTURES
    )) as { secure_url: string };
    const profilePicUrl = uploadResult.secure_url;
    // Generate 8-character random code
    const randomCode = randomBytes(4).toString('hex');
    // Create InstagramVerification entry
    const verification = await InstagramVerification.create({
      userId,
      profilePicUrl,
      username: instagramId,
      followerCount,
      randomCode,
      status: 'pending',
    });
    // Update influencer model
    await Influencer.findOneAndUpdate(
      { _id: userId },
      {
        profilePictureUrl: profilePicUrl,
        instagramUsername: instagramId,
        followerCount,
        instagramVerification: verification._id,
      }
    );
    return NextResponse.json({ message: 'Verification request sent' });
  }
}
