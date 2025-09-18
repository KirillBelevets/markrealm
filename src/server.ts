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
    this.app.set("view engine", "ejs");
    this.app.set("views", path.join(__dirname, "web", "template"));
    this.app.use(
      "/styles.css",
      express.static(path.join(__dirname, "web", "public", "styles.css"))
    );
    this.app.use(
      "/reload-client.js",
      express.static(path.join(__dirname, "web", "public", "reload-client.js"))
    );
    this.app.get("/*", this.handleRoute.bind(this));
  }

  private async handleRoute(
    req: express.Request,
    res: express.Response
  ): Promise<void> {
    const route = req.path === "/" ? "/" : req.path;

    if (/\.(yaml|yml|json|config)/.test(route)) {
      res
        .status(404)
        .send(
          `<h1>404 - Page Not Found</h1><p>The page <code>${route}</code> could not be found.</p><a href="/">← Back to Home</a>`
        );
      return;
    }

    const doc = this.contentIndex.byRoute.get(route);
    if (!doc) {
      res
        .status(404)
        .send(
          `<h1>404 - Page Not Found</h1><p>The page <code>${route}</code> could not be found.</p><a href="/">← Back to Home</a>`
        );
      return;
    }

    const sidebar = this.renderSidebar(
      generateSidebar(this.contentIndex, this.config.sidebar.order)
    );
    const html = await this.renderPage(doc, sidebar, true);
    res.send(html);
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
    if (sidebarItems.length === 0) return "";

    let html = "<ul>\n";
    for (const item of sidebarItems) {
      html += `  <li><a href="${item.route}" class="sidebar-link">${item.title}</a>`;
      if (item.children?.length) {
        html += "<ul>";
        for (const child of item.children) {
          html += `<li><a href="${child.route}" class="sidebar-link">${child.title}</a></li>`;
        }
        html += "</ul>";
      }
      html += "</li>\n";
    }
    html += "</ul>\n";
    return html;
  }

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
        updateDocumentInIndex(
          this.contentIndex,
          filePath,
          this.docsDir,
          this.config.ignore
        );
      }
      this.broadcastReload();
    };

    this.watcher.on("change", (filePath) =>
      handleFileEvent(filePath, "changed")
    );
    this.watcher.on("add", (filePath) => handleFileEvent(filePath, "added"));
    this.watcher.on("unlink", (filePath) =>
      handleFileEvent(filePath, "removed")
    );
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

    this.wss.on("connection", (ws) => {
      console.log("LiveReload client connected");
      ws.send(
        JSON.stringify({ type: "connected", message: "LiveReload ready" })
      );
      ws.on("close", () => console.log("LiveReload client disconnected"));
    });

    console.log("WebSocket server setup on path: /_livereload");
  }

  public async start(): Promise<void> {
    this.config = loadConfig(this.docsDir);
    this.contentIndex = await buildContentIndex(
      this.docsDir,
      this.config.ignore
    );

    this.server = createServer(this.app);
    this.setupWebSocket();
    this.setupFileWatcher();

    this.server.listen(this.options.port, () => {
      console.log(`Server running at http://localhost:${this.options.port}`);
      console.log(`Indexed ${this.contentIndex.byRoute.size} documents`);
    });
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
