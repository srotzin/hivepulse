# HivePulse — Agent Network Monitoring — MCP Server

HivePulse is a Model Context Protocol (MCP) server that provides real-time monitoring for the Hive agent network on Base L2. It exposes JSON-RPC 2.0 endpoints for health metrics, population analytics, economy data, and threshold-based alerts.

## MCP Tools

| Tool | Description |
|------|-------------|
| `hivepulse_get_health` | Network-wide health metrics: active services, uptime, error rates |
| `hivepulse_get_population` | Agent population stats: total agents, active count, species breakdown |
| `hivepulse_get_economy` | Economy metrics: transaction volume, revenue, settlement totals |
| `hivepulse_subscribe_alerts` | Subscribe to threshold-based alerts for any metric |

## Usage

Send JSON-RPC 2.0 requests to `POST /mcp`:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "hivepulse_get_health",
    "arguments": {}
  }
}
```

### Supported Methods

- `initialize` — Returns protocol version, capabilities, and server info
- `tools/list` — Returns available tool definitions
- `tools/call` — Execute a tool by name with arguments

## REST API

HivePulse also exposes a REST API under `/v1/pulse` with endpoints for AEI, reputation, arbitration, knowledge pricing, genetics, subscriptions, and a data firehose.

## Setup

```bash
npm install
npm start
```

Server runs on port `3001` by default (configurable via `PORT` env var).

## Architecture

Node.js with Express. SQLite for persistence. Six background analyzers run continuously for real-time metric computation.

## License

Proprietary — Hive Civilization
