import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/lib/mongoose';
import { Answer, Question } from '@/models';
import { getDataFromToken } from '@/helpers/getDataFromToken';
import mongoose from 'mongoose';

// GET /api/answers/[id] - Get a specific answer
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connect();
    
    const { id } = await params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid answer ID' },
        { status: 400 }
      );
    }
    
    const answer = await Answer.findById(id)
      .populate('author', 'name username profilePicture')
      .populate('question', 'title')
      .lean();
    
    if (!answer) {
      return NextResponse.json(
        { error: 'Answer not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(answer);
  } catch (error) {
    console.error('Error fetching answer:', error);
    return NextResponse.json(
      { error: 'Failed to fetch answer' },
      { status: 500 }
    );
  }
}

// PUT /api/answers/[id] - Update an answer
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
        { error: 'Invalid answer ID' },
        { status: 400 }
      );
    }
    
    const answer = await Answer.findById(id);
    
    if (!answer) {
      return NextResponse.json(
        { error: 'Answer not found' },
        { status: 404 }
      );
    }
    
    // Check if user is the author
    if (answer.author.toString() !== userData.id) {
      return NextResponse.json(
        { error: 'Not authorized to update this answer' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const { content } = body;
    
    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }
    
    answer.content = content;
    
    await answer.save();
    
    return NextResponse.json(answer);
  } catch (error) {
    console.error('Error updating answer:', error);
    return NextResponse.json(
      { error: 'Failed to update answer' },
      { status: 500 }
    );
  }
}

// DELETE /api/answers/[id] - Delete an answer
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
        { error: 'Invalid answer ID' },
        { status: 400 }
      );
    }
    
    const answer = await Answer.findById(id);
    
    if (!answer) {
      return NextResponse.json(
        { error: 'Answer not found' },
        { status: 404 }
      );
    }
    
    // Check if user is the author
    if (answer.author.toString() !== userData.id) {
      return NextResponse.json(
        { error: 'Not authorized to delete this answer' },
        { status: 403 }
      );
    }
    
    // Get the question ID before deleting the answer
    const questionId = answer.question;
    
    // Delete the answer
    await Answer.findByIdAndDelete(id);
    
    // Check if there are any remaining answers for this question
    const remainingAnswers = await Answer.countDocuments({ question: questionId });
    
    // If no answers remain, update the question's isAnswered status
    if (remainingAnswers === 0) {
      await Question.findByIdAndUpdate(questionId, { isAnswered: false });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting answer:', error);
    return NextResponse.json(
      { error: 'Failed to delete answer' },
      { status: 500 }
    );
  }
} 