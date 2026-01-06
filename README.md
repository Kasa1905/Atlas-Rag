# Atlas RAG

A modern document RAG (Retrieval-Augmented Generation) application with local embeddings using Ollama and nomic-embed-text.

## Architecture

This is a pnpm workspace monorepo containing:

- **Frontend**: React + TypeScript + Vite with Tailwind CSS and shadcn/ui
- **Backend**: Node.js + TypeScript + Express API server
- **Database**: SQLite with better-sqlite3
- **Shared**: Common types and utilities

## Project Structure

```
atlas-rag/
├── apps/
│   ├── frontend/          # React application
│   └── backend/           # Express API server
├── packages/
│   ├── shared/            # Shared types and utilities
│   └── database/          # SQLite schema and queries
├── pnpm-workspace.yaml
└── package.json
```

## Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Ollama (for embeddings and LLM)

## Getting Started

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```

3. **Initialize database:**
   ```bash
   pnpm db:init
   ```

4. **Start development servers:**
   ```bash
   pnpm dev
   ```

   This will start:
   - Frontend at http://localhost:5173
   - Backend at http://localhost:3001

## Development

### Available Scripts

- `pnpm dev` - Start frontend and backend in development mode
- `pnpm build` - Build all packages for production
- `pnpm lint` - Run linting across all packages
- `pnpm type-check` - Run TypeScript type checking

### Package-Specific Commands

- Frontend: `pnpm --filter frontend dev`
- Backend: `pnpm --filter backend dev`
- Database: `pnpm --filter @atlas/database init`

## Tech Stack

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- Zustand (state management)
- React Router

### Backend
- Node.js
- TypeScript
- Express
- better-sqlite3

### Database
- SQLite
- Normalized schema with foreign keys
- Indexed for performance

## Features

- 📁 Project management
- 📄 Document upload and processing
- 🔍 Document chunking with overlap
- 🧮 Local embeddings via Ollama (nomic-embed-text)
- 💬 RAG-powered chat with source citations
- 🔗 Source chunk references in responses

## License

See [LICENSE](LICENSE) file for details.
