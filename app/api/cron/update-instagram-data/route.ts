import { NextResponse } from 'next/server';
import { connect } from '@/lib/mongoose';
import { getMinimalInstagramData, shouldRefreshToken, refreshInstagramToken } from '@/utils/instagramApi';
import mongoose from 'mongoose';

/**
 * API route for updating Instagram data for all influencers
 * This route should be called by a cron job every 12 hours
 * Example setup with a service like Vercel Cron Jobs:
 * - Schedule: 0 0,12 * * * (at midnight and noon)
 * - Endpoint: /api/cron/update-instagram-data
 */
export async function GET(request: Request) {
  try {
    // Check for optional API key for security (use env var or other security mechanism)
    const { searchParams } = new URL(request.url);
    const apiKey = searchParams.get('key');
    const secretKey = process.env.CRON_SECRET_KEY;
    
    // If a secret key is set but doesn't match, return an error
    if (secretKey && apiKey !== secretKey) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Connect to the database
    await connect();
    
    // Ensure the database connection is established
    if (!mongoose.connection.db) {
      throw new Error('Failed to connect to database');
    }
    
    const db = mongoose.connection.db;
    
    // Get all influencers with Instagram tokens
    const influencers = await db.collection('influencers').find({
      'instagramToken.access_token': { $exists: true }
    }).toArray();
    
    console.log(`Found ${influencers.length} influencers with Instagram tokens to update`);
    
    const results = {
      total: influencers.length,
      success: 0,
      failed: 0,
      refreshed: 0,
      errors: [] as string[]
    };
    
    // Process each influencer one by one to avoid rate limiting
    for (const influencer of influencers) {
      try {
        console.log(`Processing Instagram data for influencer: ${influencer._id}`);
        
        // Check if token needs refresh
        if (influencer.instagramToken && shouldRefreshToken(influencer.instagramToken.created_at)) {
          console.log(`Refreshing token for influencer: ${influencer._id}`);
          
          try {
            const refreshedToken = await refreshInstagramToken(influencer.instagramToken.access_token);
            
            // Update the token in database
            await db.collection('influencers').updateOne(
              { _id: influencer._id },
              {
                $set: {
                  'instagramToken.access_token': refreshedToken,
                  'instagramToken.created_at': new Date()
                }
              }
            );
            
            influencer.instagramToken.access_token = refreshedToken;
            results.refreshed++;
            
            console.log(`Token refreshed successfully for influencer: ${influencer._id}`);
          } catch (refreshError) {
            console.error(`Error refreshing token for influencer ${influencer._id}:`, refreshError);
            results.errors.push(`Token refresh failed for ${influencer._id}: ${refreshError instanceof Error ? refreshError.message : 'Unknown error'}`);
            continue; // Skip this influencer and move to the next
          }
        }
        
        // Get Instagram data
        const instagramData = await getMinimalInstagramData(influencer.instagramToken.access_token);
        
        // Save to database
        await db.collection('influencers').updateOne(
          { _id: influencer._id },
          {
            $set: {
              instagramData,
              lastInstagramUpdate: new Date()
            }
          }
        );
        
        results.success++;
        console.log(`Successfully updated Instagram data for influencer: ${influencer._id}`);
      } catch (error) {
        results.failed++;
        const errorMessage = `Error processing influencer ${influencer._id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(errorMessage);
        results.errors.push(errorMessage);
      }
      
      // Add a small delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return NextResponse.json({
      success: true,
      message: `Updated Instagram data for ${results.success} of ${results.total} influencers. ${results.refreshed} tokens refreshed.`,
      results
    });
  } catch (error) {
    console.error('Error in update-instagram-data cron job:', error);
    return NextResponse.json(
      { success: false, message: 'Internal Server Error', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 