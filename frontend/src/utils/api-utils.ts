import { appConfig } from '@/config/app-config'

/**
 * Get the API base URL dynamically based on the current hostname
 * @returns The API base URL
 */
export function getApiUrl(): string {
    if (typeof window === 'undefined') {
        // Server-side rendering
        return appConfig.api.baseUrl
    }

    const currentHost = window.location.hostname
    
    // For localhost development
    if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
        return 'https://localhost:5001'
    }
    
    // For production or other environments, use the configured base URL
    // or construct from current hostname
    if (appConfig.api.baseUrl && appConfig.api.baseUrl !== 'https://localhost:5001') {
        return appConfig.api.baseUrl
    }
    
    // Fallback: construct URL from current hostname
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:'
    const port = window.location.port ? `:${window.location.port}` : ''
    return `${protocol}//${currentHost}${port}`
}

/**
 * Get the full API endpoint URL
 * @param endpoint - The API endpoint path (e.g., '/api/v1/auth/login')
 * @returns The full API URL
 */
export function getApiEndpoint(endpoint: string): string {
    const baseUrl = getApiUrl()
    // Ensure endpoint starts with /
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
    return `${baseUrl}${normalizedEndpoint}`
}