This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Cloudinary Integration

This project uses Cloudinary for media storage and management. Cloudinary is used for:

1. Storing Instagram influencer's media from Instagram Graph API
2. Storing media sent in chat messages
3. Storing profile pictures and videos

### Setup

1. Create a Cloudinary account at [https://cloudinary.com/](https://cloudinary.com/)
2. Get your Cloudinary credentials (Cloud Name, API Key, API Secret)
3. Add these credentials to your `.env` file:

```
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### Media Organization

Media is organized in Cloudinary using the following folder structure:

- `profile_pictures/`: For user profile pictures
- `chat_media/`: For media shared in chat messages
- `instagram_media/`: For media imported from Instagram

### API Routes

- `POST /api/upload`: Upload a file to Cloudinary
- `PUT /api/upload`: Upload a URL to Cloudinary (useful for Instagram media)

### Utilities

- `utils/cloudinary.ts`: Core Cloudinary configuration and utility functions
- `utils/uploadMedia.ts`: Client-side utilities for uploading media
- `utils/instagramMedia.ts`: Utilities for working with Instagram media

## Socket.IO Chat Setup

This project uses Socket.IO for real-time chat and status updates. The Socket.IO server has been separated from the Next.js server for better performance and scalability.

### Architecture

- Next.js server runs on port 3000
- Socket.IO server runs independently on port 4000
- Client connects to both servers - Next.js for the app UI and Socket.IO for real-time events

### Running Both Servers

You can run both servers with a single command:

```bash
npm run dev:both
```

Or start them separately:

```bash
# Start Next.js server
npm run dev

# Start Socket.IO server in another terminal
npm run start:socket-server
```

### Configuration

The Socket.IO server URL is configured in the `.env.local` file:

```
NEXT_PUBLIC_SOCKET_SERVER_URL=http://localhost:4000
```

In production, you'll need to update this to your Socket.IO server's public URL.

### Features

- Real-time messaging
- Online status indicators
- Typing indicators
- Media sharing
- User presence tracking
