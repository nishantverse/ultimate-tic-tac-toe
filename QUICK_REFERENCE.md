# Quick Reference - Ultimate Tic Tac Toe

## One Minute Setup

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` and play!

## Game Controls

| Action | How |
|--------|-----|
| **Play Move** | Click any empty cell in forced/available board |
| **Restart Game** | Click "Restart Game" button |
| **Back to Menu** | Click "Back to Menu" button |
| **Select Mode** | Click mode button on home screen |

## Game Modes

| Mode | How to Use | Server Needed |
|------|-----------|--------------|
| **Local Multiplayer** | 2 players, 1 device | No |
| **VS Computer** | Play vs AI (you're X) | No |
| **Online** | Enter room ID, play with friend | Yes |

## Online Setup

### For First Player (Room Creator)

1. Click "Online" on home screen
2. Leave room ID empty or enter custom name
3. Click "Join/Create"
4. Share room ID with friend

### For Second Player (Room Joiner)

1. Click "Online" on home screen
2. Enter the room ID your friend gave you
3. Click "Join/Create"
4. Wait for first player to join

## Game Rules (Quick)

1. 🎮 Play on 9 boards, win 3 in a row to win
2. 📌 Your move's **cell position** (0-8) sets opponent's forced board
3. 🔓 If forced board is full, play anywhere
4. ✅ Win small boards to mark positions on big board
5. 🏆 First to 3-in-a-row on big board wins!

## Board Positions

```
0 | 1 | 2
---------
3 | 4 | 5
---------
6 | 7 | 8
```

## Common Mistakes

❌ **Trying to play outside forced board**
- The forced board is highlighted with a blue border
- You can only play in the forced board (or anywhere if it's full)

❌ **Playing in a board that's already won**
- Won boards are dimmed and locked
- Play in another available board

❌ **Not understanding forced board**
- If you play in cell 2, opponent MUST play in board 2
- This creates strategy - try to force opponent into bad positions!

## Keyboard Shortcuts

None yet - use mouse/touch to play.

## What the UI Shows

| Element | Meaning |
|---------|---------|
| **Blue Border + Glow** | Your forced board (must play here) |
| **Dimmed Board** | Illegal to play here (not forced + forced board available) |
| **Red/Blue Cell** | Player O/X has played here |
| **Gray Status Box** | Small board is won or drawn |
| **"Your turn" Text** | In online mode, it's your turn to play |
| **"AI is thinking..."** | In AI mode, computer is choosing its move |

## AI Strategy (What to Expect)

The AI opponent:
1. 🎯 Tries to win the forced board first
2. 🛡️ Blocks you from winning
3. ⭐ Takes center (position 4) if available
4. 🎲 Plays random otherwise
5. ⏱️ Takes 100-300ms to decide (feels natural)

## Winning

You win by getting **3 of your boards in a row** on the big 3x3 grid.

This means:
- ✓ 3 across (horizontally)
- ✓ 3 down (vertically)  
- ✓ 3 diagonal (either direction)

Same as regular tic-tac-toe but on a 3x3 of boards!

## Troubleshooting

| Problem | Solution |
|---------|----------|
| **Can't click cells** | Make sure you're playing in forced board (blue border) or forced board is full |
| **AI takes too long** | Normal! AI includes intentional delay (100-300ms) |
| **Online not working** | Make sure Socket.IO server is running (`npm run dev:server`) |
| **Can't find friend's room** | Double-check room ID spelling and case |
| **Page won't load** | Clear browser cache, try incognito mode |

## Performance

- ✅ Works on all browsers
- ✅ Mobile friendly
- ✅ No lag or stuttering
- ✅ Fast move processing
- ✅ Real-time online sync

## Advanced Tips

1. **Force opponent into bad positions** - Pay attention to cell indices you're using
2. **Control the center board** - Board 4 (center) is powerful
3. **Watch forced boards** - Plan your moves to send opponent where you want
4. **Block opponent wins** - Prevent them from capturing winning patterns
5. **Create win opportunities** - Set up multiple ways to win

## Files to Know

- `app/page.tsx` - Main game screen
- `components/GameBoard.tsx` - Game display logic
- `lib/gameLogic.ts` - Game rules engine
- `lib/socket.ts` - Online multiplayer sync
- `server/index.js` - Socket.IO server

## For Developers

```typescript
// Initialize game
let gameState = initializeGame();

// Make a move
gameState = makeMove(gameState, boardIndex, cellIndex);

// Get AI move
const aiMove = getAIMove(gameState);

// Check legal moves
const moves = getLegalMoves(gameState);

// Check if game is over
if (gameState.gameOver) {
  console.log(gameState.winner ? `${gameState.winner} wins!` : "Draw!");
}
```

See `docs/API.md` for full documentation.

## Deployment Checklist

- [ ] Frontend deployed to Vercel
- [ ] Socket.IO server deployed (Railway/Render)
- [ ] `NEXT_PUBLIC_SOCKET_URL` set in frontend
- [ ] Tested online multiplayer
- [ ] Tested all 3 game modes
- [ ] Shared game link with friends

## Next Steps

1. 🎮 **Play** - Try all 3 game modes
2. 🌐 **Deploy** - Set up online multiplayer
3. 👥 **Share** - Play with friends
4. 🎨 **Customize** - Modify colors/styles in globals.css
5. 🚀 **Extend** - Add new features as needed

## Fun Facts

- 💯 Game logic is 100% client-side
- ⚡ Runs completely offline (local/AI modes)
- 🔌 WebSocket fallback for connectivity
- 🎯 AI uses simple strategy (no minimax)
- 📱 Works on mobile devices
- 🎨 Beautiful responsive design

---

**Ready to play? Start with `npm run dev` and visit localhost:3000!**
