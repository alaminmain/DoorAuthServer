# Test Script: Session Management & Email Verification
# Tests the complete integration of session and email verification features

param(
    [string]$BaseUrl = "https://localhost:3000",
    [string]$TenantId = "",
    [string]$TestEmail = "test-$(Get-Random)@example.com",
    [string]$TestPassword = "Test123!@#",
    [string]$TestUserName = "Test User"
)

# Colors
$Green = "Green"
$Red = "Red"
$Yellow = "Yellow"
$Cyan = "Cyan"
$Magenta = "Magenta"

Write-Host "`n========================================" -ForegroundColor $Cyan
Write-Host "  Session & Email Verification Test" -ForegroundColor $Cyan
Write-Host "========================================`n" -ForegroundColor $Cyan

# SSL Certificate Fix
[System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}
if ($PSVersionTable.PSVersion.Major -ge 7) {
    $PSDefaultParameterValues['Invoke-RestMethod:SkipCertificateCheck'] = $true
    $PSDefaultParameterValues['Invoke-WebRequest:SkipCertificateCheck'] = $true
}

# Get Tenant ID if not provided
if ([string]::IsNullOrEmpty($TenantId)) {
    Write-Host "⚠️  No Tenant ID provided." -ForegroundColor $Yellow
    $TenantId = Read-Host "Enter your Tenant ID"
    if ([string]::IsNullOrEmpty($TenantId)) {
        Write-Host "Error: Tenant ID is required!" -ForegroundColor $Red
        exit 1
    }
}

Write-Host "Test Configuration:" -ForegroundColor $Cyan
Write-Host "  Base URL: $BaseUrl" -ForegroundColor $Cyan
Write-Host "  Tenant ID: $TenantId" -ForegroundColor $Cyan
Write-Host "  Test Email: $TestEmail" -ForegroundColor $Cyan
Write-Host ""

$testsPassed = 0
$testsFailed = 0

function Test-Feature {
    param(
        [string]$Name,
        [scriptblock]$Test,
        [string]$ExpectedResult = ""
    )
    
    Write-Host "Testing: $Name..." -ForegroundColor $Yellow
    
    try {
        $result = & $Test
        
        if ($result) {
            Write-Host "  ✓ PASS: $Name" -ForegroundColor $Green
            if ($ExpectedResult) {
                Write-Host "    $ExpectedResult" -ForegroundColor $Cyan
            }
            $script:testsPassed++
            return $result
        } else {
            Write-Host "  ✗ FAIL: $Name" -ForegroundColor $Red
            $script:testsFailed++
            return $null
        }
    } catch {
        Write-Host "  ✗ FAIL: $Name" -ForegroundColor $Red
        Write-Host "    Error: $($_.Exception.Message)" -ForegroundColor $Red
        $script:testsFailed++
        return $null
    }
}

# ========================================
# Test 1: Registration with Email Verification
# ========================================
Write-Host "`n========================================" -ForegroundColor $Cyan
Write-Host "  Test Suite 1: Registration" -ForegroundColor $Cyan
Write-Host "========================================`n" -ForegroundColor $Cyan

$registrationData = $null
$registrationData = Test-Feature -Name "User Registration" -Test {
    $body = @{
        email = $TestEmail
        password = $TestPassword
        userName = $TestUserName
        tenantId = $TenantId
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$BaseUrl/api/auth/register" `
        -Method Post `
        -Body $body `
        -ContentType "application/json"
    
    if ($response.success -and $response.data.user) {
        Write-Host "    User ID: $($response.data.user.id)" -ForegroundColor $Cyan
        Write-Host "    Email: $($response.data.user.email)" -ForegroundColor $Cyan
        Write-Host "    Email Verified: $($response.data.user.emailVerified)" -ForegroundColor $Cyan
        return $response.data
    }
    return $null
} -ExpectedResult "User created successfully"

if (-not $registrationData) {
    Write-Host "`n✗ Registration failed. Cannot continue." -ForegroundColor $Red
    exit 1
}

# Check email verification status
Test-Feature -Name "Email Not Verified After Registration" -Test {
    return $registrationData.user.emailVerified -eq $false
} -ExpectedResult "Email should not be verified immediately"

# Check for verification message
Test-Feature -Name "Verification Message Returned" -Test {
    return $registrationData.message -like "*email*verify*"
} -ExpectedResult "Message should mention email verification"

# ========================================
# Test 2: Email Verification Workflow
# ========================================
Write-Host "`n========================================" -ForegroundColor $Cyan
Write-Host "  Test Suite 2: Email Verification" -ForegroundColor $Cyan
Write-Host "========================================`n" -ForegroundColor $Cyan

Write-Host "⚠️  Email Verification Token:" -ForegroundColor $Yellow
Write-Host "    Check the server console for the verification URL" -ForegroundColor $Yellow
Write-Host "    Look for: 'Verification URL: http://...'" -ForegroundColor $Yellow
Write-Host ""

$verificationToken = Read-Host "Enter the verification token from the server console (or press Enter to skip)"

if (-not [string]::IsNullOrEmpty($verificationToken)) {
    Test-Feature -Name "Email Verification" -Test {
        $body = @{
            token = $verificationToken
        } | ConvertTo-Json

        $response = Invoke-RestMethod -Uri "$BaseUrl/api/auth/verify-email" `
            -Method Post `
            -Body $body `
            -ContentType "application/json"
        
        return $response.success
    } -ExpectedResult "Email verified successfully"
} else {
    Write-Host "  ⊘ SKIP: Email verification (no token provided)" -ForegroundColor $Yellow
}

# ========================================
# Test 3: Login with Session Creation
# ========================================
Write-Host "`n========================================" -ForegroundColor $Cyan
Write-Host "  Test Suite 3: Login & Session" -ForegroundColor $Cyan
Write-Host "========================================`n" -ForegroundColor $Cyan

$loginData = $null
$loginData = Test-Feature -Name "User Login" -Test {
    $body = @{
        email = $TestEmail
        password = $TestPassword
        tenantId = $TenantId
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$BaseUrl/api/auth/login" `
        -Method Post `
        -Body $body `
        -ContentType "application/json"
    
    if ($response.success -and $response.data.token) {
        Write-Host "    Token: $($response.data.token.Substring(0, 30))..." -ForegroundColor $Cyan
        Write-Host "    Email Verified: $($response.data.emailVerified)" -ForegroundColor $Cyan
        if ($response.data.sessionToken) {
            Write-Host "    Session Token: $($response.data.sessionToken.Substring(0, 20))..." -ForegroundColor $Cyan
        }
        return $response.data
    }
    return $null
} -ExpectedResult "Login successful with token"

if (-not $loginData) {
    Write-Host "`n✗ Login failed. Cannot continue." -ForegroundColor $Red
    exit 1
}

# Check session token
Test-Feature -Name "Session Token Created" -Test {
    return -not [string]::IsNullOrEmpty($loginData.sessionToken)
} -ExpectedResult "Session token should be present"

# Check JWT has JTI
Test-Feature -Name "JWT Contains JTI" -Test {
    $tokenParts = $loginData.token.Split('.')
    if ($tokenParts.Length -ge 2) {
        $payload = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($tokenParts[1] + "=="))
        $decodedToken = $payload | ConvertFrom-Json
        
        if ($decodedToken.jti) {
            Write-Host "    JTI: $($decodedToken.jti)" -ForegroundColor $Cyan
            Write-Host "    User ID: $($decodedToken.userId)" -ForegroundColor $Cyan
            Write-Host "    Expires: $(Get-Date -UnixTimeSeconds $decodedToken.exp -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor $Cyan
            return $true
        }
    }
    return $false
} -ExpectedResult "JWT should contain JTI for token blacklisting"

# ========================================
# Test 4: Verification Status Check
# ========================================
Write-Host "`n========================================" -ForegroundColor $Cyan
Write-Host "  Test Suite 4: Verification Status" -ForegroundColor $Cyan
Write-Host "========================================`n" -ForegroundColor $Cyan

$token = $loginData.token
$headers = @{ Authorization = "Bearer $token" }

Test-Feature -Name "Get Verification Status" -Test {
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/auth/verification-status" `
        -Headers $headers
    
    if ($response.success -and $response.data) {
        Write-Host "    Email: $($response.data.email)" -ForegroundColor $Cyan
        Write-Host "    Is Verified: $($response.data.isVerified)" -ForegroundColor $Cyan
        Write-Host "    Verified At: $($response.data.verifiedAt)" -ForegroundColor $Cyan
        Write-Host "    Has Pending: $($response.data.hasPendingVerification)" -ForegroundColor $Cyan
        return $true
    }
    return $false
} -ExpectedResult "Status retrieved successfully"

# ========================================
# Test 5: Resend Verification (if not verified)
# ========================================
if ($loginData.emailVerified -eq $false) {
    Write-Host "`n========================================" -ForegroundColor $Cyan
    Write-Host "  Test Suite 5: Resend Verification" -ForegroundColor $Cyan
    Write-Host "========================================`n" -ForegroundColor $Cyan

    Test-Feature -Name "Resend Verification Email" -Test {
        $response = Invoke-RestMethod -Uri "$BaseUrl/api/auth/resend-verification" `
            -Method Post `
            -Headers $headers
        
        return $response.success
    } -ExpectedResult "Verification email resent"

    Write-Host "`n  Check server console for new verification URL" -ForegroundColor $Yellow
}

# ========================================
# Test 6: Token Blacklisting (Logout)
# ========================================
Write-Host "`n========================================" -ForegroundColor $Cyan
Write-Host "  Test Suite 6: Token Blacklisting" -ForegroundColor $Cyan
Write-Host "========================================`n" -ForegroundColor $Cyan

Test-Feature -Name "Logout (Blacklist Token)" -Test {
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/auth/logout" `
        -Method Post `
        -Headers $headers
    
    return $response.success
} -ExpectedResult "Logout successful, token blacklisted"

Test-Feature -Name "Blacklisted Token Rejected" -Test {
    try {
        Invoke-RestMethod -Uri "$BaseUrl/api/users" -Headers $headers
        return $false  # Should have failed
    } catch {
        # Expected to fail with 401
        return $_.Exception.Response.StatusCode.value__ -eq 401
    }
} -ExpectedResult "Token should be rejected after logout"

# ========================================
# Test 7: Database Verification
# ========================================
Write-Host "`n========================================" -ForegroundColor $Cyan
Write-Host "  Test Suite 7: Database Checks" -ForegroundColor $Cyan
Write-Host "========================================`n" -ForegroundColor $Cyan

Write-Host "Manual Database Verification:" -ForegroundColor $Yellow
Write-Host "  1. Open Prisma Studio: npx prisma studio" -ForegroundColor $Cyan
Write-Host "  2. Check 'users' table:" -ForegroundColor $Cyan
Write-Host "     - Email: $TestEmail" -ForegroundColor $Cyan
Write-Host "     - emailVerified field should exist" -ForegroundColor $Cyan
Write-Host "  3. Check 'sessions' table:" -ForegroundColor $Cyan
Write-Host "     - Should have session entry" -ForegroundColor $Cyan
Write-Host "     - Check deviceInfo, browser, os, ipAddress" -ForegroundColor $Cyan
Write-Host "  4. Check 'email_verifications' table:" -ForegroundColor $Cyan
Write-Host "     - Should have verification entry" -ForegroundColor $Cyan
Write-Host "  5. Check 'token_blacklist' table:" -ForegroundColor $Cyan
Write-Host "     - Should have blacklisted token from logout" -ForegroundColor $Cyan
Write-Host ""

# ========================================
# Test Results
# ========================================
Write-Host "`n========================================" -ForegroundColor $Cyan
Write-Host "  Test Results" -ForegroundColor $Cyan
Write-Host "========================================`n" -ForegroundColor $Cyan

$total = $testsPassed + $testsFailed
$passRate = if ($total -gt 0) { [math]::Round(($testsPassed / $total) * 100, 2) } else { 0 }

Write-Host "Total Tests: $total" -ForegroundColor $Cyan
Write-Host "Passed: $testsPassed" -ForegroundColor $Green
Write-Host "Failed: $testsFailed" -ForegroundColor $(if ($testsFailed -eq 0) { $Green } else { $Red })
Write-Host "Pass Rate: $passRate%" -ForegroundColor $(if ($passRate -eq 100) { $Green } else { $Yellow })

Write-Host "`nTest User Created:" -ForegroundColor $Magenta
Write-Host "  Email: $TestEmail" -ForegroundColor $Cyan
Write-Host "  Password: $TestPassword" -ForegroundColor $Cyan
Write-Host "  Tenant ID: $TenantId" -ForegroundColor $Cyan

if ($testsFailed -eq 0) {
    Write-Host "`n✅ All tests passed! Session & Email Verification working correctly." -ForegroundColor $Green
} else {
    Write-Host "`n⚠️  Some tests failed. Please review the output above." -ForegroundColor $Yellow
}

Write-Host "`n========================================" -ForegroundColor $Cyan
Write-Host "  Next Steps" -ForegroundColor $Cyan
Write-Host "========================================`n" -ForegroundColor $Cyan

Write-Host "1. Check server console for verification URLs" -ForegroundColor $Yellow
Write-Host "2. Open Prisma Studio to verify database entries" -ForegroundColor $Yellow
Write-Host "3. Test email verification with the token" -ForegroundColor $Yellow
Write-Host "4. Check session details in database" -ForegroundColor $Yellow
Write-Host ""

Write-Host "Commands:" -ForegroundColor $Cyan
Write-Host "  npx prisma studio  # View database" -ForegroundColor $Cyan
Write-Host "  npm run dev        # Check server logs" -ForegroundColor $Cyan
Write-Host ""
