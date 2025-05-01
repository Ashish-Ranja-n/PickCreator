import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/lib/mongoose';
import { Question } from '@/models';
import { getDataFromToken } from '@/helpers/getDataFromToken';

// GET /api/questions - Get all questions
export async function GET(request: NextRequest) {
  try {
    await connect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const tag = searchParams.get('tag');
    const search = searchParams.get('search');

    const query: any = {};

    if (tag) {
      query.tags = tag;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const questions = await Question.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'name username profilePicture avatar')
      .lean();

    const total = await Question.countDocuments(query);

    return NextResponse.json({
      questions,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questions' },
      { status: 500 }
    );
  }
}

// POST /api/questions - Create a new question
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
    const { title, content, tags } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    const question = await Question.create({
      title,
      content,
      tags: tags || [],
      author: userData.id,
    });

    return NextResponse.json(question, { status: 201 });
  } catch (error) {
    console.error('Error creating question:', error);
    return NextResponse.json(
      { error: 'Failed to create question' },
      { status: 500 }
    );
  }
}