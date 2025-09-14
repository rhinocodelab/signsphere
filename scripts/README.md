# SignSphere HTTPS Setup Scripts

This directory contains scripts to set up HTTPS for the SignSphere application using self-signed certificates.

## Scripts Overview

### 1. `generate_certificates.sh`
Generates self-signed SSL certificates for HTTPS communication.

**Usage:**
```bash
./generate_certificates.sh <IPv4_ADDRESS>
```

**Example:**
```bash
./generate_certificates.sh 192.168.1.100
```

**What it does:**
- Automatically detects the project root directory (parent of scripts folder)
- Creates a `certificates/` directory in the project root
- Generates a 2048-bit RSA private key
- Creates a certificate signing request (CSR)
- Generates a self-signed certificate valid for 365 days
- Includes Subject Alternative Names (SAN) for localhost and the specified IP
- Creates a combined PEM file for convenience
- Sets proper file permissions for security

**Output files:**
- `certificates/signsphere.key` - Private key
- `certificates/signsphere.crt` - Certificate
- `certificates/signsphere.pem` - Combined certificate and key

### 2. `setup_https.sh`
Configures both frontend and backend for HTTPS operation.

**Usage:**
```bash
./setup_https.sh <IPv4_ADDRESS>
```

**Example:**
```bash
./setup_https.sh 192.168.1.100
```

**What it does:**
- Automatically detects the project root directory (parent of scripts folder)
- Updates backend configuration to use HTTPS with dynamic paths
- Creates `backend/https_config.py` for HTTPS server startup
- Updates frontend environment variables for HTTPS API calls
- Modifies Next.js configuration for HTTPS development

**Generated files:**
- `backend/https_config.py` - HTTPS-enabled backend server
- `frontend/.env.local` - HTTPS environment variables

## Quick Setup Process

1. **Generate certificates:**
   ```bash
   cd scripts
   ./generate_certificates.sh 192.168.1.100
   ```

2. **Configure HTTPS:**
   ```bash
   ./setup_https.sh 192.168.1.100
   ```

3. **Start services with HTTPS:**
   ```bash
   cd ..
   ./start_services.sh
   ```

4. **Stop services:**
   Press **Ctrl+C** while `start_services.sh` is running to gracefully stop all services.

**Note:** All scripts automatically detect the project root directory, so they work regardless of where the SignSphere project is located on your system.

## Access URLs

After running the setup scripts, your application will be available at:

- **Frontend:** `https://192.168.1.100:3000`
- **Backend API:** `https://192.168.1.100:5001`
- **API Documentation:** `https://192.168.1.100:5001/docs`

## Security Notes

### Self-Signed Certificates
- These certificates are for **development and testing only**
- Browsers will display security warnings - this is expected behavior
- Click "Advanced" → "Proceed to site" to bypass browser warnings
- For production, use certificates from a trusted Certificate Authority (CA)

### File Permissions
- Private keys have restricted permissions (600) for security
- Certificates have standard permissions (644) for readability
- The certificates directory is excluded from version control

## Troubleshooting

### Certificate Issues
- Ensure OpenSSL is installed on your system
- Check that the IPv4 address is valid and accessible
- Verify file permissions on certificate files

### HTTPS Connection Issues
- Confirm both services are running on the correct ports
- Check firewall settings for ports 3000 and 5001
- Verify the IP address matches your network configuration

### Browser Warnings
- Self-signed certificate warnings are normal
- Add security exceptions if your browser allows
- Consider adding the certificate to your system's trusted store for development

## Production Considerations

For production deployment:

1. **Use a trusted CA:** Obtain certificates from Let's Encrypt, DigiCert, or similar
2. **Domain names:** Use proper domain names instead of IP addresses
3. **Certificate management:** Implement automatic certificate renewal
4. **Security headers:** Add security headers in production configurations
5. **Load balancers:** Consider using reverse proxies like Nginx for SSL termination

## Script Dependencies

- `openssl` - For certificate generation
- `bash` - Shell environment
- Basic Unix utilities (`mkdir`, `chmod`, `cat`, etc.)

All scripts include error handling and colored output for better user experience.
