# News MCP Server

A Model Context Protocol (MCP) server that provides news fetching and user validation capabilities for Puch AI.

## Features

- **News Fetching**: Get top headlines from major news sources (BBC, CNN, NDTV, The Hindu, Reuters)
- **User Validation**: Validate bearer tokens and return user phone numbers
- **MCP Compatible**: Follows the Model Context Protocol specification

## API Endpoints

### MCP Server Endpoint

- **URL**: `https://mcp-demo-gamma.vercel.app/api/mcp`
- **Method**: POST
- **Protocol**: JSON-RPC 2.0 over HTTP

### Supported MCP Methods

#### 1. `initialize`

Initialize the MCP server connection.

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "2024-11-05",
    "capabilities": {},
    "clientInfo": {
      "name": "Client Name",
      "version": "1.0.0"
    }
  }
}
```

#### 2. `tools/list`

Get available tools.

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/list",
  "params": {}
}
```

#### 3. `tools/call`

Call a specific tool.

**Validate Tool:**

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "validate",
    "arguments": {
      "token": "your_bearer_token"
    }
  }
}
```

**GetNews Tool:**

```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "method": "tools/call",
  "params": {
    "name": "getNews",
    "arguments": {}
  }
}
```

## Available Tools

### 1. validate

- **Description**: Validate bearer token and return user phone number
- **Input**: `{ "token": "string" }`
- **Output**: `{ "phone": "919901470297" }` or error

### 2. getNews

- **Description**: Fetch top 5 headlines from major news sources
- **Input**: `{}` (no parameters required)
- **Output**: News data from multiple sources

## Environment Variables

Set the following environment variable in your deployment:

```env
MCP_BEARER_TOKEN=mcp_secret_token@123
```

## Testing

Run the test script to verify the MCP server:

```powershell
.\test-mcp-server.ps1
```

## Connecting to Puch AI

1. Use the connect command in Puch:

   ```
   /mcp connect https://mcp-demo-gamma.vercel.app/api/mcp mcp_secret_token@123
   ```

2. Verify connection and available tools:
   ```
   /mcp list
   ```

## Deployment

This server is deployed on Vercel and accessible at:

- **Production URL**: https://mcp-demo-gamma.vercel.app/api/mcp
- **GitHub**: https://github.com/AnanteshG/MCP-demo

## Protocol Compliance

This server implements:

- ✅ Core protocol messages
- ✅ Tool definitions and calls
- ✅ Authentication (Bearer token)
- ✅ Error handling
- ✅ HTTPS requirement
- ✅ Phone number validation format

## Development

1. Clone the repository
2. Install dependencies: `npm install`
3. Set environment variables
4. Run development server: `npm run dev`
5. Test locally on `http://localhost:3001/api/mcp`

## License

MIT License
