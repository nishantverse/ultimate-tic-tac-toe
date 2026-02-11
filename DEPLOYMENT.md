# Deployment Guide - Ultimate Tic Tac Toe

This guide covers deploying the frontend and Socket.IO server to production.

## Quick Start

### Deploy Frontend to Vercel

1. Push code to GitHub
2. Connect repository to Vercel
3. Deploy automatically on push
4. Set `NEXT_PUBLIC_SOCKET_URL` environment variable if using a separate Socket.IO server

### Deploy Socket.IO Server

Choose one method below:

## Option 1: Vercel (Recommended for Vercel users)

Create `/api/socket.ts` for serverless Socket.IO:

```typescript
import { Server } from "socket.io";
import type { NextApiRequest, NextApiResponse } from "next";

let io: Server;

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (res.socket.server.io) {
    res.end();
    return;
  }

  const io = new Server(res.socket.server, {
    cors: {
      origin: process.env.NEXT_PUBLIC_SITE_URL || "*",
      methods: ["GET", "POST"],
    },
  });

  const rooms = new Map();

  io.on("connection", (socket) => {
    socket.on("join", ({ roomId }) => {
      socket.leaveAll();
      socket.join(roomId);

      if (!rooms.has(roomId)) {
        rooms.set(roomId, { players: [] });
      }

      const room = rooms.get(roomId);
      room.players.push(socket.id);

      io.to(roomId).emit("room-status", {
        players: room.players.length,
        gameStarted: room.players.length >= 2,
      });

      socket.on("disconnect", () => {
        const room = rooms.get(roomId);
        if (room) {
          room.players = room.players.filter((id) => id !== socket.id);
          if (room.players.length === 0) {
            rooms.delete(roomId);
          } else {
            io.to(roomId).emit("room-status", {
              players: room.players.length,
              gameStarted: false,
            });
          }
        }
      });

      socket.on("move", ({ boardIndex, cellIndex }) => {
        socket.to(roomId).emit("move", { boardIndex, cellIndex });
      });

      socket.on("reset", () => {
        socket.to(roomId).emit("reset");
      });

      socket.on("leave", () => {
        socket.leave(roomId);
        const room = rooms.get(roomId);
        if (room) {
          room.players = room.players.filter((id) => id !== socket.id);
          if (room.players.length === 0) {
            rooms.delete(roomId);
          }
        }
      });
    });
  });

  res.socket.server.io = io;
  res.end();
}
```

Then in your environment variables:

```bash
NEXT_PUBLIC_SOCKET_URL=/api/socket
```

## Option 2: Railway

Railway provides an easy way to deploy Node.js applications.

1. Create account at [railway.app](https://railway.app)
2. Connect GitHub repository
3. Create new service from `/server/index.js`
4. Set environment variables:
   ```bash
   PORT=3001
   ```
5. Railway generates a public URL automatically
6. Set `NEXT_PUBLIC_SOCKET_URL` in your frontend to the Railway URL

## Option 3: Render

Render provides free and paid Node.js hosting.

1. Create account at [render.com](https://render.com)
2. Create new Web Service
3. Connect GitHub repository
4. Configure:
   - **Start Command**: `node server/index.js`
   - **Environment**: Node
   - **Region**: Choose closest to your users
5. Set environment variables:
   ```bash
   PORT=3001
   ```
6. Deploy
7. Set `NEXT_PUBLIC_SOCKET_URL` in your frontend to the Render URL

## Option 4: DigitalOcean App Platform

1. Create account at [digitalocean.com](https://digitalocean.com)
2. Click "Create" → "App"
3. Connect GitHub repository
4. Configure build and run commands:
   - **Build**: `npm install`
   - **Run**: `node server/index.js`
5. Set environment variables:
   ```bash
   PORT=8080
   ```
6. Deploy
7. DigitalOcean provides a public URL
8. Set `NEXT_PUBLIC_SOCKET_URL` in your frontend

## Option 5: Heroku

Heroku has limited free tier now, but here's how to deploy:

1. Install Heroku CLI: `brew install heroku` (macOS) or download from heroku.com
2. Login: `heroku login`
3. Create app: `heroku create your-app-name`
4. Deploy: `git push heroku main`
5. Heroku generates a URL automatically
6. Set `NEXT_PUBLIC_SOCKET_URL` in your frontend

## Option 6: Self-hosted (AWS EC2, DigitalOcean Droplet, etc.)

1. Create a Linux server (Ubuntu 22.04 recommended)
2. SSH into server
3. Install Node.js 18+:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```
4. Clone repository:
   ```bash
   git clone <your-repo> tic-tac-toe
   cd tic-tac-toe
   ```
5. Install dependencies:
   ```bash
   npm install
   ```
6. Install PM2 for process management:
   ```bash
   sudo npm install -g pm2
   ```
7. Start server:
   ```bash
   pm2 start server/index.js --name "tic-tac-toe-server"
   pm2 startup
   pm2 save
   ```
8. Install Nginx for reverse proxy:
   ```bash
   sudo apt-get install -y nginx
   ```
9. Configure Nginx at `/etc/nginx/sites-available/default`:
   ```nginx
   server {
     listen 80;
     server_name your-domain.com;

     location / {
       proxy_pass http://localhost:3001;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection "upgrade";
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
     }
   }
   ```
10. Restart Nginx:
    ```bash
    sudo systemctl restart nginx
    ```
11. Install SSL (Let's Encrypt):
    ```bash
    sudo apt-get install -y certbot python3-certbot-nginx
    sudo certbot --nginx -d your-domain.com
    ```
12. Set `NEXT_PUBLIC_SOCKET_URL=https://your-domain.com` in frontend

## Environment Variables

### Frontend (.env.local or Vercel settings)

```bash
NEXT_PUBLIC_SOCKET_URL=https://your-socket-server.com
```

If not set, defaults to same origin (for serverless deployment).

### Backend (server/index.js)

```bash
PORT=3001
```

## Testing Socket.IO Connection

1. Open browser console on your app
2. Check for "Socket.IO server listening on port 3001" message
3. Look for "[Socket] Connected" message in console
4. Try joining an online game - should show "players: 1" in room status

## Troubleshooting

### WebSocket Connection Failed

1. Check firewall allows port 3001 (or your custom port)
2. Verify `NEXT_PUBLIC_SOCKET_URL` environment variable is set correctly
3. Check browser console for specific error message
4. Ensure both frontend and backend are running on production

### Players Can't Connect

1. Verify room ID is entered correctly
2. Check both players are using same `NEXT_PUBLIC_SOCKET_URL`
3. Look at server logs for connection errors
4. Try refreshing page to reconnect

### Server Port Already in Use

If port 3001 is in use:

```bash
lsof -i :3001  # Find process using port
kill -9 <PID>  # Kill process
```

Or use different port:
```bash
PORT=3002 node server/index.js
```

## Monitoring

Use PM2 for monitoring:

```bash
pm2 monit         # Real-time monitoring
pm2 logs          # View logs
pm2 restart all   # Restart servers
pm2 stop all      # Stop servers
```

## Performance Tips

1. **Enable compression** in Socket.IO: Already enabled in `server/index.js`
2. **Use CDN for assets** via Vercel
3. **Monitor server resources** - Socket.IO is lightweight
4. **Use WebSocket over HTTP polling** - Configured in client and server
5. **Add logging for debugging** but remove in production

## Security

1. **CORS is open** (`origin: "*"`) - Consider restricting to your domain in production
2. **No authentication** - Add if hosting sensitive games
3. **No encryption** - Use HTTPS/WSS for production
4. **No rate limiting** - Add if concerned about abuse

For production, update `/server/index.js` CORS:

```javascript
cors: {
  origin: process.env.ALLOWED_ORIGINS?.split(",") || "https://your-domain.com",
  methods: ["GET", "POST"],
},
```

Then set:
```bash
ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com
```

## Next Steps

1. Deploy frontend to Vercel
2. Deploy Socket.IO server to Railway/Render/Heroku
3. Set `NEXT_PUBLIC_SOCKET_URL` environment variable
4. Test online multiplayer
5. Share game link with friends!
