const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");

// Get port from environment or default to 3001
const PORT = Number(process.env.PORT) || 3001;

const server = http.createServer((req, res) => {
  if (req.method === "GET" && (req.url === "/" || req.url === "/health" || req.url === "/healthz")) {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ ok: false, error: "Not Found" }));
});

// Initialize Socket.IO with CORS
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  transports: ["websocket", "polling"],
});

function parseAllowedOrigins(value) {
  if (!value || value.trim() === "*") {
    return "*";
  }

  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function isValidRoomId(roomId) {
  return typeof roomId === "string" && /^[a-zA-Z0-9_-]{3,30}$/.test(roomId);
}

function generateShuffleMapping() {
  const mapping = [0, 1, 2, 3, 4, 5, 6, 7, 8];

    for (let i = mapping.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [mapping[i], mapping[j]] = [mapping[j], mapping[i]];
    }

    return mapping;
  }

  function shouldTriggerShuffle(gameState) {
    if (!gameState || gameState.instabilityTriggered) return false;

    const conqueredCount = gameState.boardStatus.filter(
      (status) => status === "X" || status === "O"
    ).length;

    return conqueredCount === 3;
  }

  function shouldTriggerRoleSwap(gameState) {
    return (
      gameState &&
      gameState.instabilityTriggered &&
      !gameState.roleSwapTriggered &&
      !gameState.gameOver &&
      gameState.postShuffleMoves === 2
    );
  }

  function removeSocketFromRoom(rooms, roomId, socketId) {
    const room = rooms.get(roomId);
    if (!room) {
      return null;
    }

    room.players = room.players.filter((id) => id !== socketId);

    if (room.players.length === 0) {
      rooms.delete(roomId);
      return null;
    }

    return room;
  }

  const server = http.createServer((req, res) => {
    if (req.method === "GET" && (req.url === "/" || req.url === "/health" || req.url === "/healthz")) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
      return;
    }

    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: false, error: "Not Found" }));
  });

  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;

  const io = socketIo(server, {
    cors: {
      origin: parseAllowedOrigins(process.env.SOCKET_CORS_ORIGIN),
      methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"],
  });

  const rooms = new Map();

  io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);

    let currentRoom = null;

    socket.on("join", ({ roomId }) => {
      if (!isValidRoomId(roomId)) {
        socket.emit("room-error", {
          message: "Invalid room ID.",
        });
        return;
      }

      if (currentRoom === roomId) {
        return;
      }

      if (currentRoom) {
        socket.leave(currentRoom);
        removeSocketFromRoom(rooms, currentRoom, socket.id);
      }

      socket.join(roomId);
      currentRoom = roomId;

      if (!rooms.has(roomId)) {
        rooms.set(roomId, {
          players: [],
          gameState: null,
        });
      }

      const room = rooms.get(roomId);
      if (!room.players.includes(socket.id)) {
        room.players.push(socket.id);
      }

      console.log(`Player ${socket.id} joined room ${roomId}`);

      io.to(roomId).emit("room-status", {
        players: room.players.length,
        gameStarted: room.players.length >= 2,
      });
    });

    socket.on("disconnect", () => {
      if (!currentRoom) {
        return;
      }

      const room = removeSocketFromRoom(rooms, currentRoom, socket.id);
      if (room) {
        io.to(currentRoom).emit("room-status", {
          players: room.players.length,
          gameStarted: false,
        });
      }

      console.log(`Player ${socket.id} disconnected from room ${currentRoom}`);
      currentRoom = null;
    });

    socket.on("game-state", ({ gameState }) => {
      if (!currentRoom) {
        return;
      }

      const room = rooms.get(currentRoom);
      if (!room) {
        return;
      }

      room.gameState = gameState;

      if (shouldTriggerShuffle(gameState)) {
        const shuffleMapping = generateShuffleMapping();
        console.log(`Triggering chaos swap in room ${currentRoom}:`, shuffleMapping);
        io.to(currentRoom).emit("chaos-swap", { shuffleMapping });
      }

      if (shouldTriggerRoleSwap(gameState)) {
        console.log(`Triggering role swap in room ${currentRoom}`);
        io.to(currentRoom).emit("role-swap");
      }
    });

    socket.on("move", ({ boardIndex, cellIndex }) => {
      if (!currentRoom) {
        return;
      }

      console.log(
        `Move in room ${currentRoom}: board ${boardIndex}, cell ${cellIndex}`
      );
      socket.to(currentRoom).emit("move", { boardIndex, cellIndex });
    });

    socket.on("reset", () => {
      if (!currentRoom) {
        return;
      }

      console.log(`Reset in room ${currentRoom}`);
      const room = rooms.get(currentRoom);
      if (room) {
        room.gameState = null;
      }

      socket.to(currentRoom).emit("reset");
    });

    socket.on("leave", () => {
      if (!currentRoom) {
        return;
      }

      socket.leave(currentRoom);
      const room = removeSocketFromRoom(rooms, currentRoom, socket.id);

      if (room) {
        io.to(currentRoom).emit("room-status", {
          players: room.players.length,
          gameStarted: false,
        });
      }

      console.log(`Player ${socket.id} left room ${currentRoom}`);
      currentRoom = null;
    });
  });

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Socket.IO server listening on port ${PORT}`);
  });
