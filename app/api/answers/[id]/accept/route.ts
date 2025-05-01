import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/lib/mongoose';
import { Answer, Question } from '@/models';
import { getDataFromToken } from '@/helpers/getDataFromToken';
import mongoose from 'mongoose';

// POST /api/answers/[id]/accept - Accept an answer
export async function POST(
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
    
    // Get the question to check if the user is the author
    const question = await Question.findById(answer.question);
    
    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }
    
    // Check if user is the question author
    if (question.author.toString() !== userData.id) {
      return NextResponse.json(
        { error: 'Only the question author can accept an answer' },
        { status: 403 }
      );
    }
    
    // If this answer is already accepted, unaccept it
    if (answer.isAccepted) {
      answer.isAccepted = false;
      await answer.save();
      
      return NextResponse.json({ 
        success: true, 
        message: 'Answer unaccepted',
        answer
      });
    }
    
    // Unaccept all other answers for this question
    await Answer.updateMany(
      { question: answer.question, _id: { $ne: answer._id } },
      { isAccepted: false }
    );
    
    // Accept this answer
    answer.isAccepted = true;
    await answer.save();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Answer accepted',
      answer
    });
  } catch (error) {
    console.error('Error accepting answer:', error);
    return NextResponse.json(
      { error: 'Failed to accept answer' },
      { status: 500 }
    );
  }
} 