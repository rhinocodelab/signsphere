'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { appConfig } from '@/config/app-config'

export default function DashboardPage() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [showProfileDropdown, setShowProfileDropdown] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<any[]>([])
    const [showProjectInfo, setShowProjectInfo] = useState(false)
    const [searchMode, setSearchMode] = useState<'number' | 'name'>('number')

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

    const handleTrainSearch = (e: React.FormEvent) => {
        e.preventDefault()

        if (!searchQuery.trim()) {
            toast.error('Please enter a train number or name')
            return
        }

        // Mock search results for demonstration
        const mockResults = [
            {
                trainNumber: '12951',
                trainName: 'MUMBAI RAJDHANI',
                route: 'Mumbai Central → New Delhi',
                departure: '16:35',
                arrival: '10:15+1',
                status: 'On Time'
            },
            {
                trainNumber: '12953',
                trainName: 'SWARNA JAYANTI RAJDHANI',
                route: 'Mumbai Central → New Delhi',
                departure: '16:55',
                arrival: '10:35+1',
                status: 'On Time'
            },
            {
                trainNumber: '12955',
                trainName: 'AUGUST KRANTI RAJDHANI',
                route: 'Mumbai Central → New Delhi',
                departure: '17:25',
                arrival: '11:05+1',
                status: 'Delayed by 15 min'
            }
        ].filter(train => {
            if (searchMode === 'number') {
                return train.trainNumber.includes(searchQuery)
            } else {
                return train.trainName.toLowerCase().includes(searchQuery.toLowerCase())
            }
        })

        setSearchResults(mockResults)

        if (mockResults.length === 0) {
            toast.error('No trains found matching your search')
        } else {
            toast.success(`Found ${mockResults.length} train(s)`)
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
                <aside className="fixed left-0 top-16 bottom-0 bg-white border-r border-gray-200 w-64 z-30 overflow-y-auto">
                    <nav className="p-4 pt-8 space-y-2">
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

                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1 ml-64 p-6 min-h-screen pb-24">
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
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors"
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
                                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200"
                                >
                                    Pick Route
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearchQuery('')
                                        setSearchResults([])
                                        toast.success('Search cleared')
                                    }}
                                    className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors duration-200"
                                >
                                    Clear
                                </button>
                            </form>

                            {/* Search Results */}
                            {searchResults.length > 0 && (
                                <div className="space-y-3">
                                    <h3 className="text-lg font-medium text-gray-900">Search Results</h3>
                                    {searchResults.map((train, index) => (
                                        <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
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
                                                        <span className="font-medium">Departure:</span> {train.departure}
                                                    </div>
                                                    <div className="text-sm text-gray-600">
                                                        <span className="font-medium">Arrival:</span> {train.arrival}
                                                    </div>
                                                    <div className={`text-sm font-medium ${train.status === 'On Time' ? 'text-green-600' : 'text-orange-600'
                                                        }`}>
                                                        {train.status}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

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


        </div>
    )
}
