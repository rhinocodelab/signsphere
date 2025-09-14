# Frontend Images

This directory contains images used in the SignSphere frontend application.

## Directory Structure

```
images/
├── logos/           # Company/product logos
├── icons/           # UI icons and symbols
├── backgrounds/     # Background images
├── avatars/         # User profile images
├── banners/         # Banner/hero images
├── thumbnails/      # Thumbnail images
└── placeholders/    # Placeholder images
```

## Usage

### In Next.js Components

Images placed in `public/images/` can be referenced directly:

```jsx
// Static import (recommended for optimization)
import logoImage from '/images/logos/logo.png'

// Direct path reference
<img src="/images/logos/logo.png" alt="Logo" />

// Using Next.js Image component (recommended)
import Image from 'next/image'

<Image
  src="/images/logos/logo.png"
  alt="Logo"
  width={200}
  height={100}
  priority
/>
```

### Image Optimization

- Use Next.js `Image` component for automatic optimization
- Place commonly used images in appropriate subdirectories
- Use descriptive filenames for better organization
- Consider using WebP format for better compression

## File Naming Convention

- Use lowercase letters and hyphens: `user-avatar.png`
- Be descriptive: `hero-banner-signsphere.jpg`
- Include dimensions when relevant: `logo-200x100.png`
- Use appropriate file extensions: `.png`, `.jpg`, `.jpeg`, `.webp`, `.svg`

## Supported Formats

- **PNG**: Best for images with transparency
- **JPG/JPEG**: Best for photographs
- **WebP**: Modern format with excellent compression
- **SVG**: Vector graphics for icons and simple illustrations
