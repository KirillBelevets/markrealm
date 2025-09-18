import express from "express";
import * as path from "path";
import * as chokidar from "chokidar";
import { WebSocketServer } from "ws";
import { createServer } from "http";
import ejs from "ejs";
import { ContentIndex, DocMeta, SidebarItem } from "./content/types";
import {
  buildContentIndex,
  updateDocumentInIndex,
  removeDocumentFromIndex,
} from "./content/loader";
import { generateSidebar } from "./content/sidebar";
import { loadConfig } from "./config";

export interface ServerOptions {
  port: number;
  docsDir: string;
}

export class MarkrealmServer {
  private app: express.Application;
  private server: any;
  private wss!: WebSocketServer;
  private watcher!: chokidar.FSWatcher;
  private contentIndex!: ContentIndex;
  private config: any;
  private docsDir: string;

  constructor(private options: ServerOptions) {
    this.app = express();
    this.docsDir = path.resolve(options.docsDir);
    this.setupApp();
  }

  private setupApp(): void {
    // Set EJS as template engine
    this.app.set("view engine", "ejs");
    this.app.set("views", path.join(__dirname, "web", "template"));

    // Serve static files
    this.app.use(
      "/styles.css",
      express.static(path.join(__dirname, "web", "public", "styles.css"))
    );
    this.app.use(
      "/reload-client.js",
      express.static(path.join(__dirname, "web", "public", "reload-client.js"))
    );

    // Routes
    this.app.get("/", this.handleRoute.bind(this));
    this.app.get("/*", this.handleRoute.bind(this));
  }

  private async handleRoute(
    req: express.Request,
    res: express.Response
  ): Promise<void> {
    try {
      const route = req.path === "/" ? "/" : req.path;

      // Skip config files and other non-content files
      if (this.isConfigFile(route)) {
        res.status(404).send(this.render404Page(route));
        return;
      }

      const doc = this.contentIndex.byRoute.get(route);

      if (!doc) {
        res.status(404).send(this.render404Page(route));
        return;
      }

      const sidebar = this.renderSidebar(
        generateSidebar(this.contentIndex, this.config.sidebar.order)
      );
      const html = await this.renderPage(doc, sidebar, true);
      res.send(html);
    } catch (error) {
      console.error("Error rendering page:", error);
      res.status(500).send("Internal Server Error");
    }
  }

  private async renderPage(
    doc: DocMeta,
    sidebar: string,
    isDev: boolean = false
  ): Promise<string> {
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
          if (err) {
            reject(err);
          } else {
            resolve(html);
          }
        }
      );
    });
  }

  private renderSidebar(sidebarItems: SidebarItem[]): string {
    return this.renderSidebarItems(sidebarItems, 0);
  }

  private renderSidebarItems(items: SidebarItem[], depth: number): string {
    if (items.length === 0) return "";

    const indent = "  ".repeat(depth);
    let html = `${indent}<ul>\n`;

    for (const item of items) {
      html += `${indent}  <li>\n`;
      html += `${indent}    <a href="${item.route}" class="sidebar-link">${item.title}</a>\n`;

      if (item.children && item.children.length > 0) {
        html += `${indent}    <div class="children">\n`;
        html += this.renderSidebarItems(item.children, depth + 2);
        html += `${indent}    </div>\n`;
      }

      html += `${indent}  </li>\n`;
    }

    html += `${indent}</ul>\n`;
    return html;
  }

  private isConfigFile(route: string): boolean {
    const configFilePatterns = [
      /\.yaml$/,
      /\.yml$/,
      /\.json$/,
      /markrealm\.config/,
      /\.config\./,
    ];

    return configFilePatterns.some((pattern) => pattern.test(route));
  }

  private render404Page(route: string): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Page Not Found - ${this.config.site.title}</title>
        <link rel="stylesheet" href="/styles.css">
      </head>
      <body>
        <div class="container">
          <main class="content">
            <h1>404 - Page Not Found</h1>
            <p>The page <code>${route}</code> could not be found.</p>
            <p><a href="/">← Back to Home</a></p>
          </main>
        </div>
      </body>
      </html>
    `;
  }

  private setupFileWatcher(): void {
    this.watcher = chokidar.watch(this.docsDir, {
      ignored: this.config.ignore,
      persistent: true,
      ignoreInitial: true,
    });

    this.watcher.on("change", (filePath: string) => {
      console.log(`File changed: ${filePath}`);
      this.handleFileChange(filePath);
    });

    this.watcher.on("add", (filePath: string) => {
      console.log(`File added: ${filePath}`);
      this.handleFileChange(filePath);
    });

    this.watcher.on("unlink", (filePath: string) => {
      console.log(`File removed: ${filePath}`);
      this.handleFileRemoval(filePath);
    });
  }

  private handleFileChange(filePath: string): void {
    updateDocumentInIndex(
      this.contentIndex,
      filePath,
      this.docsDir,
      this.config.ignore
    );
    this.broadcastReload();
  }

  private handleFileRemoval(filePath: string): void {
    removeDocumentFromIndex(this.contentIndex, filePath);
    this.broadcastReload();
  }

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

  private setupWebSocket(): void {
    this.wss = new WebSocketServer({
      server: this.server,
      path: "/_livereload",
    });

    this.wss.on("connection", (ws, req) => {
      console.log(
        "Live reload client connected from:",
        req.socket.remoteAddress
      );

      ws.on("close", () => {
        console.log("Live reload client disconnected");
      });

      ws.on("error", (error) => {
        console.error("WebSocket error:", error);
      });

      // Send a ping to confirm connection
      ws.send(
        JSON.stringify({ type: "connected", message: "LiveReload ready" })
      );
    });

    this.wss.on("error", (error) => {
      console.error("WebSocket server error:", error);
    });

    console.log("WebSocket server setup on path: /_livereload");
  }

  public async start(): Promise<void> {
    try {
      // Load configuration
      this.config = loadConfig(this.docsDir);
      console.log(`Loaded config from ${this.docsDir}`);

      // Build content index
      console.log("Building content index...");
      this.contentIndex = await buildContentIndex(
        this.docsDir,
        this.config.ignore
      );
      console.log(`Indexed ${this.contentIndex.byRoute.size} documents`);

      // Create HTTP server
      this.server = createServer(this.app);

      // Setup WebSocket for live reload
      this.setupWebSocket();

      // Start server
      this.server.listen(this.options.port, () => {
        console.log(`Server running at http://localhost:${this.options.port}`);
        console.log(`Serving docs from: ${this.docsDir}`);
      });

      // Setup file watcher
      this.setupFileWatcher();
      console.log("Watching for file changes...");
    } catch (error) {
      console.error("Failed to start server:", error);
      process.exit(1);
    }
  }

  public stop(): void {
    if (this.watcher) {
      this.watcher.close();
    }
    if (this.wss) {
      this.wss.close();
    }
    if (this.server) {
      this.server.close();
    }
  }
}
