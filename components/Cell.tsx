'use client';

import { Player } from "@/lib/gameLogic";

interface CellProps {
  value: Player | null;
  onClick: () => void;
  disabled: boolean;
  isForced: boolean;
}

export function Cell({ value, onClick, disabled, isForced }: CellProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        w-8 h-8 sm:w-10 sm:h-10 md:w-11 md:h-11
        rounded-lg text-lg sm:text-xl md:text-2xl font-bold 
        transition-transform duration-150 ease-out
        border
        ${disabled
          ? "cursor-not-allowed"
          : "cursor-pointer hover:scale-105 active:scale-95"
        }
        ${isForced && !disabled && !value
          ? "border-[var(--forced)] bg-[var(--forced)]/10"
          : "border-border/40 bg-background/50"
        }
        ${value === null && !disabled ? "hover:bg-muted/40" : ""}
        ${value !== null ? "cell-placed" : ""}
      `}
    >
      {value && (
        <span className={value === "X" ? "gradient-text-x" : "gradient-text-o"}>
          {value}
        </span>
      )}
    </button>
  );
}
