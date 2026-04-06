# PolyLend Backend

Backend services for the PolyLend peer-to-peer lending protocol.

## Services

### API (`src/api.ts`)

Express server (port 3001) that provides:

- `/positions` - Proxies user position data from Polymarket API
- `/loans` - Returns loan data from MongoDB
- `/offers` - Returns offer data from MongoDB
- `/events` - Returns market event data from MongoDB

Includes an in-memory cache (5 min TTL) for external API responses.

### Listener (`src/listener.ts`)

Blockchain event listener that:

- Watches PolyLend contract events on-chain via WebSocket
- Extracts loan/offer IDs from events
- Fetches full data from chain and stores in MongoDB
- Runs continuously with automatic reconnection

## Tech Stack

- Express 5, TypeScript
- MongoDB (via native driver)
- viem for blockchain interaction
- pino for logging

## Project Structure

```
src/
  api.ts          # Express API server
  listener.ts     # Blockchain event listener
  config.ts       # Contract addresses and RPC configuration
  blockchain/     # Chain data fetching and log extraction
  contracts/      # Contract ABIs
  types/          # TypeScript types
  utils/          # Logger, MongoDB client, blockchain client
```

## Development

```bash
npm install
npm run api           # Start API server
npm run listener      # Start blockchain listener
npm run build         # Compile TypeScript
npm run test          # Run tests
npm run lint:check    # Lint
npm run format:check  # Check formatting
```

## Environment Variables

| Variable    | Description                  |
|-------------|------------------------------|
| `MONGO_URL` | MongoDB connection string    |
| `RPC_URL`   | Polygon RPC endpoint         |
| `WS_URL`    | Polygon WebSocket endpoint   |

## Deployment

Runs as two separate Docker containers (`api` and `listener`) sharing a MongoDB instance. See the `infra/` repo for docker-compose configuration.
