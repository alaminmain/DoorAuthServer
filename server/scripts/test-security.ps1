# Security Features Test Script
# Tests Rate Limiting and Token Blacklisting

param(
    [string]$BaseUrl = "https://localhost:3000",
    [string]$TenantId = "",
    [string]$Email = "admin@demo.localhost",
    [string]$Password = "password123"
)

# Colors for output
$Green = "Green"
$Red = "Red"
$Yellow = "Yellow"
$Cyan = "Cyan"

Write-Host "`n========================================" -ForegroundColor $Cyan
Write-Host "  DoorAuth Security Features Test" -ForegroundColor $Cyan
Write-Host "========================================`n" -ForegroundColor $Cyan

# Get Tenant ID if not provided
if ([string]::IsNullOrEmpty($TenantId)) {
    Write-Host "⚠️  No Tenant ID provided. Attempting to fetch from database..." -ForegroundColor $Yellow
    Write-Host "Please provide a Tenant ID using -TenantId parameter" -ForegroundColor $Yellow
    Write-Host "Example: .\test-security.ps1 -TenantId 'your-tenant-id-here'`n" -ForegroundColor $Yellow
    exit 1
}

# Disable SSL certificate validation for localhost
[System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}
Add-Type @"
    using System.Net;
    using System.Security.Cryptography.X509Certificates;
    public class TrustAllCertsPolicy : ICertificatePolicy {
        public bool CheckValidationResult(
            ServicePoint srvPoint, X509Certificate certificate,
            WebRequest request, int certificateProblem) {
            return true;
        }
    }
"@
[System.Net.ServicePointManager]::CertificatePolicy = New-Object TrustAllCertsPolicy

# Test Counter
$testsPassed = 0
$testsFailed = 0

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Uri,
        [hashtable]$Headers = @{},
        [object]$Body = $null,
        [int]$ExpectedStatus = 200,
        [string]$ExpectedMessage = ""
    )
    
    Write-Host "Testing: $Name..." -ForegroundColor $Yellow
    
    try {
        $params = @{
            Uri = $Uri
            Method = $Method
            Headers = $Headers
            ContentType = "application/json"
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json)
        }
        
        $response = Invoke-WebRequest @params -UseBasicParsing
        $content = $response.Content | ConvertFrom-Json
        
        if ($response.StatusCode -eq $ExpectedStatus) {
            Write-Host "  ✓ PASS: $Name" -ForegroundColor $Green
            if ($ExpectedMessage -and $content.message -like "*$ExpectedMessage*") {
                Write-Host "    Message: $($content.message)" -ForegroundColor $Green
            }
            $script:testsPassed++
            return $content
        } else {
            Write-Host "  ✗ FAIL: Expected status $ExpectedStatus, got $($response.StatusCode)" -ForegroundColor $Red
            $script:testsFailed++
            return $null
        }
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        
        if ($statusCode -eq $ExpectedStatus) {
            Write-Host "  ✓ PASS: $Name (Expected error $ExpectedStatus)" -ForegroundColor $Green
            $script:testsPassed++
            return $true
        } else {
            Write-Host "  ✗ FAIL: $Name" -ForegroundColor $Red
            Write-Host "    Error: $($_.Exception.Message)" -ForegroundColor $Red
            $script:testsFailed++
            return $null
        }
    }
}

# ========================================
# Test 1: Rate Limiting
# ========================================
Write-Host "`n========================================" -ForegroundColor $Cyan
Write-Host "  Test Suite 1: Rate Limiting" -ForegroundColor $Cyan
Write-Host "========================================`n" -ForegroundColor $Cyan

Write-Host "Testing login rate limit (5 attempts allowed)..." -ForegroundColor $Yellow

for ($i = 1; $i -le 6; $i++) {
    Write-Host "`nAttempt $i of 6..." -ForegroundColor $Cyan
    
    $expectedStatus = if ($i -le 5) { 401 } else { 429 }
    
    Test-Endpoint `
        -Name "Login Attempt $i" `
        -Method "POST" `
        -Uri "$BaseUrl/api/auth/login" `
        -Body @{
            email = "wrong@example.com"
            password = "wrongpassword"
            tenantId = $TenantId
        } `
        -ExpectedStatus $expectedStatus
    
    Start-Sleep -Milliseconds 500
}

# ========================================
# Test 2: Token Blacklisting
# ========================================
Write-Host "`n========================================" -ForegroundColor $Cyan
Write-Host "  Test Suite 2: Token Blacklisting" -ForegroundColor $Cyan
Write-Host "========================================`n" -ForegroundColor $Cyan

# Step 1: Login
Write-Host "`nStep 1: Login and get token..." -ForegroundColor $Yellow
$loginResponse = Test-Endpoint `
    -Name "Login" `
    -Method "POST" `
    -Uri "$BaseUrl/api/auth/login" `
    -Body @{
        email = $Email
        password = $Password
        tenantId = $TenantId
    } `
    -ExpectedStatus 200

if (-not $loginResponse) {
    Write-Host "`n✗ Login failed. Cannot continue with token blacklisting tests." -ForegroundColor $Red
    exit 1
}

$token = $loginResponse.data.token
Write-Host "  Token received: $($token.Substring(0, 30))..." -ForegroundColor $Green

# Decode JWT to show JTI
Write-Host "`n  Decoding JWT to verify JTI..." -ForegroundColor $Cyan
$tokenParts = $token.Split('.')
$payload = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($tokenParts[1] + "=="))
$decodedToken = $payload | ConvertFrom-Json
Write-Host "    User ID: $($decodedToken.userId)" -ForegroundColor $Cyan
Write-Host "    JTI: $($decodedToken.jti)" -ForegroundColor $Cyan
Write-Host "    Expires: $(Get-Date -UnixTimeSeconds $decodedToken.exp)" -ForegroundColor $Cyan

# Step 2: Use token to access protected endpoint
Write-Host "`nStep 2: Access protected endpoint with token..." -ForegroundColor $Yellow
$headers = @{ Authorization = "Bearer $token" }
$usersResponse = Test-Endpoint `
    -Name "Get Users (with valid token)" `
    -Method "GET" `
    -Uri "$BaseUrl/api/users" `
    -Headers $headers `
    -ExpectedStatus 200

if ($usersResponse) {
    Write-Host "  Found $($usersResponse.data.Count) users" -ForegroundColor $Green
}

# Step 3: Logout (blacklist token)
Write-Host "`nStep 3: Logout (blacklist token)..." -ForegroundColor $Yellow
Test-Endpoint `
    -Name "Logout" `
    -Method "POST" `
    -Uri "$BaseUrl/api/auth/logout" `
    -Headers $headers `
    -ExpectedStatus 200 `
    -ExpectedMessage "Logout successful"

# Step 4: Try to use blacklisted token
Write-Host "`nStep 4: Try to use blacklisted token..." -ForegroundColor $Yellow
Test-Endpoint `
    -Name "Get Users (with blacklisted token)" `
    -Method "GET" `
    -Uri "$BaseUrl/api/users" `
    -Headers $headers `
    -ExpectedStatus 401

# ========================================
# Test 3: Multiple Tokens
# ========================================
Write-Host "`n========================================" -ForegroundColor $Cyan
Write-Host "  Test Suite 3: Multiple Tokens" -ForegroundColor $Cyan
Write-Host "========================================`n" -ForegroundColor $Cyan

# Login twice to get two tokens
Write-Host "Creating two separate sessions..." -ForegroundColor $Yellow

$login1 = Test-Endpoint `
    -Name "Login Session 1" `
    -Method "POST" `
    -Uri "$BaseUrl/api/auth/login" `
    -Body @{
        email = $Email
        password = $Password
        tenantId = $TenantId
    } `
    -ExpectedStatus 200

$token1 = $login1.data.token

Start-Sleep -Seconds 1

$login2 = Test-Endpoint `
    -Name "Login Session 2" `
    -Method "POST" `
    -Uri "$BaseUrl/api/auth/login" `
    -Body @{
        email = $Email
        password = $Password
        tenantId = $TenantId
    } `
    -ExpectedStatus 200

$token2 = $login2.data.token

Write-Host "`nVerifying both tokens work..." -ForegroundColor $Yellow

Test-Endpoint `
    -Name "Access with Token 1" `
    -Method "GET" `
    -Uri "$BaseUrl/api/users" `
    -Headers @{ Authorization = "Bearer $token1" } `
    -ExpectedStatus 200

Test-Endpoint `
    -Name "Access with Token 2" `
    -Method "GET" `
    -Uri "$BaseUrl/api/users" `
    -Headers @{ Authorization = "Bearer $token2" } `
    -ExpectedStatus 200

Write-Host "`nLogging out Session 1..." -ForegroundColor $Yellow
Test-Endpoint `
    -Name "Logout Session 1" `
    -Method "POST" `
    -Uri "$BaseUrl/api/auth/logout" `
    -Headers @{ Authorization = "Bearer $token1" } `
    -ExpectedStatus 200

Write-Host "`nVerifying Token 1 is blacklisted but Token 2 still works..." -ForegroundColor $Yellow

Test-Endpoint `
    -Name "Access with Token 1 (should fail)" `
    -Method "GET" `
    -Uri "$BaseUrl/api/users" `
    -Headers @{ Authorization = "Bearer $token1" } `
    -ExpectedStatus 401

Test-Endpoint `
    -Name "Access with Token 2 (should work)" `
    -Method "GET" `
    -Uri "$BaseUrl/api/users" `
    -Headers @{ Authorization = "Bearer $token2" } `
    -ExpectedStatus 200

# ========================================
# Test Results
# ========================================
Write-Host "`n========================================" -ForegroundColor $Cyan
Write-Host "  Test Results" -ForegroundColor $Cyan
Write-Host "========================================`n" -ForegroundColor $Cyan

$total = $testsPassed + $testsFailed
$passRate = [math]::Round(($testsPassed / $total) * 100, 2)

Write-Host "Total Tests: $total" -ForegroundColor $Cyan
Write-Host "Passed: $testsPassed" -ForegroundColor $Green
Write-Host "Failed: $testsFailed" -ForegroundColor $(if ($testsFailed -eq 0) { $Green } else { $Red })
Write-Host "Pass Rate: $passRate%" -ForegroundColor $(if ($passRate -eq 100) { $Green } else { $Yellow })

if ($testsFailed -eq 0) {
    Write-Host "`n✅ All tests passed! Security features are working correctly." -ForegroundColor $Green
} else {
    Write-Host "`n⚠️  Some tests failed. Please review the output above." -ForegroundColor $Yellow
}

Write-Host "`n========================================`n" -ForegroundColor $Cyan
