# SignSphere Frontend Configuration Guide

This guide explains how to configure dynamic text, images, and settings for the SignSphere frontend application.

## 📁 Configuration Files

### 1. Main Configuration
- **File**: `src/config/app-config.ts`
- **Purpose**: Contains the default configuration and configuration manager
- **Note**: This file should not be modified directly

### 2. Example Configuration
- **File**: `config.example.ts`
- **Purpose**: Template for custom configurations
- **Usage**: Copy to `config.ts` and modify as needed

### 3. Image Utilities
- **File**: `src/utils/image-utils.ts`
- **Purpose**: Helper functions for image management and validation

## 🖼️ Dynamic Image Configuration

### Changing the Login Page Image

The login page left panel image can be dynamically configured. Here's how:

#### Method 1: Using Environment Variables
```bash
# Set in your .env.local file
NEXT_PUBLIC_LOGIN_IMAGE_PATH=/images/your-custom-image.png
```

#### Method 2: Using Configuration File
1. Copy `config.example.ts` to `config.ts`
2. Update the image path:
```typescript
login: {
  leftPanel: {
    image: {
      path: "/images/backgrounds/your-custom-image.png",
      alt: "Your custom image description",
      width: 256,
      height: 256
    }
  }
}
```

#### Method 3: Programmatically (Runtime)
```typescript
import { configManager } from '@/config/app-config';

// Update the login image
configManager.updateLoginImage('/images/your-new-image.png', 'New image description');
```

## 📝 Dynamic Text Configuration

### Login Page Text Elements

All text elements on the login page can be customized:

```typescript
login: {
  leftPanel: {
    title: "Your Custom Title",
    subtitle: "Your custom subtitle with promotional text",
    ctaButton: {
      text: "YOUR CUSTOM BUTTON",
      href: "/your-upgrade-page"
    },
    footerText: "Your custom footer text"
  },
  rightPanel: {
    title: "Sign in to your account",
    usernameLabel: "Username",
    usernamePlaceholder: "Enter your username",
    passwordLabel: "Password",
    passwordPlaceholder: "Enter your password",
    keepLoggedInText: "Keep me logged in",
    loginButtonText: "LOGIN"
  }
}
```

## 🏢 Company Information

### Updating Company Details

```typescript
company: {
  name: "Your Company Name",
  website: "https://yourcompany.com/",
  supportEmail: "support@yourcompany.com"
}
```

This automatically updates:
- Footer company name and URL
- Powered by section
- Support contact information

## 🎨 Theme Configuration

### Customizing Colors

```typescript
theme: {
  primaryColor: "#0d9488",    // teal-600
  secondaryColor: "#0f766e",  // teal-700
  accentColor: "#14b8a6",     // teal-500
  backgroundColor: "#ffffff"
}
```

## 🔧 API Configuration

### Backend API Settings

```typescript
api: {
  baseUrl: "https://your-api-domain.com",
  timeout: 10000,
  endpoints: {
    auth: {
      login: "/api/v1/auth/login",
      logout: "/api/v1/auth/logout",
      refresh: "/api/v1/auth/refresh"
    }
  }
}
```

## 📋 Quick Setup Guide

### Step 1: Basic Customization
1. Copy `config.example.ts` to `config.ts`
2. Update company information:
   ```typescript
   company: {
     name: "Your Company Name",
     website: "https://yourcompany.com/"
   }
   ```

### Step 2: Custom Image
1. Place your image in `public/images/backgrounds/`
2. Update the configuration:
   ```typescript
   login: {
     leftPanel: {
       image: {
         path: "/images/backgrounds/your-image.png",
         alt: "Your image description"
       }
     }
   }
   ```

### Step 3: Custom Text
1. Update login page text:
   ```typescript
   login: {
     leftPanel: {
       title: "Your Custom Title",
       subtitle: "Your custom promotional text"
     }
   }
   ```

## 🚀 Deployment

### Environment Variables
For production deployment, use environment variables:

```bash
# Production environment variables
NEXT_PUBLIC_COMPANY_NAME="Your Company"
NEXT_PUBLIC_COMPANY_WEBSITE="https://yourcompany.com"
NEXT_PUBLIC_LOGIN_IMAGE_PATH="/images/your-production-image.png"
NEXT_PUBLIC_API_URL="https://your-production-api.com"
```

## 🔍 Image Requirements

### Supported Formats
- **PNG**: Recommended for images with transparency
- **JPG**: Good for photographs
- **SVG**: Best for scalable graphics
- **WebP**: Modern format with good compression

### Recommended Dimensions
- **Login Panel Image**: 512x512px minimum
- **Logo**: 256x256px minimum
- **Icons**: 64x64px minimum

### File Size Guidelines
- **Login Panel Image**: < 500KB
- **Logo**: < 100KB
- **Icons**: < 50KB

## 🛠️ Troubleshooting

### Image Not Loading
1. Check file path is correct
2. Ensure image exists in `public/images/` directory
3. Verify file permissions
4. Check browser console for errors

### Configuration Not Applied
1. Restart the development server
2. Clear browser cache
3. Check for syntax errors in config file
4. Verify environment variables are set correctly

### Build Errors
1. Ensure all required fields are provided
2. Check TypeScript types match expected interfaces
3. Verify import paths are correct

## 📚 Advanced Usage

### Runtime Configuration Updates
```typescript
import { configManager } from '@/config/app-config';

// Update multiple settings at once
configManager.updateConfig({
  company: {
    name: "New Company Name",
    website: "https://newcompany.com"
  },
  login: {
    leftPanel: {
      title: "New Title"
    }
  }
});
```

### Custom Image Validation
```typescript
import { validateImagePath } from '@/utils/image-utils';

// Check if image exists before using
const isValid = await validateImagePath('/images/my-image.png');
if (isValid) {
  // Use the image
} else {
  // Use fallback image
}
```

## 📞 Support

For configuration-related issues:
1. Check this documentation
2. Review the example configuration file
3. Check browser console for errors
4. Verify file paths and permissions

---

**Note**: This configuration system is designed to be flexible and easy to use. Start with the basic customization and gradually add more advanced features as needed.
