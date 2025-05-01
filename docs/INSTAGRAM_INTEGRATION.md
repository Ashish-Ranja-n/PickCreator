# Instagram API Integration Guide

This document outlines how the Instagram API integration works in this application, common issues, and troubleshooting steps.

## Components Overview

The Instagram integration consists of these main components:

1. **API Utilities**:
   - `utils/instagramApi.ts` - Core API functions for authentication and data fetching
   - `utils/instagramApiErrors.ts` - Error handling utilities

2. **API Routes**:
   - `/api/auth/instagram` - Starts the authentication flow
   - `/api/auth/instagram/callback` - Handles Instagram OAuth callback
   - `/api/influencer/instagram/minimal` - Retrieves minimal Instagram data

3. **UI Components**:
   - `components/instagram/MinimalInstagramData.tsx` - Displays Instagram profile and media
   - `components/instagram/RefreshInstagramButton.tsx` - Provides a way to refresh Instagram data
   - `components/instagram/InstagramDebugInfo.tsx` - Shows debug information about the connection

## Authentication Flow

1. User initiates Instagram connection via `/connect-instagram`
2. User is redirected to Instagram for authorization
3. Instagram redirects to our callback URL with an authorization code
4. We exchange the code for a short-lived token
5. We convert the short-lived token to a long-lived token
6. We store the token in the database with the user's profile

## Data Structure

The main Instagram data interface (`InstagramData`) consists of:

```typescript
{
  isConnected: boolean;
  profile?: InstagramProfile;
  media?: InstagramMedia[];
  error?: string;
  lastUpdated?: Date;
}
```

## Common Issues and Solutions

### 1. Account Not Connected

**Symptoms**: Instagram data doesn't show up, `isConnected` is false

**Solutions**:
- Check if the user has completed the Instagram authentication flow
- Verify that the Instagram token is stored correctly in the database
- Try reconnecting the account

### 2. Missing Profile Data

**Symptoms**: Connected but no profile information

**Solutions**:
- Check the account type (personal vs. business/creator)
- Verify the required permissions are granted
- Check for API errors in the server logs

### 3. Missing Media or Insights

**Symptoms**: Profile shows but no media or engagement metrics

**Solutions**:
- Business/Creator accounts are required for insights
- Check if the account has any posts
- Verify you requested the correct fields in the API calls

### 4. Authentication Errors

**Symptoms**: "Authentication expired" error messages

**Solutions**:
- Tokens expire after 60 days if not refreshed
- Check the token refresh logic
- Reconnect the account

## Debugging

1. **Enable Debug Mode**: Use the InstagramDebugInfo component
2. **Check Server Logs**: Look for detailed API responses and errors
3. **Test API Directly**: Use scripts/test-instagram-api.js to test your token

## Required Permissions

The minimal set of permissions required:
- `instagram_business_basic` - For basic profile data
- `instagram_business_manage_insights` - For analytics data

## Best Practices

1. **Minimal Scope**: Only request necessary permissions
2. **Field Selection**: Be specific about which fields you need
3. **Error Handling**: Always check for OAuthException error types
4. **Media Access**: Check for null values and use optional chaining (e.g., item.insights?.likes)
5. **Token Refresh**: Implement automatic token refresh for tokens older than 50 days 