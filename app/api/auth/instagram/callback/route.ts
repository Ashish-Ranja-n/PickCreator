import { NextRequest, NextResponse } from 'next/server';
import { getDataFromToken } from '@/helpers/getDataFromToken';
import { getInstagramAccessToken, validateFollowerCount, getInstagramProfile } from '@/utils/instagramApi';
import { parseInstagramError } from '@/utils/instagramApiErrors';
import { connect } from '@/lib/mongoose';
import User from '@/models/user';
import { Influencer } from '@/models/influencer';
import { ObjectId } from 'mongodb';
import axios from 'axios';
import { SignJWT } from 'jose';

/**
 * API route for handling Instagram OAuth callback
 * This receives the authorization code from Instagram and exchanges it for an access token
 */
export async function GET(request: NextRequest) {
  try {
    console.log("Instagram callback: Processing callback");

    // Get the base URL from environment variables
    const baseUrl = process.env.CLIENT_URL || 'https://pickcreator.com';
    console.log("Using base URL for redirects:", baseUrl);

    // Connect to the database
    await connect();

    // Get the authorization code from query parameters
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const errorReason = searchParams.get('error_reason');
    const errorDescription = searchParams.get('error_description');

    // Log all query parameters for debugging
    console.log("Instagram callback query parameters:", Object.fromEntries(searchParams.entries()));

    // If there's an error from Instagram, handle it
    if (error) {
      console.log(`Instagram callback error: ${error}, reason: ${errorReason}, description: ${errorDescription}`);
      return NextResponse.redirect(`${baseUrl}/connect-instagram?error=${error.toLowerCase()}`);
    }

    // If no code is provided, return an error
    if (!code) {
      console.log("Instagram callback: No code provided");
      return NextResponse.redirect(`${baseUrl}/connect-instagram?error=missing_code`);
    }

    console.log("Instagram callback: Code received, getting user from token");

    // Get the current user from the token
    const userData = await getDataFromToken(request);
    if (!userData) {
      console.log("Instagram callback: No user data in token");
      return NextResponse.redirect(`${baseUrl}/log-in`);
    }

    // Use either id or _id
    const userId = (userData as any).id || (userData as any)._id;

    if (!userId) {
      console.log("Instagram callback: No user ID in token");
      return NextResponse.redirect(`${baseUrl}/log-in`);
    }

    console.log("Instagram callback: User found, exchanging code for token");

    try {
      // Exchange the authorization code for an access token
      const instagramToken = await getInstagramAccessToken(code);

      console.log("Instagram callback: Token received, getting profile");

      // Get the Instagram profile to check follower count
      const profile = await getInstagramProfile(instagramToken.access_token);

      console.log("Instagram callback: Profile received:", JSON.stringify(profile));
      console.log("Instagram callback: Follower count:", profile.followers_count);

      // Find the user in the database
      const user = await User.findById(userId);
      if (!user) {
        console.log("Instagram callback: User not found in database");
        return NextResponse.redirect(`${baseUrl}/log-in`);
      }

      // Check if the user has enough followers or is an admin
      const hasEnoughFollowers = validateFollowerCount(profile.followers_count, user.role);

      if (!hasEnoughFollowers) {
        console.log("Instagram callback: Insufficient followers");
        // Get the minimum required followers from the validateFollowerCount function
        const minFollowers = 5000;
        return NextResponse.redirect(
          `${baseUrl}/connect-instagram?error=insufficient_followers&required_followers=${minFollowers}`
        );
      }

      // Check if this Instagram ID is already connected to another user
      const existingInfluencer = await Influencer.findOne({
        instagramId: profile.id,
        _id: { $ne: userId } // Exclude the current user
      });

      // Only block if not an admin and the account is already connected
      if (existingInfluencer && user.role !== 'Admin') {
        console.log("Instagram callback: Instagram ID already connected to another user");
        return NextResponse.redirect(`${baseUrl}/connect-instagram?error=already_connected`);
      }

      console.log("Instagram callback: Finding user in database");

      console.log("Instagram callback: Updating influencer record");

      try {
        // For manually created admin users, we need to force update the document directly using MongoDB operations
        if (user.role === 'Admin') {
          console.log("Instagram callback: Admin user, updating with direct MongoDB update");

          // Check if profile picture URL is valid and use fallback if needed
          const profilePictureUrl = profile.profile_picture_url ||
            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23BBBBBB' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'%3E%3C/path%3E%3Ccircle cx='12' cy='7' r='4'%3E%3C/circle%3E%3C/svg%3E";

          // Use raw MongoDB update to avoid Mongoose validation/schema issues
          const objectId = new ObjectId(userId.toString());
          await User.collection.updateOne(
            { _id: objectId },
            {
              $set: {
                instagram: {
                  connected: true,
                  username: profile.username,
                  followersCount: profile.followers_count || 0,
                  profilePicture: profilePictureUrl
                },
                image: profilePictureUrl
              }
            }
          );

          console.log("Instagram callback: Successfully updated admin user with Instagram data");
          return NextResponse.redirect(`${baseUrl}/admin/profile?refresh=true`);
        }

        // For influencers, continue with normal flow
        // First, check if the influencer already exists
        const influencer = await Influencer.findOne({ _id: userId });

        if (influencer) {
          console.log("Instagram callback: Updating existing influencer");

          // Validate that we have necessary data before marking as connected
          const hasValidProfile = profile && profile.id && profile.username;
          const hasValidToken = instagramToken && instagramToken.access_token;

          if (!hasValidProfile || !hasValidToken) {
            console.log("Instagram callback: Missing critical Instagram data, cannot mark as connected");
            return NextResponse.redirect(`${baseUrl}/connect-instagram?error=invalid_instagram_data`);
          }

          // Update the existing influencer
          influencer.instagramConnected = true;
          influencer.instagramToken = {
            accessToken: instagramToken.access_token,
            expiresIn: instagramToken.expires_in,
            createdAt: instagramToken.created_at
          };
          influencer.instagramUsername = profile.username;
          influencer.instagramId = profile.id;

          // Use profile.user_id (fetched by getInstagramProfile) as the webhook ID
          if (profile.user_id) {
            influencer.instagramWebhookId = profile.user_id;
            console.log(`Instagram callback: Using profile.user_id for instagramWebhookId: ${profile.user_id}`);
          } else {
            // Fallback if user_id is missing
            influencer.instagramWebhookId = profile.id;
            console.warn(`Instagram callback: profile.user_id is missing! Falling back to profile.id (${profile.id}) for instagramWebhookId.`);
          }

          influencer.followerCount = profile.followers_count || 0;
          influencer.profilePictureUrl = profile.profile_picture_url;

          await influencer.save();
          console.log("Instagram callback: Successfully updated influencer");
        } else {
          console.log("Instagram callback: Creating new influencer document");

          // Validate that we have necessary data before creating connected account
          const hasValidProfile = profile && profile.id && profile.username;
          const hasValidToken = instagramToken && instagramToken.access_token;

          if (!hasValidProfile || !hasValidToken) {
            console.log("Instagram callback: Missing critical Instagram data, cannot create connected account");
            return NextResponse.redirect(`${baseUrl}/connect-instagram?error=invalid_instagram_data`);
          }

          // Create a new influencer document
          const newInfluencer = new Influencer({
            _id: userId,
            user: userId,
            instagramConnected: true,
            instagramToken: {
              accessToken: instagramToken.access_token,
              expiresIn: instagramToken.expires_in,
              createdAt: instagramToken.created_at
            },
            instagramUsername: profile.username,
            instagramId: profile.id,
            followerCount: profile.followers_count || 0,
            profilePictureUrl: profile.profile_picture_url,
            socialMediaLinks: []
          });

          // Use profile.user_id (fetched by getInstagramProfile) as the webhook ID for new influencer
          if (profile.user_id) {
            newInfluencer.instagramWebhookId = profile.user_id;
            console.log(`Instagram callback: Using profile.user_id for new influencer instagramWebhookId: ${profile.user_id}`);
          } else {
             // Fallback if user_id is missing
            newInfluencer.instagramWebhookId = profile.id;
            console.warn(`Instagram callback: profile.user_id is missing! Falling back to profile.id (${profile.id}) for new influencer instagramWebhookId.`);
          }

          await newInfluencer.save();
          console.log("Instagram callback: Successfully created new influencer");
        }

        console.log("Instagram callback: Successfully connected Instagram for user:", userId);

        // Create a new token with updated Instagram connection status
        if (user.role === 'Influencer') {
          try {
            // Get the latest user data to ensure we have the most up-to-date information
            const updatedUser = await User.findById(userId);

            // Create token data with both id and _id to ensure compatibility
            const tokenData = {
              id: updatedUser._id,
              _id: updatedUser._id,
              email: updatedUser.email,
              role: updatedUser.role,
              // Add role-specific fields for Influencers with updated Instagram status
              instagramConnected: true, // We know it's connected now
              onboardingCompleted: updatedUser.onboardingCompleted || false
            };

            // Sign token using jose
            const token = await new SignJWT(tokenData)
              .setProtectedHeader({ alg: 'HS256' })
              .setExpirationTime('1d')
              .sign(new TextEncoder().encode(process.env.JWT_SECRET!));

            // Create response with redirect
            const response = NextResponse.redirect(`${baseUrl}/influencer/onboarding/basic-info`);

            // Set the new token in the cookies
            response.cookies.set("token", token, {
              httpOnly: true,
              secure: true,
              maxAge: 24 * 60 * 60, // 1 day in seconds
            });

            console.log("Instagram callback: New token issued with updated Instagram status");
            return response;
          } catch (tokenError) {
            console.error("Error creating new token:", tokenError);
            // If token creation fails, still redirect but without a new token
            return NextResponse.redirect(`${baseUrl}/influencer/onboarding/basic-info`);
          }
        } else if (user.role === 'Admin') {
          return NextResponse.redirect(`${baseUrl}/admin/profile`);
        } else {
          // Fallback for other roles
          return NextResponse.redirect(`${baseUrl}/influencer/onboarding/basic-info`);
        }
      } catch (dbError) {
        console.error("Error updating/creating influencer record:", dbError);

        // Try an alternative approach if the first one fails
        try {
          console.log("Instagram callback: Trying alternative update approach");

          // Handle admin users specially in the alternative approach too
          if (user.role === 'Admin') {
            console.log("Instagram callback: Admin user (alternative approach), using direct MongoDB update");

            // Check if profile picture URL is valid and use fallback if needed
            const profilePictureUrl = profile.profile_picture_url ||
              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23BBBBBB' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'%3E%3C/path%3E%3Ccircle cx='12' cy='7' r='4'%3E%3C/circle%3E%3C/svg%3E";

            // Use raw MongoDB update to avoid Mongoose validation/schema issues
            const objectId = new ObjectId(userId.toString());
            await User.collection.updateOne(
              { _id: objectId },
              {
                $set: {
                  instagram: {
                    connected: true,
                    username: profile.username,
                    followersCount: profile.followers_count || 0,
                    profilePicture: profilePictureUrl
                  },
                  image: profilePictureUrl
                }
              }
            );

            console.log("Instagram callback: Successfully updated admin user with Instagram data (alternative method)");
            return NextResponse.redirect(`${baseUrl}/admin/profile?refresh=true`);
          }

          // For non-admin users, use the original approach
          // Update the user directly to mark as Instagram connected
          try {
            // Get the user object
            const influencerUser = await User.findById(userId);

            // For influencers, set the properties directly using the original fields
            if (user.role === 'Influencer') {
              influencerUser.instagramConnected = true;
              influencerUser.instagramUsername = profile.username;
              influencerUser.instagramId = profile.id;
              influencerUser.followerCount = profile.followers_count || 0;
              influencerUser.profilePictureUrl = profile.profile_picture_url;

              await influencerUser.save();
            } else {
              // For other users, use the instagram object structure
              influencerUser.set({
                'instagram.connected': true,
                'instagram.accessToken': instagramToken.access_token,
                'instagram.expiresIn': instagramToken.expires_in,
                'instagram.createdAt': instagramToken.created_at,
                'instagram.username': profile.username,
                'instagram.id': profile.id,
                'instagram.followersCount': profile.followers_count || 0,
                'instagram.profilePicture': profile.profile_picture_url,
                image: profile.profile_picture_url
              });

              await influencerUser.save();
            }

            console.log("Instagram callback: Successfully updated user with Instagram data");

            // Create a new token with updated Instagram connection status (alternative approach)
            if (user.role === 'Influencer') {
              try {
                // Create token data with both id and _id to ensure compatibility
                const tokenData = {
                  id: influencerUser._id,
                  _id: influencerUser._id,
                  email: influencerUser.email,
                  role: influencerUser.role,
                  // Add role-specific fields for Influencers with updated Instagram status
                  instagramConnected: true, // We know it's connected now
                  onboardingCompleted: influencerUser.onboardingCompleted || false
                };

                // Sign token using jose
                const token = await new SignJWT(tokenData)
                  .setProtectedHeader({ alg: 'HS256' })
                  .setExpirationTime('1d')
                  .sign(new TextEncoder().encode(process.env.JWT_SECRET!));

                // Create response with redirect
                const response = NextResponse.redirect(`${baseUrl}/influencer/onboarding/basic-info`);

                // Set the new token in the cookies
                response.cookies.set("token", token, {
                  httpOnly: true,
                  secure: true,
                  maxAge: 24 * 60 * 60, // 1 day in seconds
                });

                console.log("Instagram callback: New token issued with updated Instagram status (alternative approach)");
                return response;
              } catch (tokenError) {
                console.error("Error creating new token (alternative approach):", tokenError);
                // If token creation fails, still redirect but without a new token
                return NextResponse.redirect(`${baseUrl}/influencer/onboarding/basic-info`);
              }
            } else if (user.role === 'Admin') {
              return NextResponse.redirect(`${baseUrl}/admin/profile?refresh=true`);
            } else {
              // Fallback for other roles
              return NextResponse.redirect(`${baseUrl}/influencer/onboarding/basic-info`);
            }
          } catch (updateError) {
            console.error("Error updating user with Instagram data:", updateError);
            throw new Error("Failed to update user with Instagram data");
          }
        } catch (altError) {
          console.error("Error with alternative update approach:", altError);
          throw new Error("Failed to update user with Instagram data");
        }
      }
    } catch (instagramError) {
      console.error('Error in Instagram API operations:', instagramError);

      // Parse the Instagram API error
      const parsedError = parseInstagramError(instagramError);
      const errorType = parsedError.type.toLowerCase();

      console.log("Instagram callback: API error type:", errorType);

      // IMPORTANT: Special handling for potential race conditions
      // If this is a token error but we've gotten far enough to have a user ID,
      // attempt to check if the Instagram connection is already established
      // This handles cases where the connection succeeded but token retrieval had an issue
      try {
        if (userId) {
          const existingUser = await User.findById(userId);
          const existingInfluencer = await Influencer.findOne({ _id: userId });

          // Check for fresh signup by analyzing URL parameters
          const freshSignup = searchParams.get('fresh') === 'true';
          console.log("Instagram callback: Fresh signup status:", freshSignup);

          // Enhanced error detection to capture more error types
          const isErrorRelatedToToken =
            parsedError.type.toLowerCase().includes('oauth') ||
            parsedError.message.toLowerCase().includes('token') ||
            errorType.includes('token') ||
            // Also detect sign-up related errors
            errorType.includes('invalid') ||
            errorType.includes('expired');

          const isTokenExpiredError = errorType.includes('expire');

          // More permissive check for new users or token issues
          if ((existingUser && (existingUser.instagramConnected || existingUser.instagram?.connected)) ||
              (existingInfluencer && existingInfluencer.instagramConnected) ||
              isErrorRelatedToToken ||
              freshSignup) {

            console.log("Instagram callback: Despite error, proceeding with connection recovery");

            // CRITICAL CHANGE: Do NOT force update connection status when there's an error
            // Instead, only manage redirects based on current connection status

            // Check if Instagram is ALREADY connected (don't set it to connected if it's not)
            const isActuallyConnected = (existingInfluencer && existingInfluencer.instagramConnected === true) ||
                                        (existingUser && existingUser.instagramConnected === true) ||
                                        (existingUser && existingUser.instagram?.connected === true);

            console.log("Instagram callback: Is Instagram actually connected:", isActuallyConnected);

            // Redirect to appropriate page based on ACTUAL connection status
            if (existingUser) {
              if (existingUser.role === 'Admin') {
                return NextResponse.redirect(`${baseUrl}/admin/profile?refresh=true`);
              } else if (existingUser.role === 'Influencer') {
                if (isActuallyConnected && (freshSignup || !existingInfluencer?.onboardingCompleted)) {
                  return NextResponse.redirect(`${baseUrl}/influencer/onboarding/basic-info?refresh=true`);
                } else if (isActuallyConnected) {
                  return NextResponse.redirect(`${baseUrl}/influencer?refresh=true`);
                } else {
                  // Instagram is NOT connected - redirect to connect page with error
                  console.log("Instagram callback: Instagram not actually connected, redirecting to connect page");
                  return NextResponse.redirect(`${baseUrl}/connect-instagram?error=connection_failed&reason=${errorType}&refresh=true`);
                }
              } else if (existingUser.role === 'Brand') {
                return NextResponse.redirect(`${baseUrl}/brand?refresh=true`);
              }
            }

            // Default case - redirect to connect page with special parameter
            return NextResponse.redirect(`${baseUrl}/connect-instagram?error=${errorType}&auto_retry=true`);
          }
        }
      } catch (fallbackError) {
        console.error("Error in fallback Instagram connection check:", fallbackError);
      }

      // If fallback check didn't work, redirect with the error
      // but add a special parameter for potential auto-retry
      return NextResponse.redirect(`${baseUrl}/connect-instagram?error=${errorType}&auto_retry=true`);
    }
  } catch (error) {
    console.error('Error handling Instagram callback:', error);

    // Get the base URL from environment variables
    const baseUrl = process.env.CLIENT_URL || 'https://pickcreator.com';

    // Redirect with a generic error
    return NextResponse.redirect(`${baseUrl}/connect-instagram?error=api_error`);
  }
}