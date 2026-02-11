// Ultimate Tic Tac Toe Game Logic
// State: boards[0-8][0-8], boardStatus[0-8], currentPlayer, forcedBoard, gameOver, winner

export type Player = "X" | "O";
export type BoardStatus = Player | "DRAW" | null;

export interface GameState {
  boards: Array<Array<Player | null>>;
  boardStatus: Array<BoardStatus>;
  currentPlayer: Player;
  forcedBoard: number | null;
  gameOver: boolean;
  winner: Player | null;
  isDraw: boolean;
  // Instability Shuffle state
  instabilityTriggered: boolean;
  shuffleJustHappened: boolean; // Flag for UI to show animation
  shuffleMapping: number[] | null; // Maps old index to new index
  // Phase 2: Role Swap state
  postShuffleMoves: number; // Count moves after shuffle
  roleSwapTriggered: boolean;
  roleSwapJustHappened: boolean; // Flag for UI notification
}

/**
 * Initialize a fresh game state
 */
export function initializeGame(): GameState {
  return {
    boards: Array(9)
      .fill(null)
      .map(() => Array(9).fill(null)),
    boardStatus: Array(9).fill(null),
    currentPlayer: "X",
    forcedBoard: null,
    gameOver: false,
    winner: null,
    isDraw: false,
    instabilityTriggered: false,
    shuffleJustHappened: false,
    shuffleMapping: null,
    postShuffleMoves: 0,
    roleSwapTriggered: false,
    roleSwapJustHappened: false,
  };
}

// Winning line combinations (used for both small and big boards)
const WINNING_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

/**
 * Check if a small board has a winner
 */
function checkSmallBoardWinner(board: Array<Player | null>): Player | "DRAW" | null {
  for (const [a, b, c] of WINNING_LINES) {
    if (board[a] && board[a] === board[b] && board[b] === board[c]) {
      return board[a] as Player;
    }
  }

  if (board.every((cell) => cell !== null)) {
    return "DRAW";
  }

  return null;
}

/**
 * Check if the big board has a winner
 */
function checkBigBoardWinner(boardStatus: Array<BoardStatus>): Player | null {
  for (const [a, b, c] of WINNING_LINES) {
    if (
      boardStatus[a] === "X" &&
      boardStatus[b] === "X" &&
      boardStatus[c] === "X"
    ) {
      return "X";
    }
    if (
      boardStatus[a] === "O" &&
      boardStatus[b] === "O" &&
      boardStatus[c] === "O"
    ) {
      return "O";
    }
  }

  return null;
}

/**
 * Check if conquered boards form a winning line
 */
function conqueredBoardsFormWinningLine(boardStatus: Array<BoardStatus>): boolean {
  for (const [a, b, c] of WINNING_LINES) {
    // Check if all three positions are conquered (not null, not DRAW counts as progress toward win)
    const aConquered = boardStatus[a] === "X" || boardStatus[a] === "O";
    const bConquered = boardStatus[b] === "X" || boardStatus[b] === "O";
    const cConquered = boardStatus[c] === "X" || boardStatus[c] === "O";
    
    // If any winning line has all 3 positions conquered by players (X or O)
    if (aConquered && bConquered && cConquered) {
      // And they're all the same player
      if (boardStatus[a] === boardStatus[b] && boardStatus[b] === boardStatus[c]) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Check if instability shuffle should trigger
 * Conditions:
 * 1. Exactly 3 mini-boards are conquered (X or O, not DRAW)
 * 2. The 3 conquered boards do NOT form a winning line
 * 3. No player is in a global winning state
 * 4. Instability has not triggered before
 */
export function shouldTriggerInstability(state: GameState): boolean {
  if (state.instabilityTriggered) return false;
  if (state.gameOver) return false;
  
  // Count conquered boards (X or O only, not DRAW)
  const conqueredCount = state.boardStatus.filter(
    status => status === "X" || status === "O"
  ).length;
  
  if (conqueredCount !== 3) return false;
  
  // Check if conquered boards form a winning line
  if (conqueredBoardsFormWinningLine(state.boardStatus)) return false;
  
  // Check if anyone is already winning
  if (checkBigBoardWinner(state.boardStatus) !== null) return false;
  
  return true;
}

/**
 * Fisher-Yates shuffle to generate random permutation
 */
function generateShuffleMapping(): number[] {
  const mapping = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  for (let i = mapping.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [mapping[i], mapping[j]] = [mapping[j], mapping[i]];
  }
  return mapping;
}

/**
 * Apply a shuffle mapping to the game state
 * Used when server provides the mapping for synchronization
 */
export function applyShuffleMapping(state: GameState, mapping: number[]): GameState {
  const newState = JSON.parse(JSON.stringify(state)) as GameState;
  
  // Create new arrays based on shuffle
  const newBoards: Array<Array<Player | null>> = Array(9).fill(null).map(() => []);
  const newBoardStatus: Array<BoardStatus> = Array(9).fill(null);
  
  // Apply shuffle: mapping[oldIndex] = newIndex
  // So board at old position i goes to new position mapping[i]
  for (let oldIndex = 0; oldIndex < 9; oldIndex++) {
    const newIndex = mapping[oldIndex];
    newBoards[newIndex] = [...state.boards[oldIndex]];
    newBoardStatus[newIndex] = state.boardStatus[oldIndex];
  }
  
  newState.boards = newBoards;
  newState.boardStatus = newBoardStatus;
  
  // Update forcedBoard to new index
  if (state.forcedBoard !== null) {
    newState.forcedBoard = mapping[state.forcedBoard];
  }
  
  // Mark instability as triggered
  newState.instabilityTriggered = true;
  newState.shuffleJustHappened = true;
  newState.shuffleMapping = mapping;
  newState.postShuffleMoves = 0; // Reset counter (though should be 0)
  
  return newState;
}

/**
 * Perform the instability shuffle (for local/AI games)
 * Randomly repositions the 9 mini-boards without changing their internal state
 */
export function performInstabilityShuffle(state: GameState): GameState {
  const mapping = generateShuffleMapping();
  return applyShuffleMapping(state, mapping);
}

/**
 * Determine if role swap should occur
 * Triggers with 50% chance after 5 moves post-shuffle
 */
export function shouldTriggerRoleSwap(state: GameState): boolean {
  if (
    state.instabilityTriggered &&
    !state.roleSwapTriggered &&
    !state.gameOver &&
    state.postShuffleMoves === 5
  ) {
    // 50% chance of role swap
    return Math.random() < 0.5;
  }
  return false;
}

/**
 * Clear the shuffle and role swap animation flags
 */
export function clearAnimationFlags(state: GameState): GameState {
  return {
    ...state,
    shuffleJustHappened: false,
    shuffleMapping: null,
    roleSwapJustHappened: false,
  };
}

/**
 * Make a move and return updated game state
 */
export function makeMove(
  state: GameState,
  boardIndex: number,
  cellIndex: number,
  suppressShuffle: boolean = false
): GameState | null {
  // Check if game is already over
  if (state.gameOver) return null;

  // Check if the cell is already occupied
  if (state.boards[boardIndex][cellIndex] !== null) return null;

  // Check if the board is already won/full
  if (state.boardStatus[boardIndex] !== null) return null;

  // Check if move is on a legal board
  // If forcedBoard is set AND that board is still active (not won/full), move must be there
  if (state.forcedBoard !== null && state.boardStatus[state.forcedBoard] === null) {
    if (boardIndex !== state.forcedBoard) {
      return null;
    }
  }

  // Create new state
  let newState = JSON.parse(JSON.stringify(state)) as GameState;
  newState.boards[boardIndex][cellIndex] = state.currentPlayer;
  
  // Clear any previous animation flags
  newState.shuffleJustHappened = false;
  newState.shuffleMapping = null;
  newState.roleSwapJustHappened = false;

  // Check if this small board is now won or full
  const boardWinner = checkSmallBoardWinner(newState.boards[boardIndex]);
  if (boardWinner) {
    newState.boardStatus[boardIndex] = boardWinner;
  }

  // Check if big board is won
  const bigWinner = checkBigBoardWinner(newState.boardStatus);
  if (bigWinner) {
    newState.gameOver = true;
    newState.winner = bigWinner;
    return newState;
  }

  // Check if big board is full (draw)
  if (newState.boardStatus.every((status) => status !== null)) {
    newState.gameOver = true;
    newState.isDraw = true;
    return newState;
  }

  // Determine next forced board
  const nextForcedBoard = cellIndex;
  if (newState.boardStatus[nextForcedBoard] !== null) {
    // Next board is won/full, player can play anywhere
    newState.forcedBoard = null;
  } else {
    newState.forcedBoard = nextForcedBoard;
  }

  // Switch player
  newState.currentPlayer = state.currentPlayer === "X" ? "O" : "X";
  
  // Increment post-shuffle move counter if instability has triggered
  if (newState.instabilityTriggered) {
    newState.postShuffleMoves += 1;
  }

  // Check if instability shuffle should trigger (after the move, before next player's turn)
  // Only trigger if NOT suppressed (suppressed in online mode so server can dictate mapping)
  if (!suppressShuffle && shouldTriggerInstability(newState)) {
    newState = performInstabilityShuffle(newState);
  }
  
  // Check for Role Swap trigger (Phase 2)
  if (!suppressShuffle && shouldTriggerRoleSwap(newState)) {
    newState.roleSwapTriggered = true;
    newState.roleSwapJustHappened = true;
    // Note: The actual "player role" swapping (who controls what) 
    // is handled by the UI/Server by swapping the socket-to-symbol mapping or 
    // simply by the fact that the 'currentPlayer' state continues to alternate.
    // The requirement says: "Player previously playing as X now plays as O"
    // This effectively means we need to notify the UI/Server to swap the assignments.
    // Since GameState only tracks board state, the "who is controlling X" is outside this state logic 
    // usually. However, we can use the flag `roleSwapJustHappened` to trigger the swap in the UI/Server.
  }

  return newState;
}

/**
 * Get all legal moves for current player
 */
export function getLegalMoves(state: GameState): Array<{ boardIndex: number; cellIndex: number }> {
  const moves: Array<{ boardIndex: number; cellIndex: number }> = [];

  if (state.gameOver) return moves;

  // If there's a forced board
  if (state.forcedBoard !== null && state.boardStatus[state.forcedBoard] === null) {
    const board = state.boards[state.forcedBoard];
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        moves.push({ boardIndex: state.forcedBoard, cellIndex: i });
      }
    }
  } else {
    // Can play anywhere in non-full/non-won boards
    for (let b = 0; b < 9; b++) {
      if (state.boardStatus[b] !== null) continue;
      const board = state.boards[b];
      for (let c = 0; c < 9; c++) {
        if (board[c] === null) {
          moves.push({ boardIndex: b, cellIndex: c });
        }
      }
    }
  }

  return moves;
}

/**
 * Score a move based on strategic value
 */
function scoreMoveStrategy(state: GameState, move: { boardIndex: number; cellIndex: number }, player: Player): number {
  let score = 0;
  const opponent = player === "X" ? "O" : "X";
  
  // Prefer strategic board positions (center board, corners)
  const strategicBoards = [4, 0, 2, 6, 8]; // center, then corners
  const boardStrategicIndex = strategicBoards.indexOf(move.boardIndex);
  if (boardStrategicIndex !== -1) {
    score += (5 - boardStrategicIndex) * 2;
  }
  
  // Prefer strategic cell positions
  const strategicCells = [4, 0, 2, 6, 8, 1, 3, 5, 7]; // center, corners, edges
  const cellStrategicIndex = strategicCells.indexOf(move.cellIndex);
  if (cellStrategicIndex !== -1) {
    score += (9 - cellStrategicIndex);
  }
  
  // Check if this move creates a two-in-a-row opportunity
  const boardCopy = [...state.boards[move.boardIndex]];
  boardCopy[move.cellIndex] = player;
  for (const [a, b, c] of WINNING_LINES) {
    const line = [boardCopy[a], boardCopy[b], boardCopy[c]];
    const playerCount = line.filter(cell => cell === player).length;
    const emptyCount = line.filter(cell => cell === null).length;
    if (playerCount === 2 && emptyCount === 1) {
      score += 15; // Good setup for winning
    }
  }
  
  // Avoid sending opponent to a board they could win
  const nextBoard = move.cellIndex;
  if (state.boardStatus[nextBoard] === null) {
    const nextBoardState = state.boards[nextBoard];
    for (const [a, b, c] of WINNING_LINES) {
      const line = [nextBoardState[a], nextBoardState[b], nextBoardState[c]];
      const opponentCount = line.filter(cell => cell === opponent).length;
      const emptyCount = line.filter(cell => cell === null).length;
      if (opponentCount === 2 && emptyCount === 1) {
        score -= 20; // Bad - opponent can win that board
      }
    }
  } else {
    // Sending to already-won board gives opponent free choice - slight penalty
    score -= 5;
  }
  
  // Add small randomness to avoid predictability
  score += Math.random() * 3;
  
  return score;
}

/**
 * AI move with improved strategic thinking
 */
export function getAIMove(state: GameState): { boardIndex: number; cellIndex: number } | null {
  const moves = getLegalMoves(state);
  
  if (moves.length === 0) {
    return null;
  }

  const player = state.currentPlayer;
  const opponent = player === "X" ? "O" : "X";

  try {
    // Priority 1: Win a board if possible
    for (const move of moves) {
      const testState = makeMove(state, move.boardIndex, move.cellIndex, true);
      if (testState && testState.boardStatus[move.boardIndex] === player) {
        // Check if this also wins the game!
        if (testState.winner === player) {
          return move; // Winning move!
        }
        // Store as winning move candidate
        return move;
      }
    }

    // Priority 2: Block opponent from winning any playable board
    for (const move of moves) {
      const boardCopy = [...state.boards[move.boardIndex]];
      boardCopy[move.cellIndex] = opponent;
      if (checkSmallBoardWinnerExport(boardCopy) === opponent) {
        return move; // Must block!
      }
    }

    // Priority 3: Use strategic scoring to pick the best move
    let bestMove = moves[0];
    let bestScore = -Infinity;
    
    for (const move of moves) {
      const score = scoreMoveStrategy(state, move, player);
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
    
    return bestMove;
    
  } catch (err) {
    // Fallback to random move
    return moves[Math.floor(Math.random() * moves.length)];
  }
}

/**
 * Export checkSmallBoardWinner for AI use
 */
export function checkSmallBoardWinnerExport(board: Array<Player | null>): Player | "DRAW" | null {
  return checkSmallBoardWinner(board);
}

/**
 * Reset game state
 */
export function resetGame(): GameState {
  return initializeGame();
}
