'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { getApiUrl } from '@/utils/api-utils'

import DashboardLayout from '@/components/layouts/DashboardLayout'
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
            const response = await fetch(`${getApiUrl()}/api/v1/train-route-translations/`)
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
            const response = await fetch(`${getApiUrl()}/api/v1/train-route-translations/clear-all`, {
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
        <DashboardLayout activeMenuItem="dashboard">
            
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
                
        </DashboardLayout>
    )
}