'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  joinRoom: (roomId: string, user: any) => void;
  leaveRoom: (roomId: string) => void;
  isConnected: boolean;
  listUsers: () => void;
  sendMessage: (roomId: string, message: string) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  joinRoom: () => {},
  leaveRoom: () => {},
  isConnected: false,
  listUsers: () => {},
  sendMessage: () => {},
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Initialize socket connection with improved settings
    const socketInstance = io('http://localhost:8080', {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true,
      forceNew: false,
    });

    socketInstance.on('connect', () => {
      console.log('✅ Socket connected successfully');
      setIsConnected(true);
      
      // Clear any existing reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      // Start heartbeat to keep connection alive
      startHeartbeat(socketInstance);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      setIsConnected(false);
      
      // Stop heartbeat
      stopHeartbeat();

      // Handle reconnection based on reason
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, try to reconnect
        console.log('🔄 Server disconnected, attempting to reconnect...');
        socketInstance.connect();
      } else if (reason === 'io client disconnect') {
        // Client initiated disconnect, don't reconnect
        console.log('👤 Client disconnected intentionally');
      } else {
        // Network issues, will auto-reconnect
        console.log('🌐 Network issue, auto-reconnecting...');
      }
    });

    socketInstance.on('connect_error', (error) => {
      console.log('⚠️ Socket connection error:', error.message);
      setIsConnected(false);
      
      // Retry connection after delay
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log('🔄 Retrying connection...');
        socketInstance.connect();
      }, 3000);
    });

    socketInstance.on('reconnect', (attemptNumber) => {
      console.log(`🔄 Socket reconnected after ${attemptNumber} attempts`);
      setIsConnected(true);
      startHeartbeat(socketInstance);
    });

    socketInstance.on('reconnect_attempt', (attemptNumber) => {
      console.log(`🔄 Reconnection attempt ${attemptNumber}`);
    });

    socketInstance.on('reconnect_error', (error) => {
      console.log('❌ Reconnection error:', error);
    });

    socketInstance.on('reconnect_failed', () => {
      console.log('❌ Reconnection failed after all attempts');
    });

    socketInstance.on('ping', (message) => {
      console.log('📡 Received ping:', message);
      // Respond to ping to keep connection alive
      socketInstance.emit('pong', { timestamp: Date.now() });
    });

    socketInstance.on('user_joined', (data) => {
      console.log(`👤 ${data.email} (${data.role}) joined the room`);
    });

    socketInstance.on('user_left', (data) => {
      console.log(`👋 ${data.email} (${data.role}) left the room`);
    });

    setSocket(socketInstance);

    // Cleanup function
    return () => {
      stopHeartbeat();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      socketInstance.disconnect();
    };
  }, []);

  // Heartbeat function to keep connection alive
  const startHeartbeat = (socketInstance: Socket) => {
    stopHeartbeat(); // Clear any existing heartbeat
    
    heartbeatIntervalRef.current = setInterval(() => {
      if (socketInstance.connected) {
        socketInstance.emit('heartbeat', { timestamp: Date.now() });
      }
    }, 30000); // Send heartbeat every 30 seconds
  };

  const stopHeartbeat = () => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  };

  const joinRoom = (roomId: string, user: any) => {
    if (socket && socket.connected) {
      socket.emit('join_room', { roomId, user });
    } else {
      console.log('⚠️ Socket not connected, cannot join room');
    }
  };

  const leaveRoom = (roomId: string) => {
    if (socket && socket.connected) {
      socket.emit('leave_room', roomId);
    }
  };

  const listUsers = () => {
    if (socket && socket.connected) {
      socket.emit('list_users');
    }
  };

  const sendMessage = (roomId: string, message: string) => {
    if (socket && socket.connected) {
      socket.emit('chat-message', { roomId, message });
    }
  };

  return (
    <SocketContext.Provider value={{ socket, joinRoom, leaveRoom, isConnected, listUsers, sendMessage }}>
      {children}
    </SocketContext.Provider>
  );
};