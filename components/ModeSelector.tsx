"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

interface ModeSelectorProps {
  onModeSelect: (
    mode: "local" | "ai" | "online",
    roomId?: string
  ) => void;
}

export function ModeSelector({ onModeSelect }: ModeSelectorProps) {
  const [showOnlineInput, setShowOnlineInput] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [roomIdError, setRoomIdError] = useState("");

  const validateRoomId = (id: string): boolean => {
    if (id.length < 3) {
      setRoomIdError("Room ID must be at least 3 characters");
      return false;
    }
    if (id.length > 30) {
      setRoomIdError("Room ID must be 30 characters or less");
      return false;
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
      setRoomIdError("Only letters, numbers, hyphens, and underscores");
      return false;
    }
    setRoomIdError("");
    return true;
  };

  const handleOnlineJoin = () => {
    const trimmedId = roomId.trim();
    if (trimmedId) {
      if (validateRoomId(trimmedId)) {
        onModeSelect("online", trimmedId);
        setRoomId("");
        setShowOnlineInput(false);
        setRoomIdError("");
      }
    } else {
      onModeSelect("online");
      setShowOnlineInput(false);
    }
  };

  const handleRoomIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setRoomId(value);
    if (value.trim() && roomIdError) {
      validateRoomId(value.trim());
    } else {
      setRoomIdError("");
    }
  };

  return (
    <div className="h-screen h-[100dvh] app-bg relative overflow-hidden flex flex-col">
      {/* Theme Toggle - Top Right */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-6 sm:gap-8 px-4 py-6 overflow-hidden">
        {/* Title - Compact */}
        <div className="text-center space-y-1 sm:space-y-2 shrink-0">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold gradient-text-title tracking-tight">
            Ultimate Tic Tac Toe
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Win 9 boards • Challenge friends worldwide
          </p>
        </div>

        {/* Mode Selection Cards - Compact */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 w-full max-w-lg shrink-0">
          {/* Local */}
          <button
            onClick={() => onModeSelect("local")}
            className="mode-card group glass-card rounded-xl p-3 sm:p-4 md:p-6 text-center cursor-pointer hover:border-[var(--player-x)] border-2 border-transparent"
          >
            <div className="text-3xl sm:text-4xl md:text-5xl mb-1 sm:mb-2 group-hover:scale-110 transition-transform duration-200">
              👥
            </div>
            <h3 className="text-xs sm:text-sm md:text-base font-bold">Local</h3>
            <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">
              Same screen
            </p>
          </button>

          {/* AI */}
          <button
            onClick={() => onModeSelect("ai")}
            className="mode-card group glass-card rounded-xl p-3 sm:p-4 md:p-6 text-center cursor-pointer hover:border-amber-500 border-2 border-transparent"
          >
            <div className="text-3xl sm:text-4xl md:text-5xl mb-1 sm:mb-2 group-hover:scale-110 transition-transform duration-200">
              🤖
            </div>
            <h3 className="text-xs sm:text-sm md:text-base font-bold">AI</h3>
            <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">
              Computer
            </p>
          </button>

          {/* Online */}
          <button
            onClick={() => setShowOnlineInput(!showOnlineInput)}
            className={`mode-card group glass-card rounded-xl p-3 sm:p-4 md:p-6 text-center cursor-pointer border-2 transition-all ${showOnlineInput
                ? "border-emerald-500 shadow-lg shadow-emerald-500/20"
                : "border-transparent hover:border-emerald-500"
              }`}
          >
            <div className="text-3xl sm:text-4xl md:text-5xl mb-1 sm:mb-2 group-hover:scale-110 transition-transform duration-200">
              🌐
            </div>
            <h3 className="text-xs sm:text-sm md:text-base font-bold">Online</h3>
            <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">
              Real-time
            </p>
          </button>
        </div>

        {/* Online Room Input - Compact */}
        {showOnlineInput && (
          <div className="w-full max-w-sm glass-card rounded-xl p-4 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200 shrink-0">
            <div className="text-center">
              <h3 className="text-sm font-semibold">Join or Create Room</h3>
            </div>

            <div className="space-y-1.5">
              <input
                type="text"
                placeholder="Room code (or leave empty)"
                value={roomId}
                onChange={handleRoomIdChange}
                maxLength={30}
                className={`w-full px-3 py-2 rounded-lg bg-background/50 border text-sm placeholder:text-muted-foreground focus:outline-none transition-all ${roomIdError
                    ? "border-red-500"
                    : "border-border focus:border-emerald-500"
                  }`}
                onKeyDown={(e) => e.key === "Enter" && handleOnlineJoin()}
              />
              {roomIdError && (
                <p className="text-xs text-red-500 px-1">{roomIdError}</p>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleOnlineJoin}
                size="sm"
                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-lg"
              >
                {roomId.trim() ? "Join" : "Create"}
              </Button>
              <Button
                onClick={() => {
                  setShowOnlineInput(false);
                  setRoomId("");
                  setRoomIdError("");
                }}
                variant="ghost"
                size="sm"
                className="rounded-lg"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* How to Play - Compact, Hidden on Small Screens when Online Input Shows */}
        <div className={`w-full max-w-lg glass-card rounded-xl p-4 shrink-0 ${showOnlineInput ? 'hidden sm:block' : ''}`}>
          <h2 className="text-sm font-bold mb-2 flex items-center gap-2">
            📖 How to Play
          </h2>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-start gap-2 p-2 rounded-lg bg-background/30">
              <span>🎯</span>
              <span><strong>Win boards</strong> - Get 3-in-a-row</span>
            </div>
            <div className="flex items-start gap-2 p-2 rounded-lg bg-background/30">
              <span>📍</span>
              <span><strong>Cell choice</strong> sends opponent there</span>
            </div>
            <div className="flex items-start gap-2 p-2 rounded-lg bg-background/30">
              <span>🔓</span>
              <span><strong>Full/won board</strong> - play anywhere</span>
            </div>
            <div className="flex items-start gap-2 p-2 rounded-lg bg-background/30">
              <span>🏆</span>
              <span><strong>3 boards</strong> in a row wins!</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
