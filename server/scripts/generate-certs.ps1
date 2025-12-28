# PowerShell script to generate self-signed SSL certificate for development
$certPath = Join-Path $PSScriptRoot ".." "certs"
$certFile = Join-Path $certPath "cert.pem"
$keyFile = Join-Path $certPath "key.pem"
$pfxFile = Join-Path $certPath "localhost.pfx"

# Check if certificates already exist
if ((Test-Path $certFile) -and (Test-Path $keyFile)) {
    Write-Host "SSL certificates already exist in certs/ directory" -ForegroundColor Green
    Write-Host "   - key.pem"
    Write-Host "   - cert.pem"
    exit 0
}

Write-Host "Generating self-signed SSL certificates..." -ForegroundColor Cyan

try {
    # Create certificate using .NET
    $certParams = @{
        Subject = "CN=localhost"
        DnsName = @("localhost", "127.0.0.1")
        KeyAlgorithm = "RSA"
        KeyLength = 4096
        NotBefore = (Get-Date)
        NotAfter = (Get-Date).AddYears(1)
        CertStoreLocation = "Cert:\CurrentUser\My"
        FriendlyName = "DoorAuth Development Certificate"
        HashAlgorithm = "SHA256"
        KeyUsage = @("DigitalSignature", "KeyEncipherment", "DataEncipherment")
        TextExtension = @("2.5.29.37={text}1.3.6.1.5.5.7.3.1")
    }
    
    $cert = New-SelfSignedCertificate @certParams

    # Export to PFX
    $certPassword = ConvertTo-SecureString -String "dev-password" -Force -AsPlainText
    Export-PfxCertificate -Cert $cert -FilePath $pfxFile -Password $certPassword | Out-Null

    # Convert PFX to PEM format using OpenSSL if available, otherwise use .NET
    $opensslPath = Get-Command openssl -ErrorAction SilentlyContinue
    if ($opensslPath) {
        # Use OpenSSL to convert
        & openssl pkcs12 -in $pfxFile -out $certFile -nokeys -nodes -passin pass:dev-password 2>$null
        & openssl pkcs12 -in $pfxFile -out $keyFile -nocerts -nodes -passin pass:dev-password 2>$null
    } else {
        # Fallback: Export using .NET (less ideal but works)
        $certBytes = $cert.Export([System.Security.Cryptography.X509Certificates.X509ContentType]::Cert)
        $certPem = "-----BEGIN CERTIFICATE-----`n"
        $certPem += [System.Convert]::ToBase64String($certBytes, [System.Base64FormattingOptions]::InsertLineBreaks)
        $certPem += "`n-----END CERTIFICATE-----`n"
        Set-Content -Path $certFile -Value $certPem -NoNewline

        # For the key, we need to export the private key
        $keyBytes = $cert.PrivateKey.ExportRSAPrivateKey()
        $keyPem = "-----BEGIN RSA PRIVATE KEY-----`n"
        $keyPem += [System.Convert]::ToBase64String($keyBytes, [System.Base64FormattingOptions]::InsertLineBreaks)
        $keyPem += "`n-----END RSA PRIVATE KEY-----`n"
        Set-Content -Path $keyFile -Value $keyPem -NoNewline
    }

    # Remove the certificate from the store
    $certThumbprint = $cert.Thumbprint
    Remove-Item -Path "Cert:\CurrentUser\My\$certThumbprint" -Force

    # Clean up PFX file
    if (Test-Path $pfxFile) {
        Remove-Item $pfxFile -Force
    }

    Write-Host ""
    Write-Host "SSL certificates generated successfully!" -ForegroundColor Green
    Write-Host "   Location: certs/" -ForegroundColor Gray
    Write-Host "   Private Key: key.pem" -ForegroundColor Gray
    Write-Host "   Certificate: cert.pem" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Note: These are self-signed certificates for development only." -ForegroundColor Yellow
    Write-Host "You may need to trust them in your browser." -ForegroundColor Yellow

} catch {
    Write-Host ""
    Write-Host "Failed to generate certificates." -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
