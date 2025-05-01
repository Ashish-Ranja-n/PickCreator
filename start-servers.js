const { spawn } = require('child_process');
const path = require('path');

// Start Next.js server
const nextServer = spawn('node', ['server.js'], {
  stdio: 'inherit',
  shell: true
});

// Start Socket.IO server
const socketServer = spawn('node', ['socketServer.js'], {
  stdio: 'inherit',
  shell: true
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('Shutting down servers...');
  nextServer.kill('SIGINT');
  socketServer.kill('SIGINT');
  process.exit(0);
});

console.log('Both servers started!');
console.log('Next.js server running on http://localhost:3000');
console.log('Socket.IO server running on http://localhost:4000'); 