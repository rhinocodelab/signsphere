# SignSphere Scripts

This directory contains utility scripts for setting up and managing the SignSphere application.

## Available Scripts

### `setup-isl-videos.sh`

Sets up the directory structure and permissions for ISL (Indian Sign Language) video storage.

#### Usage

```bash
# Run the setup script
./scripts/setup-isl-videos.sh
```

#### What it does

1. **Creates Directory Structure**:
   ```
   /var/www/signsphere/uploads/isl-videos/
   ├── male-model/
   │   └── (videos organized as needed)
   └── female-model/
       └── (videos organized as needed)
   ```

2. **Sets Permissions**:
   - Sets ownership to the current user
   - Sets permissions to 755 (readable by all, writable by owner)

3. **Creates Documentation**:
   - Adds a README.md file with usage instructions
   - Provides file naming conventions
   - Lists supported video formats

4. **Verifies Setup**:
   - Tests directory creation
   - Verifies write permissions
   - Confirms file creation works

#### Requirements

- **Sudo privileges**: Required to create directories in `/var/www/`
- **Normal user**: Script should not be run as root
- **Ubuntu/Linux**: Designed for Linux-based systems

#### Output

The script provides colored output showing:
- ✅ Success messages (green)
- ⚠️ Warnings (yellow)
- ❌ Errors (red)
- ℹ️ Information (blue)

#### After Running

1. **Backend Configuration**: Update your FastAPI app to use `/var/www/signsphere/uploads/isl-videos/`
2. **Nginx Configuration**: Add location block to serve videos
3. **Frontend**: Implement video upload functionality
4. **Testing**: Upload test videos to verify everything works

#### Troubleshooting

- **Permission Denied**: Ensure you have sudo privileges
- **Directory Not Found**: Check if `/var/www/` exists and is accessible
- **Write Test Failed**: Verify ownership and permissions are set correctly

#### Example Nginx Configuration

```nginx
location /isl-videos/ {
    alias /var/www/signsphere/uploads/isl-videos/;
    expires 1y;
    add_header Cache-Control "public, immutable";
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
}
```

## File Naming Convention

For ISL videos, use descriptive names:
- `train-arriving-platform-1.mp4`
- `boarding-instructions.mp4`
- `platform-change-notice.mp4`
- `delay-announcement.mp4`

## Supported Video Formats

- **MP4** (recommended)
- **WebM**
- **OGG**

## File Size Limits

- **Maximum**: 50MB per video
- **Recommended Resolution**: 720p or 1080p
- **Recommended Duration**: 5-30 seconds per video