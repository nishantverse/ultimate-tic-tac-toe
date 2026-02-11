const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");

// Get port from environment or default to 3001
const PORT = process.env.PORT || 3001;

// Create HTTP server
const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Ultimate Tic Tac Toe - Socket.IO Server Running");
});

// Initialize Socket.IO with CORS
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  transports: ["websocket", "polling"],
});

// Store rooms and their state
const rooms = new Map();

// Helper: Generate Fisher-Yates shuffle mapping
function generateShuffleMapping() {
  const mapping = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  for (let i = mapping.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [mapping[i], mapping[j]] = [mapping[j], mapping[i]];
  }
  return mapping;
}

// Helper: Check if shuffle should trigger
function shouldTriggerShuffle(gameState) {
  if (!gameState || gameState.instabilityTriggered) return false;
  
  // Count conquered boards (X or O only, not DRAW)
  const conqueredCount = gameState.boardStatus.filter(
    status => status === "X" || status === "O"
  ).length;
  
  return conqueredCount === 3;
}

// Helper: Check if role swap should trigger
function shouldTriggerRoleSwap(gameState) {
  return (
    gameState &&
    gameState.instabilityTriggered &&
    !gameState.roleSwapTriggered &&
    !gameState.gameOver &&
    gameState.postShuffleMoves === 2
  );
}

// Socket.IO event handlers
io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);
  
  // Track current room for this socket
  let currentRoom = null;

  socket.on("join", ({ roomId }) => {
    // Leave previous game room (but not the socket's personal room)
    if (currentRoom) {
      socket.leave(currentRoom);
      const prevRoom = rooms.get(currentRoom);
      if (prevRoom) {
        prevRoom.players = prevRoom.players.filter((id) => id !== socket.id);
        if (prevRoom.players.length === 0) {
          rooms.delete(currentRoom);
        }
      }
    }

    // Join new room
    socket.join(roomId);
    currentRoom = roomId;

    // Initialize room if it doesn't exist
    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        players: [],
        gameState: null,
      });
    }

    const room = rooms.get(roomId);
    room.players.push(socket.id);

    console.log(`Player ${socket.id} joined room ${roomId}`);

    // Notify room about new player
    io.to(roomId).emit("room-status", {
      players: room.players.length,
      gameStarted: room.players.length >= 2,
    });
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    if (currentRoom) {
      const room = rooms.get(currentRoom);
      if (room) {
        room.players = room.players.filter((id) => id !== socket.id);
        if (room.players.length === 0) {
          rooms.delete(currentRoom);
        } else {
          io.to(currentRoom).emit("room-status", {
            players: room.players.length,
            gameStarted: false,
          });
        }
      }
      console.log(`Player ${socket.id} disconnected from room ${currentRoom}`);
    }
  });

  // Handle game state sync (for checking shuffle and role swap triggers)
  socket.on("game-state", ({ gameState }) => {
    if (currentRoom) {
      const room = rooms.get(currentRoom);
      if (room) {
        room.gameState = gameState;
        
        // Check if shuffle should trigger on the server
        if (shouldTriggerShuffle(gameState)) {
          const shuffleMapping = generateShuffleMapping();
          console.log(`Triggering chaos swap in room ${currentRoom}:`, shuffleMapping);
          
          // Broadcast shuffle to all clients in room
          io.to(currentRoom).emit("chaos-swap", { shuffleMapping });
        }
        
        // Check if role swap should trigger on the server
        if (shouldTriggerRoleSwap(gameState)) {
           console.log(`Triggering role swap in room ${currentRoom}`);
           // Broadcast role swap to all clients
           io.to(currentRoom).emit("role-swap");
        }
      }
    }
  });

  // Handle move
  socket.on("move", ({ boardIndex, cellIndex }) => {
    if (currentRoom) {
      console.log(
        `Move in room ${currentRoom}: board ${boardIndex}, cell ${cellIndex}`
      );
      // Relay move to other players in room
      socket.to(currentRoom).emit("move", { boardIndex, cellIndex });
    }
  });

  // Handle reset
  socket.on("reset", () => {
    if (currentRoom) {
      console.log(`Reset in room ${currentRoom}`);
      const room = rooms.get(currentRoom);
      if (room) {
        room.gameState = null; // Clear game state on reset
      }
      // Relay reset to other players in room
      socket.to(currentRoom).emit("reset");
    }
  });

  // Handle leave
  socket.on("leave", () => {
    if (currentRoom) {
      socket.leave(currentRoom);
      const room = rooms.get(currentRoom);
      if (room) {
        room.players = room.players.filter((id) => id !== socket.id);
        if (room.players.length === 0) {
          rooms.delete(currentRoom);
        } else {
          io.to(currentRoom).emit("room-status", {
            players: room.players.length,
            gameStarted: false,
          });
        }
      }
      console.log(`Player ${socket.id} left room ${currentRoom}`);
      currentRoom = null;
    }
  });
});

server.listen(PORT, () => {
  console.log(`Socket.IO server listening on port ${PORT}`);
});
