---
title: "Getting Started"
description: "Learn how to set up and use Markrealm for your documentation"
---

# Getting Started with Markrealm

This guide will walk you through setting up Markrealm for your documentation project.

## Prerequisites

Before you begin, make sure you have:

- Node.js 20 or higher
- npm or yarn package manager
- A text editor (VS Code recommended)

## Installation

### Option 1: Use as CLI Tool

Install Markrealm globally:

```bash
npm install -g markrealm
```

### Option 2: Use in Project

Add Markrealm to your project:

```bash
npm install markrealm --save-dev
```

## Project Setup

1. **Create a documentation directory**:

   ```bash
   mkdir my-docs
   cd my-docs
   ```

2. **Initialize your project**:

   ```bash
   npm init -y
   ```

3. **Create your first documentation file**:

   ```bash
   echo "# Welcome to My Docs" > index.md
   ```

4. **Create a configuration file**:

   ```yaml
   # markrealm.config.yaml
   site:
     title: "My Documentation"
     baseUrl: "/"

   sidebar:
     order:
       - "index.md"

   linkcheck:
     enabled: true
     externalTimeoutMs: 5000

   ignore:
     - "drafts/**"
   ```

## Running the Development Server

Start the development server:

```bash
markrealm dev --dir ./my-docs
```

Or if installed locally:

```bash
npx markrealm dev --dir ./my-docs
```

The server will start on `http://localhost:5173` by default.

## Writing Documentation

### Basic Markdown

Markrealm supports standard Markdown syntax:

```markdown
# Heading 1

## Heading 2

### Heading 3

**Bold text** and _italic text_

- List item 1
- List item 2
- List item 3

[Link to another page](another-page.md)
```

### Front Matter

Add metadata to your pages using YAML front matter:

```yaml
---
title: "Page Title"
description: "Page description"
author: "Your Name"
date: "2024-01-01"
---
```

### Code Blocks

Use fenced code blocks with syntax highlighting:

````markdown
```javascript
function hello() {
  console.log("Hello, World!");
}
```
````

### Tables

Create tables using Markdown syntax:

| Feature       | Description            | Status |
| ------------- | ---------------------- | ------ |
| Live Reload   | Automatic page refresh | ✅     |
| Link Checking | Validate links         | ✅     |
| Static Build  | Export static site     | ✅     |

## File Organization

Organize your documentation logically:

```
my-docs/
├── index.md                 # Homepage
├── guide/
│   ├── getting-started.md   # /guide/getting-started
│   ├── installation.md      # /guide/installation
│   └── configuration.md     # /guide/configuration
├── api/
│   ├── reference.md         # /api/reference
│   └── examples.md          # /api/examples
├── drafts/                  # Ignored by default
│   └── work-in-progress.md
└── markrealm.config.yaml    # Configuration
```

## Building for Production

When you're ready to deploy:

```bash
markrealm build --dir ./my-docs --out ./dist
```

This creates a static version of your documentation in the `dist` directory.

## Next Steps

- Learn about [Advanced Configuration](/guide/configuration)
- Explore [Custom Themes](/guide/themes)
- Check out [API Reference](/api/reference)
