// Image Utility Functions for SignSphere Frontend

import { appConfig } from '@/config/app-config';

export interface ImageConfig {
    path: string;
    alt: string;
    width?: number;
    height?: number;
    className?: string;
}

/**
 * Get the full URL for an image path
 * @param imagePath - Relative path to the image
 * @returns Full URL or relative path
 */
export function getImageUrl(imagePath: string): string {
    // If it's already a full URL, return as is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        return imagePath;
    }

    // If it starts with '/', it's a public path
    if (imagePath.startsWith('/')) {
        return imagePath;
    }

    // Otherwise, assume it's in the public/images directory
    return `/images/${imagePath}`;
}

/**
 * Get image configuration from app config
 * @param imageType - Type of image (e.g., 'loginLeftPanel')
 * @returns Image configuration
 */
export function getImageConfig(imageType: keyof typeof appConfig.login.leftPanel): ImageConfig {
    switch (imageType) {
        case 'image':
            return {
                path: getImageUrl(appConfig.login.leftPanel.image.path),
                alt: appConfig.login.leftPanel.image.alt,
                width: appConfig.login.leftPanel.image.width,
                height: appConfig.login.leftPanel.image.height,
                className: "max-w-full h-auto object-contain"
            };
        default:
            throw new Error(`Unknown image type: ${imageType}`);
    }
}

/**
 * Validate if an image path exists (client-side check)
 * @param imagePath - Path to the image
 * @returns Promise<boolean>
 */
export async function validateImagePath(imagePath: string): Promise<boolean> {
    try {
        const img = new Image();
        return new Promise((resolve) => {
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = getImageUrl(imagePath);
        });
    } catch (error) {
        return false;
    }
}

/**
 * Get fallback image configuration if the primary image fails to load
 * @param imageType - Type of image
 * @returns Fallback image configuration
 */
export function getFallbackImageConfig(imageType: keyof typeof appConfig.login.leftPanel): ImageConfig {
    switch (imageType) {
        case 'image':
            return {
                path: "/images/placeholders/default-illustration.svg",
                alt: "Default illustration",
                width: 500,
                height: 500,
                className: "max-w-full h-auto object-contain opacity-50"
            };
        default:
            throw new Error(`Unknown image type: ${imageType}`);
    }
}

/**
 * Update login panel image configuration
 * @param newImagePath - New image path
 * @param newAlt - New alt text (optional)
 */
export function updateLoginImage(newImagePath: string, newAlt?: string): void {
    const { configManager } = require('@/config/app-config');
    configManager.updateLoginImage(newImagePath, newAlt);
}
