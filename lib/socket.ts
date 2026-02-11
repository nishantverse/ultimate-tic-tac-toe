import { GameState } from "./gameLogic";

let socket: any = null;
let isConnecting = false;

export interface SocketMessage {
  type: "move" | "reset" | "join" | "leave" | "state";
  payload?: any;
}

/**
 * Initialize Socket.IO connection
 */
export async function initSocket(): Promise<void> {
  if (socket || isConnecting) return;

  isConnecting = true;

  try {
    // Dynamically import socket.io-client only on client side
    const { io } = await import("socket.io-client");

    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin;
    socket = io(socketUrl, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socket.on("connect", () => {
      console.log("[Socket] Connected:", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("[Socket] Disconnected");
    });

    socket.on("error", (error: string) => {
      console.error("[Socket] Error:", error);
    });
  } catch (error) {
    console.error("[Socket] Failed to initialize:", error);
    isConnecting = false;
  }

  isConnecting = false;
}

/**
 * Join a game room
 */
export function joinRoom(roomId: string): void {
  if (!socket) {
    console.error("[Socket] Not connected");
    return;
  }
  socket.emit("join", { roomId });
}

/**
 * Send a move to the server
 */
export function sendMove(boardIndex: number, cellIndex: number): void {
  if (!socket) {
    console.error("[Socket] Not connected");
    return;
  }
  socket.emit("move", { boardIndex, cellIndex });
}

/**
 * Send game state to server (for chaos swap detection)
 */
export function sendGameState(gameState: GameState): void {
  if (!socket) {
    console.error("[Socket] Not connected");
    return;
  }
  socket.emit("game-state", { gameState });
}

/**
 * Send reset request
 */
export function sendReset(): void {
  if (!socket) {
    console.error("[Socket] Not connected");
    return;
  }
  socket.emit("reset");
}

/**
 * Leave the room
 */
export function leaveRoom(): void {
  if (!socket) return;
  socket.emit("leave");
}

/**
 * Listen for move events from server
 */
export function onRemoteMove(
  callback: (data: { boardIndex: number; cellIndex: number }) => void
): () => void {
  if (!socket) return () => {};
  socket.on("move", callback);
  return () => socket.off("move", callback);
}

/**
 * Listen for chaos swap events from server
 */
export function onChaosSwap(
  callback: (data: { shuffleMapping: number[] }) => void
): () => void {
  if (!socket) return () => {};
  socket.on("chaos-swap", callback);
  return () => socket.off("chaos-swap", callback);
}

/**
 * Listen for role swap events from server
 */
export function onRoleSwap(
  callback: () => void
): () => void {
  if (!socket) return () => {};
  socket.on("role-swap", callback);
  return () => socket.off("role-swap", callback);
}

/**
 * Listen for reset events from server
 */
export function onRemoteReset(callback: () => void): () => void {
  if (!socket) return () => {};
  socket.on("reset", callback);
  return () => socket.off("reset", callback);
}

/**
 * Listen for state sync from server
 */
export function onStateSync(
  callback: (state: GameState) => void
): () => void {
  if (!socket) return () => {};
  socket.on("state", callback);
  return () => socket.off("state", callback);
}

/**
 * Listen for room status
 */
export function onRoomStatus(
  callback: (data: { players: number; gameStarted: boolean }) => void
): () => void {
  if (!socket) return () => {};
  socket.on("room-status", callback);
  return () => socket.off("room-status", callback);
}

/**
 * Check if connected
 */
export function isConnected(): boolean {
  return socket?.connected ?? false;
}

/**
 * Disconnect socket
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * Get socket instance
 */
export function getSocket(): any {
  return socket;
}
