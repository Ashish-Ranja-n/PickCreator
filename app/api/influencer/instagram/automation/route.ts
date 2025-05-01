import { NextRequest, NextResponse } from 'next/server';
import { getDataFromToken } from '@/helpers/getDataFromToken';
import { connect } from '@/lib/mongoose';
import { AutomationRule } from '@/models/automationRule';
import { Influencer } from '@/models/influencer';

// Add top-level log
console.log('Loading /api/influencer/instagram/automation/route.ts module...');

// GET: Fetch automation rules for the current user
export async function GET(request: NextRequest) {
  try {
    // Connect to database
    await connect();
    
    // Get user data from token
    const userData = await getDataFromToken(request);
    if (!userData || !userData.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Fetch automation rules for this user
    const rules = await AutomationRule.find({ user: userData.id }).sort({ createdAt: -1 });
    
    return NextResponse.json({ success: true, rules });
  } catch (error) {
    console.error('Error fetching automation rules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch automation rules' },
      { status: 500 }
    );
  }
}

// POST: Create a new automation rule
export async function POST(request: NextRequest) {
  // Add entry-point log
  console.log('Entering POST handler for /api/influencer/instagram/automation');
  try {
    // Connect to database
    await connect();
    
    // Get user data from token
    const userData = await getDataFromToken(request);
    if (!userData || !userData.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.responseTemplate || !body.triggerType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Check if user is an influencer - Query by _id, not a non-existent 'user' field
    const influencer = await Influencer.findOne({ _id: userData.id });
    if (!influencer) {
      return NextResponse.json(
        { error: 'Influencer profile not found' },
        { status: 404 }
      );
    }
    
    // If Instagram is not connected, don't allow creating automation rules
    if (!influencer.instagramConnected) {
      return NextResponse.json(
        { error: 'Instagram account not connected' },
        { status: 400 }
      );
    }
    
    // Check if keywords are provided for keyword-based rules
    if (body.triggerType === 'keyword' && (!body.keywords || body.keywords.length === 0)) {
      return NextResponse.json(
        { error: 'Keywords are required for keyword-based automation' },
        { status: 400 }
      );
    }
    
    // Create the automation rule
    const newRule = new AutomationRule({
      user: userData.id,
      name: body.name,
      triggerType: body.triggerType,
      keywords: body.triggerType === 'keyword' ? body.keywords : [],
      responseTemplate: body.responseTemplate,
      delaySeconds: Math.min(Math.max(body.delaySeconds || 0, 0), 30), // Ensure between 0-30 seconds
      active: body.active !== undefined ? body.active : true
    });
    
    await newRule.save();
    
    return NextResponse.json({
      success: true,
      rule: newRule
    });
  } catch (error) {
    console.error('Error creating automation rule:', error);
    return NextResponse.json(
      { error: 'Failed to create automation rule' },
      { status: 500 }
    );
  }
}

// DELETE: Remove an automation rule
export async function DELETE(request: NextRequest) {
  try {
    // Connect to database
    await connect();
    
    // Get user data from token
    const userData = await getDataFromToken(request);
    if (!userData || !userData.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get rule ID from query params
    const { searchParams } = new URL(request.url);
    const ruleId = searchParams.get('id');
    
    if (!ruleId) {
      return NextResponse.json(
        { error: 'Rule ID is required' },
        { status: 400 }
      );
    }
    
    // Find and delete the rule, ensuring it belongs to the current user
    const deletedRule = await AutomationRule.findOneAndDelete({
      _id: ruleId,
      user: userData.id
    });
    
    if (!deletedRule) {
      return NextResponse.json(
        { error: 'Rule not found or unauthorized' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Automation rule deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting automation rule:', error);
    return NextResponse.json(
      { error: 'Failed to delete automation rule' },
      { status: 500 }
    );
  }
}

// PATCH: Update an automation rule
export async function PATCH(request: NextRequest) {
  try {
    // Connect to database
    await connect();
    
    // Get user data from token
    const userData = await getDataFromToken(request);
    if (!userData || !userData.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse request body
    const body = await request.json();
    const { ruleId, updates } = body;
    
    if (!ruleId || !updates) {
      return NextResponse.json(
        { error: 'Rule ID and updates are required' },
        { status: 400 }
      );
    }
    
    // Find and update the rule, ensuring it belongs to the current user
    const updatedRule = await AutomationRule.findOneAndUpdate(
      { _id: ruleId, user: userData.id },
      { $set: updates },
      { new: true }
    );
    
    if (!updatedRule) {
      return NextResponse.json(
        { error: 'Rule not found or unauthorized' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      rule: updatedRule
    });
  } catch (error) {
    console.error('Error updating automation rule:', error);
    return NextResponse.json(
      { error: 'Failed to update automation rule' },
      { status: 500 }
    );
  }
} 