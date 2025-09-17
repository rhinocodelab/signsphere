'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { appConfig } from '@/config/app-config'

interface TrainRoute {
    id: number
    train_number: string
    train_name: string
    from_station_code: string
    from_station: string
    to_station_code: string
    to_station: string
    created_at: string
    updated_at?: string
}

interface SelectedRoute {
    id: number
    train_number: string
    train_name: string
    from_station: string
    to_station: string
    platform: string
    announcement_category: string
}

export default function DashboardPage() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [showProfileDropdown, setShowProfileDropdown] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<any[]>([])
    const [showProjectInfo, setShowProjectInfo] = useState(false)
    const [searchMode, setSearchMode] = useState<'number' | 'name'>('number')

    // Pick Route functionality
    const [showPickRouteModal, setShowPickRouteModal] = useState(false)
    const [trainRoutes, setTrainRoutes] = useState<TrainRoute[]>([])
    const [loadingRoutes, setLoadingRoutes] = useState(false)
    const [announcementCategories, setAnnouncementCategories] = useState<string[]>([])
    const [selectedRoute, setSelectedRoute] = useState<SelectedRoute | null>(null)

    // Announcement generation functionality
    const [showAnnouncementModal, setShowAnnouncementModal] = useState(false)
    const [announcementProgress, setAnnouncementProgress] = useState({
        step: '',
        progress: 0,
        isComplete: false,
        error: null as string | null
    })
    const [generatedAnnouncement, setGeneratedAnnouncement] = useState('')
    const [generatedAnnouncements, setGeneratedAnnouncements] = useState<{
        english: string
        hindi: string
        marathi: string
        gujarati: string
    } | null>(null)
    const [announcementVideoUrl, setAnnouncementVideoUrl] = useState('')
    const [isGeneratingAnnouncement, setIsGeneratingAnnouncement] = useState(false)
    const [announcementTemplates, setAnnouncementTemplates] = useState<any[]>([])
    const [loadingTemplates, setLoadingTemplates] = useState(false)
    const [showModelSelectionModal, setShowModelSelectionModal] = useState(false)
    const [selectedAIModel, setSelectedAIModel] = useState<'male' | 'female' | null>(null)
    const [currentTempVideoId, setCurrentTempVideoId] = useState<string | null>(null)
    const [playSpeed, setPlaySpeed] = useState(1.0)

    const handlePlaySpeedChange = (speed: number) => {
        setPlaySpeed(speed)
        const video = document.querySelector('video')
        if (video) {
            video.playbackRate = speed
        }
    }

    useEffect(() => {
        const checkAuthentication = async () => {
            // Check if user is logged in
            const isLoggedIn = localStorage.getItem('isLoggedIn')
            const userData = localStorage.getItem('user')
            const accessToken = localStorage.getItem('accessToken')

            if (!isLoggedIn || !userData || !accessToken) {
                router.push('/login')
                return
            }

            try {
                // Determine API URL based on current hostname
                const currentHost = window.location.hostname
                const apiUrl = currentHost === 'localhost'
                    ? 'https://localhost:5001'
                    : (process.env.NEXT_PUBLIC_API_URL || 'https://192.168.1.10:5001')

                // Verify token with backend
                const response = await fetch(`${apiUrl}/api/v1/auth/me`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                    },
                })

                if (response.ok) {
                    const userInfo = await response.json()
                    setUser(userInfo)
                } else {
                    // Token is invalid, clear storage and redirect to login
                    localStorage.removeItem('isLoggedIn')
                    localStorage.removeItem('user')
                    localStorage.removeItem('accessToken')
                    localStorage.removeItem('tokenType')
                    router.push('/login')
                }
            } catch (error) {
                console.error('Token verification error:', error)
                // Network error, still allow access but show warning
                setUser(JSON.parse(userData))
            }
        }

        checkAuthentication()
        fetchAnnouncementTemplates()
    }, [router])

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element
            if (!target.closest('.profile-dropdown')) {
                setShowProfileDropdown(false)
            }
        }

        if (showProfileDropdown) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [showProfileDropdown])

    const handleLogout = () => {
        // Show logout confirmation toast
        toast.success('Signed out successfully')

        // Clear all authentication data
        localStorage.removeItem('isLoggedIn')
        localStorage.removeItem('user')
        localStorage.removeItem('accessToken')
        localStorage.removeItem('tokenType')

        router.push('/login')
    }

    const fetchTrainRoutes = async () => {
        try {
            setLoadingRoutes(true)
            const currentHost = window.location.hostname
            const apiUrl = currentHost === 'localhost'
                ? 'https://localhost:5001'
                : (process.env.NEXT_PUBLIC_API_URL || 'https://192.168.1.10:5001')

            const response = await fetch(`${apiUrl}/api/v1/train-routes/`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            })

            if (response.ok) {
                const routes = await response.json()
                setTrainRoutes(routes)
            } else {
                toast.error('Failed to fetch train routes')
            }
        } catch (error) {
            console.error('Error fetching train routes:', error)
            toast.error('Error fetching train routes')
        } finally {
            setLoadingRoutes(false)
        }
    }


    const handlePickRouteClick = () => {
        setShowPickRouteModal(true)
        fetchTrainRoutes()
    }

    const handleRouteSelect = (route: TrainRoute) => {
        setSelectedRoute({
            id: route.id,
            train_number: route.train_number,
            train_name: route.train_name,
            from_station: route.from_station,
            to_station: route.to_station,
            platform: '1',
            announcement_category: 'Arriving'
        })
        setShowPickRouteModal(false)
        toast.success('Route selected successfully')
    }

    const handleSelectedRouteChange = (field: keyof SelectedRoute, value: string) => {
        if (selectedRoute) {
            setSelectedRoute({
                ...selectedRoute,
                [field]: value
            })
        }
    }

    const handleCleanupTempVideo = async (tempVideoId: string) => {
        try {
            const currentHost = window.location.hostname
            const apiUrl = currentHost === 'localhost'
                ? 'https://localhost:5001'
                : (process.env.NEXT_PUBLIC_API_URL || `https://${currentHost}:5001`)

            const response = await fetch(`${apiUrl}/api/v1/isl-video-generation/cleanup/${tempVideoId}`, {
                method: 'DELETE'
            })

            if (response.ok) {
                console.log(`Temporary video ${tempVideoId} cleaned up successfully`)
            } else {
                console.warn(`Failed to cleanup temporary video ${tempVideoId}`)
            }
        } catch (error) {
            console.error('Video cleanup error:', error)
        }
    }

    const handleCloseAnnouncementModal = async () => {
        // Clean up generated ISL video if it exists
        if (currentTempVideoId) {
            await handleCleanupTempVideo(currentTempVideoId)
        }
        
        // Reset all announcement-related states
        setShowAnnouncementModal(false)
        setAnnouncementProgress({
            step: '',
            progress: 0,
            isComplete: false,
            error: null
        })
        setGeneratedAnnouncement('')
        setGeneratedAnnouncements(null)
        setAnnouncementVideoUrl('')
        setCurrentTempVideoId(null)
        setSelectedAIModel(null)
    }

    const handleGenerateAnnouncement = () => {
        if (!selectedRoute || !selectedRoute.announcement_category) {
            toast.error('Please select an announcement category')
            return
        }

        // Show AI model selection modal first
        setShowModelSelectionModal(true)
    }

    const handleModelSelection = async (model: 'male' | 'female') => {
        if (!selectedRoute) return

        setSelectedAIModel(model)
        setShowModelSelectionModal(false)
        
        setIsGeneratingAnnouncement(true)
        setShowAnnouncementModal(true)
        setAnnouncementProgress({
            step: 'Preparing announcement...',
            progress: 0,
            isComplete: false,
            error: null
        })

        try {
            // Step 1: Generate announcement text
            setAnnouncementProgress({
                step: 'Generating announcement text...',
                progress: 20,
                isComplete: false,
                error: null
            })

            const announcementTexts = await generateAnnouncementTexts(selectedRoute)
            setGeneratedAnnouncements(announcementTexts)
            setGeneratedAnnouncement(announcementTexts.english) // Keep for backward compatibility

            // Step 2: Generate ISL video
            setAnnouncementProgress({
                step: `Generating ISL video with ${model === 'male' ? 'Male' : 'Female'} AI model...`,
                progress: 50,
                isComplete: false,
                error: null
            })

            const currentHost = window.location.hostname
            const apiUrl = currentHost === 'localhost'
                ? 'https://localhost:5001'
                : (process.env.NEXT_PUBLIC_API_URL || `https://${currentHost}:5001`)

            const formData = new FormData()
            formData.append('text', announcementTexts.english) // Use English text for ISL video generation
            formData.append('model_type', model) // Use selected AI model
            formData.append('user_id', user?.id || '1')

            const response = await fetch(`${apiUrl}/api/v1/isl-video-generation/generate-form`, {
                method: 'POST',
                body: formData
            })

            if (!response.ok) {
                throw new Error(`ISL video generation failed: ${response.statusText}`)
            }

            const result = await response.json()

            // Store temp video ID for cleanup
            setCurrentTempVideoId(result.temp_video_id)

            // Step 3: Get video URL
            setAnnouncementProgress({
                step: 'Preparing video for playback...',
                progress: 80,
                isComplete: false,
                error: null
            })

            const videoUrl = `${apiUrl}${result.preview_url}`
            setAnnouncementVideoUrl(videoUrl)

            // Step 4: Complete
            setAnnouncementProgress({
                step: 'Announcement ready!',
                progress: 100,
                isComplete: true,
                error: null
            })

            toast.success('Announcement generated successfully!')

        } catch (error) {
            console.error('Announcement generation error:', error)
            setAnnouncementProgress({
                step: 'Generation failed',
                progress: 0,
                isComplete: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            })
            toast.error('Failed to generate announcement')
        } finally {
            setIsGeneratingAnnouncement(false)
        }
    }

    const fetchAnnouncementTemplates = async () => {
        try {
            setLoadingTemplates(true)
            const currentHost = window.location.hostname
            const apiUrl = currentHost === 'localhost'
                ? 'https://localhost:5001'
                : (process.env.NEXT_PUBLIC_API_URL || `https://${currentHost}:5001`)

            // Fetch all templates
            const templatesResponse = await fetch(`${apiUrl}/api/v1/announcement-templates/`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            })

            if (templatesResponse.ok) {
                const templates = await templatesResponse.json()
                setAnnouncementTemplates(templates)
                
                // Extract unique categories
                const categories = [...new Set(templates.map((template: any) => template.category))] as string[]
                setAnnouncementCategories(categories)
            } else {
                console.error('Failed to fetch announcement templates')
                setAnnouncementCategories([])
                toast.error('Failed to load announcement templates. Please try again later.')
            }
        } catch (error) {
            console.error('Error fetching announcement templates:', error)
            setAnnouncementCategories([])
            toast.error('Failed to load announcement templates. Please check your connection.')
        } finally {
            setLoadingTemplates(false)
        }
    }

    const generateAnnouncementTexts = async (route: SelectedRoute): Promise<{
        english: string
        hindi: string
        marathi: string
        gujarati: string
    }> => {
        // Find template from database
        const template = announcementTemplates.find(t => t.category === route.announcement_category)
        
        if (!template) {
            throw new Error(`No announcement template found for category: ${route.announcement_category}`)
        }

        // Fetch train route translations
        let translations = null
        try {
            const currentHost = window.location.hostname
            const apiUrl = currentHost === 'localhost'
                ? 'https://localhost:5001'
                : (process.env.NEXT_PUBLIC_API_URL || `https://${currentHost}:5001`)

            // Fetch translations for this train route using the ID
            const translationResponse = await fetch(`${apiUrl}/api/v1/train-route-translations/route/${route.id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            })

            if (translationResponse.ok) {
                translations = await translationResponse.json()
            }
        } catch (error) {
            console.warn('Failed to fetch train route translations:', error)
            // Continue with English values if translation fetch fails
        }

        // Create language-specific replacements
        const createReplacements = (language: 'en' | 'hi' | 'mr' | 'gu') => {
            if (translations && language !== 'en') {
                return {
                    train_number: route.train_number,
                    train_name: language === 'hi' ? translations.train_name_hi || route.train_name :
                               language === 'mr' ? translations.train_name_mr || route.train_name :
                               language === 'gu' ? translations.train_name_gu || route.train_name :
                               route.train_name,
                    start_station: language === 'hi' ? translations.from_station_hi || route.from_station :
                                  language === 'mr' ? translations.from_station_mr || route.from_station :
                                  language === 'gu' ? translations.from_station_gu || route.from_station :
                                  route.from_station,
                    end_station: language === 'hi' ? translations.to_station_hi || route.to_station :
                                language === 'mr' ? translations.to_station_mr || route.to_station :
                                language === 'gu' ? translations.to_station_gu || route.to_station :
                                route.to_station,
                    platform: route.platform
                }
            } else {
                // Use English values
                return {
                    train_number: route.train_number,
                    train_name: route.train_name,
                    start_station: route.from_station,
                    end_station: route.to_station,
                    platform: route.platform
                }
            }
        }

        const replacePlaceholders = (text: string, replacements: any) => {
            return text
                .replace('{train_number}', replacements.train_number)
                .replace('{train_name}', replacements.train_name)
                .replace('{start_station}', replacements.start_station)
                .replace('{end_station}', replacements.end_station)
                .replace('{platform}', replacements.platform)
        }

        return {
            english: template.english_template ? replacePlaceholders(template.english_template, createReplacements('en')) : '',
            hindi: template.hindi_template ? replacePlaceholders(template.hindi_template, createReplacements('hi')) : '',
            marathi: template.marathi_template ? replacePlaceholders(template.marathi_template, createReplacements('mr')) : '',
            gujarati: template.gujarati_template ? replacePlaceholders(template.gujarati_template, createReplacements('gu')) : ''
        }
    }

    const handleTrainSearch = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!searchQuery.trim()) {
            toast.error('Please enter a train number or name')
            return
        }

        try {
            const currentHost = window.location.hostname
            const apiUrl = currentHost === 'localhost'
                ? 'https://localhost:5001'
                : (process.env.NEXT_PUBLIC_API_URL || 'https://192.168.1.10:5001')

            // Search for train routes
            const response = await fetch(`${apiUrl}/api/v1/train-routes/search?q=${encodeURIComponent(searchQuery)}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            })

            if (response.ok) {
                const searchResults = await response.json()

                if (searchResults.length === 0) {
                    toast.error('No trains found matching your search')
                    setSearchResults([])
                } else {
                    // Always show search results for user selection
                    setSearchResults(searchResults.map((route: TrainRoute) => ({
                        trainNumber: route.train_number,
                        trainName: route.train_name,
                        route: `${route.from_station} → ${route.to_station}`,
                        departure: 'N/A',
                        arrival: 'N/A',
                        status: 'Available',
                        routeData: route // Store original route data for selection
                    })))
                    toast.success(`Found ${searchResults.length} train(s) - please select one`)
                }
            } else {
                toast.error('Failed to search for trains')
                setSearchResults([])
            }
        } catch (error) {
            console.error('Error searching trains:', error)
            toast.error('Error searching for trains')
            setSearchResults([])
        }
    }

    // Show loading while checking authentication
    if (!user) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Fixed Header */}
            <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-40">
                {/* Left Section - Logo */}
                <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center">
                        <div className="w-4 h-4 bg-white rounded-full"></div>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xl font-semibold text-gray-900">SignSphere</span>
                        <span className="text-sm text-gray-500">Western Railway Divyangjan Announcement System</span>
                    </div>
                </div>

                {/* Right Section - Notifications and Profile */}
                <div className="flex items-center space-x-4">


                    {/* Profile */}
                    <div className="relative profile-dropdown">
                        <button
                            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                            className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center">
                                <span className="text-white text-sm font-medium">A</span>
                            </div>
                            <span className="text-sm font-medium text-gray-700">{user?.username}</span>
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {/* Profile Dropdown */}
                        {showProfileDropdown && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                                <div className="px-4 py-2 border-b border-gray-100">
                                    <p className="text-sm font-medium text-gray-900">{user?.username}</p>
                                    <p className="text-xs text-gray-500">Administrator</p>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                >
                                    Sign out
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <div className="flex pt-16">
                {/* Fixed Sidebar */}
                <aside className="fixed left-0 top-16 bottom-0 bg-white border-r border-gray-200 w-fit min-w-64 max-w-80 z-30 overflow-y-auto">
                    <nav className="p-4 pt-8 space-y-2 w-full">
                        {/* Dashboard */}
                        <Link href="/dashboard" className="flex items-center space-x-3 px-3 py-2 bg-teal-50 text-teal-700 rounded-lg">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            <span>Dashboard</span>
                        </Link>

                        {/* Route Management */}
                        <Link href="/route-management" className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                            </svg>
                            <span>Route Management</span>
                        </Link>

                        {/* AI Content Generation Section */}
                        <div className="pt-6">
                            <h3 className="px-3 text-sm font-bold text-gray-800 uppercase tracking-wider mb-3">
                                AI Content Generation
                            </h3>
                            <Link href="/ai-generated-assets" className="hidden flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                                <span>AI Generated Assets</span>
                            </Link>
                            <Link href="/ai-generated-assets/translations" className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                                </svg>
                                <span>Train Route Translations</span>
                            </Link>
                            <Link href="/announcement-template" className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                                </svg>
                                <span>Announcement Template</span>
                            </Link>
                            <Link href="/general-announcements" className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                                </svg>
                                <span>General Announcements</span>
                            </Link>
                            <Link href="/ai-generated-assets/audio-to-isl" className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                                </svg>
                                <span>Audio File to ISL</span>
                            </Link>
                            <Link href="/ai-generated-assets/speech-to-isl" className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                </svg>
                                <span>Speech to ISL</span>
                            </Link>
                            <Link href="/ai-generated-assets/text-to-isl" className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span>Text to ISL</span>
                            </Link>
                        </div>

                        {/* Indian Sign Language (ISL) Section */}
                        <div className="pt-6">
                            <h3 className="px-3 text-sm font-bold text-gray-800 uppercase tracking-wider mb-3">
                                Indian Sign Language (ISL)
                            </h3>
                            <Link href="/ai-generated-assets/isl-dataset" className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                                <span>ISL Dictionary</span>
                            </Link>
                        </div>

                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-6 min-h-screen pb-24 ml-64">
                    <div className="max-w-6xl mx-auto">
                        {/* Welcome Section */}
                        <div className="mb-8 pt-4">
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {user?.username}!</h1>
                        </div>

                        {/* Train Search Section */}
                        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm mb-8">
                            <div className="flex items-center mb-4">
                                <svg className="w-6 h-6 text-teal-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <h2 className="text-xl font-semibold text-gray-900">Search for trains by number or name to quickly find a route.</h2>
                            </div>

                            {/* Search Mode Toggle */}
                            <div className="mb-4">
                                <div className="flex items-center space-x-4">
                                    <span className="text-sm font-medium text-gray-700">Search by:</span>
                                    <div className="flex bg-gray-100 rounded-lg p-1">
                                        <button
                                            type="button"
                                            onClick={() => setSearchMode('number')}
                                            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${searchMode === 'number'
                                                ? 'bg-white text-teal-600 shadow-sm'
                                                : 'text-gray-600 hover:text-gray-900'
                                                }`}
                                        >
                                            Train Number
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setSearchMode('name')}
                                            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${searchMode === 'name'
                                                ? 'bg-white text-teal-600 shadow-sm'
                                                : 'text-gray-600 hover:text-gray-900'
                                                }`}
                                        >
                                            Train Name
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={handleTrainSearch} className="flex gap-4 mb-6">
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        placeholder={
                                            searchMode === 'number'
                                                ? "Enter train number (e.g., 12951)"
                                                : "Enter train name (e.g., Rajdhani)"
                                        }
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors text-black"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors duration-200"
                                >
                                    Search
                                </button>
                                <button
                                    type="button"
                                    onClick={handlePickRouteClick}
                                    className="px-6 py-3 text-white font-semibold rounded-lg transition-colors duration-200"
                                    style={{ backgroundColor: '#287fb8' }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1e5f8a'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#287fb8'}
                                >
                                    Pick Route
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearchQuery('')
                                        setSearchResults([])
                                        setSelectedRoute(null)
                                        toast.success('Search and selected route cleared')
                                    }}
                                    className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors duration-200"
                                >
                                    Clear
                                </button>
                            </form>

                            {/* Search Results */}
                            {searchResults.length > 0 && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-medium text-gray-900">Search Results</h3>
                                        <span className="text-sm text-gray-500">{searchResults.length} result(s) found</span>
                                    </div>
                                    <div className="space-y-2">
                                        {searchResults.map((train, index) => (
                                            <div
                                                key={index}
                                                onClick={() => {
                                                    if (train.routeData) {
                                                        // This is from search results, use the stored route data
                                                        setSelectedRoute({
                                                            id: train.routeData.id,
                                                            train_number: train.routeData.train_number,
                                                            train_name: train.routeData.train_name,
                                                            from_station: train.routeData.from_station,
                                                            to_station: train.routeData.to_station,
                                                            platform: '1',
                                                            announcement_category: 'Arriving'
                                                        })
                                                        setSearchResults([])
                                                        toast.success('Train selected!')
                                                    }
                                                }}
                                                className="border border-gray-200 rounded-lg p-4 hover:bg-teal-50 hover:border-teal-300 cursor-pointer transition-all duration-200"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-4">
                                                        <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                                                            <span className="text-teal-600 font-bold text-sm">{train.trainNumber}</span>
                                                        </div>
                                                        <div>
                                                            <h4 className="font-semibold text-gray-900">{train.trainName}</h4>
                                                            <p className="text-sm text-gray-600">{train.route}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-sm text-gray-600">
                                                            <span className="font-medium">Status:</span> {train.status}
                                                        </div>
                                                        <div className="text-xs text-teal-600 font-medium mt-1">
                                                            Click to select
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Selected Route Section */}
                        {selectedRoute && (
                            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm mb-8">
                                <div className="flex items-center mb-4">
                                    <svg className="w-6 h-6 text-teal-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                    </svg>
                                    <h2 className="text-xl font-semibold text-gray-900">Selected Route</h2>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-gray-200">
                                                <th className="text-left py-3 px-4 font-medium text-black">Train Number</th>
                                                <th className="text-left py-3 px-4 font-medium text-black">Train Name</th>
                                                <th className="text-left py-3 px-4 font-medium text-black">From Station</th>
                                                <th className="text-left py-3 px-4 font-medium text-black">To Station</th>
                                                <th className="text-left py-3 px-4 font-medium text-black">Platform</th>
                                                <th className="text-left py-3 px-4 font-medium text-black">Announcement Category</th>
                                                <th className="text-left py-3 px-4 font-medium text-black">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr className="border-b border-gray-100">
                                                <td className="py-3 px-4">
                                                    <span className="text-black font-medium">{selectedRoute.train_number}</span>
                                                </td>
                                                <td className="py-3 px-4 min-w-[200px]">
                                                    <span className="text-black break-words">{selectedRoute.train_name}</span>
                                                </td>
                                                <td className="py-3 px-4 min-w-[150px]">
                                                    <span className="text-black break-words">{selectedRoute.from_station}</span>
                                                </td>
                                                <td className="py-3 px-4 min-w-[150px]">
                                                    <span className="text-black break-words">{selectedRoute.to_station}</span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="relative w-20">
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            max="99"
                                                            value={selectedRoute.platform}
                                                            onChange={(e) => {
                                                                const value = e.target.value
                                                                // Only allow 1-2 digits, no leading zeros except for single digits
                                                                if (value === '' || (value.length <= 2 && parseInt(value) >= 1 && parseInt(value) <= 99)) {
                                                                    handleSelectedRouteChange('platform', value)
                                                                }
                                                            }}
                                                            className="w-full px-2 py-2 pr-8 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-black text-center"
                                                            style={{ color: '#000000' }}
                                                        />
                                                        <div className="absolute right-1 top-0 bottom-0 flex flex-col">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const currentValue = parseInt(selectedRoute.platform) || 1
                                                                    if (currentValue < 99) {
                                                                        handleSelectedRouteChange('platform', (currentValue + 1).toString())
                                                                    }
                                                                }}
                                                                className="flex-1 flex items-center justify-center text-gray-400 hover:text-gray-600 text-xs"
                                                            >
                                                                ▲
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const currentValue = parseInt(selectedRoute.platform) || 1
                                                                    if (currentValue > 1) {
                                                                        handleSelectedRouteChange('platform', (currentValue - 1).toString())
                                                                    }
                                                                }}
                                                                className="flex-1 flex items-center justify-center text-gray-400 hover:text-gray-600 text-xs"
                                                            >
                                                                ▼
                                                            </button>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <select
                                                        value={selectedRoute.announcement_category}
                                                        onChange={(e) => handleSelectedRouteChange('announcement_category', e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-black"
                                                        disabled={loadingTemplates}
                                                    >
                                                        <option value="">
                                                            {loadingTemplates ? 'Loading categories...' : 'Select Category'}
                                                        </option>
                                                        {announcementCategories.map((category) => (
                                                            <option key={category} value={category}>
                                                                {category}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <button
                                                        onClick={handleGenerateAnnouncement}
                                                        disabled={!selectedRoute.announcement_category || isGeneratingAnnouncement || announcementTemplates.length === 0}
                                                        className={`p-2 rounded-lg transition-colors ${
                                                            !selectedRoute.announcement_category || isGeneratingAnnouncement || announcementTemplates.length === 0
                                                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                                : 'bg-teal-600 text-white hover:bg-teal-700'
                                                        }`}
                                                        title={
                                                            announcementTemplates.length === 0 
                                                                ? "No announcement templates available" 
                                                                : "Generate Announcement"
                                                        }
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                                        </svg>
                                                    </button>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* No Templates Available Message */}
                        {announcementTemplates.length === 0 && !loadingTemplates && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                                <div className="flex items-center">
                                    <svg className="w-5 h-5 text-yellow-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                    </svg>
                                    <div>
                                        <h3 className="text-sm font-medium text-yellow-800">No Announcement Templates Available</h3>
                                        <p className="text-sm text-yellow-700 mt-1">
                                            Please add announcement templates in the Announcement Templates section to generate announcements.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                </main>
            </div>

            {/* Project Info Modal */}
            {showProjectInfo && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            {/* Header */}
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">Project Information</h2>
                                <button
                                    onClick={() => setShowProjectInfo(false)}
                                    className="text-gray-400 hover:text-gray-600 text-sm font-medium"
                                >
                                    Close
                                </button>
                            </div>

                            {/* Content */}
                            <div className="space-y-6">
                                {/* Mission Section */}
                                <div className="text-center">
                                    <div className="mb-4">
                                        {appConfig.branding.projectInfoImage && (
                                            <Image
                                                src={appConfig.branding.projectInfoImage.path}
                                                alt="Project Mission"
                                                width={appConfig.branding.projectInfoImage.width || 101}
                                                height={appConfig.branding.projectInfoImage.height || 104}
                                                className="mx-auto"
                                                style={{ background: 'transparent' }}
                                            />
                                        )}
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-900 mb-3">Our Mission</h3>
                                    <p className="text-gray-600 leading-relaxed">
                                        The Western Railway Divyangjan Announcement System is designed to make travel more accessible
                                        for people who are deaf or hard of hearing. Our platform delivers important train announcements
                                        using Indian Sign Language (ISL) videos, synchronized subtitles, and text notifications,
                                        ensuring equal access to real-time information at railway stations and on trains.
                                    </p>
                                </div>

                                {/* Vision Section */}
                                <div className="bg-gray-50 p-6 rounded-lg">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Our Vision</h3>
                                    <p className="text-gray-600 leading-relaxed">
                                        We aim to foster independence and confidence for Divyangjan passengers within the Western Railway network
                                        by providing an inclusive platform built according to accessibility standards. Our goal is to ensure
                                        that every passenger has equal access to crucial travel information, making railway travel more
                                        accessible and enjoyable for everyone.
                                    </p>
                                </div>

                                {/* Features Section */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Key Features</h3>
                                    <ul className="space-y-2 text-gray-600">
                                        <li className="flex items-start">
                                            <span className="text-teal-600 mr-2">•</span>
                                            Indian Sign Language (ISL) video announcements
                                        </li>
                                        <li className="flex items-start">
                                            <span className="text-teal-600 mr-2">•</span>
                                            Synchronized subtitles for all announcements
                                        </li>
                                        <li className="flex items-start">
                                            <span className="text-teal-600 mr-2">•</span>
                                            Real-time text notifications
                                        </li>
                                        <li className="flex items-start">
                                            <span className="text-teal-600 mr-2">•</span>
                                            Accessibility-compliant design
                                        </li>
                                        <li className="flex items-start">
                                            <span className="text-teal-600 mr-2">•</span>
                                            Train route management system
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Pick Route Modal */}
            {showPickRouteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900">Select Train Route</h2>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Choose a train route from the available options
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowPickRouteModal(false)}
                                    className="text-gray-400 hover:text-gray-600 text-sm font-medium"
                                >
                                    Close
                                </button>
                            </div>
                        </div>

                        <div className="p-6 overflow-y-auto max-h-[60vh]">
                            {loadingRoutes ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
                                    <span className="ml-2 text-gray-600">Loading train routes...</span>
                                </div>
                            ) : trainRoutes.length === 0 ? (
                                <div className="text-center py-12">
                                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                    </svg>
                                    <p className="text-gray-500">No train routes available</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {trainRoutes.map((route) => (
                                        <div
                                            key={route.id}
                                            onClick={() => handleRouteSelect(route)}
                                            className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-4">
                                                    <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                                                        <span className="text-teal-600 font-bold text-sm">{route.train_number}</span>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-gray-900">{route.train_name}</h4>
                                                        <p className="text-sm text-gray-600">
                                                            {route.from_station} → {route.to_station}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm text-gray-600">
                                                        <span className="font-medium">From:</span> {route.from_station_code}
                                                    </div>
                                                    <div className="text-sm text-gray-600">
                                                        <span className="font-medium">To:</span> {route.to_station_code}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Announcement Generation Modal */}
            {showAnnouncementModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full mx-4 max-h-[90vh] overflow-hidden">
                        {/* Header */}
                        <div className="flex justify-between items-center p-6 border-b border-gray-200">
                            <h2 className="text-2xl font-bold text-gray-900">Announcement Generation</h2>
                            <button
                                onClick={handleCloseAnnouncementModal}
                                className="text-gray-400 hover:text-gray-600 text-sm font-medium"
                            >
                                Close
                            </button>
                        </div>

                        {/* Two Panel Layout */}
                        <div className="flex h-[calc(90vh-120px)]">
                            {/* Left Panel - Multi-language Announcements */}
                            <div className="w-1/2 p-6 border-r border-gray-200 overflow-y-auto">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Generated Announcements</h3>
                                
                                {generatedAnnouncements ? (
                                    <div className="space-y-4">
                                        {/* English */}
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                            <div className="flex items-center mb-2">
                                                <span className="text-sm font-medium text-blue-800 bg-blue-100 px-2 py-1 rounded">English</span>
                                            </div>
                                            <p className="text-gray-700 leading-relaxed">{generatedAnnouncements.english}</p>
                                        </div>

                                        {/* Hindi */}
                                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                                            <div className="flex items-center mb-2">
                                                <span className="text-sm font-medium text-orange-800 bg-orange-100 px-2 py-1 rounded">हिंदी (Hindi)</span>
                                            </div>
                                            <p className="text-gray-700 leading-relaxed">{generatedAnnouncements.hindi || 'Translation not available'}</p>
                                        </div>

                                        {/* Marathi */}
                                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                            <div className="flex items-center mb-2">
                                                <span className="text-sm font-medium text-green-800 bg-green-100 px-2 py-1 rounded">मराठी (Marathi)</span>
                                            </div>
                                            <p className="text-gray-700 leading-relaxed">{generatedAnnouncements.marathi || 'Translation not available'}</p>
                                        </div>

                                        {/* Gujarati */}
                                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                            <div className="flex items-center mb-2">
                                                <span className="text-sm font-medium text-purple-800 bg-purple-100 px-2 py-1 rounded">ગુજરાતી (Gujarati)</span>
                                            </div>
                                            <p className="text-gray-700 leading-relaxed">{generatedAnnouncements.gujarati || 'Translation not available'}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <p className="text-gray-500">No announcements generated yet</p>
                                    </div>
                                )}
                            </div>

                            {/* Right Panel - ISL Video Generation */}
                            <div className="w-1/2 p-6 overflow-y-auto">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">ISL Video Generation</h3>
                                
                                {/* Progress Section */}
                                {!announcementProgress.isComplete && !announcementProgress.error && (
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm text-gray-600">
                                                <span>{announcementProgress.step}</span>
                                                <span>{announcementProgress.progress}%</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-teal-600 h-2 rounded-full transition-all duration-500"
                                                    style={{ width: `${announcementProgress.progress}%` }}
                                                />
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-500">
                                            Please wait while we generate your ISL video...
                                        </p>
                                    </div>
                                )}

                                {/* Error Section */}
                                {announcementProgress.error && (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                        <div className="flex items-center">
                                            <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <h3 className="text-lg font-semibold text-red-800">Generation Failed</h3>
                                        </div>
                                        <p className="text-red-700 mt-2">{announcementProgress.error}</p>
                                        <button
                                            onClick={handleGenerateAnnouncement}
                                            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                        >
                                            Try Again
                                        </button>
                                    </div>
                                )}

                                {/* Video Player Section */}
                                {announcementProgress.isComplete && announcementVideoUrl && (
                                    <div className="space-y-4">
                                        <div className="bg-gray-900 rounded-lg p-4">
                                            <video
                                                src={announcementVideoUrl}
                                                controls
                                                className="w-full rounded-lg"
                                                style={{ maxHeight: '400px' }}
                                                autoPlay
                                            />
                                        </div>
                                        
                                        {/* Play Speed Control */}
                                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <label className="text-sm font-medium text-gray-700">Play Speed</label>
                                                <span className="text-sm text-gray-500">{playSpeed}x</span>
                                            </div>
                                            <div className="flex space-x-2">
                                                {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((speed) => (
                                                    <button
                                                        key={speed}
                                                        onClick={() => handlePlaySpeedChange(speed)}
                                                        className={`px-3 py-1 text-sm rounded-md transition-colors ${
                                                            playSpeed === speed
                                                                ? 'bg-teal-600 text-white'
                                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                        }`}
                                                    >
                                                        {speed}x
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex space-x-3">
                                            <button
                                                onClick={() => {
                                                    const video = document.querySelector('video')
                                                    if (video) {
                                                        video.play()
                                                    }
                                                }}
                                                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                                            >
                                                Play Again
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    // Clean up current video before generating new one
                                                    if (currentTempVideoId) {
                                                        await handleCleanupTempVideo(currentTempVideoId)
                                                    }
                                                    setShowAnnouncementModal(false)
                                                    setShowModelSelectionModal(true)
                                                }}
                                                disabled={isGeneratingAnnouncement}
                                                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                                            >
                                                Generate New
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Empty State */}
                                {!announcementProgress.isComplete && !announcementProgress.error && !announcementVideoUrl && (
                                    <div className="text-center py-8">
                                        <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                        <p className="text-gray-500">ISL video will appear here after generation</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* AI Model Selection Modal */}
            {showModelSelectionModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                        <div className="p-6">
                            {/* Header */}
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-semibold text-gray-900">Select AI Model</h2>
                                <button
                                    onClick={() => setShowModelSelectionModal(false)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Content */}
                            <div className="space-y-4">
                                <p className="text-gray-600">
                                    Choose the AI model for generating the ISL video announcement:
                                </p>

                                {/* Model Selection */}
                                <div className="space-y-3">
                                    <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                        <input
                                            type="radio"
                                            name="aiModel"
                                            value="male"
                                            onChange={() => setSelectedAIModel('male')}
                                            className="mr-3 h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300"
                                        />
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-900">Male Model</div>
                                                <div className="text-sm text-gray-500">Generate ISL video with male AI model</div>
                                            </div>
                                        </div>
                                    </label>

                                    <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                        <input
                                            type="radio"
                                            name="aiModel"
                                            value="female"
                                            onChange={() => setSelectedAIModel('female')}
                                            className="mr-3 h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300"
                                        />
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center mr-3">
                                                <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-900">Female Model</div>
                                                <div className="text-sm text-gray-500">Generate ISL video with female AI model</div>
                                            </div>
                                        </div>
                                    </label>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex space-x-3 pt-4">
                                    <button
                                        onClick={() => setShowModelSelectionModal(false)}
                                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => selectedAIModel && handleModelSelection(selectedAIModel)}
                                        disabled={!selectedAIModel}
                                        className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                                            selectedAIModel
                                                ? 'bg-teal-600 text-white hover:bg-teal-700'
                                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        }`}
                                    >
                                        Generate Announcement
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}
