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

    // Redis client configuration
    const redisOptions = {
      // Connection settings
      maxRetriesPerRequest: 3,      // Reduced from default 20
      connectTimeout: 10000,        // 10 seconds
      disconnectTimeout: 2000,      // 2 seconds
      commandTimeout: 5000,         // 5 seconds
      keepAlive: 10000,             // Send keep-alive every 10 seconds
      noDelay: true,                // Disable Nagle's algorithm
      enableAutoPipelining: false,  // Disable auto pipelining
      enableOfflineQueue: false,    // Don't queue commands when disconnected

      // Retry strategy with exponential backoff
      retryStrategy: (times) => {
        // If we've tried too many times, stop retrying
        if (times > 10) {
          console.log('Redis connection failed too many times. Stopping retries.');
          return null; // Stop retrying
        }

        // Exponential backoff with jitter
        const delay = Math.min(Math.floor(Math.random() * 100) + Math.pow(2, times) * 50, 5000);
        console.log(`Redis retry in ${delay}ms (attempt ${times})`);
        return delay;
      },

      // Reconnect on specific errors only
      reconnectOnError: (err) => {
        const targetErrors = ['READONLY', 'ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED'];
        for (const errType of targetErrors) {
          if (err.message.includes(errType)) {
            console.log(`Reconnecting due to error: ${errType}`);
            return true; // Reconnect for these specific errors
          }
        }
        return false; // Don't reconnect for other errors
      }
    };

    // Setup Redis clients with error handlers
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    pubClient = new Redis(redisUrl, redisOptions);
    pubClient.on('error', (err) => {
      console.error('Redis pub client error:', err.message, err.stack);
      // Log additional connection details
      console.error(`Redis pub client connection details: ${redisUrl.replace(/\/\/.*@/, '//***@')}`);
      console.error(`Redis pub client status: ${pubClient.status}`);
    });
    pubClient.on('connect', () => {
      console.log('Redis pub client connected');
    });
    pubClient.on('reconnecting', (attempt) => {
      console.log(`Redis pub client reconnecting... (attempt ${attempt})`);
    });
    pubClient.on('end', () => {
      console.log('Redis pub client connection closed');
    });
    pubClient.on('ready', () => {
      console.log('Redis pub client ready');
    });

    subClient = pubClient.duplicate();
    subClient.on('error', (err) => {
      console.error('Redis sub client error:', err.message, err.stack);
      console.error(`Redis sub client status: ${subClient.status}`);
    });
    subClient.on('connect', () => {
      console.log('Redis sub client connected');
    });
    subClient.on('reconnecting', (attempt) => {
      console.log(`Redis sub client reconnecting... (attempt ${attempt})`);
    });
    subClient.on('end', () => {
      console.log('Redis sub client connection closed');
    });
    subClient.on('ready', () => {
      console.log('Redis sub client ready');
    });

    redisRateLimiter = new Redis(redisUrl, redisOptions);
    redisRateLimiter.on('error', (err) => {
      console.error('Redis rate limiter error:', err.message, err.stack);
      console.error(`Redis rate limiter status: ${redisRateLimiter.status}`);
    });
    redisRateLimiter.on('connect', () => {
      console.log('Redis rate limiter connected');
    });
    redisRateLimiter.on('reconnecting', (attempt) => {
      console.log(`Redis rate limiter reconnecting... (attempt ${attempt})`);
    });
    redisRateLimiter.on('end', () => {
      console.log('Redis rate limiter connection closed');
    });
    redisRateLimiter.on('ready', () => {
      console.log('Redis rate limiter ready');
    });

    console.log('Redis mode enabled');

    // Set up periodic health check for Redis connections
    const redisHealthCheck = setInterval(async () => {
      try {
        // Check if Redis clients are connected
        const pubStatus = pubClient.status;
        const subStatus = subClient.status;
        const limiterStatus = redisRateLimiter.status;

        console.log(`Redis health check - Pub: ${pubStatus}, Sub: ${subStatus}, Limiter: ${limiterStatus}`);

        // If any client is not ready, try a ping to verify connectivity
        if (pubStatus !== 'ready' || subStatus !== 'ready' || limiterStatus !== 'ready') {
          console.log('Some Redis clients not ready, checking connectivity...');

          // Try pinging Redis to check connectivity
          if (pubStatus === 'ready') {
            try {
              const pingResult = await pubClient.ping();
              console.log(`Redis pub client ping result: ${pingResult}`);
            } catch (pingErr) {
              console.error('Redis pub client ping failed:', pingErr.message);
            }
          }

          // Check for reconnection issues
          if (pubClient.retryAttempts > 5) {
            console.warn(`Redis pub client has high retry count: ${pubClient.retryAttempts}`);
          }
        }
      } catch (error) {
        console.error('Redis health check error:', error.message);
      }
    }, 30000); // Run every 30 seconds

    // Clean up health check on process exit
    process.on('exit', () => {
      if (redisHealthCheck) {
        clearInterval(redisHealthCheck);
      }
    });
  } catch (error) {
    console.error('Failed to initialize Redis:', error.message);
    console.log('Falling back to in-memory storage');
  }
}

// Rate limiting implementation that works with or without Redis
async function isRateLimited(clientId) {
  // Use in-memory rate limiting if Redis is not available
  if (!USE_REDIS || !redisRateLimiter) {
    return useInMemoryRateLimiting(clientId);
  }

  // Use Redis-based rate limiting
  try {
    // Check if Redis client is ready
    if (!redisRateLimiter.status || redisRateLimiter.status !== 'ready') {
      console.warn('Redis rate limiter not ready, falling back to in-memory rate limiting');
      return useInMemoryRateLimiting(clientId);
    }

    const key = `ratelimit:${clientId}`;

    // Use Redis pipeline for atomicity with a timeout
    const pipeline = redisRateLimiter.pipeline();
    pipeline.incr(key);
    pipeline.pexpire(key, RATE_LIMIT_WINDOW);

    const results = await Promise.race([
      pipeline.exec(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Redis pipeline timeout')), 2000)
      )
    ]);

    if (!results || !Array.isArray(results) || results.length < 1) {
      throw new Error('Invalid Redis pipeline results');
    }

    const count = results[0][1];
    return count > MAX_REQUESTS_PER_WINDOW;
  } catch (error) {
    console.error('Redis rate limiting error:', error.message);
    console.log('Falling back to in-memory rate limiting');
    return useInMemoryRateLimiting(clientId);
  }
}

// Helper function for in-memory rate limiting
function useInMemoryRateLimiting(clientId) {
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
  try {
    // Check if Redis clients are ready
    if (pubClient.status === 'ready' && subClient.status === 'ready') {
      ioOptions.adapter = createAdapter(pubClient, subClient);
      console.log('Redis adapter configured for Socket.IO');
    } else {
      console.warn('Redis clients not ready, skipping Redis adapter setup');
    }
  } catch (error) {
    console.error('Error setting up Redis adapter:', error.message);
  }
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
      for (const [, typingUsers] of userTypingStatus.entries()) {
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

  // Clear any active intervals
  try {
    // Find and clear the Redis health check interval if it exists
    if (typeof redisHealthCheck !== 'undefined') {
      clearInterval(redisHealthCheck);
      console.log('Redis health check interval cleared');
    }
  } catch (error) {
    console.error('Error clearing intervals:', error.message);
  }

  // Close all connections
  io.close();

  // Close Redis connections if they exist
  if (USE_REDIS) {
    try {
      const promises = [];

      // Helper function to safely close Redis connections with timeout
      const safeQuit = async (client, name, timeout = 2000) => {
        try {
          // Create a promise that resolves when client quits or rejects after timeout
          return await Promise.race([
            client.quit(),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error(`${name} quit timeout`)), timeout)
            )
          ]);
        } catch (err) {
          console.error(`Error closing ${name}:`, err.message);
          // Force disconnect if quit times out
          try {
            client.disconnect();
          } catch (disconnectErr) {
            console.error(`Error disconnecting ${name}:`, disconnectErr.message);
          }
        }
      };

      // Add each client to the promises array if it exists
      if (pubClient) promises.push(safeQuit(pubClient, 'pubClient'));
      if (subClient) promises.push(safeQuit(subClient, 'subClient'));
      if (redisRateLimiter) promises.push(safeQuit(redisRateLimiter, 'redisRateLimiter'));

      // Wait for all clients to close with a timeout
      await Promise.all(promises);
      console.log('All Redis connections closed successfully');
    } catch (error) {
      console.error('Error closing Redis connections:', error.message);
    }
  }

  console.log('Server shutdown complete');
  process.exit(0);
}

// Function to check Redis server configuration
async function checkRedisConfig() {
  if (!USE_REDIS || !pubClient || pubClient.status !== 'ready') {
    console.log('Redis not enabled or not ready, skipping config check');
    return;
  }

  try {
    console.log('Checking Redis server configuration...');

    // Get Redis server info
    const info = await pubClient.info();
    const configLines = info.split('\n');

    // Extract important configuration values
    const redisVersion = configLines.find(line => line.startsWith('redis_version'))?.split(':')[1]?.trim();
    const connectedClients = configLines.find(line => line.startsWith('connected_clients'))?.split(':')[1]?.trim();
    const maxClients = configLines.find(line => line.startsWith('maxclients'))?.split(':')[1]?.trim();
    const usedMemory = configLines.find(line => line.startsWith('used_memory_human'))?.split(':')[1]?.trim();
    const maxMemory = configLines.find(line => line.startsWith('maxmemory'))?.split(':')[1]?.trim();

    console.log(`Redis version: ${redisVersion || 'unknown'}`);
    console.log(`Connected clients: ${connectedClients || 'unknown'} / ${maxClients || 'unlimited'}`);
    console.log(`Memory usage: ${usedMemory || 'unknown'} / ${maxMemory || 'unlimited'}`);

    // Check for potential issues
    if (maxClients && connectedClients && parseInt(connectedClients) > parseInt(maxClients) * 0.8) {
      console.warn('WARNING: Redis server is approaching client connection limit');
    }

    // Get client list to check for connection issues
    const clientList = await pubClient.client('LIST');
    const clientCount = clientList.split('\n').length - 1;
    console.log(`Total Redis client connections: ${clientCount}`);

  } catch (error) {
    console.error('Error checking Redis configuration:', error.message);
  }
}

server.listen(SOCKET_PORT, "0.0.0.0", () => {
  console.log(`Socket.IO server running on port ${SOCKET_PORT}`);
  console.log(`Redis mode: ${USE_REDIS ? 'enabled' : 'disabled'}`);

  // Check Redis configuration after server starts
  if (USE_REDIS) {
    // Wait a bit for connections to stabilize
    setTimeout(() => {
      checkRedisConfig().catch(err => console.error('Redis config check failed:', err.message));
    }, 5000);
  }
});
