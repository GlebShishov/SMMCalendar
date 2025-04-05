import { Server } from 'socket.io';

const ioHandler = (req, res) => {
  if (!res.socket.server.io) {
    const io = new Server(res.socket.server, {
      path: '/socket.io',
      addTrailingSlash: false,
      cors: {
        origin: process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    // Обработка подключений
    io.on('connection', socket => {
      console.log('Client connected:', socket.id);

      // Присоединение к комнате проекта
      socket.on('join-project', (projectId) => {
        socket.join(`project-${projectId}`);
        console.log(`Socket ${socket.id} joined project ${projectId}`);
      });

      // Обработка отключений
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });

      // Обработка обновлений изображений
      socket.on('reorder-images', ({ projectId, dayId, images, userId }) => {
        socket.to(`project-${projectId}`).emit('imageReorder', { dayId, images, userId });
      });
    });

    res.socket.server.io = io;
  }

  res.end();
};

export const config = {
  api: {
    bodyParser: false
  }
};

export default ioHandler;
