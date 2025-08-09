Write-Host "Testing MCP Server Connectivity..." -ForegroundColor Cyan
$baseUrl = "https://mcp-demo-gamma.vercel.app/api/mcp"

Write-Host "`n1. Testing server discovery..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri $baseUrl -Method GET -TimeoutSec 10
    Write-Host "✓ Server discovery successful" -ForegroundColor Green
    Write-Host "Server: $($response.name) v$($response.version)" -ForegroundColor White
} catch {
    Write-Host "✗ Server discovery failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n2. Testing initialize handshake..." -ForegroundColor Yellow
try {
    $initBody = @{
        jsonrpc = "2.0"
        id = 1
        method = "initialize"
        params = @{
            protocolVersion = "2024-11-05"
            capabilities = @{}
        }
    } | ConvertTo-Json -Depth 3

    $response = Invoke-RestMethod -Uri $baseUrl -Method POST -Body $initBody -ContentType "application/json" -TimeoutSec 10
    Write-Host "✓ Initialize handshake successful" -ForegroundColor Green
    Write-Host "Protocol: $($response.result.protocolVersion)" -ForegroundColor White
} catch {
    Write-Host "✗ Initialize handshake failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n3. Testing validate tool..." -ForegroundColor Yellow
try {
    $validateBody = @{
        jsonrpc = "2.0"
        id = 3
        method = "tools/call"
        params = @{
            name = "validate"
            arguments = @{
                token = "mcp_secret_token@123"
            }
        }
    } | ConvertTo-Json -Depth 3

    $response = Invoke-RestMethod -Uri $baseUrl -Method POST -Body $validateBody -ContentType "application/json" -TimeoutSec 10
    Write-Host "✓ Validate tool successful" -ForegroundColor Green
    $content = $response.result.content[0].text | ConvertFrom-Json
    Write-Host "Phone: $($content.phone)" -ForegroundColor White
} catch {
    Write-Host "✗ Validate tool failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nConnectivity Test Complete!" -ForegroundColor Cyan
Write-Host "Try connecting with: /mcp connect $baseUrl mcp_secret_token@123" -ForegroundColor White
