const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const certsDir = path.join(__dirname, '..', 'certs');
const keyPath = path.join(certsDir, 'key.pem');
const certPath = path.join(certsDir, 'cert.pem');

// Create certs directory if it doesn't exist
if (!fs.existsSync(certsDir)) {
    fs.mkdirSync(certsDir, { recursive: true });
}

// Check if certificates already exist
if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    console.log('✅ SSL certificates already exist in certs/ directory');
    console.log('   - key.pem');
    console.log('   - cert.pem');
    process.exit(0);
}

console.log('🔐 Generating self-signed SSL certificates...');
console.log('');

// Try to use mkcert first (for trusted certs)
try {
    const mkcertCheck = execSync('mkcert -help', { stdio: 'ignore' });
    console.log('✨ mkcert found! Generating trusted certificates...');

    // Install local CA if needed (might require admin, but usually harmless to try)
    // execSync('mkcert -install', { stdio: 'inherit' }); 
    // Commented out install to avoid interactive prompts/admin issues in script, assume user did it or does it manually.

    const command = `mkcert -key-file "${keyPath}" -cert-file "${certPath}" localhost 127.0.0.1 ::1`;
    execSync(command, { stdio: 'inherit' });

    console.log('');
    console.log('✅ Trusted SSL certificates generated successfully!');
    console.log('   📁 Location: certs/');
    console.log('   🔑 Private Key: key.pem');
    console.log('   📜 Certificate: cert.pem');
    console.log('');
    console.log('👉 Note: You might need to restart your servers to apply changes.');
    process.exit(0);

} catch (e) {
    console.log('⚠️ mkcert not found, falling back to OpenSSL (self-signed)...');
}

// Try to find OpenSSL
let opensslCommand = 'openssl';
try {
    execSync('openssl version', { stdio: 'ignore' });
} catch (e) {
    // Try Git's OpenSSL
    try {
        const gitPath = 'C:\\Program Files\\Git\\usr\\bin\\openssl.exe';
        if (fs.existsSync(gitPath)) {
            opensslCommand = `"${gitPath}"`;
        } else {
            throw new Error('OpenSSL not found');
        }
    } catch (e2) {
        console.log('❌ OpenSSL not found.');
        console.log('');
        console.log('Please install OpenSSL or mkcert (recommended for trusted HTTPS).');
        console.log('To install mkcert on Windows: choco install mkcert');
        console.log('');
        console.log('Or use one of these options for OpenSSL:');
        console.log('1. Install Git for Windows (includes OpenSSL)');
        console.log('2. Install OpenSSL from https://slproweb.com/products/Win32OpenSSL.html');
        console.log('3. Manually create certificates and place them in the certs/ folder');
        console.log('');
        console.log('Or run this command manually:');
        console.log(`openssl req -x509 -newkey rsa:2048 -keyout "${keyPath}" -out "${certPath}" -days 365 -nodes -subj "/CN=localhost"`);
        process.exit(1);
    }
}

try {
    // Generate certificate
    const command = `${opensslCommand} req -x509 -newkey rsa:2048 -keyout "${keyPath}" -out "${certPath}" -days 365 -nodes -subj "/CN=localhost"`;
    execSync(command, { stdio: 'inherit' });

    console.log('');
    console.log('✅ SSL certificates generated successfully!');
    console.log('   📁 Location: certs/');
    console.log('   🔑 Private Key: key.pem');
    console.log('   📜 Certificate: cert.pem');
    console.log('');
    console.log('⚠️  Note: These are self-signed certificates (OpenSSL). Browser will warn.');
    console.log('   For trusted certificates, install mkcert.');

} catch (error) {
    console.log('');
    console.log('❌ Failed to generate certificates.');
    console.log('   Error:', error.message);
    process.exit(1);
}
