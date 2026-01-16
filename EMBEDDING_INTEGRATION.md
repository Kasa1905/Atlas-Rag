# Embedding and Vector Search Integration Guide

## Overview

This document describes the newly integrated embedding generation and vector search capabilities in Atlas RAG. The system now automatically generates embeddings for document chunks using Ollama's `nomic-embed-text` model and maintains a fast approximate nearest neighbor search index using HNSW (Hierarchical Navigable Small World).

## Architecture

### Components

1. **Ollama Service** (`ollamaService.ts`)
   - Wrapper around the official Ollama JavaScript client
   - Handles embedding generation with retry logic
   - Validates embeddings and manages Ollama health

2. **Vector Store Service** (`vectorStoreService.ts`)
   - Manages HNSW indexes per project
   - Handles adding/searching embeddings
   - Persists indexes to disk for recovery

3. **Embedding Service** (`embeddingService.ts`)
   - Orchestrates the embedding generation workflow
   - Processes chunks in batches
   - Tracks progress and updates document metadata
   - Integrates with the ingestion pipeline

4. **Progress Tracker** (`progressTracker.ts`)
   - Tracks long-running embedding jobs
   - Provides real-time progress updates
   - Automatically cleans up after completion

### Flow Diagram

```
Document Upload
    ↓
Parse & Chunk (Ingestion Service)
    ↓
Store Chunks in Database
    ↓
Trigger Embedding Generation (Async)
    ├→ Get unembedded chunks
    ├→ Batch generate embeddings (Ollama)
    ├→ Store embeddings in Database
    ├→ Add to Vector Index (HNSW)
    ├→ Save Index to Disk
    └→ Update Document Metadata
```

## Prerequisites

### System Requirements

- Ollama service running locally or accessible via network
- `nomic-embed-text` model pulled in Ollama
- 768-dimensional vector support (for HNSW index)

### Installation

1. **Install Ollama**
   ```bash
   # macOS: brew install ollama
   # Linux: curl https://ollama.ai/install.sh | sh
   # Windows: Download from https://ollama.ai
   ```

2. **Pull the Embedding Model**
   ```bash
   ollama pull nomic-embed-text
   ```

3. **Start Ollama Service**
   ```bash
   ollama serve
   # Runs on http://localhost:11434 by default
   ```

4. **Install Backend Dependencies**
   ```bash
   pnpm install
   ```

## Configuration

### Environment Variables

Add to `.env` or `.env.local`:

```env
# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434
EMBEDDING_MODEL=nomic-embed-text
EMBEDDING_DIMENSION=768
VECTOR_INDEX_PATH=./data/vector_index
```

### Application Startup

The backend automatically:
1. Initializes Ollama client on startup
2. Checks Ollama health and model availability
3. Creates vector index directories
4. Loads existing project indexes from disk

If Ollama is unavailable, the system logs a warning but continues operating. Document ingestion succeeds without embeddings, allowing manual triggering later.

## API Endpoints

### Embedding Management

**Generate Embeddings for Document**
```http
POST /api/embeddings/generate/:documentId
```

Manually trigger embedding generation for a specific document.

Response:
```json
{
  "success": true,
  "data": {
    "documentId": "doc-123",
    "message": "Embedding generation started"
  }
}
```

**Get Embedding Progress**
```http
GET /api/embeddings/status/:documentId
```

Get current progress of embedding generation.

Response:
```json
{
  "success": true,
  "data": {
    "documentId": "doc-123",
    "inProgress": true,
    "progress": {
      "total": 50,
      "completed": 25,
      "failed": 0,
      "status": "processing"
    },
    "percentage": 50,
    "embeddedCount": 25
  }
}
```

**Rebuild Project Vector Index**
```http
POST /api/embeddings/rebuild/:projectId
```

Rebuild the entire vector index for a project from existing embeddings.

Response:
```json
{
  "success": true,
  "data": {
    "projectId": "proj-123",
    "message": "Vector index rebuild started"
  }
}
```

**Get Embedding Statistics**
```http
GET /api/embeddings/stats/:projectId
```

Get embedding statistics for a project.

Response:
```json
{
  "success": true,
  "data": {
    "projectId": "proj-123",
    "totalChunks": 150,
    "embeddedChunks": 150,
    "pendingChunks": 0,
    "documentsWithPendingEmbeddings": 0,
    "indexSize": 150,
    "lastUpdated": 1705339200000
  }
}
```

## Database Schema

### New Embeddings Table

```sql
CREATE TABLE embeddings (
  id TEXT PRIMARY KEY,
  chunk_id TEXT NOT NULL UNIQUE,
  embedding BLOB NOT NULL, -- Float32Array serialized as binary
  model TEXT NOT NULL,     -- e.g., "nomic-embed-text"
  dimension INTEGER NOT NULL, -- 768
  created_at INTEGER NOT NULL,
  FOREIGN KEY (chunk_id) REFERENCES chunks(id) ON DELETE CASCADE
);

CREATE INDEX idx_embeddings_chunk_id ON embeddings(chunk_id);
```

### New Embedding-Related Queries

```typescript
// Get chunks without embeddings
getChunksWithoutEmbeddings(documentId: string): Chunk[]
getChunksWithoutEmbeddingsByProject(projectId: string): Chunk[]

// Count embeddings
countEmbeddingsByDocument(documentId: string): number
countEmbeddingsByProject(projectId: string): number

// Retrieve embeddings
getAllEmbeddingsByProject(projectId: string): Array<{chunkId, embedding}>
getEmbeddingByChunk(chunkId: string): Embedding | null

// Cleanup
deleteEmbeddingsByDocument(documentId: string): boolean
```

## Vector Store Format

### Directory Structure

```
data/vector_index/
├── project-{projectId}.hnsw      # HNSW index binary
└── project-{projectId}.mapping.json  # ChunkId → ElementId mapping
```

### Index Parameters

- **Space**: Cosine similarity
- **M**: 16 (number of connections per element)
- **efConstruction**: 200 (construction parameter)
- **Dimension**: 768 (from nomic-embed-text)

### Performance Characteristics

- Index construction: O(n log n)
- Search: O(log n) in practice
- Memory: ~50-100 bytes per element (for M=16)

## Automatic Workflow

### During Document Ingestion

1. Document is uploaded and parsed
2. Chunks are created and stored in database
3. Embedding generation is triggered asynchronously
4. System logs indicate progress

### Embedding Generation Process

1. Fetch unembedded chunks for document
2. Initialize progress tracking
3. Process chunks in batches of 15
4. For each batch:
   - Generate embeddings via Ollama (768-dim vectors)
   - Store in database (serialized as BLOB)
   - Add to vector store (HNSW index)
   - Update progress
5. Save vector index to disk
6. Update document metadata

### Error Handling

- **Ollama Unavailable**: Logs warning, continues without embeddings
- **Batch Failures**: Retries individual chunks up to 3 times
- **Partial Failures**: Continues processing, marks failed chunks
- **Index Save Failures**: Logs error but doesn't fail embedding generation

## Performance Considerations

### Batch Size

Default: 15 chunks per batch
- Adjust based on available RAM
- Larger batches = faster throughput but higher memory
- Smaller batches = slower but safer for low-memory systems

### Throughput

Expected rates (varies by system):
- ~2-5 chunks/second with Ollama CPU
- ~10-20 chunks/second with GPU acceleration

### Storage

Vector index size:
- ~100 bytes per vector with M=16
- 150 chunks = ~15 KB index file
- 10,000 chunks = ~1 MB index file

## Monitoring

### Logs to Watch

```
✓ Ollama service healthy: Ollama service is healthy
✓ Vector store initialized
✓ Started embedding generation for document
Embedding progress: 50% (25/50)
✓ Completed embedding generation for document
```

### Progress Tracking

Track embedding progress via API:
```javascript
// Poll embedding status
const status = await fetch('/api/embeddings/status/{documentId}');
const { data } = await status.json();
console.log(`Progress: ${data.percentage}%`);
console.log(`Completed: ${data.progress.completed}/${data.progress.total}`);
```

## Testing

### Manual Testing

1. Start Ollama:
   ```bash
   ollama serve
   ```

2. Start backend:
   ```bash
   pnpm --filter backend dev
   ```

3. Upload a document via frontend

4. Check embedding progress:
   ```bash
   curl http://localhost:3001/api/embeddings/status/{documentId}
   ```

5. Verify embeddings in database:
   ```sql
   SELECT COUNT(*) FROM embeddings;
   SELECT COUNT(*) FROM embeddings WHERE chunk_id IN (
     SELECT id FROM chunks WHERE document_id = '{documentId}'
   );
   ```

6. Check vector index file:
   ```bash
   ls -lah data/vector_index/
   ```

### Integration Testing

```typescript
// In your test file
describe('Embedding Integration', () => {
  it('should generate embeddings for uploaded document', async () => {
    // Upload document
    const doc = await uploadDocument(file);
    
    // Wait for embeddings to complete
    let progress = getEmbeddingProgress(doc.id);
    while (progress.status !== 'completed') {
      await sleep(1000);
      progress = getEmbeddingProgress(doc.id);
    }
    
    // Verify embeddings exist
    const embeddings = countEmbeddingsByDocument(doc.id);
    expect(embeddings).toBeGreaterThan(0);
  });
});
```

## Troubleshooting

### Issue: "Ollama service unavailable"

**Solution**: 
- Check Ollama is running: `ollama serve`
- Verify model is installed: `ollama list`
- Check OLLAMA_BASE_URL in .env matches actual Ollama URL

### Issue: "Embedding dimension mismatch"

**Solution**:
- Ensure `nomic-embed-text` is pulled: `ollama pull nomic-embed-text`
- Verify EMBEDDING_DIMENSION=768 in .env
- Check Ollama model hasn't changed

### Issue: Slow embedding generation

**Solution**:
- Check Ollama isn't running other models
- Reduce batch size in embeddingService.ts
- Monitor CPU/memory usage during generation
- Consider enabling GPU in Ollama for faster processing

### Issue: Vector index file corruption

**Solution**:
- Delete project index files: `rm data/vector_index/project-{id}.*`
- Trigger rebuild: `POST /api/embeddings/rebuild/{projectId}`
- System will recreate from database embeddings

## Future Enhancements

1. **Semantic Search**: Implement `/api/search` endpoint using vector similarity
2. **Hybrid Search**: Combine keyword search with semantic search
3. **Real-time Updates**: WebSocket for live embedding progress
4. **Multi-Model Support**: Support other embedding models (e.g., OpenAI, Hugging Face)
5. **GPU Acceleration**: Configure Ollama GPU support
6. **Chunk Reranking**: Use embeddings to rerank search results
7. **Caching**: Cache frequently searched embeddings
8. **Analytics**: Track embedding quality metrics

## References

- [Ollama Documentation](https://ollama.ai)
- [HNSW Algorithm Paper](https://arxiv.org/abs/1802.02413)
- [Nomic Embed Model](https://huggingface.co/nomic-ai/nomic-embed-text)
- [hnswlib-node GitHub](https://github.com/nmslib/hnswlib)

