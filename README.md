# Markrealm

A production-ready TypeScript Node CLI that renders a directory of Markdoc files as a website with live reload, one page per file, auto sidebar, config file, broken link detection, and static build.

## Features

- **Live Reload**: Edit your documentation and see changes instantly
- **Auto Sidebar**: Automatically generates navigation from your file structure
- **Link Checking**: Validates internal and external links
- **Static Build**: Export your documentation as a static website
- **Markdoc Support**: Full support for Markdoc syntax and features
- **Configurable**: Customize your site with YAML configuration
- **Responsive Design**: Clean, modern UI that works on all devices

## Quick Start

### Installation

```bash
npm install markrealm
```

### Development

```bash
# Start development server
markrealm dev --dir ./docs

# Or use the example docs
npm run dev
```

Open your browser to `http://localhost:5173` and start editing your documentation!

### Building for Production

```bash
# Build static site
markrealm build --dir ./docs --out ./dist

# Or use the example
npm run build
```

## Project Structure

```
markrealm/
├── src/
│   ├── cli.ts              # CLI interface
│   ├── server.ts           # Express server with live reload
│   ├── build.ts            # Static site generation
│   ├── config.ts           # Configuration loading
│   └── content/            # Content processing
│       ├── loader.ts       # File loading and indexing
│       ├── markdoc.ts      # Markdoc rendering
│       ├── sidebar.ts      # Sidebar generation
│       ├── links.ts        # Link checking
│       └── types.ts        # TypeScript types
├── examples/
│   └── docs/               # Example documentation
├── test/                   # Unit tests
└── playwright/             # E2E tests
```

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

Create a `markrealm.config.yaml` file in your docs directory:

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

### Configuration Options

- **site.title**: The title of your documentation site
- **site.baseUrl**: Base URL for your site (usually `/`)
- **sidebar.order**: Custom order for sidebar items (supports glob patterns)
- **linkcheck.enabled**: Enable/disable link checking
- **linkcheck.externalTimeoutMs**: Timeout for external link checks
- **ignore**: Glob patterns for files to ignore

## CLI Commands

### Development Server

```bash
markrealm dev [options]

Options:
  --dir <path>    Documentation directory (default: ./docs)
  --port <number> Port for dev server (default: 5173)
```

### Static Build

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

## Examples

Check out the `examples/docs` directory for a complete example with:

- Homepage with feature overview
- Getting started guide
- Advanced features documentation
- Configuration examples
- Draft files (ignored by default)

## Development

### Prerequisites

- Node.js 20 or higher
- npm or yarn

### Setup

```bash
# Clone the repository
git clone <repository-url>
cd markrealm

# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Run e2e tests
npm run e2e
```

### Scripts

- `npm run dev`: Start development server with example docs
- `npm run build`: Build static site from example docs
- `npm test`: Run unit tests
- `npm run e2e`: Run end-to-end tests
- `npm run compile`: Compile TypeScript

## Architecture

### Content Processing

1. **File Discovery**: Uses `globby` to find all `.md` and `.mdoc` files
2. **Markdoc Rendering**: Parses Markdoc syntax and renders to HTML
3. **Index Building**: Creates in-memory index of all documents
4. **Sidebar Generation**: Builds navigation tree from file structure
5. **Link Extraction**: Extracts and validates all links

### Live Reload

- Uses `chokidar` to watch for file changes
- WebSocket server broadcasts reload messages to clients
- Client-side JavaScript automatically refreshes the page

### Static Build

- Pre-renders all pages using EJS templates
- Copies static assets
- Runs link checking before build
- Generates clean, deployable static site

## Trade-offs and Future Plans

### Current Trade-offs

- **CLI over env for --dir**: Better observability, works with scripts, multi-repo support
- **EJS over React**: Simpler templating, no build step required
- **In-memory index**: Fast but limited to single process

### Future Enhancements

- **OpenAPI Support**: Embed Redoc/Swagger UI for `.yaml` files
- **Internationalization**: Multi-language support
- **Search**: Full-text search with Lunr/Elasticlunr
- **Themes**: Customizable themes and styling
- **Plugins**: Extensible plugin system
- **Performance**: Caching and optimization

## Known TODOs

- [ ] i18n support
- [ ] Search functionality
- [ ] Theme customization
- [ ] Plugin system
- [ ] Performance optimizations
- [ ] More comprehensive error handling

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Acknowledgments

- Built with [Markdoc](https://markdoc.dev/) for content processing
- Inspired by [Realm](https://realm.io/) documentation platform
- Uses [Express](https://expressjs.com/) for the web server
- Powered by [TypeScript](https://www.typescriptlang.org/) for type safety
