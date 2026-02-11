'use client';

import { Player, BoardStatus } from "@/lib/gameLogic";
import { Cell } from "./Cell";

interface SmallBoardProps {
  boardIndex: number;
  board: Array<Player | null>;
  status: BoardStatus;
  isForced: boolean;
  isIllegal: boolean;
  onCellClick: (cellIndex: number) => void;
  currentPlayer: Player;
  isPlayerTurn: boolean;
}

export function SmallBoard({
  boardIndex,
  board,
  status,
  isForced,
  isIllegal,
  onCellClick,
  currentPlayer,
  isPlayerTurn,
}: SmallBoardProps) {
  const isWon = status === "X" || status === "O";
  const isDraw = status === "DRAW";

  // Only show the forced glow when it's the player's turn
  const showForcedGlow = isForced && !status && isPlayerTurn;

  return (
    <div
      className={`
        relative p-1.5 sm:p-2 md:p-2.5 rounded-xl border-2 transition-all duration-200
        ${showForcedGlow ? "forced-board border-[var(--forced)]" : "border-border/20"}
        ${isIllegal ? "opacity-25 pointer-events-none" : "opacity-100"}
        ${status === "X" ? "bg-[var(--player-x)]/15 border-[var(--player-x)]/50" : ""}
        ${status === "O" ? "bg-[var(--player-o)]/15 border-[var(--player-o)]/50" : ""}
        ${isDraw ? "bg-muted/20" : !status ? "glass-card" : ""}
      `}
      style={{
        boxShadow: isWon
          ? status === "X"
            ? "0 0 20px var(--player-x-glow), inset 0 0 15px var(--player-x-glow)"
            : "0 0 20px var(--player-o-glow), inset 0 0 15px var(--player-o-glow)"
          : undefined
      }}
    >
      {/* Cells Grid - Hidden when won */}
      <div className={`grid grid-cols-3 gap-1 ${status ? "invisible" : ""}`}>
        {board.map((cell, cellIndex) => (
          <Cell
            key={cellIndex}
            value={cell}
            onClick={() => onCellClick(cellIndex)}
            disabled={isIllegal || status !== null || !isPlayerTurn}
            isForced={showForcedGlow}
          />
        ))}
      </div>

      {/* Won/Draw Overlay - Big glowing symbol */}
      {status && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl">
          {isWon ? (
            <span
              className={`
                text-5xl sm:text-6xl md:text-7xl font-black
                ${status === "X" ? "text-[var(--player-x)]" : "text-[var(--player-o)]"}
              `}
              style={{
                textShadow: status === "X"
                  ? "0 0 30px var(--player-x-glow), 0 0 60px var(--player-x-glow), 0 0 90px var(--player-x-glow)"
                  : "0 0 30px var(--player-o-glow), 0 0 60px var(--player-o-glow), 0 0 90px var(--player-o-glow)",
                filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))"
              }}
            >
              {status}
            </span>
          ) : (
            <span className="text-3xl sm:text-4xl text-muted-foreground font-bold">
              —
            </span>
          )}
        </div>
      )}
    </div>
  );
}
