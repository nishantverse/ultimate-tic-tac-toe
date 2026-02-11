# Ultimate Tic Tac Toe - API & State Documentation

## Game State Model

All game logic runs on the client. The server only relays messages.

### GameState Interface

```typescript
interface GameState {
  boards: Array<Array<Player | null>>;  // 9 small boards, each with 9 cells
  boardStatus: Array<BoardStatus>;       // Status of each small board (9 values)
  currentPlayer: Player;                 // "X" or "O"
  forcedBoard: number | null;            // Which board player must play in
  gameOver: boolean;                     // Game has ended
  winner: Player | null;                 // Winning player (X or O)
  isDraw: boolean;                       // Game is a draw
}

type Player = "X" | "O";
type BoardStatus = Player | "DRAW" | null;
```

### Boards Array Structure

```
boards[0] = [cell0, cell1, cell2, cell3, cell4, cell5, cell6, cell7, cell8]
boards[1] = [cell0, cell1, cell2, cell3, cell4, cell5, cell6, cell7, cell8]
...
boards[8] = [cell0, cell1, cell2, cell3, cell4, cell5, cell6, cell7, cell8]
```

Each cell is either:
- `null` (empty)
- `"X"` (X played here)
- `"O"` (O played here)

### Board Positions

```
0 | 1 | 2
---------
3 | 4 | 5
---------
6 | 7 | 8
```

The boardStatus array follows same numbering:
- `boardStatus[0]` = top-left board status
- `boardStatus[4]` = center board status
- `boardStatus[8]` = bottom-right board status

## Game Logic Functions

### initializeGame(): GameState

Creates a fresh game with empty boards and Player X going first.

```typescript
const gameState = initializeGame();
// {
//   boards: [[], [], [], [], [], [], [], [], []],
//   boardStatus: [null, null, null, null, null, null, null, null, null],
//   currentPlayer: "X",
//   forcedBoard: null,
//   gameOver: false,
//   winner: null,
//   isDraw: false
// }
```

### makeMove(state: GameState, boardIndex: number, cellIndex: number): GameState | null

Attempts to make a move. Returns updated state or `null` if move is illegal.

```typescript
const updatedState = makeMove(gameState, 4, 2);
// null = illegal move
// GameState = move accepted, state updated
```

**Move Validation:**
1. Game must not be over
2. Cell must be empty
3. Board must not be won/full
4. Move must be in forced board (if applicable)

**After Move:**
1. Check if small board is won
2. Check if big board is won (win condition)
3. Check if big board is full (draw condition)
4. Determine next forced board (cellIndex of current move)
5. Switch to other player

### getLegalMoves(state: GameState): Array<{ boardIndex: number; cellIndex: number }>

Returns all legal moves for current player.

```typescript
const moves = getLegalMoves(gameState);
// [
//   { boardIndex: 2, cellIndex: 0 },
//   { boardIndex: 2, cellIndex: 3 },
//   ...
// ]
```

### getAIMove(state: GameState): { boardIndex: number; cellIndex: number } | null

AI decision making with priority strategy:

1. **Win**: Win the forced board if possible
2. **Block**: Block opponent from winning forced board
3. **Center**: Play center cell (position 4) if available
4. **Random**: Play random valid move

```typescript
const aiMove = getAIMove(gameState);
// { boardIndex: 3, cellIndex: 4 }
```

### resetGame(): GameState

Returns a fresh game state (equivalent to `initializeGame()`).

## Socket.IO Events

### Client → Server

#### join

Join a game room.

```javascript
socket.emit("join", { roomId: "room-123" });
```

**Parameters:**
- `roomId` (string): Unique room identifier

**Server Response:**
- Broadcasts `room-status` to all players in room

#### move

Send a move to opponent.

```javascript
socket.emit("move", { boardIndex: 4, cellIndex: 2 });
```

**Parameters:**
- `boardIndex` (0-8): Which small board
- `cellIndex` (0-8): Which cell in the board

#### reset

Request game reset.

```javascript
socket.emit("reset");
```

#### leave

Leave the current room.

```javascript
socket.emit("leave");
```

### Server → Client

#### room-status

Room status update (e.g., player joined).

```javascript
socket.on("room-status", (data) => {
  console.log(data.players);      // Number of players in room
  console.log(data.gameStarted);  // true if 2 players present
});
```

**Data:**
- `players` (number): 1 or 2
- `gameStarted` (boolean): true when both players connected

#### move

Opponent's move received.

```javascript
socket.on("move", (data) => {
  console.log(data.boardIndex);  // 0-8
  console.log(data.cellIndex);   // 0-8
  makeMove(gameState, data.boardIndex, data.cellIndex);
});
```

#### reset

Opponent requested game reset.

```javascript
socket.on("reset", () => {
  // Reset your local game state
});
```

## Socket.IO Utilities (/lib/socket.ts)

### initSocket(): Promise<void>

Initialize Socket.IO connection to server.

```typescript
await initSocket();
```

### joinRoom(roomId: string): void

Join a room and start listening for events.

```typescript
joinRoom("room-123");
```

### sendMove(boardIndex: number, cellIndex: number): void

Send your move to opponent.

```typescript
sendMove(4, 2);
```

### sendReset(): void

Send reset request to opponent.

```typescript
sendReset();
```

### leaveRoom(): void

Leave current room.

```typescript
leaveRoom();
```

### onRemoteMove(callback): () => void

Listen for opponent's moves.

```typescript
const unsubscribe = onRemoteMove(({ boardIndex, cellIndex }) => {
  // Handle opponent's move
});

// Later:
unsubscribe(); // Stop listening
```

### onRemoteReset(callback): () => void

Listen for reset events.

```typescript
const unsubscribe = onRemoteReset(() => {
  // Handle reset
});
```

### onRoomStatus(callback): () => void

Listen for room status updates.

```typescript
const unsubscribe = onRoomStatus(({ players, gameStarted }) => {
  // Update UI with player count
});
```

### isConnected(): boolean

Check if socket is connected.

```typescript
if (isConnected()) {
  // Send move
}
```

## Game Modes

### Local Multiplayer

Two players on same device. No network required.

```typescript
gameMode = "local"
```

- Player X and Player O take turns
- All moves processed locally
- No server communication

### VS Computer (AI)

Player X vs AI opponent (O).

```typescript
gameMode = "ai"
```

- Player always plays as X (goes first)
- AI plays as O
- AI includes 100-300ms delay
- AI uses `getAIMove()` for strategy
- No server communication

### Online Multiplayer

Two players over network.

```typescript
gameMode = "online"
```

- First player to join is X
- Second player to join is O
- Both players send moves via Socket.IO
- Game state stays in sync
- Requires Socket.IO server

## Winning Conditions

### Small Board Win

A small board is won by getting 3-in-a-row (like regular tic-tac-toe):

```
X | O | X
---------
X | O | .
---------
. | O | .

Result: O wins this small board
```

### Big Board Win

Win the game by capturing 3 boards in a row (horizontally, vertically, or diagonally):

```
O | X | O
---------
X | O | X
---------
. | . | .

Result: O wins (top row of boards)
```

### Draw

Game is a draw when big board is full with no winner:

```
X | O | X
---------
X | O | X
---------
O | X | O

Result: All 9 boards are won/drawn, no 3-in-a-row for either player
```

## Forced Board Logic

After you play a move at `cellIndex`, your opponent **must** play in board `cellIndex` (if it's not already won or full).

### Example Flow

1. Player X plays at board 0, cell 4 (center)
   - Next forced board = 4 (center board)
2. Player O plays at board 4, cell 2
   - Next forced board = 2
3. Player X plays at board 2, cell 7
   - Board 2 is still active, so next forced board = 7
4. Player O plays at board 7, cell 1
   - But board 7 is now full!
   - Player X can now play in ANY available board

This creates strategic depth - you're trying to direct your opponent into losing positions!

## Implementation Example

```typescript
// Initialize game
let gameState = initializeGame();

// Player X's move
gameState = makeMove(gameState, 4, 2); // Play center board, center cell

// Check legal moves for opponent
const legalMoves = getLegalMoves(gameState);
// Returns moves in board 2 (forced board)

// Player O's move (or AI)
const nextMove = gameMode === "ai" 
  ? getAIMove(gameState)
  : playerInput;

gameState = makeMove(gameState, nextMove.boardIndex, nextMove.cellIndex);

// Check if game is over
if (gameState.gameOver) {
  if (gameState.isDraw) {
    console.log("Game is a draw!");
  } else {
    console.log(`Player ${gameState.winner} wins!`);
  }
}
```

## Performance Notes

- Game logic is purely client-side (no server validation)
- State is immutable (makeMove returns new state)
- No minimax or heavy computation
- AI moves include intentional 100-300ms delay
- WebSocket fallback to polling for connectivity

## Debugging

Enable debug logging:

```typescript
// In /lib/gameLogic.ts, add console.logs as needed:
console.log("[v0] Move accepted:", { boardIndex, cellIndex });
console.log("[v0] Game state:", gameState);
console.log("[v0] Legal moves:", getLegalMoves(gameState));
```

Socket messages:

```typescript
// In /lib/socket.ts, already logged:
console.log("[Socket] Connected:", socket.id);
console.log("[Socket] Move received:", data);
```

Browser DevTools → Console shows all game flow.
