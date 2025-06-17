// Keep track of connected users and their rooms
const connectedUsers = new Map();

const initializeSocket = (io) => {
  io.on('connection', (socket) => {
    console.log('\n🟢 New connection:', socket.id);

    // Handle room joining
    socket.on('join_room', (data) => {
      const { roomId, user } = data;
      socket.join(roomId);
      
      // Store user information
      connectedUsers.set(socket.id, {
        roomId,
        email: user?.email || 'Unknown',
        role: user?.role || 'Unknown',
        joinedAt: new Date().toLocaleString()
      });

      // Log detailed connection info
      console.log('\n==== User Joined Room ====');
      console.log('Socket ID:', socket.id);
      console.log('Room ID:', roomId);
      console.log('User Email:', user?.email || 'Unknown');
      console.log('User Role:', user?.role || 'Unknown');
      console.log('Time:', new Date().toLocaleString());
      
      // Log all users in this room
      const usersInRoom = Array.from(connectedUsers.entries())
        .filter(([_, userData]) => userData.roomId === roomId);
      
      console.log('\n==== Current Users in Room ====');
      usersInRoom.forEach(([socketId, userData]) => {
        console.log(`- ${userData.email} (${userData.role}) - Connected since ${userData.joinedAt}`);
      });
      console.log('============================\n');
      
      // Notify other users in the room
      socket.to(roomId).emit('user_joined', {
        userId: socket.id,
        email: user?.email,
        role: user?.role,
        message: 'A new user has joined the room'
      });

      // Send a welcome ping to the user
      socket.emit('ping', {
        message: `Welcome to room ${roomId}!`
      });
    });

    // Handle WebRTC signaling
    socket.on('offer', (data) => {
      const { offer, room } = data;
      socket.to(room).emit('offer', { offer, from: socket.id });
    });

    socket.on('answer', (data) => {
      const { answer, room } = data;
      socket.to(room).emit('answer', { answer, from: socket.id });
    });

    socket.on('ice-candidate', (data) => {
      const { candidate, room } = data;
      socket.to(room).emit('ice-candidate', { candidate, from: socket.id });
    });

    // Handle chat messages
    socket.on('chat-message', (data) => {
      const { message, room } = data;
      socket.to(room).emit('chat-message', { message, from: socket.id });
    });

    // Handle room leaving
    socket.on('leave_room', (roomId) => {
      const userData = connectedUsers.get(socket.id);
      socket.leave(roomId);
      
      console.log('\n==== User Left Room ====');
      console.log('Socket ID:', socket.id);
      console.log('Room ID:', roomId);
      if (userData) {
        console.log('User Email:', userData.email);
        console.log('User Role:', userData.role);
      }
      console.log('Time:', new Date().toLocaleString());
      console.log('========================\n');

      // Remove user from tracking
      connectedUsers.delete(socket.id);
      
      // Notify other users in the room
      socket.to(roomId).emit('user_left', {
        userId: socket.id,
        email: userData?.email,
        role: userData?.role,
        message: 'A user has left the room'
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      const userData = connectedUsers.get(socket.id);
      
      console.log('\n🔴 User Disconnected');
      console.log('Socket ID:', socket.id);
      if (userData) {
        console.log('User Email:', userData.email);
        console.log('User Role:', userData.role);
        console.log('Was in Room:', userData.roomId);
      }
      console.log('Time:', new Date().toLocaleString());
      console.log('========================\n');

      // Clean up user data
      connectedUsers.delete(socket.id);
    });

    // Debug command to list all connected users
    socket.on('list_users', () => {
      console.log('\n==== All Connected Users ====');
      connectedUsers.forEach((userData, socketId) => {
        console.log(`\nSocket ID: ${socketId}`);
        console.log(`Email: ${userData.email}`);
        console.log(`Role: ${userData.role}`);
        console.log(`Room: ${userData.roomId}`);
        console.log(`Connected since: ${userData.joinedAt}`);
      });
      console.log('===========================\n');
    });
  });
};

module.exports = { initializeSocket }; 