---
title: "Markrealm - Technical Documentation"
description: "Simplified and efficient documentation site generator with WebSocket live reload"
---

# Markrealm - Technical Documentation

## Project Overview

Markrealm is a streamlined TypeScript Node CLI that renders Markdoc files as a website with WebSocket live reload, auto sidebar, and static build capabilities. The codebase has been optimized for simplicity and maintainability.

**Quick Facts:**

- **Language**: TypeScript with Node.js 20+
- **Architecture**: Simplified modular design (40% less code)
- **Primary Use Case**: Fast documentation site generation
- **Key Innovation**: Real-time WebSocket reload with minimal complexity
- **Production Ready**: Static site generation for deployment

## Simplified Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   CLI Interface │    │  Express Server  │    │  Static Builder │
│   (src/cli.ts)  │    │ (src/server.ts)  │    │ (src/build.ts)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌──────────────────┐
                    │  Content Engine  │
                    │  (simplified)    │
                    └──────────────────┘
```

### Code Statistics

- **Total Lines**: 597 (down from 995)
- **Server**: 217 lines (simplified routing & WebSocket)
- **Content Processing**: 380 lines (removed complex AST traversal)
- **Reduction**: 40% smaller codebase

## Core Components

### 1. Express Server (`src/server.ts`)

**217 lines** - Handles HTTP requests and WebSocket connections

Key features:

- Simplified routing logic
- WebSocket live reload on `/_livereload`
- File watching with chokidar
- EJS template rendering

### 2. Content Processing (`src/content/`)

**380 lines total** - Streamlined content handling

- **markdoc.ts** (29 lines): Basic Markdoc rendering without complex AST processing
- **loader.ts** (95 lines): File loading and indexing
- **sidebar.ts** (31 lines): Flat sidebar generation (no tree building)
- **links.ts** (167 lines): Link validation (kept for functionality)

### 3. WebSocket Live Reload (`src/web/public/reload-client.js`)

**47 lines** - Client-side live reload

Features:

- Connects to `ws://localhost:PORT/_livereload`
- Automatic page refresh on file changes
- Connection error handling and reconnection

## Implementation Details

### Simplified Content Flow

1. **File Discovery**: Uses `globby` to find `.md/.mdoc` files
2. **Basic Processing**: Simple Markdoc parsing without AST traversal
3. **Index Building**: Dual lookup (by route and path)
4. **Sidebar Generation**: Flat list instead of hierarchical tree
5. **Template Rendering**: EJS templates with minimal data

### WebSocket Live Reload

```javascript
// Server: Broadcast reload to all clients
private broadcastReload(): void {
  const message = JSON.stringify({ type: "reload", timestamp: Date.now() });
  this.wss.clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(message);
    }
  });
}

// Client: Auto-reload on message
ws.addEventListener("message", (event) => {
  const data = JSON.parse(event.data);
  if (data.type === "reload") {
    location.reload();
  }
});
```

### File Watching

```javascript
// Simplified file event handling
const handleFileEvent = (filePath: string, eventType: string) => {
  if (eventType === "removed") {
    removeDocumentFromIndex(this.contentIndex, filePath);
  } else {
    updateDocumentInIndex(
      this.contentIndex,
      filePath,
      this.docsDir,
      this.config.ignore
    );
  }
  this.broadcastReload();
};
```

## Design Decisions

### Simplification Strategy

1. **Removed Complex AST Processing**: No heading/link extraction during rendering
2. **Flat Sidebar Structure**: Simple list instead of hierarchical tree building
3. **Consolidated Error Handling**: Minimal try/catch blocks
4. **Streamlined Methods**: Combined similar functions

### What Was Removed

- Complex AST node traversal functions
- Hierarchical sidebar tree building
- Excessive error handling abstractions
- Redundant logging and formatting

### What Was Kept

- WebSocket live reload functionality
- Link checking and validation
- Basic Markdoc rendering
- File watching and indexing
- Static site generation

## Performance Benefits

### Faster Development

- **Simpler Code**: Easier to understand and modify
- **Faster Builds**: Less processing overhead
- **Quick Debugging**: Clearer error paths

### Reduced Complexity

- **40% Less Code**: Easier maintenance
- **Fewer Abstractions**: Direct implementation
- **Clearer Data Flow**: Simplified processing pipeline

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build static site
npm run build
```

The server runs on `http://localhost:5173` with WebSocket live reload at `/_livereload`.

## Project Structure

```
markrealm/
├── src/
│   ├── cli.ts              # CLI interface
│   ├── server.ts           # Express server (217 lines)
│   ├── build.ts            # Static site generation
│   ├── config.ts           # Configuration loading
│   └── content/            # Content processing (380 lines)
│       ├── loader.ts       # File loading (95 lines)
│       ├── markdoc.ts      # Simple rendering (29 lines)
│       ├── sidebar.ts      # Flat sidebar (31 lines)
│       ├── links.ts        # Link validation (167 lines)
│       └── types.ts        # TypeScript types
├── examples/docs/          # Example documentation
└── test/                   # Unit tests
```

## Future Enhancements

- **Search Integration**: Add full-text search
- **Theme Customization**: Custom styling options
- **Plugin System**: Extensible architecture
- **Performance Optimizations**: Caching and lazy loading

The simplified architecture provides a solid foundation for future enhancements while maintaining code clarity and maintainability.
