# DoorAuth - Create Tenant Admin User
# This script creates a tenant admin user with full permissions

param(
    [string]$BaseUrl = "https://localhost:3000/api",
    [string]$TenantId = "default-tenant",
    [string]$AdminEmail = "admin@doorauth.local",
    [string]$AdminPassword = "Admin123!",
    [string]$AdminName = "Tenant Administrator"
)

Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  DoorAuth - Tenant Admin Creation Script" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Configuration Summary
Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "  API URL:     $BaseUrl" -ForegroundColor Gray
Write-Host "  Tenant ID:   $TenantId" -ForegroundColor Gray
Write-Host "  Email:       $AdminEmail" -ForegroundColor Gray
Write-Host "  Password:    $AdminPassword" -ForegroundColor Gray
Write-Host "  Name:        $AdminName" -ForegroundColor Gray
Write-Host ""

try {
    # Step 1: Register User
    Write-Host "[1/4] Creating admin user..." -ForegroundColor Cyan
    $registerBody = @{
        email = $AdminEmail
        password = $AdminPassword
        userName = $AdminName
        tenantId = $TenantId
    } | ConvertTo-Json

    $registerResponse = Invoke-RestMethod -Uri "$BaseUrl/auth/register" `
        -Method POST `
        -ContentType "application/json" `
        -Body $registerBody `
        -SkipCertificateCheck

    $token = $registerResponse.data.token
    $userId = $registerResponse.data.user.id
    Write-Host "      ✅ User created successfully" -ForegroundColor Green
    Write-Host "         User ID: $userId" -ForegroundColor Gray

    # Step 2: Create Tenant Admin Role
    Write-Host "[2/4] Creating Tenant Admin role..." -ForegroundColor Cyan
    $roleBody = @{
        name = "Tenant Admin"
        description = "Full administrative access to tenant"
        tenantId = $TenantId
    } | ConvertTo-Json

    $roleResponse = Invoke-RestMethod -Uri "$BaseUrl/roles" `
        -Method POST `
        -Headers @{ Authorization = "Bearer $token" } `
        -ContentType "application/json" `
        -Body $roleBody `
        -SkipCertificateCheck

    $roleId = $roleResponse.data.id
    Write-Host "      ✅ Role created successfully" -ForegroundColor Green
    Write-Host "         Role ID: $roleId" -ForegroundColor Gray

    # Step 3: Add Permissions
    Write-Host "[3/4] Adding permissions to role..." -ForegroundColor Cyan
    $permissions = @(
        @{ resource = "users"; action = "read" }
        @{ resource = "users"; action = "write" }
        @{ resource = "applications"; action = "read" }
        @{ resource = "applications"; action = "write" }
        @{ resource = "roles"; action = "read" }
        @{ resource = "roles"; action = "write" }
        @{ resource = "menus"; action = "read" }
        @{ resource = "menus"; action = "write" }
        @{ resource = "organizations"; action = "read" }
        @{ resource = "organizations"; action = "write" }
        @{ resource = "tenants"; action = "read" }
        @{ resource = "audit-logs"; action = "read" }
    )

    $permCount = 0
    foreach ($perm in $permissions) {
        $permBody = $perm | ConvertTo-Json
        Invoke-RestMethod -Uri "$BaseUrl/roles/$roleId/permissions" `
            -Method POST `
            -Headers @{ Authorization = "Bearer $token" } `
            -ContentType "application/json" `
            -Body $permBody `
            -SkipCertificateCheck | Out-Null
        $permCount++
    }
    Write-Host "      ✅ Added $permCount permissions" -ForegroundColor Green

    # Step 4: Assign Role to User
    Write-Host "[4/4] Assigning role to user..." -ForegroundColor Cyan
    $assignBody = @{ roleId = $roleId } | ConvertTo-Json

    Invoke-RestMethod -Uri "$BaseUrl/users/$userId/roles" `
        -Method POST `
        -Headers @{ Authorization = "Bearer $token" } `
        -ContentType "application/json" `
        -Body $assignBody `
        -SkipCertificateCheck | Out-Null

    Write-Host "      ✅ Role assigned successfully" -ForegroundColor Green

    # Success Summary
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host "  🎉 Tenant Admin Created Successfully!" -ForegroundColor Green
    Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host ""
    Write-Host "Login Credentials:" -ForegroundColor Yellow
    Write-Host "  📧 Email:    $AdminEmail" -ForegroundColor White
    Write-Host "  🔑 Password: $AdminPassword" -ForegroundColor White
    Write-Host "  🏢 Tenant:   $TenantId" -ForegroundColor White
    Write-Host ""
    Write-Host "Access Points:" -ForegroundColor Yellow
    Write-Host "  🌐 UI:       https://localhost:5173" -ForegroundColor White
    Write-Host "  📚 API Docs: https://localhost:3000/api-docs" -ForegroundColor White
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Yellow
    Write-Host "  1. Login to the UI with the credentials above" -ForegroundColor Gray
    Write-Host "  2. Create your first application" -ForegroundColor Gray
    Write-Host "  3. Define additional roles" -ForegroundColor Gray
    Write-Host "  4. Build menu structures" -ForegroundColor Gray
    Write-Host "  5. Onboard users" -ForegroundColor Gray
    Write-Host ""

} catch {
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Red
    Write-Host "  ❌ Error Creating Tenant Admin" -ForegroundColor Red
    Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error Details:" -ForegroundColor Yellow
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "  • Ensure the DoorAuth server is running" -ForegroundColor Gray
    Write-Host "  • Check if the tenant ID exists" -ForegroundColor Gray
    Write-Host "  • Verify the email is not already registered" -ForegroundColor Gray
    Write-Host "  • Check the server logs for more details" -ForegroundColor Gray
    Write-Host ""
    exit 1
}
