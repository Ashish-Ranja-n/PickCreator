import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/lib/mongoose';
import { Notice, User } from '@/models';
import { getDataFromToken } from '@/helpers/getDataFromToken';
import mongoose from 'mongoose';

// DELETE /api/notices/[id] - Delete a notice (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
        { error: 'Only admins can delete notices' },
        { status: 403 }
      );
    }

    await connect();
    
    const { id } = await params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid notice ID' },
        { status: 400 }
      );
    }

    const notice = await Notice.findByIdAndDelete(id);
    
    if (!notice) {
      return NextResponse.json(
        { error: 'Notice not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Notice deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting notice:', error);
    return NextResponse.json(
      { error: 'Failed to delete notice' },
      { status: 500 }
    );
  }
}
