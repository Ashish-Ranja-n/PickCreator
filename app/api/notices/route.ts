import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/lib/mongoose';
import { Notice, User } from '@/models';
import { getDataFromToken } from '@/helpers/getDataFromToken';

// GET /api/notices - Get all notices
export async function GET(request: NextRequest) {

  await connect();
  
  try {
    // Get notices sorted by pinned status (pinned first) and then by creation date (newest first)
    const notices = await Notice.find({})
      .sort({ isPinned: -1, createdAt: -1 })
      .populate('createdBy', 'name avatar')
      .lean();

    return NextResponse.json(notices);
  } catch (error) {
    console.error('Error fetching notices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notices' },
      { status: 500 }
    );
  }
}

// POST /api/notices - Create a new notice (admin only)
export async function POST(request: NextRequest) {
  try {
    // Get user data from token
    const userData = await getDataFromToken(request);
    if (!userData || !userData.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is an admin
    const user = await User.findById(userData.id);
    if (!user || user.role !== 'Admin') {
      return NextResponse.json(
        { error: 'Only admins can create notices' },
        { status: 403 }
      );
    }

    await connect();

    const { title, content, isPinned } = await request.json();

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    const notice = await Notice.create({
      title,
      content,
      createdBy: userData.id,
      isPinned: isPinned || false,
    });

    // Return the created notice with populated creator info
    const populatedNotice = await Notice.findById(notice._id)
      .populate('createdBy', 'name avatar')
      .lean();

    return NextResponse.json(populatedNotice, { status: 201 });
  } catch (error) {
    console.error('Error creating notice:', error);
    return NextResponse.json(
      { error: 'Failed to create notice' },
      { status: 500 }
    );
  }
}
