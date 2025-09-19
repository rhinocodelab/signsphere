'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { appConfig } from '@/config/app-config'
import DashboardLayout from '@/components/layouts/DashboardLayout'

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
                        'Content-Type': 'application/json',
                    },
                })

                if (response.ok) {
                    const userInfo = await response.json()
                    setUser(userInfo)
                } else {
                    // Token is invalid, redirect to login
                    localStorage.removeItem('isLoggedIn')
                    localStorage.removeItem('user')
                    localStorage.removeItem('accessToken')
                    router.push('/login')
                }
            } catch (error) {
                console.error('Authentication check failed:', error)
                localStorage.removeItem('isLoggedIn')
                localStorage.removeItem('user')
                localStorage.removeItem('accessToken')
                router.push('/login')
            }
        }

        checkAuthentication()
    }, [router])

    const handleLogout = () => {
        localStorage.removeItem('isLoggedIn')
        localStorage.removeItem('user')
        localStorage.removeItem('accessToken')
        router.push('/login')
    }

    const generateAnnouncementTexts = async (route: SelectedRoute, template: any) => {
        try {
            const currentHost = window.location.hostname
            const apiUrl = currentHost === 'localhost'
                ? 'https://localhost:5001'
                : (process.env.NEXT_PUBLIC_API_URL || 'https://192.168.1.10:5001')

            const response = await fetch(`${apiUrl}/api/v1/general-announcements/generate-announcement-texts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                },
                body: JSON.stringify({
                    train_number: route.train_number,
                    train_name: route.train_name,
                    from_station: route.from_station,
                    to_station: route.to_station,
                    platform: route.platform,
                    announcement_category: route.announcement_category,
                    template_id: template.id
                }),
            })

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const data = await response.json()
            return data
        } catch (error) {
            console.error('Error generating announcement texts:', error)
            throw error
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

            const endpoint = searchMode === 'number' 
                ? `${apiUrl}/api/v1/train-routes/search-by-number/${searchQuery}`
                : `${apiUrl}/api/v1/train-routes/search-by-name/${searchQuery}`

            const response = await fetch(endpoint, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                    'Content-Type': 'application/json',
                },
            })

            if (response.ok) {
                const data = await response.json()
                if (data && data.length > 0) {
                    setSearchResults(data)
                    toast.success(`Found ${data.length} train(s)`)
                } else {
                    toast('No trains found matching your search')
                    setSearchResults([])
                }
            } else {
                toast.error('Error searching for trains')
                setSearchResults([])
            }
        } catch (error) {
            console.error('Error searching trains:', error)
            toast.error('Error searching for trains')
            setSearchResults([])
        }
    }

    const handlePickRouteClick = () => {
        setShowPickRouteModal(true)
        loadTrainRoutes()
    }

    const loadTrainRoutes = async () => {
        setLoadingRoutes(true)
        try {
            const currentHost = window.location.hostname
            const apiUrl = currentHost === 'localhost'
                ? 'https://localhost:5001'
                : (process.env.NEXT_PUBLIC_API_URL || 'https://192.168.1.10:5001')

            const response = await fetch(`${apiUrl}/api/v1/train-routes`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                    'Content-Type': 'application/json',
                },
            })

            if (response.ok) {
                const data = await response.json()
                setTrainRoutes(data)
            } else {
                toast.error('Failed to load train routes')
            }
        } catch (error) {
            console.error('Error loading train routes:', error)
            toast.error('Error loading train routes')
        } finally {
            setLoadingRoutes(false)
        }
    }

    const loadAnnouncementTemplates = async () => {
        setLoadingTemplates(true)
        try {
            const currentHost = window.location.hostname
            const apiUrl = currentHost === 'localhost'
                ? 'https://localhost:5001'
                : (process.env.NEXT_PUBLIC_API_URL || 'https://192.168.1.10:5001')

            const response = await fetch(`${apiUrl}/api/v1/announcement-templates`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                    'Content-Type': 'application/json',
                },
            })

            if (response.ok) {
                const data = await response.json()
                setAnnouncementTemplates(data)
            } else {
                toast.error('Failed to load announcement templates')
            }
        } catch (error) {
            console.error('Error loading announcement templates:', error)
            toast.error('Error loading announcement templates')
        } finally {
            setLoadingTemplates(false)
        }
    }

    const handleGenerateAnnouncement = async () => {
        if (!selectedRoute) {
            toast.error('Please select a route first')
            return
        }

        setShowModelSelectionModal(true)
        loadAnnouncementTemplates()
    }

    const handleModelSelection = async (model: 'male' | 'female') => {
        if (!selectedRoute || !announcementTemplates.length) {
            toast.error('Missing route or templates')
            return
        }

        setShowModelSelectionModal(false)
        setShowAnnouncementModal(true)
        setIsGeneratingAnnouncement(true)
        setAnnouncementProgress({ step: 'Generating announcement texts...', progress: 10, isComplete: false, error: null })

        try {
            // Generate announcement texts
            const announcementTexts = await generateAnnouncementTexts(selectedRoute, announcementTemplates[0])
            setGeneratedAnnouncements(announcementTexts)
            setAnnouncementProgress({ step: 'Creating ISL video...', progress: 50, isComplete: false, error: null })

            // Generate ISL video
            const currentHost = window.location.hostname
            const apiUrl = currentHost === 'localhost'
                ? 'https://localhost:5001'
                : (process.env.NEXT_PUBLIC_API_URL || 'https://192.168.1.10:5001')

            const videoResponse = await fetch(`${apiUrl}/api/v1/general-announcements/generate-announcement-video`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                },
                body: JSON.stringify({
                    announcement_texts: announcementTexts,
                    ai_model: model,
                    train_number: selectedRoute.train_number,
                    train_name: selectedRoute.train_name,
                    from_station: selectedRoute.from_station,
                    to_station: selectedRoute.to_station,
                    platform: selectedRoute.platform,
                    announcement_category: selectedRoute.announcement_category
                }),
            })

            if (videoResponse.ok) {
                const videoData = await videoResponse.json()
                setAnnouncementVideoUrl(videoData.video_url)
                setCurrentTempVideoId(videoData.temp_video_id)
                setAnnouncementProgress({ step: 'Announcement generated successfully!', progress: 100, isComplete: true, error: null })
                toast.success('Announcement generated successfully!')
            } else {
                throw new Error('Failed to generate video')
            }
        } catch (error) {
            console.error('Error generating announcement:', error)
            setAnnouncementProgress({ step: 'Generation failed', progress: 0, isComplete: false, error: error instanceof Error ? error.message : 'Unknown error' })
            toast.error('Failed to generate announcement')
        } finally {
            setIsGeneratingAnnouncement(false)
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
        <DashboardLayout activeMenuItem="dashboard">
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
                                    <th className="text-left py-3 px-4 font-medium text-black">Category</th>
                                    <th className="text-left py-3 px-4 font-medium text-black">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b border-gray-100">
                                    <td className="py-3 px-4 text-gray-900 font-medium">{selectedRoute.train_number}</td>
                                    <td className="py-3 px-4 text-gray-700">{selectedRoute.train_name}</td>
                                    <td className="py-3 px-4 text-gray-700">{selectedRoute.from_station}</td>
                                    <td className="py-3 px-4 text-gray-700">{selectedRoute.to_station}</td>
                                    <td className="py-3 px-4 text-gray-700">{selectedRoute.platform}</td>
                                    <td className="py-3 px-4 text-gray-700">{selectedRoute.announcement_category}</td>
                                    <td className="py-3 px-4">
                                        <button
                                            onClick={handleGenerateAnnouncement}
                                            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                                        >
                                            Generate Announcement
                                        </button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Pick Route Modal */}
            {showPickRouteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-gray-900">Pick a Route</h2>
                            <button
                                onClick={() => setShowPickRouteModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {loadingRoutes ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
                                <span className="ml-2 text-gray-600">Loading routes...</span>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {trainRoutes.map((route) => (
                                    <div
                                        key={route.id}
                                        onClick={() => {
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
                                            toast.success('Route selected!')
                                        }}
                                        className="border border-gray-200 rounded-lg p-4 hover:bg-teal-50 hover:border-teal-300 cursor-pointer transition-all duration-200"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                                                    <span className="text-teal-600 font-bold text-sm">{route.train_number}</span>
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-gray-900">{route.train_name}</h4>
                                                    <p className="text-sm text-gray-600">{route.from_station} → {route.to_station}</p>
                                                </div>
                                            </div>
                                            <div className="text-xs text-teal-600 font-medium">
                                                Click to select
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Announcement Generation Modal */}
            {showAnnouncementModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-gray-900">Generating Announcement</h2>
                            <button
                                onClick={() => setShowAnnouncementModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-gray-50 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-700">Progress</span>
                                    <span className="text-sm text-gray-500">{announcementProgress.progress}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-teal-600 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${announcementProgress.progress}%` }}
                                    ></div>
                                </div>
                                <p className="text-sm text-gray-600 mt-2">{announcementProgress.step}</p>
                            </div>

                            {announcementProgress.error && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <p className="text-red-700 text-sm">{announcementProgress.error}</p>
                                </div>
                            )}

                            {announcementProgress.isComplete && announcementVideoUrl && (
                                <div className="space-y-4">
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                        <p className="text-green-700 text-sm">Announcement generated successfully!</p>
                                    </div>

                                    {generatedAnnouncements && (
                                        <div className="space-y-3">
                                            <h3 className="font-medium text-gray-900">Generated Announcements:</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <div className="bg-gray-50 rounded-lg p-3">
                                                    <h4 className="font-medium text-gray-700 mb-1">English</h4>
                                                    <p className="text-sm text-gray-600">{generatedAnnouncements.english}</p>
                                                </div>
                                                <div className="bg-gray-50 rounded-lg p-3">
                                                    <h4 className="font-medium text-gray-700 mb-1">Hindi</h4>
                                                    <p className="text-sm text-gray-600">{generatedAnnouncements.hindi}</p>
                                                </div>
                                                <div className="bg-gray-50 rounded-lg p-3">
                                                    <h4 className="font-medium text-gray-700 mb-1">Marathi</h4>
                                                    <p className="text-sm text-gray-600">{generatedAnnouncements.marathi}</p>
                                                </div>
                                                <div className="bg-gray-50 rounded-lg p-3">
                                                    <h4 className="font-medium text-gray-700 mb-1">Gujarati</h4>
                                                    <p className="text-sm text-gray-600">{generatedAnnouncements.gujarati}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-3">
                                        <h3 className="font-medium text-gray-900">ISL Video:</h3>
                                        <div className="bg-gray-900 rounded-lg overflow-hidden">
                                            <video
                                                controls
                                                className="w-full h-auto"
                                                style={{ maxHeight: '400px' }}
                                            >
                                                <source src={announcementVideoUrl} type="video/mp4" />
                                                Your browser does not support the video tag.
                                            </video>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <span className="text-sm text-gray-600">Playback Speed:</span>
                                            <select
                                                value={playSpeed}
                                                onChange={(e) => handlePlaySpeedChange(parseFloat(e.target.value))}
                                                className="px-2 py-1 border border-gray-300 rounded text-sm"
                                            >
                                                <option value={0.5}>0.5x</option>
                                                <option value={0.75}>0.75x</option>
                                                <option value={1.0}>1.0x</option>
                                                <option value={1.25}>1.25x</option>
                                                <option value={1.5}>1.5x</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* AI Model Selection Modal */}
            {showModelSelectionModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-gray-900">Select AI Model</h2>
                            <button
                                onClick={() => setShowModelSelectionModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-4">
                            <p className="text-gray-600">Choose the AI model for generating the ISL video:</p>
                            
                            <div className="space-y-3">
                                <button
                                    onClick={() => setSelectedAIModel('male')}
                                    className={`w-full p-4 border-2 rounded-lg text-left transition-colors ${
                                        selectedAIModel === 'male'
                                            ? 'border-teal-500 bg-teal-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-gray-900">Male Model</h3>
                                            <p className="text-sm text-gray-600">Generate ISL video with male avatar</p>
                                        </div>
                                    </div>
                                </button>

                                <button
                                    onClick={() => setSelectedAIModel('female')}
                                    className={`w-full p-4 border-2 rounded-lg text-left transition-colors ${
                                        selectedAIModel === 'female'
                                            ? 'border-teal-500 bg-teal-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center">
                                            <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-gray-900">Female Model</h3>
                                            <p className="text-sm text-gray-600">Generate ISL video with female avatar</p>
                                        </div>
                                    </div>
                                </button>
                            </div>

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
            )}
        </DashboardLayout>
    )
}