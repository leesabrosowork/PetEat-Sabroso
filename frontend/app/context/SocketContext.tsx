'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
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

  useEffect(() => {
    // Initialize socket connection
    const socketInstance = io('http://localhost:8080', {
      autoConnect: true,
      reconnection: true,
      transports: ['websocket', 'polling'] // Add transport options
    });

    socketInstance.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.log('Socket connection error:', error);
    });

    socketInstance.on('ping', (message) => {
      console.log('Received ping:', message);
      // You can add notification or sound here
    });

    socketInstance.on('user_joined', (data) => {
      console.log(`${data.email} (${data.role}) joined the room`);
    });

    socketInstance.on('user_left', (data) => {
      console.log(`${data.email} (${data.role}) left the room`);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const joinRoom = (roomId: string, user: any) => {
    if (socket) {
      socket.emit('join_room', { roomId, user });
    }
  };

  const leaveRoom = (roomId: string) => {
    if (socket) {
      socket.emit('leave_room', roomId);
    }
  };

  const listUsers = () => {
    if (socket) {
      socket.emit('list_users');
    }
  };

  const sendMessage = (roomId: string, message: string) => {
    if (socket) {
      socket.emit('chat-message', { roomId, message });
    }
  };

  return (
    <SocketContext.Provider value={{ socket, joinRoom, leaveRoom, isConnected, listUsers, sendMessage }}>
      {children}
    </SocketContext.Provider>
  );
};