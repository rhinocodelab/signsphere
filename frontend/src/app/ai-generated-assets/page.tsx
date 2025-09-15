'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface TrainRouteTranslation {
    id: number
    train_route_id: number
    train_name_en: string
    from_station_en: string
    to_station_en: string
    train_name_hi: string
    from_station_hi: string
    to_station_hi: string
    train_name_mr: string
    from_station_mr: string
    to_station_mr: string
    train_name_gu: string
    from_station_gu: string
    to_station_gu: string
    created_at: string
    updated_at?: string
}

export default function AIGeneratedAssetsPage() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [showProfileDropdown, setShowProfileDropdown] = useState(false)
    const [translations, setTranslations] = useState<TrainRouteTranslation[]>([])
    const [loading, setLoading] = useState(true)
    const [clearingTranslations, setClearingTranslations] = useState(false)

    useEffect(() => {
        // Check if user is logged in
        const userData = localStorage.getItem('user')
        if (!userData) {
            router.push('/login')
            return
        }
        setUser(JSON.parse(userData))
        fetchTranslations()
    }, [router])

    const fetchTranslations = async () => {
        try {
            setLoading(true)
            const response = await fetch('https://localhost:5001/api/v1/train-route-translations/')
            if (response.ok) {
                const data = await response.json()
                setTranslations(data)
            } else {
                // Silently handle error - just set empty array
                setTranslations([])
            }
        } catch (error) {
            console.error('Error fetching translations:', error)
            // Silently handle error - just set empty array
            setTranslations([])
        } finally {
            setLoading(false)
        }
    }

    const handleClearAllTranslations = async () => {
        if (!confirm('Are you sure you want to clear all translations? This action cannot be undone.')) {
            return
        }

        try {
            setClearingTranslations(true)
            const response = await fetch('https://localhost:5001/api/v1/train-route-translations/clear-all', {
                method: 'DELETE'
            })

            if (response.ok) {
                toast.success('All translations cleared successfully')
                setTranslations([])
            } else {
                toast.error('Failed to clear translations')
            }
        } catch (error) {
            console.error('Error clearing translations:', error)
            toast.error('Failed to clear translations')
        } finally {
            setClearingTranslations(false)
        }
    }

    const handleLogout = () => {
        localStorage.removeItem('user')
        router.push('/login')
    }

    if (!user) {
        return null
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-40">
                <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center">
                                <div className="w-4 h-4 bg-white rounded-full"></div>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xl font-semibold text-gray-900">SignSphere</span>
                                <span className="text-sm text-gray-500">Western Railway Divyangjan Announcement System</span>
                            </div>
                        </div>

                        {/* User Profile Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                                className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                            >
                                <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center">
                                    <span className="text-sm font-medium text-white">
                                        {user.name ? user.name.charAt(0).toUpperCase() : 'A'}
                                    </span>
                                </div>
                                <span className="text-sm font-medium">{user.name || 'Admin'}</span>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {showProfileDropdown && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                                    <button
                                        onClick={handleLogout}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                        <span>Logout</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex pt-16">
                {/* Fixed Sidebar */}
                <aside className="fixed left-0 top-16 bottom-0 bg-white border-r border-gray-200 w-fit min-w-64 max-w-80 z-30 overflow-y-auto">
                    <nav className="p-4 pt-8 space-y-2 w-full">
                        {/* Dashboard */}
                        <Link href="/dashboard" className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
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
                            <Link href="/ai-generated-assets" className="hidden flex items-center space-x-3 px-3 py-2 bg-teal-50 text-teal-700 rounded-lg">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                                <span>AI Generated Assets</span>
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
                <main className="flex-1 ml-64 p-6 min-h-screen pb-24">
                    <div className="max-w-6xl mx-auto">
                        {/* Page Header */}
                        <div className="mb-8 pt-4">
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Database</h1>
                            <p className="text-gray-600">Explore and manage AI-generated data assets</p>
                        </div>

                        {/* Grid View Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* AI Generated Text Translation Card */}
                            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
                                <div className="flex items-center space-x-3 mb-4">
                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">AI Generated Text Translation</h3>
                                        <p className="text-sm text-gray-500">Multilingual train route translations</p>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                                        <span>Total Translations:</span>
                                        <span className="font-medium">{translations.length}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm text-gray-600">
                                        <span>Languages:</span>
                                        <span className="font-medium">English, Hindi, Marathi, Gujarati</span>
                                    </div>
                                </div>

                                <div className="flex space-x-3">
                                    <button
                                        onClick={() => router.push('/ai-generated-assets/translations')}
                                        disabled={translations.length === 0}
                                        className="flex-1 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        View Translation
                                    </button>
                                    <button
                                        onClick={handleClearAllTranslations}
                                        disabled={clearingTranslations || translations.length === 0}
                                        className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {clearingTranslations ? 'Clearing...' : 'Clear All'}
                                    </button>
                                </div>
                            </div>

                            {/* Placeholder for future AI cards */}
                            <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-6 flex items-center justify-center">
                                <div className="text-center">
                                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    <p className="text-gray-500 text-sm">More AI features coming soon</p>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-6 flex items-center justify-center">
                                <div className="text-center">
                                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    <p className="text-gray-500 text-sm">More AI features coming soon</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>


            {/* Fixed Footer */}
            <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 z-30">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                        © 2024 SignSphere. All rights reserved.
                    </div>
                    <div className="text-sm text-gray-500">
                        Western Railway Divyangjan Announcement System
                    </div>
                </div>
            </footer>
        </div>
    )
}
