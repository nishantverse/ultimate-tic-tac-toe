"use client";

import { GameState, Player } from "@/lib/gameLogic";
import { SmallBoard } from "./SmallBoard";

interface GameBoardProps {
  gameState: GameState;
  onCellClick: (boardIndex: number, cellIndex: number) => void;
  gameMode: "local" | "ai" | "online";
  isPlayerTurn: boolean;
  opponentName: string;
  showShuffleAnimation: boolean;
  showRoleSwapAnimation: boolean;
}

export function GameBoard({
  gameState,
  onCellClick,
  gameMode,
  isPlayerTurn,
  opponentName,
  showShuffleAnimation,
  showRoleSwapAnimation,
}: GameBoardProps) {
  const { boards, boardStatus, currentPlayer, forcedBoard, gameOver, winner, isDraw } =
    gameState;

  return (
    <div className="flex flex-col items-center gap-3 sm:gap-4 relative">
      {/* Chaos Swap Notification Overlay */}
      {showShuffleAnimation && (
        <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="glass-card rounded-2xl px-8 py-6 border-2 border-amber-500 animate-in zoom-in-95 duration-300 shadow-2xl shadow-amber-500/30">
            <div className="text-center space-y-2">
              <div className="text-4xl animate-pulse">⚡</div>
              <h2 className="text-2xl font-black bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
                CHAOS SWAP!
              </h2>
              <p className="text-sm text-muted-foreground">
                All boards have been shuffled!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Role Swap Notification Overlay */}
      {showRoleSwapAnimation && (
        <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="glass-card rounded-2xl px-8 py-6 border-2 border-indigo-500 animate-in zoom-in-95 duration-300 shadow-2xl shadow-indigo-500/30">
            <div className="text-center space-y-2">
              <div className="text-4xl animate-pulse">🔄</div>
              <h2 className="text-2xl font-black bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                ROLE SWAP!
              </h2>
              <p className="text-sm text-muted-foreground">
                You have swapped sides!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Status Display - Compact */}
      <div className="text-center">
        {!gameOver ? (
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
            {/* Current Player Indicator */}
            <div className="glass-card inline-flex items-center gap-3 px-4 py-2 rounded-xl">
              <span className="text-xs text-muted-foreground">Turn:</span>
              <span
                className={`text-2xl font-black ${currentPlayer === "X" ? "gradient-text-x" : "gradient-text-o"
                  }`}
              >
                {currentPlayer}
              </span>
            </div>

            {/* Turn Status */}
            {gameMode === "online" && (
              <span
                className={`
                  inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                  ${isPlayerTurn
                    ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                    : "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                  }
                `}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isPlayerTurn ? "bg-emerald-500" : "bg-amber-500 animate-pulse"}`} />
                {isPlayerTurn ? "Your turn" : `Waiting for ${opponentName}`}
              </span>
            )}

            {gameMode === "ai" && !isPlayerTurn && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-600 dark:text-amber-400">
                🤖 AI thinking...
              </span>
            )}

            {/* Forced Board Hint */}
            {forcedBoard !== null && (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-[var(--forced)]/20 text-[var(--forced)]">
                📍 Board {forcedBoard + 1}
              </span>
            )}

            {/* Instability Warning */}
            {!gameState.instabilityTriggered && (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                ⚡ Chaos pending
              </span>
            )}

            {/* Role Swap Warning */}
            {gameState.instabilityTriggered && !gameState.roleSwapTriggered && (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
                🔄 Swap in {2 - gameState.postShuffleMoves}
              </span>
            )}
          </div>
        ) : isDraw ? (
          <div className="glass-card px-6 py-3 rounded-xl">
            <p className="text-2xl font-black text-muted-foreground">🤝 Draw!</p>
          </div>
        ) : (
          <div className="glass-card px-6 py-3 rounded-xl">
            <p className="text-2xl font-black">
              <span className={winner === "X" ? "gradient-text-x" : "gradient-text-o"}>
                {winner}
              </span>
              {" "}Wins! 🎉
            </p>
          </div>
        )}
      </div>

      {/* Main Game Board */}
      <div className={`glass-card p-2 sm:p-3 md:p-4 rounded-2xl transition-all duration-500 ${showShuffleAnimation || showRoleSwapAnimation ? "scale-95 opacity-70" : ""}`}>
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2 md:gap-3">
          {boards.map((board, boardIndex) => (
            <SmallBoard
              key={boardIndex}
              boardIndex={boardIndex}
              board={board}
              status={boardStatus[boardIndex]}
              isForced={forcedBoard === boardIndex}
              isIllegal={
                forcedBoard !== null &&
                boardIndex !== forcedBoard &&
                boardStatus[forcedBoard] === null
              }
              onCellClick={(cellIndex) => onCellClick(boardIndex, cellIndex)}
              currentPlayer={currentPlayer}
              isPlayerTurn={isPlayerTurn && !showShuffleAnimation && !showRoleSwapAnimation}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
