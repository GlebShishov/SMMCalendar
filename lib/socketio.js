import { io } from 'socket.io-client';

// Создаем синглтон для Socket.IO
let socket;

export const initSocket = async () => {
  if (socket) {
    return socket;
  }

  // Инициализируем сервер Socket.IO
  await fetch('/api/socketio');

  // Создаем соединение с правильным путем
  socket = io({
    path: '/api/socketio',
    addTrailingSlash: false
  });

  return socket;
};

export const getSocket = () => {
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
