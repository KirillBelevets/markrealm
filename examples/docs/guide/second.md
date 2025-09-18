---
title: "Advanced Features"
description: "Learn about advanced Markrealm features and customization options"
---

# Advanced Features

This page covers advanced features and customization options available in Markrealm.

## Custom Sidebar Ordering

Control the order of items in your sidebar using the `sidebar.order` configuration:

```yaml
sidebar:
  order:
    - "index.md"
    - "guide/getting-started.md"
    - "guide/*" # All other guide pages
    - "api/*" # All API pages
```

## Link Checking

Markrealm automatically checks your links for validity:

### Internal Links

Internal links are validated to ensure they point to existing pages:

```markdown
[Valid link](getting-started.md)
[Broken link](non-existent-page.md) <!-- Will be flagged -->
```

### External Links

External links are checked with HTTP requests:

```markdown
[GitHub](https://github.com) <!-- Will be checked -->
[Broken](https://example.com/404) <!-- Will be flagged -->
```

### Configuration

Control link checking behavior:

```yaml
linkcheck:
  enabled: true
  externalTimeoutMs: 5000 # Timeout for external link checks
```

## File Ignoring

Exclude files from processing using glob patterns:

```yaml
ignore:
  - "drafts/**" # Ignore all files in drafts/
  - "*.draft.md" # Ignore files ending with .draft.md
  - "temp/**" # Ignore temp directory
```

## Custom Styling

Markrealm comes with a clean, responsive design, but you can customize it:

### CSS Variables

Override CSS variables in your configuration:

```yaml
theme:
  primaryColor: "#007bff"
  sidebarWidth: "300px"
  fontFamily: "Inter, sans-serif"
```

### Custom CSS

Add custom CSS files to your public directory and reference them in your pages.

## Static Site Generation

Generate a static version of your documentation:

```bash
markrealm build --dir ./docs --out ./dist
```

### Build Options

- `--dir`: Source directory (default: `./docs`)
- `--out`: Output directory (default: `dist`)
- `--no-strict`: Don't fail on broken links

### Deployment

The generated static site can be deployed to any static hosting service:

- **Netlify**: Drag and drop the `dist` folder
- **Vercel**: Connect your repository
- **GitHub Pages**: Push to `gh-pages` branch
- **AWS S3**: Upload to S3 bucket

## Performance Optimization

### Image Optimization

Optimize images for web delivery:

```markdown
![Alt text](image.jpg)
```

Consider using WebP format for better compression.

### Code Splitting

Markrealm automatically optimizes JavaScript and CSS delivery.

## Troubleshooting

### Common Issues

**Server won't start:**

- Check if port 5173 is available
- Verify Node.js version (20+ required)
- Check file permissions

**Links not working:**

- Ensure file paths are correct
- Check for typos in filenames
- Verify file extensions (.md or .mdoc)

**Build fails:**

- Run `markrealm check` to identify broken links
- Use `--no-strict` flag to ignore broken links
- Check file permissions

### Debug Mode

Enable debug logging:

```bash
DEBUG=markrealm:* markrealm dev
```

## Contributing

Want to contribute to Markrealm? Check out our [Contributing Guide](/contributing) and [API Reference](/api/reference).
