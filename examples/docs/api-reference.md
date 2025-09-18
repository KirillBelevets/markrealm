---
title: "API Reference"
description: "API documentation for Markrealm"
---

# API Reference

API documentation for Markrealm components.

## Server Class

### MarkrealmServer

Main server class that handles:

- WebSocket connections
- File watching
- Content serving

### Methods

- `start()` - Start the development server
- `stop()` - Stop the server
- `setupWebSocket()` - Initialize WebSocket for live reload
