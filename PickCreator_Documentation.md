# PickCreator Platform Documentation

<div style="text-align: center; margin-bottom: 50px;">
<h2>Connecting Local Brands with Instagram Influencers</h2>
<p style="font-style: italic;">Version 1.0</p>
</div>

## Table of Contents

1. [Introduction](#1-introduction)
2. [Technical Architecture](#2-technical-architecture)
3. [Core Features](#3-core-features)
4. [User Roles and Interfaces](#4-user-roles-and-interfaces)
5. [Database Schema](#5-database-schema)
6. [API Structure](#6-api-structure)
7. [Integration Points](#7-integration-points)
8. [Deployment Architecture](#8-deployment-architecture)
9. [Security Considerations](#9-security-considerations)
10. [Maintenance and Support](#10-maintenance-and-support)

---

## 1. Introduction

### 1.1 Platform Overview

PickCreator is a specialized platform designed to connect local brands with Instagram influencers, facilitating authentic collaborations and partnerships. The platform serves as a marketplace where brands can discover, connect with, and hire influencers for promotional campaigns, while influencers can showcase their profiles, set pricing models, and manage collaboration deals.

### 1.2 Core Purpose

PickCreator bridges the gap between brands and Instagram influencers (primarily those with 5K-1M followers), making collaborations seamless and secure. The platform focuses on connecting local influencers with businesses looking for authentic promotions in their geographic area.

### 1.3 Target Audience

- **Brands**: Businesses looking to promote their products or services through Instagram influencers
- **Influencers**: Instagram content creators with established followings
- **Administrators**: Platform managers who oversee operations and user management

### 1.4 Key Value Propositions

- **For Brands**:
  - Access to a curated network of local influencers
  - Transparent pricing and negotiation tools
  - Secure payment processing
  - Content approval workflows
  - Performance analytics

- **For Influencers**:
  - Increased visibility to relevant brands
  - Multiple monetization options
  - Flexible pricing models
  - Secure payment processing
  - Professional communication tools

---

## 2. Technical Architecture

### 2.1 Technology Stack

| Component | Technology |
|-----------|------------|
| Frontend | Next.js 14 (App Router), React, TypeScript |
| UI Framework | Tailwind CSS with shadcn/ui components |
| Backend | Next.js API Routes (serverless) |
| Database | MongoDB with Mongoose ODM |
| Authentication | JWT-based authentication |
| Real-time Communication | Socket.IO |
| Media Storage | Cloudinary |
| External APIs | Instagram Graph API |
| Deployment | Docker containerization |

### 2.2 System Architecture Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Client Browser │────▶│  Next.js Server │────▶│  MongoDB Atlas  │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                      │                        │
         │                      │                        │
         │                      ▼                        │
         │             ┌─────────────────┐               │
         │             │                 │               │
         └────────────▶│  Socket.IO      │◀──────────────┘
                       │  Server         │
                       │                 │
                       └─────────────────┘
                               │
                               │
                               ▼
                      ┌─────────────────┐
                      │                 │
                      │  Cloudinary     │
                      │  Media Storage  │
                      │                 │
                      └─────────────────┘
                               │
                               │
                               ▼
                      ┌─────────────────┐
                      │                 │
                      │  Instagram      │
                      │  Graph API      │
                      │                 │
                      └─────────────────┘
```

### 2.3 Containerization

The application is containerized using Docker with two main services:
- **Next.js Server**: Handles the web application and API endpoints
- **Socket.IO Server**: Manages real-time communication

---

## 3. Core Features

### 3.1 User Management

#### 3.1.1 User Roles
- **Brand**: Business accounts looking to hire influencers
- **Influencer**: Instagram content creators
- **Admin**: Platform administrators with management capabilities

#### 3.1.2 Authentication
- Email/password registration and login
- JWT-based session management
- Password reset functionality
- Role-based access control

### 3.2 Instagram Integration

- OAuth-based Instagram account connection
- Automatic data retrieval from Instagram Graph API
- Profile data synchronization (followers, media, engagement metrics)
- Periodic data refresh via cron jobs

### 3.3 Influencer Discovery

- Location-based influencer search
- Filtering by follower count and engagement metrics
- Sorting options (followers, average reel views)
- Detailed influencer profiles with analytics

### 3.4 Deal Management

#### 3.4.1 Deal Types
- **Single Influencer Deals**: One-to-one collaborations
- **Multiple Influencer Campaigns**: Coordinated campaigns with multiple influencers

#### 3.4.2 Pricing Models
- Fixed pricing for different content types (reels, posts, stories, lives)
- Package deals with bundled services
- Negotiable pricing with counter-offers
- Barter/product exchange options

#### 3.4.3 Deal Workflow
1. Deal request from brand to influencer
2. Acceptance, rejection, or counter-offer by influencer
3. Payment processing
4. Content creation and submission
5. Content approval and payment release

### 3.5 Communication

- Real-time chat between brands and influencers
- Chat rooms for group discussions
- Message notifications
- Typing indicators
- Media sharing in conversations

### 3.6 Content Management

- Content submission by influencers
- Content review by brands
- Instagram content integration
- Media storage via Cloudinary

### 3.7 Analytics

- Influencer performance metrics
- Engagement statistics
- Deal tracking and reporting
- Platform usage analytics

### 3.8 Progressive Web App (PWA) Features

- Offline functionality
- Push notifications
- Installable on mobile devices
- Service worker for background processing

---

## 4. User Roles and Interfaces

### 4.1 Brand Interface

The brand interface features a modern, clean design with:

#### 4.1.1 Main Dashboard
- Influencer discovery with filtering and sorting options
- Deal status overview
- Recent communications
- Analytics summary

#### 4.1.2 Influencer Discovery
- Location-based search
- Filtering by metrics (followers, engagement)
- Sorting options
- Detailed influencer profiles

#### 4.1.3 Deal Management
- Active deals tracking
- Deal creation workflow
- Payment processing
- Content approval

#### 4.1.4 Communication
- Real-time chat with influencers
- Media sharing
- Message history

### 4.2 Influencer Interface

The influencer interface includes:

#### 4.2.1 Dashboard
- Analytics showing Instagram metrics
- Deal opportunities
- Recent communications
- Earnings summary

#### 4.2.2 Profile Management
- Instagram connection
- Pricing model configuration
- Portfolio management
- Brand preferences

#### 4.2.3 Deal Management
- Deal requests
- Negotiation tools
- Content submission
- Payment tracking

#### 4.2.4 Additional Features
- Q&A section for community engagement
- Feed for industry updates
- Competitions section for engagement opportunities

### 4.3 Admin Interface

The admin interface provides:

#### 4.3.1 User Management
- User approval and verification
- Account suspension
- Role management

#### 4.3.2 Content Moderation
- Content review
- Flagged content management
- Community guidelines enforcement

#### 4.3.3 Platform Analytics
- User growth metrics
- Transaction volume
- Platform usage statistics
- Performance monitoring

---

## 5. Database Schema

### 5.1 Core Models

#### 5.1.1 User
```javascript
{
  name: String,
  email: String,
  password: String,
  role: Enum["Brand", "Influencer", "Admin"],
  avatar: String,
  isVerified: Boolean,
  forgotPasswordToken: String,
  forgotPasswordTokenExpiry: Date,
  verifyToken: String,
  verifyTokenExpiry: Date
}
```

#### 5.1.2 Brand (extends User)
```javascript
{
  companyName: String,
  website: String,
  logo: String,
  bio: String,
  phoneNumber: String,
  location: String
}
```

#### 5.1.3 Influencer (extends User)
```javascript
{
  instagramUsername: String,
  instagramId: String,
  followerCount: Number,
  profilePictureUrl: String,
  bio: String,
  city: String,
  pricingModels: {
    fixedPricing: {
      enabled: Boolean,
      storyPrice: Number,
      reelPrice: Number,
      postPrice: Number,
      livePrice: Number
    },
    negotiablePricing: Boolean,
    packageDeals: {
      enabled: Boolean,
      packages: [{
        name: String,
        includedServices: String,
        totalPrice: Number
      }]
    },
    barterDeals: {
      enabled: Boolean,
      acceptedCategories: [String],
      restrictions: String
    }
  },
  brandPreferences: {
    preferredBrandTypes: [String],
    exclusions: [String],
    collabStyles: [String]
  },
  instagramAnalytics: {
    totalPosts: Number,
    averageEngagement: Number,
    avgReelViews: Number,
    avgReelLikes: Number,
    lastUpdated: Date
  }
}
```

#### 5.1.4 Deal
```javascript
{
  brandId: ObjectId,
  brandName: String,
  brandProfilePic: String,
  dealType: Enum["single", "multiple"],
  dealName: String,
  description: String,
  budget: Number,
  influencers: [{
    id: String,
    name: String,
    profilePictureUrl: String,
    offeredPrice: Number,
    status: Enum["pending", "accepted", "rejected"],
    counterOffer: Number
  }],
  contentRequirements: {
    reels: Number,
    posts: Number,
    stories: Number,
    lives: Number
  },
  usePackageDeals: Boolean,
  selectedPackage: {
    name: String,
    includedServices: String,
    totalPrice: Number
  },
  visitRequired: Boolean,
  isNegotiating: Boolean,
  offerAmount: Number,
  isProductExchange: Boolean,
  productName: String,
  productPrice: Number,
  status: Enum["requested", "counter-offered", "accepted", "ongoing", "completed", "cancelled", "content_approved"],
  paymentStatus: Enum["paid", "unpaid"],
  submittedContent: [{
    type: String,
    url: String,
    caption: String,
    submittedAt: Date,
    approved: Boolean
  }],
  contentPublished: Boolean,
  paymentReleased: Boolean,
  createdAt: Date,
  totalAmount: Number
}
```

#### 5.1.5 Conversation & Message
```javascript
// Conversation
{
  participants: [ObjectId],
  lastMessage: {
    content: String,
    sender: ObjectId,
    timestamp: Date
  },
  createdAt: Date,
  updatedAt: Date
}

// Message
{
  conversation: ObjectId,
  sender: ObjectId,
  content: String,
  read: Boolean,
  createdAt: Date
}
```

#### 5.1.6 ChatRoom
```javascript
{
  name: String,
  description: String,
  accessType: Enum["brand", "influencer", "all"],
  participants: [ObjectId],
  createdBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 6. API Structure

### 6.1 Authentication Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/sign-up` | POST | User registration |
| `/api/auth/log-in` | POST | User login |
| `/api/auth/log-out` | POST | User logout |
| `/api/auth/refresh-token` | POST | Refresh JWT token |
| `/api/auth/forgot-password` | POST | Initiate password reset |
| `/api/auth/reset-password` | POST | Complete password reset |
| `/api/auth/instagram` | GET | Initiate Instagram OAuth |
| `/api/auth/instagram/callback` | GET | Instagram OAuth callback |

### 6.2 User Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/influencer` | GET | Get influencer profile |
| `/api/influencer` | PUT | Update influencer profile |
| `/api/influencer/search` | GET | Search influencers |
| `/api/brand` | GET | Get brand profile |
| `/api/brand` | PUT | Update brand profile |
| `/api/admin/users` | GET | List all users (admin only) |

### 6.3 Deal Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/deals` | GET | List deals for current user |
| `/api/deals` | POST | Create new deal |
| `/api/deals/:id` | GET | Get deal details |
| `/api/deals/:id` | PUT | Update deal |
| `/api/deals/:id/accept` | POST | Accept deal |
| `/api/deals/:id/reject` | POST | Reject deal |
| `/api/deals/:id/counter` | POST | Submit counter-offer |
| `/api/deals/:id/content` | POST | Submit content for deal |
| `/api/deals/:id/approve` | POST | Approve submitted content |
| `/api/payments/initiate` | POST | Initiate payment for deal |
| `/api/payments/callback` | GET | Payment gateway callback |

### 6.4 Communication Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/conversation` | GET | List conversations |
| `/api/conversation` | POST | Create new conversation |
| `/api/conversation/:id` | GET | Get conversation details |
| `/api/conversation/:id/messages` | GET | Get messages in conversation |
| `/api/conversation/:id/messages` | POST | Send message in conversation |
| `/api/chat-rooms` | GET | List chat rooms |
| `/api/chat-rooms` | POST | Create chat room |
| `/api/chat-rooms/:id` | GET | Get chat room details |
| `/api/chat-rooms/:id/join` | POST | Join chat room |
| `/api/chat-rooms/:id/leave` | POST | Leave chat room |
| `/api/chat-rooms/:id/messages` | GET | Get messages in chat room |
| `/api/chat-rooms/:id/messages` | POST | Send message in chat room |

### 6.5 Content Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/upload` | POST | Upload file to Cloudinary |
| `/api/upload` | PUT | Upload URL to Cloudinary |
| `/api/posts` | GET | List posts |
| `/api/posts` | POST | Create new post |
| `/api/posts/:id` | GET | Get post details |
| `/api/posts/:id/comments` | GET | Get comments on post |
| `/api/posts/:id/comments` | POST | Add comment to post |

### 6.6 Analytics Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/analytics` | GET | Get platform statistics |
| `/api/influencer/instagram/minimal` | GET | Get basic Instagram metrics |
| `/api/influencer/instagram/analytics` | GET | Get detailed Instagram analytics |

---

## 7. Integration Points

### 7.1 Instagram Graph API

#### 7.1.1 Authentication Flow
1. User initiates Instagram connection
2. System redirects to Instagram OAuth
3. User authorizes application
4. Instagram redirects to callback URL
5. System exchanges code for access token
6. System retrieves user profile and media data

#### 7.1.2 Data Retrieved
- Basic profile information
- Follower count
- Media count
- Recent media items
- Engagement metrics

#### 7.1.3 Refresh Mechanism
- Periodic refresh via cron job
- Manual refresh option for users
- Webhook for real-time updates

### 7.2 Cloudinary Integration

#### 7.2.1 Media Organization
- `profile_pictures/`: User profile images
- `chat_media/`: Media shared in conversations
- `instagram_media/`: Content imported from Instagram

#### 7.2.2 Upload Methods
- Direct file upload
- URL-based import (for Instagram media)
- Base64 encoded data

#### 7.2.3 Transformation Options
- Image resizing and cropping
- Format conversion
- Quality optimization
- Watermarking

### 7.3 Payment Processing

#### 7.3.1 Payment Flow
1. Brand initiates payment
2. System creates payment request
3. Brand completes payment on gateway
4. Gateway redirects to callback URL
5. System verifies payment status
6. System updates deal payment status

#### 7.3.2 Security Measures
- Secure webhook validation
- Transaction ID verification
- Amount verification
- Fraud detection mechanisms

---

## 8. Deployment Architecture

### 8.1 Development Environment
- Local development using `npm run dev:all`
- Concurrent Next.js and Socket.IO server execution
- Environment variables managed via `.env.local`

### 8.2 Production Environment
- Docker containerization
- Separate containers for Next.js and Socket.IO
- Container orchestration via Docker Compose
- Environment variables managed via Docker secrets

### 8.3 Scaling Strategy
- Horizontal scaling of Next.js containers
- Socket.IO clustering for real-time communication
- MongoDB Atlas for database scaling
- CDN for static assets and media

### 8.4 Monitoring and Logging
- Application logs centralized
- Performance metrics collection
- Error tracking and alerting
- User activity monitoring

---

## 9. Security Considerations

### 9.1 Authentication Security
- JWT tokens with appropriate expiration
- Refresh token rotation
- CSRF protection
- Secure cookie handling

### 9.2 Data Protection
- Password hashing with bcrypt
- Sensitive data encryption
- HTTPS enforcement
- Database access controls

### 9.3 API Security
- Rate limiting
- Input validation and sanitization
- CORS configuration
- Request validation

### 9.4 Infrastructure Security
- Regular security updates
- Firewall configuration
- Network isolation
- Principle of least privilege

---

## 10. Maintenance and Support

### 10.1 Monitoring
- Error logging and tracking
- Performance monitoring
- User activity analytics
- System health checks

### 10.2 Updates
- Regular security patches
- Feature enhancements
- Bug fixes
- API version management

### 10.3 Backup Strategy
- Database backups
- Configuration backups
- Media backups
- Disaster recovery plan

### 10.4 Support Channels
- In-app support system
- Email support
- Documentation
- Knowledge base

---

<div style="text-align: center; margin-top: 50px;">
<p>© 2023 PickCreator. All rights reserved.</p>
<p>This document is confidential and contains proprietary information.</p>
</div>
