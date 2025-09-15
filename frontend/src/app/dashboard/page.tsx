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
        fetchAnnouncementCategories()
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

    const fetchAnnouncementCategories = async () => {
        try {
            const currentHost = window.location.hostname
            const apiUrl = currentHost === 'localhost'
                ? 'https://localhost:5001'
                : (process.env.NEXT_PUBLIC_API_URL || 'https://192.168.1.10:5001')

            const response = await fetch(`${apiUrl}/api/v1/announcement-templates/categories`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            })

            if (response.ok) {
                const categories = await response.json()
                setAnnouncementCategories(categories)
            } else {
                console.error('Failed to fetch announcement categories')
            }
        } catch (error) {
            console.error('Error fetching announcement categories:', error)
        }
    }

    const handlePickRouteClick = () => {
        setShowPickRouteModal(true)
        fetchTrainRoutes()
    }

    const handleRouteSelect = (route: TrainRoute) => {
        setSelectedRoute({
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
                        </div>

                        {/* Indian Sign Language (ISL) Section */}
                        <div className="pt-6">
                            <h3 className="px-3 text-sm font-bold text-gray-800 uppercase tracking-wider mb-3">
                                Indian Sign Language (ISL)
                            </h3>
                            <Link href="/ai-generated-assets/isl-dataset" className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                                </svg>
                                <span>ISL Dataset</span>
                            </Link>
                            <Link href="/ai-generated-assets/audio-to-isl" className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                                </svg>
                                <span>Audio File to ISL</span>
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
                                                    >
                                                        <option value="">Select Category</option>
                                                        {announcementCategories.map((category) => (
                                                            <option key={category} value={category}>
                                                                {category}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
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

        </div>
    )
}
