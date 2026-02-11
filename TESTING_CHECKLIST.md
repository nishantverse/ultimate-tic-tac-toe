# Testing Checklist - Ultimate Tic Tac Toe

Complete this checklist to verify the game is working correctly.

## Setup & Startup

- [ ] Run `npm install` successfully
- [ ] Run `npm run dev` - frontend starts on localhost:3000
- [ ] Run `npm run dev:server` - Socket.IO server starts on localhost:3001
- [ ] Navigate to localhost:3000 - mode selection screen appears
- [ ] Page title shows "Ultimate Tic Tac Toe"
- [ ] No console errors on page load

## Home Screen

- [ ] Home screen displays title "Ultimate Tic Tac Toe"
- [ ] All 3 game mode buttons visible: Local, AI, Online
- [ ] "How to Play" section visible with game rules
- [ ] UI is responsive (looks good on mobile)

## Local Multiplayer Mode

### Mode Selection
- [ ] Click "Local Multiplayer" - game starts
- [ ] Header shows "Local Multiplayer"
- [ ] "Back to Menu" button visible
- [ ] Current player shows "X" (blue)

### First Move
- [ ] Can click any cell in any board (no forced board on first move)
- [ ] Clicked cell shows "X"
- [ ] Current player switches to "O" (red)
- [ ] Forced board is highlighted (blue border)

### Subsequent Moves
- [ ] "O" can only play in forced board (or anywhere if full)
- [ ] Illegal boards are dimmed (can't click)
- [ ] Move alternates between X and O
- [ ] Correct player displayed in header

### Winning a Small Board
- [ ] When player gets 3 in a row on small board:
  - [ ] Board shows "X" or "O" status
  - [ ] Board status box displays correctly
  - [ ] Can't play more moves in that board
  - [ ] Board is highlighted with player color

### Winning the Game
- [ ] Play until player gets 3 boards in a row
- [ ] Winner message displays: "Player X Wins! 🎉"
- [ ] Game Over state reached
- [ ] "Play Again" button appears

### Draw Scenario
- [ ] Play to fill the board without 3 in a row
- [ ] "Game Draw!" message appears
- [ ] "Play Again" button shows

### Controls
- [ ] "Restart Game" button resets during game
- [ ] "Play Again" button works after game ends
- [ ] "Back to Menu" button returns to mode selector
- [ ] Game state clears properly

## VS Computer Mode

### Mode Selection & Startup
- [ ] Click "VS Computer" - game starts
- [ ] Header shows "VS Computer"
- [ ] Player is "X" (blue), AI is "O" (red)
- [ ] Game starts with X's turn

### Player Turn (X)
- [ ] Can play anywhere on first move
- [ ] Board highlights forced board
- [ ] Can only play in forced board or anywhere if full
- [ ] Player move displays immediately

### AI Turn (O)
- [ ] "AI is thinking..." appears briefly
- [ ] AI move appears after 100-300ms delay
- [ ] AI move is valid (in forced board or anywhere if full)
- [ ] Turn switches back to player

### AI Strategy Test
- [ ] AI wins if possible (test by playing weak moves)
- [ ] AI blocks player wins
- [ ] AI takes center when available
- [ ] AI plays reasonable moves overall

### Game End
- [ ] When AI wins: "Player O Wins!" message
- [ ] When player wins: "Player X Wins!" message
- [ ] Draw message if board fills without winner

### Controls
- [ ] "Restart Game" works during game
- [ ] "Back to Menu" works
- [ ] "Play Again" works after game ends

## Online Multiplayer Mode

### Room Creation
- [ ] Click "Online" button
- [ ] Room ID input appears
- [ ] Leave empty and click "Join/Create" - creates new room
- [ ] Room ID displayed in header
- [ ] "Waiting for opponent..." message shows

### Room Joining
- [ ] Open two browser tabs/windows
- [ ] First tab: Join/Create room → gets room ID
- [ ] Second tab: Enter same room ID → joins room
- [ ] Both show "Player X" and "Player O"
- [ ] "Your turn" / "Waiting for..." messages display correctly

### Move Synchronization
- [ ] Player 1 makes move in first tab
- [ ] Move appears in second tab immediately
- [ ] Second tab shows "Your turn"
- [ ] Player 2 makes move
- [ ] Move appears in first tab
- [ ] Correct player symbol (X/O) displayed everywhere

### Forced Board Sync
- [ ] Both players see same forced board highlighting
- [ ] Both players see same illegal board dimming
- [ ] Forced board updates correctly after each move

### Win Condition
- [ ] Play game to completion
- [ ] Winner shows on both tabs
- [ ] Game syncs to end state on both sides

### Disconnect & Reconnect
- [ ] Close one player's browser
- [ ] Room shows "players: 1" for other player
- [ ] Reconnect - rejoin with same room ID
- [ ] Game state resumes

### Reset
- [ ] During game, click "Restart Game"
- [ ] Other player's board resets too
- [ ] Both start from fresh game

## Forced Board Logic

### First Move Sets Next Board
- [ ] Play cell 0 (top-left) → next forced board is 0
- [ ] Play cell 4 (center) → next forced board is 4
- [ ] Play cell 8 (bottom-right) → next forced board is 8

### Forced Board Highlight
- [ ] Forced board has blue border + glow
- [ ] All other playable boards are dimmed

### Full Board Override
- [ ] Play in board that's full/won
- [ ] Can now play in any available board
- [ ] UI updates forced board correctly

### Illegal Move Prevention
- [ ] Trying to click illegal board - nothing happens
- [ ] Illegal boards show visual dimming
- [ ] Can only play in allowed boards

## Visual Design

### Colors & Contrast
- [ ] X cells are blue (#2563eb or similar)
- [ ] O cells are red (#dc2626 or similar)
- [ ] Forced board has accent color border
- [ ] All text is readable
- [ ] Good dark mode support

### Responsiveness
- [ ] Game board scales on mobile
- [ ] Cells remain clickable on touch
- [ ] Layout stacks properly on small screens
- [ ] No horizontal scroll on any device

### Animations & Transitions
- [ ] Buttons have hover effects
- [ ] Smooth transitions between moves
- [ ] No lag or stutter
- [ ] Loading states (AI thinking) visible

## Game Rules Enforcement

### Move Validation
- [ ] Can't play in occupied cell
- [ ] Can't play in won/full board (unless forced board)
- [ ] Can't play outside forced board (unless forced board is full/won)
- [ ] Can't play after game ends

### Winning Patterns (Horizontal)
- [ ] Winning: 0,1,2 / 3,4,5 / 6,7,8 boards
- [ ] Winning: 0,3,6 / 1,4,7 / 2,5,8 boards
- [ ] Winning: 0,4,8 / 2,4,6 boards

### Draw Detection
- [ ] Game is draw when:
  - [ ] All 9 boards are full
  - [ ] No player has 3 in a row
  - [ ] "Game Draw!" message shown

## Accessibility

### Keyboard Navigation
- [ ] Can tab through buttons
- [ ] Enter/Space activates buttons
- [ ] Reasonable tab order

### Screen Reader (if testing)
- [ ] Page title readable
- [ ] Game status announced
- [ ] Button labels clear

### Mouse/Touch
- [ ] All clickable elements work with mouse
- [ ] All work with touch on mobile
- [ ] Hover states visible

## Browser Compatibility

Test on:
- [ ] Chrome/Chromium latest
- [ ] Firefox latest
- [ ] Safari latest (if available)
- [ ] Mobile Chrome
- [ ] Mobile Safari (if available)

For each:
- [ ] Game loads without errors
- [ ] All features work
- [ ] Responsive layout works
- [ ] Touch controls work (mobile)

## Performance

- [ ] Game responds instantly to clicks
- [ ] No lag when processing moves
- [ ] AI moves within 100-300ms
- [ ] Online moves sync quickly (< 1 second)
- [ ] No memory leaks on multiple games
- [ ] CPU usage reasonable

## Console

- [ ] No error messages in console
- [ ] No warning messages (except expected)
- [ ] Socket.IO debug messages appear (if debugging)
- [ ] Clean shutdown when leaving page

## Deployment Testing

### Local Build
- [ ] Run `npm run build` - completes successfully
- [ ] Run `npm run start` - production server starts
- [ ] All features work in production build

### Environment Variables
- [ ] `NEXT_PUBLIC_SOCKET_URL` works when set
- [ ] Server defaults to same origin when not set
- [ ] Frontend works without Socket.IO server (local/AI modes)

## Final Verification

- [ ] All game modes work (Local, AI, Online)
- [ ] All moves validate correctly
- [ ] Game rules enforced properly
- [ ] UI is beautiful and responsive
- [ ] No console errors
- [ ] Ready for production deployment

## Performance Baseline

Record these metrics:
- [ ] Initial page load time: ___ ms
- [ ] AI move decision time: ___ ms
- [ ] Online move sync time: ___ ms
- [ ] Memory usage: ___ MB
- [ ] CPU usage peak: ___ %

## Known Limitations

- [ ] AI doesn't use minimax (intentional)
- [ ] No authentication for online mode
- [ ] No game history/logging
- [ ] No chat between players
- [ ] No sound effects
- [ ] No undo/redo moves

## Sign-Off

- [ ] All tests passed ✓
- [ ] Ready for production ✓
- [ ] Game is fun to play ✓
- [ ] Documentation is complete ✓

---

**Checklist completed by:** _________________  
**Date:** _________________  
**Notes:**
