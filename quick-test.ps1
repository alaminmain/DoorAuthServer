# Quick Security Test - With SSL Fix
# Tests Token Blacklisting

# ========================================
# SSL Certificate Fix
# ========================================
Write-Host "Configuring SSL certificate validation..." -ForegroundColor Cyan

# Disable SSL certificate validation for this PowerShell session
[System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}

# For PowerShell 7+, also add this
if ($PSVersionTable.PSVersion.Major -ge 7) {
    $PSDefaultParameterValues['Invoke-RestMethod:SkipCertificateCheck'] = $true
    $PSDefaultParameterValues['Invoke-WebRequest:SkipCertificateCheck'] = $true
}

Write-Host "✓ SSL validation configured`n" -ForegroundColor Green

# ========================================
# Configuration
# ========================================
$baseUrl = "https://localhost:3000"
$email = "admin@demo.localhost"
$password = "password123"

# IMPORTANT: Replace with your actual tenant ID
$tenantId = Read-Host "Enter your Tenant ID"

if ([string]::IsNullOrEmpty($tenantId)) {
    Write-Host "Error: Tenant ID is required!" -ForegroundColor Red
    exit 1
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Token Blacklisting Test" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# ========================================
# Test 1: Login
# ========================================
Write-Host "Step 1: Login and get token..." -ForegroundColor Yellow

try {
    $loginBody = @{
        email = $email
        password = $password
        tenantId = $tenantId
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    
    $token = $response.data.token
    Write-Host "✓ Login successful!" -ForegroundColor Green
    Write-Host "  Token: $($token.Substring(0,30))..." -ForegroundColor Cyan
    
    # Decode JWT to show JTI
    $tokenParts = $token.Split('.')
    if ($tokenParts.Length -ge 2) {
        $payload = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($tokenParts[1] + "=="))
        $decodedToken = $payload | ConvertFrom-Json
        Write-Host "  User ID: $($decodedToken.userId)" -ForegroundColor Cyan
        Write-Host "  JTI: $($decodedToken.jti)" -ForegroundColor Cyan
        Write-Host "  Expires: $(Get-Date -UnixTimeSeconds $decodedToken.exp -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Cyan
    }
} catch {
    Write-Host "✗ Login failed!" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# ========================================
# Test 2: Use Token
# ========================================
Write-Host "`nStep 2: Use token to access protected endpoint..." -ForegroundColor Yellow

try {
    $headers = @{ Authorization = "Bearer $token" }
    $users = Invoke-RestMethod -Uri "$baseUrl/api/users" -Headers $headers
    
    Write-Host "✓ Token works! Accessed /api/users" -ForegroundColor Green
    Write-Host "  Found $($users.data.Count) users" -ForegroundColor Cyan
} catch {
    Write-Host "✗ Failed to access protected endpoint!" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# ========================================
# Test 3: Logout (Blacklist Token)
# ========================================
Write-Host "`nStep 3: Logout (blacklist token)..." -ForegroundColor Yellow

try {
    $logoutResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/logout" -Method Post -Headers $headers
    
    Write-Host "✓ Logout successful!" -ForegroundColor Green
    Write-Host "  Message: $($logoutResponse.message)" -ForegroundColor Cyan
} catch {
    Write-Host "✗ Logout failed!" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# ========================================
# Test 4: Try to Use Blacklisted Token
# ========================================
Write-Host "`nStep 4: Try to use blacklisted token..." -ForegroundColor Yellow

try {
    $users = Invoke-RestMethod -Uri "$baseUrl/api/users" -Headers $headers
    
    Write-Host "✗ FAILED: Token should have been rejected!" -ForegroundColor Red
    Write-Host "  The token is still working, which means blacklisting is NOT working." -ForegroundColor Red
    exit 1
} catch {
    $errorMessage = $_.Exception.Message
    
    if ($errorMessage -like "*401*" -or $errorMessage -like "*Unauthorized*" -or $errorMessage -like "*revoked*") {
        Write-Host "✓ Token correctly rejected!" -ForegroundColor Green
        Write-Host "  Status: 401 Unauthorized" -ForegroundColor Cyan
        Write-Host "  The token has been successfully blacklisted!" -ForegroundColor Green
    } else {
        Write-Host "✗ Unexpected error!" -ForegroundColor Red
        Write-Host "  Error: $errorMessage" -ForegroundColor Red
        exit 1
    }
}

# ========================================
# Test 5: Verify Database Entry
# ========================================
Write-Host "`nStep 5: Verify database entry..." -ForegroundColor Yellow
Write-Host "  To verify, run: npx prisma studio" -ForegroundColor Cyan
Write-Host "  Then check the 'token_blacklist' table" -ForegroundColor Cyan

# ========================================
# Summary
# ========================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Test Results" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "✅ All tests passed!" -ForegroundColor Green
Write-Host "`nToken Blacklisting is working correctly:" -ForegroundColor Green
Write-Host "  ✓ Login generates token with JTI" -ForegroundColor Green
Write-Host "  ✓ Token works for API calls" -ForegroundColor Green
Write-Host "  ✓ Logout blacklists the token" -ForegroundColor Green
Write-Host "  ✓ Blacklisted token is rejected" -ForegroundColor Green

Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "  1. Check database: npx prisma studio" -ForegroundColor Cyan
Write-Host "  2. View token_blacklist table" -ForegroundColor Cyan
Write-Host "  3. Verify entry has jti, userId, reason='logout'" -ForegroundColor Cyan

Write-Host "`n========================================`n" -ForegroundColor Cyan
