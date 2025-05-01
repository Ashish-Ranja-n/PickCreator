import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/lib/mongoose';
import { Vote, Question, Answer } from '@/models';
import { getDataFromToken } from '@/helpers/getDataFromToken';
import mongoose from 'mongoose';

// POST /api/votes - Vote on a question or answer
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
    const { targetType, targetId, voteType } = body;
    
    if (!targetType || !targetId || !voteType) {
      return NextResponse.json(
        { error: 'Target type, target ID, and vote type are required' },
        { status: 400 }
      );
    }
    
    if (!['question', 'answer'].includes(targetType)) {
      return NextResponse.json(
        { error: 'Target type must be either "question" or "answer"' },
        { status: 400 }
      );
    }
    
    if (!['upvote', 'downvote'].includes(voteType)) {
      return NextResponse.json(
        { error: 'Vote type must be either "upvote" or "downvote"' },
        { status: 400 }
      );
    }
    
    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      return NextResponse.json(
        { error: 'Invalid target ID' },
        { status: 400 }
      );
    }
    
    // Check if target exists
    if (targetType === 'question') {
      const question = await Question.findById(targetId);
      if (!question) {
        return NextResponse.json(
          { error: 'Question not found' },
          { status: 404 }
        );
      }
    } else {
      const answer = await Answer.findById(targetId);
      if (!answer) {
        return NextResponse.json(
          { error: 'Answer not found' },
          { status: 404 }
        );
      }
    }
    
    // Check if user has already voted on this target
    const existingVote = await Vote.findOne({
      user: userData.id,
      targetType,
      targetId
    });
    
    // If user has already voted with the same vote type, remove the vote
    if (existingVote && existingVote.voteType === voteType) {
      await Vote.findByIdAndDelete(existingVote._id);
      
      // Update the target's vote count
      if (targetType === 'question') {
        await Question.findByIdAndUpdate(targetId, {
          $inc: { [voteType + 's']: -1 }
        });
      } else {
        await Answer.findByIdAndUpdate(targetId, {
          $inc: { [voteType + 's']: -1 }
        });
      }
      
      return NextResponse.json({
        success: true,
        message: 'Vote removed',
        voteType: null
      });
    }
    
    // If user has already voted with a different vote type, update the vote
    if (existingVote) {
      const oldVoteType = existingVote.voteType;
      
      // Update the vote
      existingVote.voteType = voteType;
      await existingVote.save();
      
      // Update the target's vote count
      if (targetType === 'question') {
        await Question.findByIdAndUpdate(targetId, {
          $inc: {
            [oldVoteType + 's']: -1,
            [voteType + 's']: 1
          }
        });
      } else {
        await Answer.findByIdAndUpdate(targetId, {
          $inc: {
            [oldVoteType + 's']: -1,
            [voteType + 's']: 1
          }
        });
      }
      
      return NextResponse.json({
        success: true,
        message: 'Vote updated',
        voteType
      });
    }
    
    // Create a new vote
    const vote = await Vote.create({
      user: userData.id,
      targetType,
      targetId,
      voteType
    });
    
    // Update the target's vote count
    if (targetType === 'question') {
      await Question.findByIdAndUpdate(targetId, {
        $inc: { [voteType + 's']: 1 }
      });
    } else {
      await Answer.findByIdAndUpdate(targetId, {
        $inc: { [voteType + 's']: 1 }
      });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Vote created',
      voteType
    });
  } catch (error) {
    console.error('Error voting:', error);
    return NextResponse.json(
      { error: 'Failed to vote' },
      { status: 500 }
    );
  }
} 