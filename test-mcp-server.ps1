# Test MCP Server Implementation
Write-Host "Testing MCP Server Implementation..." -ForegroundColor Cyan

$baseUrl = "https://mcp-demo-gamma.vercel.app/api/mcp"
$headers = @{ "Content-Type" = "application/json" }

Write-Host "`n1. Testing initialize..." -ForegroundColor Yellow
try {
    $initBody = @{
        jsonrpc = "2.0"
        id = 1
        method = "initialize"
        params = @{
            protocolVersion = "2024-11-05"
            capabilities = @{}
            clientInfo = @{
                name = "Test Client"
                version = "1.0.0"
            }
        }
    } | ConvertTo-Json -Depth 3

    $response = Invoke-RestMethod -Uri $baseUrl -Method POST -Headers $headers -Body $initBody
    Write-Host "✓ Initialize successful" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 3) -ForegroundColor White
} catch {
    Write-Host "✗ Initialize failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n2. Testing tools/list..." -ForegroundColor Yellow
try {
    $toolsBody = @{
        jsonrpc = "2.0"
        id = 2
        method = "tools/list"
        params = @{}
    } | ConvertTo-Json -Depth 2

    $response = Invoke-RestMethod -Uri $baseUrl -Method POST -Headers $headers -Body $toolsBody
    Write-Host "✓ Tools list successful" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 5) -ForegroundColor White
} catch {
    Write-Host "✗ Tools list failed: $($_.Exception.Message)" -ForegroundColor Red
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

    $response = Invoke-RestMethod -Uri $baseUrl -Method POST -Headers $headers -Body $validateBody
    Write-Host "✓ Validate tool successful" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 5) -ForegroundColor White
} catch {
    Write-Host "✗ Validate tool failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n4. Testing getNews tool..." -ForegroundColor Yellow
try {
    $newsBody = @{
        jsonrpc = "2.0"
        id = 4
        method = "tools/call"
        params = @{
            name = "getNews"
            arguments = @{}
        }
    } | ConvertTo-Json -Depth 3

    $response = Invoke-RestMethod -Uri $baseUrl -Method POST -Headers $headers -Body $newsBody
    Write-Host "✓ GetNews tool successful" -ForegroundColor Green
    $content = ($response.result.content[0].text | ConvertFrom-Json)
    Write-Host "News sources found: $($content.news.PSObject.Properties.Name -join ', ')" -ForegroundColor White
} catch {
    Write-Host "✗ GetNews tool failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n5. Testing with invalid token..." -ForegroundColor Yellow
try {
    $invalidBody = @{
        jsonrpc = "2.0"
        id = 5
        method = "tools/call"
        params = @{
            name = "validate"
            arguments = @{
                token = "invalid_token"
            }
        }
    } | ConvertTo-Json -Depth 3

    $response = Invoke-RestMethod -Uri $baseUrl -Method POST -Headers $headers -Body $invalidBody
    if ($response.result.isError -eq $true) {
        Write-Host "✓ Invalid token properly rejected" -ForegroundColor Green
    } else {
        Write-Host "✗ Invalid token was accepted (should be rejected)" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Invalid token test failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nMCP Server Testing Complete!" -ForegroundColor Cyan
