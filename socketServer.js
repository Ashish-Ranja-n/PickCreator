const { Server } = require('socket.io');
const http = require('http');
const jwt = require('jsonwebtoken');

// Environment variables with defaults
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const RATE_LIMIT_WINDOW = parseInt(process.env.RATE_LIMIT_WINDOW || 60000); // 1 minute
const MAX_REQUESTS_PER_WINDOW = parseInt(process.env.MAX_REQUESTS_PER_WINDOW || 100);
const SOCKET_PORT = parseInt(process.env.SOCKET_PORT || 3001);
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "http://pickcreator.com,https://pickcreator.com").split(',');
const USE_REDIS = process.env.USE_REDIS === 'true';

// In-memory fallbacks when Redis is not available
const rateLimiter = new Map();
const onlineUsers = new Map();
const userTypingStatus = new Map();

// Only try to use Redis if specifically enabled
let Redis, createAdapter, pubClient, subClient, redisRateLimiter;
if (USE_REDIS) {
  try {
    Redis = require('ioredis');
    createAdapter = require('@socket.io/redis-adapter').createAdapter;
    
    // Setup Redis clients with error handlers
    pubClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    pubClient.on('error', (err) => {
      console.error('Redis pub client error:', err.message);
    });
    
    subClient = pubClient.duplicate();
    subClient.on('error', (err) => {
      console.error('Redis sub client error:', err.message);
    });
    
    redisRateLimiter = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    redisRateLimiter.on('error', (err) => {
      console.error('Redis rate limiter error:', err.message);
    });
    
    console.log('Redis mode enabled');
  } catch (error) {
    console.error('Failed to initialize Redis:', error.message);
    console.log('Falling back to in-memory storage');
  }
}

// Rate limiting implementation that works with or without Redis
async function isRateLimited(clientId) {
  // Use in-memory rate limiting if Redis is not available
  if (!USE_REDIS || !redisRateLimiter) {
    const now = Date.now();
    const clientRequests = rateLimiter.get(clientId) || { count: 0, timestamp: now };
    
    // Reset count if window has passed
    if (now - clientRequests.timestamp > RATE_LIMIT_WINDOW) {
      clientRequests.count = 0;
      clientRequests.timestamp = now;
    }
    
    // Increment count
    clientRequests.count++;
    rateLimiter.set(clientId, clientRequests);
    
    return clientRequests.count > MAX_REQUESTS_PER_WINDOW;
  }
  
  // Use Redis-based rate limiting
  try {
    const now = Date.now();
    const key = `ratelimit:${clientId}`;
    
    // Use Redis pipeline for atomicity
    const results = await redisRateLimiter.pipeline()
      .incr(key)
      .pexpire(key, RATE_LIMIT_WINDOW)
      .exec();
    
    const count = results[0][1];
    return count > MAX_REQUESTS_PER_WINDOW;
  } catch (error) {
    console.error('Rate limiting error:', error);
    return false; // Fail open if Redis has an error
  }
}

// Create HTTP server with basic request filtering
const server = http.createServer((req, res) => {
  // Block suspicious paths
  const suspiciousPaths = /\.(php|asp|aspx|jsp|cgi)$/i;
  if (suspiciousPaths.test(req.url)) {
    res.writeHead(404);
    res.end();
    return;
  }

  // Basic CORS handling for HTTP requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Add an endpoint for emitting events from the backend
  if (req.url === '/emit-event' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const eventData = JSON.parse(body);
        
        if (eventData.event && eventData.data) {
          // Emit the event to the specified room or to all clients
          if (eventData.data.roomId) {
            io.to(eventData.data.roomId).emit(eventData.event, eventData.data);
          } else {
            io.emit(eventData.event, eventData.data);
          }
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        } else {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            success: false, 
            message: 'Invalid event data. Both event and data are required.' 
          }));
        }
      } catch (error) {
        console.error('Error processing event emission request:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: false, 
          message: 'Error processing request', 
          error: error.message 
        }));
      }
    });
    
    return;
  }
  
  // Handle other routes with a 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ message: 'Not Found' }));
});

// Error handling for the HTTP server
server.on('error', (err) => {
  console.error('Server error:', err);
});

// Initialize Socket.IO with the HTTP server
const ioOptions = {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
  },
  allowEIO3: true,
  transports: ['websocket', 'polling'],
  pingTimeout: 20000,
  pingInterval: 25000,
  connectTimeout: 10000,
  maxHttpBufferSize: 1e6 // 1MB
};

// Add Redis adapter if available
if (USE_REDIS && pubClient && subClient) {
  ioOptions.adapter = createAdapter(pubClient, subClient);
}

const io = new Server(server, ioOptions);

// Simplified authentication middleware - made optional
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
    
    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.user = decoded;
    } else {
      // Still allow connection but with limited user info
      socket.user = { 
        id: socket.id,
        anonymous: true
      };
    }
    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    // Still allow connection but with limited user info
    socket.user = { 
      id: socket.id,
      anonymous: true
    };
    next();
  }
});

// Add rate limiting middleware
io.use(async (socket, next) => {
  try {
    const clientId = socket.user?.id || socket.handshake.address;
    const limited = await isRateLimited(clientId);
    
    if (limited) {
      const err = new Error('Rate limit exceeded');
      err.data = { details: 'Too many requests' };
      return next(err);
    }
    next();
  } catch (error) {
    console.error('Rate limiting error:', error);
    next(); // Continue on error
  }
});

// Socket.IO connection handler
io.on('connection', (socket) => {
  // Get user data
  const userId = socket.user.id;
  const socketId = socket.id;
  
  console.log(`User connected: ${userId} (socket: ${socketId})`);
  
  // Handle errors at socket level
  socket.conn.on('error', (error) => {
    console.error(`Socket connection error for ${userId}:`, error);
  });
  
  socket.on('error', (error) => {
    console.error(`Socket error for ${userId}:`, error);
  });
  
  // Handle user coming online
  socket.on('userOnline', async (userId) => {
    if (userId) {
      try {
        if (USE_REDIS && pubClient) {
          // Store in Redis
          await pubClient.hset('online_users', userId, socketId);
          const onlineUserIds = await pubClient.hkeys('online_users');
          io.emit('userStatusChange', { userId, status: 'online' });
          socket.emit('onlineUsers', onlineUserIds);
        } else {
          // Store in memory
          onlineUsers.set(userId, socketId);
          const onlineUserIds = Array.from(onlineUsers.keys());
          io.emit('userStatusChange', { userId, status: 'online' });
          socket.emit('onlineUsers', onlineUserIds);
        }
      } catch (error) {
        console.error('Error handling userOnline event:', error);
        // Fallback to in-memory if Redis fails
        onlineUsers.set(userId, socketId);
        const onlineUserIds = Array.from(onlineUsers.keys());
        io.emit('userStatusChange', { userId, status: 'online' });
        socket.emit('onlineUsers', onlineUserIds);
      }
    }
  });
  
  // Handle request for online users
  socket.on('getOnlineUsers', async () => {
    try {
      if (USE_REDIS && pubClient) {
        const onlineUserIds = await pubClient.hkeys('online_users');
        socket.emit('onlineUsers', onlineUserIds);
      } else {
        const onlineUserIds = Array.from(onlineUsers.keys());
        socket.emit('onlineUsers', onlineUserIds);
      }
    } catch (error) {
      console.error('Error getting online users:', error);
      // Fallback to in-memory
      const onlineUserIds = Array.from(onlineUsers.keys());
      socket.emit('onlineUsers', onlineUserIds);
    }
  });
  
  // Handle joining a room (conversation)
  socket.on('joinRoom', (conversationId) => {
    try {
      socket.join(conversationId);
      
      // Notify others in the room
      socket.to(conversationId).emit('userJoined', { 
        userId: socket.user.id,
        message: 'A new user has joined the conversation'
      });
    } catch (error) {
      console.error(`Error joining room ${conversationId}:`, error);
      socket.emit('error', { message: 'Failed to join conversation' });
    }
  });
  
  // Handle leaving a room
  socket.on('leaveRoom', (conversationId) => {
    try {
      socket.leave(conversationId);
      
      // Notify others in the room
      socket.to(conversationId).emit('userLeft', {
        userId: socket.user.id,
        message: 'A user has left the conversation'
      });
    } catch (error) {
      console.error(`Error leaving room ${conversationId}:`, error);
    }
  });
  
  // Handle user typing status with Redis or in-memory fallback
  socket.on('typing', async (data) => {
    const { userId, conversationId, isTyping } = data;
    
    if (userId && conversationId) {
      try {
        if (USE_REDIS && pubClient) {
          // Use Redis
          const typingKey = `typing:${conversationId}`;
          
          if (isTyping) {
            await pubClient.hset(typingKey, userId, '1');
            await pubClient.expire(typingKey, 60); // 60 seconds
          } else {
            await pubClient.hdel(typingKey, userId);
          }
        } else {
          // Use in-memory
          if (!userTypingStatus.has(conversationId)) {
            userTypingStatus.set(conversationId, new Map());
          }
          
          const conversationTyping = userTypingStatus.get(conversationId);
          
          if (isTyping) {
            conversationTyping.set(userId, true);
          } else {
            conversationTyping.delete(userId);
          }
        }
        
        // Broadcast typing status to the conversation
        socket.to(conversationId).emit('userTyping', {
          userId,
          conversationId,
          isTyping
        });
      } catch (error) {
        console.error('Error handling typing status:', error);
        
        // Fallback to in-memory
        if (!userTypingStatus.has(conversationId)) {
          userTypingStatus.set(conversationId, new Map());
        }
        
        const conversationTyping = userTypingStatus.get(conversationId);
        
        if (isTyping) {
          conversationTyping.set(userId, true);
        } else {
          conversationTyping.delete(userId);
        }
        
        socket.to(conversationId).emit('userTyping', {
          userId,
          conversationId,
          isTyping
        });
      }
    }
  });

  // Handle joining a chat room
  socket.on('joinChatRoom', (roomId) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined chat room ${roomId}`);
  });

  // Handle leaving a chat room
  socket.on('leaveChatRoom', (roomId) => {
    socket.leave(roomId);
    console.log(`Socket ${socket.id} left chat room ${roomId}`);
  });

  // Handle sending room messages
  socket.on('sendRoomMessage', (data) => {
    const roomId = data.chatRoomId || data.chatRoom;
    if (!roomId) {
      console.error('sendRoomMessage missing roomId');
      return;
    }
    console.log(`Received room message for room ${roomId}:`, data);
    io.to(roomId).emit('newRoomMessage', data);
  });

  // Handle participant joined notification
  socket.on('participantJoined', ({ roomId, participant }) => {
    console.log(`Participant joined room ${roomId}:`, participant);
    io.to(roomId).emit('roomParticipantJoined', { roomId, participant });
  });

  // Handle participant left notification
  socket.on('participantLeft', ({ roomId, participantId, participantName }) => {
    console.log(`Participant left room ${roomId}: ${participantName} (${participantId})`);
    io.to(roomId).emit('roomParticipantLeft', { roomId, participantId, participantName });
  });
  
  // Handle sending messages to a room
  socket.on('sendMessage', (data) => {
    try {
      const { conversationId, text, sender, timestamp, media } = data;
      
      // Create message object
      const messageData = {
        sender,
        timestamp
      };
      
      // Add text if it exists
      if (text) {
        messageData.text = text;
      }
      
      // Add media if it exists
      if (media && media.length > 0) {
        messageData.media = media;
      }
      
      // Clear typing status
      try {
        if (USE_REDIS && pubClient) {
          pubClient.hdel(`typing:${conversationId}`, sender).catch(err => {
            console.error('Error clearing typing status in Redis:', err);
          });
        } else if (userTypingStatus.has(conversationId)) {
          const conversationTyping = userTypingStatus.get(conversationId);
          conversationTyping.delete(sender);
        }
      } catch (error) {
        console.error('Error clearing typing status:', error);
      }
      
      // Broadcast message to all clients in the room
      io.to(conversationId).emit('newMessage', messageData);
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });
  
  // Handle disconnection
  socket.on('disconnect', async () => {
    console.log(`User disconnected: ${userId} (socket: ${socketId})`);
    
    try {
      if (USE_REDIS && pubClient) {
        // Redis cleanup
        try {
          const keys = await pubClient.hkeys('online_users');
          for (const id of keys) {
            const storedSocketId = await pubClient.hget('online_users', id);
            if (storedSocketId === socketId) {
              await pubClient.hdel('online_users', id);
              io.emit('userStatusChange', { userId: id, status: 'offline' });
              break;
            }
          }
          
          // Clean up typing statuses
          const typingPatterns = await pubClient.keys('typing:*');
          for (const key of typingPatterns) {
            await pubClient.hdel(key, userId);
          }
        } catch (error) {
          console.error('Redis cleanup error:', error);
          // Fall back to in-memory cleanup
          memoryCleanup();
        }
      } else {
        // In-memory cleanup
        memoryCleanup();
      }
    } catch (error) {
      console.error('Error handling disconnect:', error);
      // Last resort attempt at cleanup
      memoryCleanup();
    }
    
    // Helper function for in-memory cleanup
    function memoryCleanup() {
      // Find and remove user from online users
      let disconnectedUserId = null;
      for (const [id, sid] of onlineUsers.entries()) {
        if (sid === socketId) {
          disconnectedUserId = id;
          onlineUsers.delete(id);
          break;
        }
      }
      
      if (disconnectedUserId) {
        io.emit('userStatusChange', { userId: disconnectedUserId, status: 'offline' });
      }
      
      // Clear typing status
      for (const [conversationId, typingUsers] of userTypingStatus.entries()) {
        typingUsers.delete(userId);
        if (disconnectedUserId) {
          typingUsers.delete(disconnectedUserId);
        }
      }
    }
  });
});

// Handle server shutdown gracefully
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

async function shutdown() {
  console.log('Shutting down server...');
  
  // Close all connections
  io.close();
  
  // Close Redis connections if they exist
  if (USE_REDIS) {
    try {
      const promises = [];
      if (pubClient) promises.push(pubClient.quit().catch(err => console.error('Error closing pubClient:', err)));
      if (subClient) promises.push(subClient.quit().catch(err => console.error('Error closing subClient:', err)));
      if (redisRateLimiter) promises.push(redisRateLimiter.quit().catch(err => console.error('Error closing redisRateLimiter:', err)));
      
      await Promise.all(promises);
    } catch (error) {
      console.error('Error closing Redis connections:', error);
    }
  }
  
  console.log('Server shutdown complete');
  process.exit(0);
}

server.listen(SOCKET_PORT, "0.0.0.0", () => {
  console.log(`Socket.IO server running on port ${SOCKET_PORT}`);
  console.log(`Redis mode: ${USE_REDIS ? 'enabled' : 'disabled'}`);
});
