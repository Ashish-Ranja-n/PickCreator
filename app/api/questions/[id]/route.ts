import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/lib/mongoose';
import { Question, Answer } from '@/models';
import { getDataFromToken } from '@/helpers/getDataFromToken';
import mongoose from 'mongoose';

// GET /api/questions/[id] - Get a specific question
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connect();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid question ID' },
        { status: 400 }
      );
    }

    const question = await Question.findById(id)
      .populate('author', 'name username profilePicture avatar')
      .lean();

    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // Increment view count
    await Question.findByIdAndUpdate(id, { $inc: { views: 1 } });

    // Get answers for this question
    const answers = await Answer.find({ question: id })
      .sort({ isAccepted: -1, upvotes: -1, createdAt: -1 })
      .populate('author', 'name username profilePicture avatar')
      .lean();

    return NextResponse.json({
      question,
      answers
    });
  } catch (error) {
    console.error('Error fetching question:', error);
    return NextResponse.json(
      { error: 'Failed to fetch question' },
      { status: 500 }
    );
  }
}

// PUT /api/questions/[id] - Update a question
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userData = await getDataFromToken(request);

    if (!userData || !userData.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connect();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid question ID' },
        { status: 400 }
      );
    }

    const question = await Question.findById(id);

    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // Check if user is the author
    if (question.author.toString() !== userData.id) {
      return NextResponse.json(
        { error: 'Not authorized to update this question' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, content, tags } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    question.title = title;
    question.content = content;
    question.tags = tags || [];

    await question.save();

    return NextResponse.json(question);
  } catch (error) {
    console.error('Error updating question:', error);
    return NextResponse.json(
      { error: 'Failed to update question' },
      { status: 500 }
    );
  }
}

// DELETE /api/questions/[id] - Delete a question
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userData = await getDataFromToken(request);

    if (!userData || !userData.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connect();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid question ID' },
        { status: 400 }
      );
    }

    const question = await Question.findById(id);

    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // Check if user is the author
    if (question.author.toString() !== userData.id) {
      return NextResponse.json(
        { error: 'Not authorized to delete this question' },
        { status: 403 }
      );
    }

    // Delete all answers for this question
    await Answer.deleteMany({ question: id });

    // Delete the question
    await Question.findByIdAndDelete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting question:', error);
    return NextResponse.json(
      { error: 'Failed to delete question' },
      { status: 500 }
    );
  }
}