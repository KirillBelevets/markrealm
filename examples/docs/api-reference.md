---
title: "API Reference"
description: "Complete API documentation for Markrealm's simplified architecture"
---

# API Reference

Comprehensive documentation for Markrealm's streamlined API. The codebase has been simplified (40% reduction) for better maintainability and performance.

## Core Classes

### MarkrealmServer

Main server class that orchestrates the development environment.

**File**: `src/server.ts` (217 lines)

```typescript
class MarkrealmServer {
  constructor(private options: ServerOptions);
  public async start(): Promise<void>;
  public stop(): void;
}
```

#### Constructor

```typescript
constructor(options: ServerOptions)
```

**Parameters:**

- `options.port: number` - Server port (default: 5173)
- `options.docsDir: string` - Documentation directory path

#### Methods

##### `start(): Promise<void>`

Starts the development server with WebSocket live reload.

**Process:**

1. Loads configuration from `markrealm.config.yaml`
2. Builds content index from markdown files
3. Creates HTTP server with Express
4. Sets up WebSocket server on `/_livereload`
5. Initializes file watcher for live reload

```typescript
public async start(): Promise<void> {
  this.config = loadConfig(this.docsDir);
  this.contentIndex = await buildContentIndex(this.docsDir, this.config.ignore);

  this.server = createServer(this.app);
  this.setupWebSocket();
  this.setupFileWatcher();

  this.server.listen(this.options.port, () => {
    console.log(`Server running at http://localhost:${this.options.port}`);
  });
}
```

##### `stop(): void`

Gracefully shuts down all server components.

```typescript
public stop(): void {
  if (this.watcher) this.watcher.close();
  if (this.wss) this.wss.close();
  if (this.server) this.server.close();
}
```

## Content Processing

### Content Loader

**File**: `src/content/loader.ts` (95 lines)

#### `buildContentIndex(docsDir, ignorePatterns): Promise<ContentIndex>`

Builds an index of all documentation files.

```typescript
export async function buildContentIndex(
  docsDir: string,
  ignorePatterns: string[]
): Promise<ContentIndex> {
  const index: ContentIndex = { byRoute: new Map(), byPath: new Map() };
  const files = await globby("**/*.{md,mdoc}", {
    cwd: docsDir,
    absolute: true,
  });

  for (const filePath of files) {
    if (isIgnoredPath(filePath, ignorePatterns)) continue;

    const docMeta = loadDocument(filePath, docsDir);
    if (docMeta) {
      index.byRoute.set(docMeta.route, docMeta);
      index.byPath.set(docMeta.path, docMeta);
    }
  }

  return index;
}
```

**Returns**: `ContentIndex` with dual lookup (by route and file path)

#### `updateDocumentInIndex(index, filePath, docsDir, ignorePatterns): void`

Updates a single document in the index (used by file watcher).

#### `removeDocumentFromIndex(index, filePath): void`

Removes a document from the index when file is deleted.

### Markdoc Renderer

**File**: `src/content/markdoc.ts` (29 lines - simplified!)

#### `renderMarkdocToHtml(src): MarkdocResult`

Simplified Markdoc rendering without complex AST processing.

```typescript
export function renderMarkdocToHtml(src: string): MarkdocResult {
  const { data: frontMatter, content } = matter(src);
  const ast = Markdoc.parse(content);
  const transformedAst = Markdoc.transform(ast);
  const html = Markdoc.renderers.html(transformedAst);

  return {
    html,
    frontMatter,
    headings: [], // Simplified - no extraction
    links: [], // Simplified - no extraction
  };
}
```

**Parameters:**

- `src: string` - Raw markdown content with front matter

**Returns**: `MarkdocResult`

```typescript
interface MarkdocResult {
  html: string; // Rendered HTML
  frontMatter: Record<string, any>; // YAML front matter
  headings: Heading[]; // Empty in simplified version
  links: Link[]; // Empty in simplified version
}
```

#### `extractTitle({ frontMatter }): string`

Extracts page title from front matter.

```typescript
export function extractTitle({
  frontMatter,
}: {
  frontMatter: Record<string, any>;
  headings: Heading[];
}): string {
  return frontMatter.title || "Untitled";
}
```

### Sidebar Generator

**File**: `src/content/sidebar.ts` (31 lines - flat structure!)

#### `generateSidebar(index, order): SidebarItem[]`

Generates a flat sidebar structure (no complex tree building).

```typescript
export function generateSidebar(
  index: ContentIndex,
  order: string[] = []
): SidebarItem[] {
  const docs = Array.from(index.byRoute.values());

  const items: SidebarItem[] = docs.map((doc) => ({
    title: doc.title,
    route: doc.route,
  }));

  if (order.length > 0) {
    return items.sort((a, b) => {
      // Apply custom ordering from config
    });
  }

  return items.sort((a, b) => a.title.localeCompare(b.title));
}
```

**Parameters:**

- `index: ContentIndex` - Content index with all documents
- `order: string[]` - Optional ordering from config

**Returns**: `SidebarItem[]` - Flat list of sidebar items

## WebSocket Live Reload

### Server-Side WebSocket

**Location**: `src/server.ts` - `setupWebSocket()` method

```typescript
private setupWebSocket(): void {
  this.wss = new WebSocketServer({
    server: this.server,
    path: "/_livereload",
  });

  this.wss.on("connection", (ws) => {
    console.log("LiveReload client connected");
    ws.send(JSON.stringify({ type: "connected", message: "LiveReload ready" }));
    ws.on("close", () => console.log("LiveReload client disconnected"));
  });
}
```

### Broadcast Reload

```typescript
private broadcastReload(): void {
  if (this.wss) {
    const message = JSON.stringify({ type: "reload", timestamp: Date.now() });
    console.log(`Broadcasting reload to ${this.wss.clients.size} clients`);

    this.wss.clients.forEach((client) => {
      if (client.readyState === client.OPEN) {
        client.send(message);
      }
    });
  }
}
```

### Client-Side WebSocket

**File**: `src/web/public/reload-client.js` (47 lines)

```javascript
const proto = location.protocol === "https:" ? "wss" : "ws";
const wsUrl = `${proto}://${location.host}/_livereload`;
const ws = new WebSocket(wsUrl);

ws.addEventListener("open", () => {
  console.log("Live reload connected");
});

ws.addEventListener("message", (event) => {
  const data = JSON.parse(event.data);

  if (data.type === "connected") {
    console.log("LiveReload ready");
  } else if (data.type === "reload") {
    console.log("Reloading page...");
    location.reload();
  }
});
```

## Configuration

### Config Loader

**File**: `src/config.ts`

#### `loadConfig(docsDir): ConfigResult`

Loads and validates `markrealm.config.yaml`.

**Default Configuration:**

```yaml
site:
  title: "Documentation"
  baseUrl: "/"

sidebar:
  order: []

linkcheck:
  enabled: true
  externalTimeoutMs: 5000

ignore:
  - "node_modules/**"
  - ".git/**"
```

## TypeScript Types

### Core Interfaces

**File**: `src/content/types.ts`

```typescript
export interface DocMeta {
  path: string; // Absolute file path
  route: string; // URL route (/guide/intro)
  title: string; // Page title
  headings: Heading[]; // Extracted headings
  frontMatter: Record<string, any>; // YAML front matter
  links: Link[]; // Extracted links
  html: string; // Rendered HTML
}

export interface ContentIndex {
  byRoute: Map<string, DocMeta>; // Lookup by URL route
  byPath: Map<string, DocMeta>; // Lookup by file path
}

export interface SidebarItem {
  title: string;
  route: string;
  children?: SidebarItem[]; // Optional for hierarchical structure
}

export interface ServerOptions {
  port: number;
  docsDir: string;
}
```

## File Watching

### File Event Handling

```typescript
private setupFileWatcher(): void {
  this.watcher = chokidar.watch(this.docsDir, {
    ignored: this.config.ignore,
    persistent: true,
    ignoreInitial: true,
  });

  const handleFileEvent = (filePath: string, eventType: string) => {
    console.log(`File ${eventType}: ${filePath}`);
    if (eventType === "removed") {
      removeDocumentFromIndex(this.contentIndex, filePath);
    } else {
      updateDocumentInIndex(this.contentIndex, filePath, this.docsDir, this.config.ignore);
    }
    this.broadcastReload();
  };

  this.watcher.on("change", (filePath) => handleFileEvent(filePath, "changed"));
  this.watcher.on("add", (filePath) => handleFileEvent(filePath, "added"));
  this.watcher.on("unlink", (filePath) => handleFileEvent(filePath, "removed"));
}
```

## Link Checking

**File**: `src/content/links.ts` (167 lines - kept for functionality)

### `checkInternalLinks(index): Promise<LinkCheckResult>`

Validates internal links between documentation pages.

### `checkExternalLinks(urls, timeout): Promise<{valid, broken}>`

Validates external HTTP/HTTPS links.

## Template Rendering

### EJS Templates

**Layout**: `src/web/template/layout.ejs`
**Page**: `src/web/template/page.ejs`

```typescript
private async renderPage(doc: DocMeta, sidebar: string, isDev: boolean = false): Promise<string> {
  return new Promise((resolve, reject) => {
    ejs.renderFile(
      path.join(__dirname, "web", "template", "page.ejs"),
      {
        siteTitle: this.config.site.title,
        pageTitle: doc.title,
        sidebar,
        html: doc.html,
        isDev,
      },
      (err, html) => {
        if (err) reject(err);
        else resolve(html);
      }
    );
  });
}
```

## Error Handling

The simplified architecture uses minimal error handling:

- File loading errors are logged but don't crash the server
- WebSocket connection errors are handled gracefully
- Missing files return 404 responses
- Configuration errors halt server startup

This streamlined approach reduces complexity while maintaining reliability for development use cases.
