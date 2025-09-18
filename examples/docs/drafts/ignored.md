---
title: "Draft Document"
description: "This file should be ignored by Markrealm"
---

# Draft Document

This is a draft document that should be ignored by Markrealm because it's in the `drafts/` directory.

The `drafts/` directory is configured to be ignored in the `markrealm.config.yaml` file:

```yaml
ignore:
  - "drafts/**"
```

This means any files in the `drafts/` directory (and its subdirectories) will not be processed or included in the generated documentation site.

## Use Cases

Draft directories are useful for:

- Work-in-progress documentation
- Experimental content
- Personal notes
- Content that's not ready for publication

## Configuration

You can configure which directories to ignore in your `markrealm.config.yaml`:

```yaml
ignore:
  - "drafts/**" # Ignore all files in drafts/
  - "*.draft.md" # Ignore files ending with .draft.md
  - "temp/**" # Ignore temp directory
  - "private/**" # Ignore private directory
```

This file will not appear in the sidebar or be accessible via the web interface when the development server is running.
