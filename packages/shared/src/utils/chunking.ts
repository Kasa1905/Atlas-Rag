export interface ChunkOptions {
  chunkSize: number;
  chunkOverlap: number;
  preserveWords?: boolean;
}

export interface TextChunk {
  content: string;
  startChar: number;
  endChar: number;
}

/**
 * Split text into overlapping chunks using a sliding window algorithm
 */
export function chunkText(text: string, options: ChunkOptions): TextChunk[] {
  const { chunkSize, chunkOverlap, preserveWords = true } = options;

  if (chunkSize <= 0) {
    throw new Error('Chunk size must be greater than 0');
  }

  if (chunkOverlap < 0 || chunkOverlap >= chunkSize) {
    throw new Error('Chunk overlap must be between 0 and chunk size');
  }

  if (text.length === 0) {
    return [];
  }

  const chunks: TextChunk[] = [];
  let startChar = 0;

  while (startChar < text.length) {
    let endChar = Math.min(startChar + chunkSize, text.length);

    // Preserve word boundaries if enabled
    if (preserveWords && endChar < text.length) {
      // Look back to find a word boundary (space, newline, punctuation)
      const searchStart = Math.max(startChar, endChar - 100);
      const substring = text.substring(searchStart, endChar);
      const lastBoundary = Math.max(
        substring.lastIndexOf(' '),
        substring.lastIndexOf('\n'),
        substring.lastIndexOf('.'),
        substring.lastIndexOf(','),
        substring.lastIndexOf(';'),
        substring.lastIndexOf(')')
      );

      if (lastBoundary > 0) {
        endChar = searchStart + lastBoundary + 1;
      }
    }

    const content = text.substring(startChar, endChar);

    chunks.push({
      content,
      startChar,
      endChar,
    });

    // Move to next chunk position with overlap
    const step = chunkSize - chunkOverlap;
    startChar += step;

    // Avoid infinite loop if step is too small
    if (step <= 0) {
      startChar = endChar;
    }

    // Break if we've reached the end
    if (endChar >= text.length) {
      break;
    }
  }

  return chunks;
}

/**
 * Advanced chunking for code that attempts to preserve function/class boundaries
 */
export function chunkCode(code: string, options: ChunkOptions): TextChunk[] {
  const { chunkSize, chunkOverlap } = options;

  // Detect common code boundaries
  const boundaryPatterns = [
    /\n\s*function\s+/g, // function declarations
    /\n\s*const\s+\w+\s*=\s*\(/g, // arrow functions
    /\n\s*class\s+/g, // class declarations
    /\n\s*export\s+(function|class|const)/g, // exports
    /\n\s*def\s+/g, // Python functions
    /\n\s*public\s+(class|interface|void|static)/g, // Java/C#
  ];

  // Find all boundary positions
  const boundaries: number[] = [0];
  for (const pattern of boundaryPatterns) {
    let match;
    while ((match = pattern.exec(code)) !== null) {
      boundaries.push(match.index);
    }
  }

  // Sort and deduplicate boundaries
  const uniqueBoundaries = [...new Set(boundaries)].sort((a, b) => a - b);

  // If no boundaries found or code is small, use regular chunking
  if (uniqueBoundaries.length <= 1 || code.length <= chunkSize) {
    return chunkText(code, { ...options, preserveWords: true });
  }

  const chunks: TextChunk[] = [];
  let startChar = 0;

  while (startChar < code.length) {
    let endChar = startChar + chunkSize;

    // Find the nearest boundary before endChar
    if (endChar < code.length) {
      const nearestBoundary = uniqueBoundaries
        .filter((b) => b > startChar && b <= endChar)
        .pop();

      if (nearestBoundary) {
        endChar = nearestBoundary;
      }
    } else {
      endChar = code.length;
    }

    const content = code.substring(startChar, endChar);

    chunks.push({
      content,
      startChar,
      endChar,
    });

    // Move to next chunk with overlap
    const step = chunkSize - chunkOverlap;
    startChar = endChar - chunkOverlap;

    if (startChar >= code.length) {
      break;
    }
  }

  return chunks;
}
