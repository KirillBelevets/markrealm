---
title: "Getting Started"
description: "Step-by-step guide to set up and use Markrealm for documentation"
---

# Getting Started

Get Markrealm up and running in minutes. This guide covers installation, basic usage, and how to leverage the WebSocket live reload feature.

## Prerequisites

- **Node.js 20+** (check with `node --version`)
- **npm** or **yarn** package manager
- Basic knowledge of Markdown

## Installation

### Option 1: Clone Repository

```bash
git clone <repository-url>
cd markrealm
npm install
```

### Option 2: NPM Package (when published)

```bash
npm install -g markrealm
```

## Quick Start

### 1. Start Development Server

```bash
# From the markrealm directory
npm run dev

# Or if installed globally
markrealm dev --dir ./your-docs
```

You should see:

```
Server running at http://localhost:5173
Indexed 3 documents
WebSocket server setup on path: /_livereload
```

### 2. Open Your Browser

Navigate to **http://localhost:5173** and you'll see:

- The documentation homepage
- Sidebar navigation (automatically generated)
- Live reload functionality active

### 3. Test Live Reload

1. Open browser Developer Tools (F12) → Console
2. Look for: `"Live reload connected"`
3. Edit any `.md` file in `examples/docs/`
4. Watch the browser automatically refresh!

## Project Setup

### Create Your Documentation

1. **Create docs directory:**

```bash
mkdir my-docs
cd my-docs
```

2. **Add configuration file** (`markrealm.config.yaml`):

```yaml
site:
  title: "My Documentation"
  baseUrl: "/"

sidebar:
  order:
    - "index.md"
    - "getting-started.md"
    - "api/*"

linkcheck:
  enabled: true
  externalTimeoutMs: 5000

ignore:
  - "drafts/**"
```

3. **Create your first page** (`index.md`):

```markdown
---
title: "Welcome"
description: "My awesome documentation"
---

# Welcome to My Docs

This is my documentation homepage.

## Features

- Live reload with WebSocket
- Automatic sidebar generation
- Link checking
- Static site generation
```

4. **Start the server:**

```bash
markrealm dev --dir my-docs
```

## File Organization

### Recommended Structure

```
my-docs/
├── index.md                 # Homepage (/)
├── getting-started.md       # Guide (/getting-started)
├── api/
│   ├── index.md            # API overview (/api)
│   ├── authentication.md   # Auth docs (/api/authentication)
│   └── endpoints.md        # Endpoints (/api/endpoints)
└── markrealm.config.yaml   # Configuration
```

### URL Mapping

- `index.md` → `/`
- `getting-started.md` → `/getting-started`
- `api/index.md` → `/api`
- `api/authentication.md` → `/api/authentication`

## Writing Content

### Front Matter

Add metadata to your pages:

```yaml
---
title: "Page Title"
description: "Page description for SEO"
---
# Page Content
```

### Markdoc Features

Markrealm supports standard Markdoc syntax:

```markdown
# Headings

**Bold text**
_Italic text_
[Links](./other-page.md)

## Code Blocks

\`\`\`javascript
console.log("Hello World!");
\`\`\`

## Lists

- Item 1
- Item 2
- Item 3
```

## WebSocket Live Reload

### How It Works

1. **File Watcher**: Chokidar monitors file changes
2. **WebSocket Server**: Broadcasts reload messages to clients
3. **Client Script**: Automatically reloads the browser

### Debugging Live Reload

If live reload isn't working:

1. **Check Console Messages:**

```
✅ "Live reload connected"
✅ "WebSocket server setup on path: /_livereload"
❌ "WebSocket connection error"
```

2. **Verify WebSocket Connection:**

- Open Network tab in DevTools
- Look for WebSocket connection to `/_livereload`
- Should show "Connected" status

3. **Test File Changes:**

- Edit any `.md` file
- Save the file
- Look for server message: `"File changed: /path/to/file.md"`
- Browser should automatically refresh

## Building for Production

### Static Site Generation

```bash
# Build static site
npm run build

# Or with custom directories
markrealm build --dir ./my-docs --out ./dist
```

This creates a `dist/` directory with:

- Static HTML files
- CSS stylesheets
- No JavaScript dependencies
- Ready for deployment

### Deployment Options

- **GitHub Pages**: Upload `dist/` contents
- **Netlify**: Drag and drop `dist/` folder
- **Vercel**: Connect Git repository
- **Any static host**: Upload `dist/` contents

## CLI Commands

### Development

```bash
markrealm dev [options]

Options:
  --dir <path>    Documentation directory (default: ./docs)
  --port <number> Port for dev server (default: 5173)
```

### Build

```bash
markrealm build [options]

Options:
  --dir <path>      Documentation directory (default: ./docs)
  --out <path>      Output directory (default: dist)
  --no-strict       Don't fail on broken links
```

### Link Checking

```bash
markrealm check [options]

Options:
  --dir <path>      Documentation directory (default: ./docs)
  --no-strict       Don't fail on broken links
```

## Troubleshooting

### Common Issues

**Port already in use:**

```bash
markrealm dev --port 3000
```

**Files not being watched:**

- Check file permissions
- Ensure files are in the specified docs directory
- Check ignore patterns in config

**Broken links:**

- Use relative paths: `./other-page.md`
- Check file extensions
- Run `markrealm check` to validate links

**WebSocket not connecting:**

- Check firewall settings
- Verify port accessibility
- Look for proxy/VPN interference

### Getting Help

1. Check the console output for error messages
2. Verify your `markrealm.config.yaml` syntax
3. Test with minimal configuration
4. Check file paths and permissions

## Next Steps

- Explore the [API Reference](./api-reference) for advanced usage
- Learn about link checking and validation
- Set up automated deployment
- Customize styling and themes
