import { useEffect, useRef, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { initSocket, getSocket, disconnectSocket } from '../lib/socketio';

export default function useSocketIO(projectId) {
  const { data: session } = useSession();
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  // Initialize Socket.IO connection
  useEffect(() => {
    if (!projectId) return;

    // Function to initialize the socket connection
    const setupSocket = async () => {
      try {
        // Initialize the socket using our singleton
        const socket = await initSocket();
        socketRef.current = socket;

        // Set up event handlers
        socket.on('connect', () => {
          console.log('Socket connected:', socket.id);
          setIsConnected(true);
          
          // Join the project room
          socket.emit('join-project', projectId);
        });

        socket.on('disconnect', () => {
          console.log('Socket disconnected');
          setIsConnected(false);
        });

        socket.on('connect_error', (err) => {
          console.error('Socket connection error:', err);
          setIsConnected(false);
        });
      } catch (error) {
        console.error('Error initializing socket:', error);
      }
    };

    setupSocket();

    // Cleanup on unmount
    return () => {
      // We don't disconnect the socket here since it's a singleton
      // Just remove our event listeners
      if (socketRef.current) {
        socketRef.current.off('connect');
        socketRef.current.off('disconnect');
        socketRef.current.off('connect_error');
      }
    };
  }, [projectId]);

  // Function to emit image reorder event
  const emitImageReorder = useCallback((dayId, images) => {
    if (!socketRef.current || !isConnected) return;
    
    socketRef.current.emit('reorder-images', {
      projectId,
      dayId,
      images,
      userId: session?.user?.id
    });
  }, [projectId, isConnected, session]);

  // Function to subscribe to image reordering events
  const subscribeToImageReorder = useCallback((callback) => {
    if (!socketRef.current) return () => {};
    
    const handleImagesReordered = (data) => {
      callback(data);
    };
    
    socketRef.current.on('images-reordered', handleImagesReordered);
    
    // Return cleanup function
    return () => {
      if (socketRef.current) {
        socketRef.current.off('images-reordered', handleImagesReordered);
      }
    };
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    emitImageReorder,
    subscribeToImageReorder
  };
}
