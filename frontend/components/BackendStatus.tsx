'use client';

import { useSocket } from '@/app/context/SocketContext';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff } from 'lucide-react';

export function BackendStatus() {
  const { isConnected } = useSocket();

  return (
    <div className="flex items-center gap-2">
      {isConnected ? (
        <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
          <Wifi className="w-3 h-3 mr-1" />
          Connected
        </Badge>
      ) : (
        <Badge variant="destructive">
          <WifiOff className="w-3 h-3 mr-1" />
          Disconnected
        </Badge>
      )}
    </div>
  );
} 