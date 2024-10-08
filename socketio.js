const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const prisma = require('./src/database'); // Ensure this path is correct
const { jwtSecret } = require('./src/config'); // Adjust path as necessary

const io = socketIO({
  cors: {
    origin: '*', // Allow all origins (adjust as necessary)
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 60000, // 60 seconds timeout before considering a client disconnected
  pingInterval: 25000,
});

// Middleware for authentication
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.query.token; // Extract token from query params or headers
    if (token) {
      // Verify token
      const decoded = jwt.verify(token, jwtSecret);
      if (decoded) {
        socket.user = decoded; // Attach user info to socket
        return next();
      }
    }
    return next(new Error('Authentication error'));
  } catch (error) {
    return next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  console.log('New client connected', socket.id);
  const token = socket.handshake.query.token;
  if(token){

  if (socket.user) {

    // Register user with socket ID
    prisma.user.update({
      where: { id: socket.user.id },
      data: { socketId: socket.id }
    }).catch(err => console.error('Failed to update socketId:', err));
  }
}

  // Sending test notifications every 5 seconds (for demonstration)
//   setInterval(() => {
//     socket.emit('notification', { message: 'Test notification from server' });
//   }, 5000);


socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
  // Handle reconnection logic if necessary
});

socket.on('connect_error', (error) => {
  console.error('Connection Error:', error.message);
});

socket.on('disconnect', async (reason) => {
  console.log('Disconnected:', reason);
  if (socket.user) {
    await prisma.user.updateMany({
      where: { socketId: socket.id },
      data: { socketId: null }
    }).catch(err => console.error('Failed to clear socketId:', err));
  }

  // Handle client reconnection if needed (this can also be managed on the client)
  if (reason === 'ping timeout' || reason === 'transport close') {
    // Optionally handle reconnection logic on the server side
    console.log('Client will try to reconnect...');
  }
});

  socket.on('disconnect', async () => {
    console.log('Client disconnected', socket.id);
    if (socket.user) {
      await prisma.user.updateMany({
        where: { socketId: socket.id },
        data: { socketId: null }
      }).catch(err => console.error('Failed to clear socketId:', err));
    }
  });
});

module.exports = io;