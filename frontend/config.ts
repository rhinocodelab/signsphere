// Example Configuration File for SignSphere Frontend
// Copy this file to config.ts and modify the values as needed

import { AppConfig } from './src/config/app-config';

export const customConfig: Partial<AppConfig> = {
    // Company Information
    company: {
        name: "Sundyne Technologies",
        website: "https://www.sundynegroup.com/",
        supportEmail: "support@sundynegroup.com"
    },

    // Application Branding
    branding: {
        appName: "Western Railway Divyangjan Announcement System",
        logoPath: "/images/logos/signsphere-logo.svg",
        faviconPath: "/favicon.ico",
        projectInfoImage: {
            path: "/images/logos/deaf.png",
            width: 101,
            height: 104
        }
    },

    // Login Page Configuration
    login: {
        // Left Panel Configuration
        leftPanel: {
            image: {
                path: "/images/banners/banner_logo.png", // Your custom image path
                alt: "Western Railway Announcement System for Deaf and Hard of Hearing",
                width: 312,
                height: 268
            },
            title: "Western Railway Announcement System for Deaf and Hard of Hearing",
            subtitle: "Empowering accessibility through AI-powered visual railway announcements",
            ctaButton: undefined,
            footerText: undefined
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
            copyright: "SignSphere © 2025 All rights reserved.",
            links: [
                { text: "Privacy Policy", href: "/privacy" },
                { text: "T&C", href: "/terms" }
            ],
            poweredBy: {
                text: "Developed by",
                companyName: "Sundyne Technologies",
                companyUrl: "https://www.sundynegroup.com/"
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
