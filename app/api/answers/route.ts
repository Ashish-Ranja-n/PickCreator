import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/lib/mongoose';
import { Answer, Question } from '@/models';
import { getDataFromToken } from '@/helpers/getDataFromToken';
import mongoose from 'mongoose';

// GET /api/answers - Get all answers for a question
export async function GET(request: NextRequest) {
  try {
    await connect();

    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get('questionId');

    if (!questionId || !mongoose.Types.ObjectId.isValid(questionId)) {
      return NextResponse.json(
        { error: 'Valid question ID is required' },
        { status: 400 }
      );
    }

    const answers = await Answer.find({ question: questionId })
      .sort({ isAccepted: -1, upvotes: -1, createdAt: -1 })
      .populate('author', 'name username profilePicture avatar')
      .lean();

    return NextResponse.json(answers);
  } catch (error) {
    console.error('Error fetching answers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch answers' },
      { status: 500 }
    );
  }
}

// POST /api/answers - Create a new answer
export async function POST(request: NextRequest) {
  try {
    const userData = await getDataFromToken(request);

    if (!userData || !userData.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connect();

    const body = await request.json();
    const { content, questionId } = body;

    if (!content || !questionId) {
      return NextResponse.json(
        { error: 'Content and question ID are required' },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(questionId)) {
      return NextResponse.json(
        { error: 'Invalid question ID' },
        { status: 400 }
      );
    }

    // Check if question exists
    const question = await Question.findById(questionId);

    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // Check if user has already answered this question
    const existingAnswer = await Answer.findOne({
      question: questionId,
      author: userData.id
    });

    if (existingAnswer) {
      return NextResponse.json(
        { error: 'You have already answered this question' },
        { status: 400 }
      );
    }

    const answer = await Answer.create({
      content,
      question: questionId,
      author: userData.id,
    });

    // Update question's isAnswered status
    await Question.findByIdAndUpdate(questionId, { isAnswered: true });

    return NextResponse.json(answer, { status: 201 });
  } catch (error) {
    console.error('Error creating answer:', error);
    return NextResponse.json(
      { error: 'Failed to create answer' },
      { status: 500 }
    );
  }
}