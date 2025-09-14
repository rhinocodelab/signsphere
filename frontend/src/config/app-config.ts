// SignSphere Frontend Configuration
// This file contains all dynamic text, file paths, and configurable settings

export interface AppConfig {
    // Company Information
    company: {
        name: string;
        website: string;
        supportEmail?: string;
    };

    // Application Branding
    branding: {
        appName: string;
        logoPath: string;
        faviconPath: string;
        projectInfoImage?: {
            path: string;
            width?: number;
            height?: number;
        };
    };

    // Login Page Configuration
    login: {
        // Left Panel Configuration
        leftPanel: {
            image: {
                path: string;
                alt: string;
                width?: number;
                height?: number;
            };
            title: string;
            subtitle: string;
            ctaButton?: {
                text: string;
                href?: string;
                onClick?: string;
            };
            footerText?: string;
        };

        // Right Panel Configuration
        rightPanel: {
            title: string;
            usernameLabel: string;
            usernamePlaceholder: string;
            passwordLabel: string;
            passwordPlaceholder: string;
            keepLoggedInText: string;
            loginButtonText: string;
        };

        // Footer Configuration
        footer: {
            copyright: string;
            links: Array<{
                text: string;
                href: string;
            }>;
            poweredBy: {
                text: string;
                companyName: string;
                companyUrl: string;
            };
        };
    };

    // API Configuration
    api: {
        baseUrl: string;
        timeout: number;
        endpoints: {
            auth: {
                login: string;
                logout: string;
                refresh: string;
            };
            user: {
                profile: string;
                update: string;
            };
        };
    };

    // Theme Configuration
    theme: {
        primaryColor: string;
        secondaryColor: string;
        accentColor: string;
        backgroundColor: string;
    };
}

// Default Configuration
export const defaultConfig: AppConfig = {
    company: {
        name: "Sundyne Technologies",
        website: "https://www.sundynegroup.com/",
        supportEmail: "support@sundynegroup.com"
    },

    branding: {
        appName: "SignSphere",
        logoPath: "/images/logos/signsphere-logo.svg",
        faviconPath: "/favicon.ico",
        projectInfoImage: {
            path: "/images/logos/deaf.png",
            width: 48,
            height: 48
        }
    },

    login: {
        leftPanel: {
            image: {
                path: "/images/backgrounds/login-illustration.svg",
                alt: "SignSphere Digital Signage Management",
                width: 256,
                height: 256
            },
            title: "Unlock Advanced Features, Go Premium",
            subtitle: "Save 20% on the premium membership plan by using the promo code \"SIGNSPHERE20\"",
            ctaButton: {
                text: "UPGRADE NOW",
                href: "/upgrade",
                onClick: "handleUpgrade"
            },
            footerText: "All illustrations are powered by Icons8"
        },

        rightPanel: {
            title: "Sign in to your account",
            usernameLabel: "Username",
            usernamePlaceholder: "Enter your username",
            passwordLabel: "Password",
            passwordPlaceholder: "Enter your password",
            keepLoggedInText: "Keep me logged in",
            loginButtonText: "LOGIN"
        },

        footer: {
            copyright: "SignSphere © 2025 All rights reserved.",
            links: [
                { text: "Privacy Policy", href: "/privacy" },
                { text: "T&C", href: "/terms" }
            ],
            poweredBy: {
                text: "Powered by",
                companyName: "Sundyne Technologies",
                companyUrl: "https://www.sundynegroup.com/"
            }
        }
    },

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

    theme: {
        primaryColor: "#0d9488", // teal-600
        secondaryColor: "#0f766e", // teal-700
        accentColor: "#14b8a6", // teal-500
        backgroundColor: "#ffffff"
    }
};

// Configuration Manager
export class ConfigManager {
    private static instance: ConfigManager;
    private config: AppConfig;

    private constructor() {
        this.config = { ...defaultConfig };
        this.loadFromEnvironment();
    }

    public static getInstance(): ConfigManager {
        if (!ConfigManager.instance) {
            ConfigManager.instance = new ConfigManager();
        }
        return ConfigManager.instance;
    }

    public getConfig(): AppConfig {
        return this.config;
    }

    public updateConfig(updates: Partial<AppConfig>): void {
        this.config = { ...this.config, ...updates };
    }

    public updateLoginImage(imagePath: string, alt?: string): void {
        this.config.login.leftPanel.image.path = imagePath;
        if (alt) {
            this.config.login.leftPanel.image.alt = alt;
        }
    }

    public updateCompanyInfo(name: string, website: string): void {
        this.config.company.name = name;
        this.config.company.website = website;
        this.config.login.footer.poweredBy.companyName = name;
        this.config.login.footer.poweredBy.companyUrl = website;
    }

    private loadFromEnvironment(): void {
        // Load configuration from environment variables if available
        if (process.env.NEXT_PUBLIC_COMPANY_NAME) {
            this.config.company.name = process.env.NEXT_PUBLIC_COMPANY_NAME;
        }
        if (process.env.NEXT_PUBLIC_COMPANY_WEBSITE) {
            this.config.company.website = process.env.NEXT_PUBLIC_COMPANY_WEBSITE;
        }
        if (process.env.NEXT_PUBLIC_LOGIN_IMAGE_PATH) {
            this.config.login.leftPanel.image.path = process.env.NEXT_PUBLIC_LOGIN_IMAGE_PATH;
        }
    }
}

// Export singleton instance
export const configManager = ConfigManager.getInstance();

// Load custom configuration if available
try {
    const { customConfig } = require('../../config.ts');
    if (customConfig) {
        configManager.updateConfig(customConfig);
    }
} catch (error) {
    // Custom config not found, use defaults
    console.log('Using default configuration');
}

// Export current config
export const appConfig = configManager.getConfig();
