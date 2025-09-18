---
title: "Welcome to Markrealm"
description: "A modern documentation site generator"
---

# Welcome to Markrealm

Markrealm is a production-ready TypeScript Node CLI that renders a directory of Markdoc files as a website with live reload, one page per file, auto sidebar, config file, broken link detection, and static build.

## Features

- **Live Reload**: Edit your documentation and see changes instantly
- **Auto Sidebar**: Automatically generates navigation from your file structure
- **Link Checking**: Validates internal and external links
- **Static Build**: Export your documentation as a static website
- **Markdoc Support**: Full support for Markdoc syntax and features

## Quick Start

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Start development server**:

   ```bash
   npm run dev
   ```

3. **Open your browser** to `http://localhost:5173`

4. **Edit files** in the `examples/docs` directory and see changes instantly!

## Documentation Structure

Your documentation should be organized in a clear, logical structure. Each `.md` or `.mdoc` file becomes a page on your site.

### File Naming

- `index.md` becomes the homepage (`/`)
- `guide/getting-started.md` becomes `/guide/getting-started`
- `api/reference.md` becomes `/api/reference`

### Front Matter

Use YAML front matter to add metadata to your pages:

```yaml
---
title: "Page Title"
description: "Page description"
---
```

## Configuration

Create a `markrealm.config.yaml` file in your docs directory to customize your site:

```yaml
site:
  title: "My Documentation"
  baseUrl: "/"

sidebar:
  order:
    - "index.md"
    - "guide/*"
    - "api/*"

linkcheck:
  enabled: true
  externalTimeoutMs: 5000

ignore:
  - "drafts/**"
```

## Building for Production

To build a static version of your documentation:

```bash
npm run build
```

This creates a `dist` directory with all the static files ready for deployment.

## Next Steps

- Check out the [Getting Started Guide](/guide/getting-started) for detailed setup instructions
- Learn about [Advanced Features](/guide/advanced-features) like custom themes and plugins
- Explore the [API Reference](/api/reference) for programmatic usage
