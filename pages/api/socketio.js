import { Server } from 'socket.io';

const SocketIOHandler = (req, res) => {
  if (res.socket.server.io) {
    console.log('Socket.IO is already running');
    res.end();
    return;
  }

  console.log('Setting up Socket.IO...');
  
  const io = new Server(res.socket.server, {
    path: '/api/socketio',
    addTrailingSlash: false
  });
  
  res.socket.server.io = io;

  // Set up Socket.IO event handlers
  io.on('connection', (socket) => {
    console.log('New client connected', socket.id);

    // Handle joining a project room
    socket.on('join-project', (projectId) => {
      socket.join(`project-${projectId}`);
      console.log(`Client ${socket.id} joined project-${projectId}`);
    });

    // Handle image reordering events
    socket.on('reorder-images', ({ projectId, dayId, images, userId }) => {
      // Broadcast to all clients in the project room except the sender
      socket.to(`project-${projectId}`).emit('images-reordered', {
        dayId,
        images,
        userId
      });
      console.log(`Client ${socket.id} reordered images in day ${dayId} of project ${projectId}`);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('Client disconnected', socket.id);
    });
  });

  console.log('Socket.IO server started');
  res.end();
};

export default SocketIOHandler;
