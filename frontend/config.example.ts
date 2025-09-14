// Example Configuration File for SignSphere Frontend
// Copy this file to config.ts and modify the values as needed

import { AppConfig } from './src/config/app-config';

export const customConfig: Partial<AppConfig> = {
    // Company Information
    company: {
        name: "Your Company Name",
        website: "https://yourcompany.com/",
        supportEmail: "support@yourcompany.com"
    },

    // Application Branding
    branding: {
        appName: "Your App Name",
        logoPath: "/images/logos/your-logo.svg",
        faviconPath: "/favicon.ico"
    },

    // Login Page Configuration
    login: {
        // Left Panel Configuration
        leftPanel: {
            image: {
                path: "/images/banners/banner_logo.png", // Change this path to your custom image
                alt: "Your Custom Image Description",
                width: 256,
                height: 256
            },
            title: "Your Custom Title",
            subtitle: "Your custom subtitle text here",
            ctaButton: {
                text: "YOUR CTA BUTTON",
                href: "/your-upgrade-page",
                onClick: "handleYourUpgrade"
            },
            footerText: "Your custom footer text"
        },

        // Right Panel Configuration
        rightPanel: {
            title: "Sign in to your account",
            usernameLabel: "Username",
            usernamePlaceholder: "Enter your username",
            passwordLabel: "Password",
            passwordPlaceholder: "Enter your password",
            keepLoggedInText: "Keep me logged in",
            loginButtonText: "LOGIN"
        },

        // Footer Configuration
        footer: {
            copyright: "Your App Name © 2025 All rights reserved.",
            links: [
                { text: "Privacy Policy", href: "/privacy" },
                { text: "T&C", href: "/terms" }
            ],
            poweredBy: {
                text: "Powered by",
                companyName: "Your Company Name",
                companyUrl: "https://yourcompany.com/"
            }
        }
    },

    // API Configuration
    api: {
        baseUrl: process.env.NEXT_PUBLIC_API_URL || "https://localhost:5001",
        timeout: 10000,
        endpoints: {
            auth: {
                login: "/api/v1/auth/login",
                logout: "/api/v1/auth/logout",
                refresh: "/api/v1/auth/refresh"
            },
            user: {
                profile: "/api/v1/users/profile",
                update: "/api/v1/users/update"
            }
        }
    },

    // Theme Configuration
    theme: {
        primaryColor: "#0d9488", // teal-600
        secondaryColor: "#0f766e", // teal-700
        accentColor: "#14b8a6", // teal-500
        backgroundColor: "#ffffff"
    }
};

// Usage Instructions:
// 1. Copy this file to config.ts
// 2. Modify the values according to your needs
// 3. The most common changes are:
//    - company.name and company.website
//    - login.leftPanel.image.path (for custom images)
//    - login.leftPanel.title and subtitle
//    - branding.appName
