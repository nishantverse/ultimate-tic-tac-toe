# Ultimate Tic Tac Toe

Ultimate Tic Tac Toe with local, AI, and online multiplayer modes.

## Production Setup

This app is split into two services in production:

1. The Next.js frontend.
2. The Socket.IO backend in `server/index.js`.

### Required environment variables

Frontend:

- `NEXT_PUBLIC_SOCKET_URL` - public URL of the Socket.IO server, for example `https://your-socket-service.onrender.com`

Backend:

- `PORT` - provided by Render automatically.
- `SOCKET_CORS_ORIGIN` - comma-separated list of allowed frontend origins, for example `https://your-frontend.onrender.com`.

### Render deployment

The included [render.yaml](render.yaml) blueprint defines both services. After you create the services, set `NEXT_PUBLIC_SOCKET_URL` on the frontend service to the backend's public URL, then set `SOCKET_CORS_ORIGIN` on the backend to the frontend URL.

### Local development

Run the frontend and socket server separately:

```bash
npm install
npm run dev
npm run dev:server
```

For local online multiplayer without extra config, the client falls back to `http://localhost:3001` in development.

