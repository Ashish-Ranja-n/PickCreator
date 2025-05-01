# Chat Components

## Recent Updates

### ChatList.tsx
- **User Role Badge**: Added color-coded role badges to easily identify if the user is a Brand or Influencer
- **Online Status Integration**: Added real-time user status indicators that show whether users are online or offline
- **Timestamp Formatting**: Added proper formatting for message timestamps (Today, Yesterday, or date)
- **Socket Integration**: Connected the chat list to the socket for real-time updates of user status
- **Enhanced UI**: Improved the UI with clearer status indicators and better message previews
- **Avatar Handling**: Properly handles user avatar display, with fallbacks to generated avatars
- **Media Messages**: Shows an indicator for media attachments in the last message
- **Unread Message Badge**: Added support for displaying unread message count badges
- **Debugging Logs**: Added console logs to help track data flow and state changes

### API Improvements
- **Enhanced Conversation Endpoint**: Updated the `/api/conversation/[userId]` endpoint to include:
  - User ID of the conversation partner (for online status checks)
  - Last message timestamp for proper time display
  - Better sorting based on most recently updated conversations
  - Media message handling for previews
  - Proper user avatar handling with multiple sources
  - Support for unread message count (to be implemented)

## Component Structure

The chat functionality consists of several key components:

1. **ChatList**: Shows all conversations with real-time online status
2. **ChatWindow**: Main chat interface for individual conversations
3. **Socket Integration**: Real-time updates for messages and user status

## Socket Events

The following socket events are used:

- `userStatusChange`: When a user's online status changes
- `newMessage`: When a new message is received
- `typing`: When a user is typing

## Data Models

### Conversation
```typescript
interface Conversations {
  _id: string;         // Conversation ID
  name: string;        // Name of the other user
  role: string;        // Role of the other user (Brand/Influencer)
  avatar?: string;     // Avatar URL
  lastMessage?: string; // Preview of the last message
  lastMessageTime?: string; // Timestamp of the last message
  userId: string;      // ID of the other user (for status checks)
  unreadCount?: number; // Number of unread messages
}
```

## UI Elements

### Role Badges
- **Brand**: Blue badge
- **Influencer**: Purple badge

### Online Status Indicator
- **Online**: Green dot with "online" text
- **Offline**: Gray dot with "offline" text

### Message Preview
- **Text Message**: Shows the message text
- **Media Message**: Shows text with media or indicates the media type
- **No Messages**: Shows "No messages yet"

## Troubleshooting

If status indicators are not updating:
1. Check the socket connection in the console
2. Verify that the `userId` field is correctly populated in the conversation data
3. Make sure the `onlineUsers` Map in the socket hook contains the correct user IDs 