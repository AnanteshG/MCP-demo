# Connectivity Test for MCP Server
Write-Host "Testing MCP Server Connectivity..." -ForegroundColor Cyan

$baseUrl = "https://mcp-demo-gamma.vercel.app/api/mcp"

# Test 1: Check if server responds to GET (discovery)
Write-Host "`n1. Testing server discovery (GET)..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri $baseUrl -Method GET -TimeoutSec 10
    Write-Host "✓ Server discovery successful" -ForegroundColor Green
    Write-Host "Server: $($response.name) v$($response.version)" -ForegroundColor White
} catch {
    Write-Host "✗ Server discovery failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Test connection timeout specifically
Write-Host "`n2. Testing connection timeout..." -ForegroundColor Yellow
try {
    $start = Get-Date
    $response = Invoke-RestMethod -Uri $baseUrl -Method GET -TimeoutSec 5
    $duration = (Get-Date) - $start
    Write-Host "✓ Connection established in $($duration.TotalMilliseconds)ms" -ForegroundColor Green
} catch {
    $duration = (Get-Date) - $start
    Write-Host "✗ Connection timeout after $($duration.TotalMilliseconds)ms: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Test initialize with proper timeout
Write-Host "`n3. Testing initialize handshake..." -ForegroundColor Yellow
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

# Test 4: Test with curl to ensure compatibility
Write-Host "`n4. Testing with curl for Puch AI compatibility..." -ForegroundColor Yellow
try {
    $curlResult = & curl.exe -X GET $baseUrl -w "%{http_code},%{time_total}" -s -o temp_response.json 2>$null
    if ($LASTEXITCODE -eq 0) {
        $httpCode = ($curlResult -split ',')[0]
        $timeTotal = ($curlResult -split ',')[1]
        
        if ($httpCode -eq "200") {
            Write-Host "✓ Curl test successful (HTTP $httpCode in ${timeTotal}s)" -ForegroundColor Green
            $content = Get-Content temp_response.json | ConvertFrom-Json
            Write-Host "Server accessible via curl: $($content.name)" -ForegroundColor White
        } else {
            Write-Host "✗ Curl test failed with HTTP code: $httpCode" -ForegroundColor Red
        }
    } else {
        Write-Host "✗ Curl command failed" -ForegroundColor Red
    }
    
    Remove-Item temp_response.json -ErrorAction SilentlyContinue
} catch {
    Write-Host "✗ Curl test error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nConnectivity Test Complete!" -ForegroundColor Cyan
Write-Host "If all tests pass, try connecting again with:" -ForegroundColor Yellow
Write-Host "/mcp connect $baseUrl mcp_secret_token@123" -ForegroundColor White
