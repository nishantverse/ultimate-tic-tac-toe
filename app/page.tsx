"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { GameState, makeMove, getAIMove, initializeGame, resetGame, applyShuffleMapping, clearAnimationFlags } from "@/lib/gameLogic";
import { GameBoard } from "@/components/GameBoard";
import { ModeSelector } from "@/components/ModeSelector";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import {
  initSocket,
  joinRoom,
  sendMove,
  sendReset,
  sendGameState,
  onRemoteMove,
  onRemoteReset,
  onChaosSwap,
  onRoleSwap,
  onRoomStatus,
  leaveRoom,
  isConnected,
  disconnectSocket,
} from "@/lib/socket";

type GameMode = "local" | "ai" | "online" | null;

export default function Home() {
  const [gameMode, setGameMode] = useState<GameMode>(null);
  const [gameState, setGameState] = useState<GameState>(initializeGame());
  const [roomId, setRoomId] = useState<string>("");
  const [playerSymbol, setPlayerSymbol] = useState<"X" | "O">("X");
  const [opponentName, setOpponentName] = useState("Opponent");
  const [remoteConnected, setRemoteConnected] = useState(false);
  const [isProcessingMove, setIsProcessingMove] = useState(false);
  const [showShuffleAnimation, setShowShuffleAnimation] = useState(false);
  const [showRoleSwapAnimation, setShowRoleSwapAnimation] = useState(false);
  const [aiSymbol, setAiSymbol] = useState<"O" | "X">("O");

  // Store cleanup functions for socket listeners
  const socketCleanupRef = useRef<(() => void) | null>(null);
  const socketIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isFirstPlayerRef = useRef<boolean>(false);
  
  // AI timer ref - prevents cleanup from clearing the timeout
  const aiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const aiIsThinkingRef = useRef<boolean>(false);

  // Initialize Socket.IO for online mode
  useEffect(() => {
    if (gameMode === "online") {
      initSocket().catch(console.error);
    }

    return () => {
      if (gameMode === "online") {
        // Clean up socket listeners
        if (socketCleanupRef.current) {
          socketCleanupRef.current();
          socketCleanupRef.current = null;
        }
        // Clear connection interval
        if (socketIntervalRef.current) {
          clearInterval(socketIntervalRef.current);
          socketIntervalRef.current = null;
        }
        leaveRoom();
      }
    };
  }, [gameMode]);

  // Handle mode selection
  const handleModeSelect = useCallback(
    (mode: GameMode, selectedRoomId?: string) => {
      if (mode === "online" && !selectedRoomId) {
        // Generate short 6-char room ID (e.g. A9X-2B4)
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // No I,1,O,0 to avoid confusion
        let code = "";
        for (let i = 0; i < 6; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        // Format as ABC-123
        selectedRoomId = `${code.slice(0, 3)}-${code.slice(3)}`;
      }

      setGameMode(mode);
      setGameState(initializeGame());
      setIsProcessingMove(false);

      if (mode === "online" && selectedRoomId) {
        setRoomId(selectedRoomId);
        // Reset first player flag - will be set by room-status
        isFirstPlayerRef.current = false;

        // Wait for socket to connect with timeout
        let connectionAttempts = 0;
        const maxAttempts = 50; // 5 seconds timeout

        socketIntervalRef.current = setInterval(() => {
          connectionAttempts++;

          if (connectionAttempts >= maxAttempts) {
            clearInterval(socketIntervalRef.current!);
            socketIntervalRef.current = null;
            console.error("[Socket] Connection timeout");
            return;
          }

          if (isConnected()) {
            clearInterval(socketIntervalRef.current!);
            socketIntervalRef.current = null;
            joinRoom(selectedRoomId!);

            // Set up remote move handler
            const unsubscribeMove = onRemoteMove((data) => {
              setGameState((prev) => {
                const updated = makeMove(
                  prev,
                  data.boardIndex,
                  data.cellIndex,
                  true // Suppress local shuffle in online mode, wait for server
                );
                if (updated) {
                  // Send updated state for shuffle detection
                  sendGameState(updated);
                }
                return updated || prev;
              });
            });

            // Set up remote reset handler
            const unsubscribeReset = onRemoteReset(() => {
              setGameState(initializeGame());
            });

            // Set up chaos swap handler (server-side shuffle)
            const unsubscribeChaosSwap = onChaosSwap((data) => {
              console.log("[Chaos Swap] Received from server:", data.shuffleMapping);
              setGameState((prev) => {
                return applyShuffleMapping(prev, data.shuffleMapping);
              });
            });

            // Set up role swap handler
            const unsubscribeRoleSwap = onRoleSwap(() => {
              console.log("[Role Swap] Triggered by server");
              setShowRoleSwapAnimation(true);

              // Swap current player's symbol
              setPlayerSymbol(prev => prev === "X" ? "O" : "X");

              // Swap opponent name
              setOpponentName(prev => prev === "Player X" ? "Player O" : "Player X");

              // Auto-dismiss after 2 seconds
              setTimeout(() => {
                setShowRoleSwapAnimation(false);
              }, 2000);
            });

            // Set up room status handler to determine player symbol
            const unsubscribeStatus = onRoomStatus((data) => {
              if (data.players === 1) {
                // First player in room is always X
                isFirstPlayerRef.current = true;
                setPlayerSymbol("X");
                setOpponentName("Waiting for opponent...");
                setRemoteConnected(false);
              } else if (data.players === 2) {
                // Second player is O, first player stays X
                if (isFirstPlayerRef.current) {
                  // We were first, stay as X
                  setPlayerSymbol("X");
                  setOpponentName("Player O");
                } else {
                  // We just joined as second player, we are O
                  setPlayerSymbol("O");
                  setOpponentName("Player X");
                }
                setRemoteConnected(true);
              }
            });

            // Store cleanup function
            socketCleanupRef.current = () => {
              unsubscribeMove();
              unsubscribeReset();
              unsubscribeChaosSwap();
              unsubscribeRoleSwap();
              unsubscribeStatus();
            };
          }
        }, 100);
      }
    },
    [] // No dependencies needed - uses refs for mutable values
  );

  // Handle cell click
  const handleCellClick = useCallback(
    (boardIndex: number, cellIndex: number) => {
      if (gameState.gameOver || isProcessingMove) return;

      // In online mode, only allow move if it's player's turn
      if (gameMode === "online" && gameState.currentPlayer !== playerSymbol) {
        return;
      }

      // In AI mode, only allow move if it's the player's turn (not AI's turn)
      if (gameMode === "ai" && gameState.currentPlayer === aiSymbol) {
        return;
      }

      const updated = makeMove(
        gameState,
        boardIndex,
        cellIndex,
        gameMode === "online" // Suppress local shuffle if online
      );
      if (updated) {
        setGameState(updated);
        setIsProcessingMove(false);

        // Send move to server if online
        if (gameMode === "online") {
          sendMove(boardIndex, cellIndex);
          // Send updated game state for shuffle detection
          sendGameState(updated);
        }
      }
    },
    [gameState, gameMode, playerSymbol, isProcessingMove, aiSymbol]
  );

  // Handle AI move - using refs to prevent effect cleanup from canceling the timer
  useEffect(() => {
    // Only run in AI mode, when game is active, and it's AI's turn
    if (gameMode !== "ai") return;
    if (gameState.gameOver) return;
    if (gameState.currentPlayer !== aiSymbol) return;
    
    // Don't start AI thinking during animations
    if (gameState.shuffleJustHappened || gameState.roleSwapJustHappened) return;
    
    // Prevent duplicate AI moves
    if (aiIsThinkingRef.current) return;
    
    aiIsThinkingRef.current = true;
    setIsProcessingMove(true);

    // Clear any existing timer
    if (aiTimerRef.current) {
      clearTimeout(aiTimerRef.current);
    }

    // Slower, more natural AI timing (800-1200ms)
    const delay = 800 + Math.random() * 400;
    
    aiTimerRef.current = setTimeout(() => {
      // Get fresh state and make the move
      setGameState((currentState) => {
        // Safety checks - don't move during animations or if game over
        if (currentState.gameOver || currentState.shuffleJustHappened || currentState.roleSwapJustHappened) {
          aiIsThinkingRef.current = false;
          setIsProcessingMove(false);
          return currentState;
        }

        // Calculate AI move
        const aiMove = getAIMove(currentState);

        if (aiMove) {
          const updated = makeMove(currentState, aiMove.boardIndex, aiMove.cellIndex);
          if (updated) {
            // Reset flags AFTER returning new state
            setTimeout(() => {
              aiIsThinkingRef.current = false;
              setIsProcessingMove(false);
            }, 0);
            return updated;
          }
        }
        
        // Reset on failure
        aiIsThinkingRef.current = false;
        setIsProcessingMove(false);
        return currentState;
      });
      
      aiTimerRef.current = null;
    }, delay);

    // No cleanup here - timer is managed via refs and cleared in restart/back-to-menu
  }, [gameState, gameMode, aiSymbol]);

  // Detect and handle instability shuffle
  useEffect(() => {
    if (gameState.shuffleJustHappened) {
      setShowShuffleAnimation(true);
      
      // Reset AI state during shuffle to prevent getting stuck
      if (gameMode === "ai") {
        if (aiTimerRef.current) {
          clearTimeout(aiTimerRef.current);
          aiTimerRef.current = null;
        }
        aiIsThinkingRef.current = false;
        setIsProcessingMove(false);
      }

      // Auto-dismiss after 2 seconds
      const timer = setTimeout(() => {
        setShowShuffleAnimation(false);
        setGameState(prev => clearAnimationFlags(prev));
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [gameState.shuffleJustHappened, gameMode]);

  // Handle local/AI role swap detection
  useEffect(() => {
    if (gameState.roleSwapJustHappened) {
      setShowRoleSwapAnimation(true);

      // If AI mode, swap symbols and reset AI thinking state
      if (gameMode === "ai") {
        // Clear any pending AI action first
        if (aiTimerRef.current) {
          clearTimeout(aiTimerRef.current);
          aiTimerRef.current = null;
        }
        aiIsThinkingRef.current = false;
        setIsProcessingMove(false);
        
        // Swap symbols
        setAiSymbol(prev => prev === "O" ? "X" : "O");
        setPlayerSymbol(prev => prev === "X" ? "O" : "X");
      }

      // Auto-dismiss after 2 seconds
      const timer = setTimeout(() => {
        setShowRoleSwapAnimation(false);
        setGameState(prev => clearAnimationFlags(prev));
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [gameState.roleSwapJustHappened, gameMode]);

  // Handle restart
  const handleRestart = useCallback(() => {
    // Clear AI timer and flags
    if (aiTimerRef.current) {
      clearTimeout(aiTimerRef.current);
      aiTimerRef.current = null;
    }
    aiIsThinkingRef.current = false;
    
    const newState = resetGame();
    setGameState(newState);
    setIsProcessingMove(false);

    // Reset symbols to default (User: X, AI: O) to prevent AI lockup after role swap
    if (gameMode === "ai") {
      setPlayerSymbol("X");
      setAiSymbol("O");
    }

    if (gameMode === "online") {
      sendReset();
    }
  }, [gameMode]);

  // Handle back to menu
  const handleBackToMenu = useCallback(() => {
    // Clear AI timer and flags
    if (aiTimerRef.current) {
      clearTimeout(aiTimerRef.current);
      aiTimerRef.current = null;
    }
    aiIsThinkingRef.current = false;
    
    if (gameMode === "online") {
      // Clean up socket listeners
      if (socketCleanupRef.current) {
        socketCleanupRef.current();
        socketCleanupRef.current = null;
      }
      // Clear connection interval
      if (socketIntervalRef.current) {
        clearInterval(socketIntervalRef.current);
        socketIntervalRef.current = null;
      }
      disconnectSocket();
    }
    setGameMode(null);
    setGameState(initializeGame());
    setRoomId("");
    setPlayerSymbol("X");
    setAiSymbol("O");
    setRemoteConnected(false);
    setIsProcessingMove(false);
    isFirstPlayerRef.current = false;
  }, [gameMode]);

  // Show mode selector if no mode selected
  if (gameMode === null) {
    return <ModeSelector onModeSelect={handleModeSelect} />;
  }

  // Check if player can make moves
  const isPlayerTurn =
    gameMode !== "online" ||
    gameState.currentPlayer === playerSymbol ||
    !remoteConnected;


  return (
    <main className="h-screen h-[100dvh] app-bg relative overflow-hidden flex flex-col">
      {/* Header - Centered */}
      <header className="shrink-0 flex justify-center pt-4 sm:pt-5 px-4">
        <div className="glass-card rounded-2xl px-5 py-3 sm:px-8 sm:py-4 flex items-center gap-4 sm:gap-6">
          {/* Back Button */}
          <Button
            onClick={handleBackToMenu}
            variant="secondary"
            size="sm"
            className="shrink-0 rounded-xl shadow-md border border-white/10 h-9 px-4 text-xs font-bold transition-all hover:scale-105 active:scale-95 hover:bg-secondary/90"
          >
            ← Menu
          </Button>

          {/* Title & Mode */}
          <div className="flex flex-col items-center gap-1">
            <h1 className="text-lg sm:text-2xl md:text-3xl font-bold gradient-text-title">
              Ultimate Tic Tac Toe
            </h1>
            <div className="flex items-center gap-2">
              <span
                className={`
                  inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs sm:text-sm font-medium
                  ${gameMode === "local"
                    ? "bg-[var(--player-x)]/20 text-[var(--player-x)]"
                    : gameMode === "ai"
                      ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                      : "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                  }
                `}
              >
                {gameMode === "local" ? "👥 Local Multiplayer" : gameMode === "ai" ? "🤖 VS Computer" : `🌐 Room: ${roomId}`}
              </span>

              {gameMode === "online" && (
                <span
                  className={`
                    inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs sm:text-sm
                    ${remoteConnected
                      ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                      : "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                    }
                  `}
                >
                  <span className={`w-2 h-2 rounded-full ${remoteConnected ? "bg-emerald-500" : "bg-amber-500 animate-pulse"}`} />
                  {remoteConnected ? "Connected" : "Waiting..."}
                </span>
              )}
            </div>
          </div>

          {/* Theme Toggle */}
          <ThemeToggle />
        </div>
      </header>

      {/* Game Board - Centered & Flexible */}
      <div className="flex-1 flex items-center justify-center p-3 sm:p-4 overflow-hidden">
        <GameBoard
          gameState={gameState}
          onCellClick={handleCellClick}
          gameMode={gameMode}
          isPlayerTurn={isPlayerTurn}
          opponentName={opponentName}
          showShuffleAnimation={showShuffleAnimation}
          showRoleSwapAnimation={showRoleSwapAnimation}
        />
      </div>

      {/* Controls - Bottom */}
      <footer className="shrink-0 flex justify-center pb-3 sm:pb-4 px-3">
        <Button
          onClick={handleRestart}
          className="px-6 sm:px-8 btn-shine bg-gradient-to-r from-primary to-accent hover:opacity-90 rounded-xl font-semibold text-sm sm:text-base"
        >
          {gameState.gameOver ? "🎮 Play Again" : "🔄 Restart"}
        </Button>
      </footer>
    </main>
  );
}


