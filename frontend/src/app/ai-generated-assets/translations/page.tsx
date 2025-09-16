'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface TrainRouteTranslation {
    id: number
    train_route_id: number
    train_number?: string
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

export default function TranslationsTablePage() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [showProfileDropdown, setShowProfileDropdown] = useState(false)
    const [translations, setTranslations] = useState<TrainRouteTranslation[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'hi' | 'mr' | 'gu'>('en')
    const [showTranslationModal, setShowTranslationModal] = useState(false)
    const [selectedTranslation, setSelectedTranslation] = useState<TrainRouteTranslation | null>(null)
    const [modalLanguage, setModalLanguage] = useState<'en' | 'hi' | 'mr' | 'gu'>('en')
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [deletingTranslation, setDeletingTranslation] = useState(false)
    const [translationToDelete, setTranslationToDelete] = useState<{ id: number, trainNumber: string } | null>(null)
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage] = useState(10)

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
                setTranslations([])
            }
        } catch (error) {
            console.error('Error fetching translations:', error)
            setTranslations([])
        } finally {
            setLoading(false)
        }
    }

    // Pagination calculations
    const totalPages = Math.ceil(translations.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const currentTranslations = translations.slice(startIndex, endIndex)

    // Pagination navigation functions
    const goToPage = (page: number) => {
        setCurrentPage(page)
    }

    const goToPreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1)
        }
    }

    const goToNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1)
        }
    }

    const handleLogout = () => {
        localStorage.removeItem('user')
        router.push('/login')
    }

    const handleOpenTranslationModal = (translation: TrainRouteTranslation, language: 'en' | 'hi' | 'mr' | 'gu') => {
        setSelectedTranslation(translation)
        setModalLanguage(language)
        setShowTranslationModal(true)
    }

    // Handle delete translation confirmation
    const handleDeleteTranslation = (translationId: number, trainNumber: string) => {
        setTranslationToDelete({ id: translationId, trainNumber })
        setShowDeleteModal(true)
    }

    // Handle actual delete operation
    const confirmDeleteTranslation = async () => {
        if (!translationToDelete) return

        setDeletingTranslation(true)
        const loadingToast = toast.loading('Deleting translation...')

        try {
            const response = await fetch(`https://localhost:5001/api/v1/train-route-translations/${translationToDelete.id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                }
            })

            if (response.ok) {
                // Remove the translation from the current list
                setTranslations(prev => prev.filter(translation => translation.id !== translationToDelete.id))

                toast.dismiss(loadingToast)
                toast.success(`Translation for ${translationToDelete.trainNumber} deleted successfully!`)

                // Close modal and reset state
                setShowDeleteModal(false)
                setTranslationToDelete(null)
            } else {
                const errorData = await response.json()
                toast.dismiss(loadingToast)
                toast.error(errorData.detail || 'Failed to delete translation')
            }
        } catch (error) {
            console.error('Error deleting translation:', error)
            toast.dismiss(loadingToast)
            toast.error('Failed to delete translation')
        } finally {
            setDeletingTranslation(false)
        }
    }

    // Cancel delete operation
    const cancelDeleteTranslation = () => {
        setShowDeleteModal(false)
        setTranslationToDelete(null)
    }

    const getLanguageLabel = (lang: string) => {
        switch (lang) {
            case 'en': return 'English'
            case 'hi': return 'हिंदी'
            case 'mr': return 'मराठी'
            case 'gu': return 'ગુજરાતી'
            default: return lang
        }
    }

    const getLanguageCode = (lang: string) => {
        switch (lang) {
            case 'en': return 'EN'
            case 'hi': return 'हि'
            case 'mr': return 'म'
            case 'gu': return 'ग'
            default: return lang
        }
    }

    const getTranslationData = (translation: TrainRouteTranslation, lang: string) => {
        switch (lang) {
            case 'en':
                return {
                    trainName: translation.train_name_en,
                    fromStation: translation.from_station_en,
                    toStation: translation.to_station_en
                }
            case 'hi':
                return {
                    trainName: translation.train_name_hi,
                    fromStation: translation.from_station_hi,
                    toStation: translation.to_station_hi
                }
            case 'mr':
                return {
                    trainName: translation.train_name_mr,
                    fromStation: translation.from_station_mr,
                    toStation: translation.to_station_mr
                }
            case 'gu':
                return {
                    trainName: translation.train_name_gu,
                    fromStation: translation.from_station_gu,
                    toStation: translation.to_station_gu
                }
            default:
                return {
                    trainName: translation.train_name_en,
                    fromStation: translation.from_station_en,
                    toStation: translation.to_station_en
                }
        }
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
                            <Link href="/ai-generated-assets" className="hidden flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                                <span>AI Generated Assets</span>
                            </Link>
                            <Link href="/ai-generated-assets/translations" className="flex items-center space-x-3 px-3 py-2 bg-teal-50 text-teal-700 rounded-lg">
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
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                                <span>ISL Dictionary</span>
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
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">Train Route Translations</h1>
                            <p className="text-gray-600">Multilingual translations for train routes</p>
                        </div>

                        {/* Language Selector */}
                        <div className="mb-6">
                            <div className="flex items-center space-x-4">
                                <span className="text-sm font-medium text-gray-700">Display Language:</span>
                                <div className="flex space-x-2">
                                    {(['en', 'hi', 'mr', 'gu'] as const).map((lang) => (
                                        <button
                                            key={lang}
                                            onClick={() => setSelectedLanguage(lang)}
                                            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${selectedLanguage === lang
                                                ? 'bg-teal-600 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                        >
                                            {getLanguageLabel(lang)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Translations Table */}
                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
                                </div>
                            ) : translations.length === 0 ? (
                                <div className="text-center py-12">
                                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <p className="text-gray-500">No translations available</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Train Number
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Train Name
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Start Station
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    End Station
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {currentTranslations.map((translation) => {
                                                const data = getTranslationData(translation, selectedLanguage)
                                                return (
                                                    <tr key={translation.id} className="hover:bg-gray-50 transition-colors">
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {translation.train_number || translation.train_route_id.toString().padStart(5, '0')}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm font-medium text-gray-900">{data.trainName}</div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm text-gray-900">{data.fromStation}</div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm text-gray-900">{data.toStation}</div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center space-x-2">
                                                                <button
                                                                    onClick={() => handleDeleteTranslation(translation.id, translation.train_number || translation.train_route_id.toString())}
                                                                    className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-colors"
                                                                    title="Delete Translation"
                                                                >
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Pagination */}
                            {translations.length > 0 && (
                                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                                    <div className="flex-1 flex justify-between sm:hidden">
                                        <button 
                                            onClick={goToPreviousPage}
                                            disabled={currentPage === 1}
                                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Previous
                                        </button>
                                        <button 
                                            onClick={goToNextPage}
                                            disabled={currentPage === totalPages}
                                            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Next
                                        </button>
                                    </div>
                                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                        <div>
                                            <p className="text-sm text-gray-700">
                                                Showing <span className="font-medium">{startIndex + 1}</span> to <span className="font-medium">{Math.min(endIndex, translations.length)}</span> of{' '}
                                                <span className="font-medium">{translations.length}</span> results
                                            </p>
                                        </div>
                                        <div>
                                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                                <button 
                                                    onClick={goToPreviousPage}
                                                    disabled={currentPage === 1}
                                                    className="relative inline-flex items-center px-3 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Previous
                                                </button>
                                                
                                                {/* Page numbers */}
                                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                                                    // Show first page, last page, current page, and pages around current page
                                                    const shouldShow = 
                                                        page === 1 || 
                                                        page === totalPages || 
                                                        (page >= currentPage - 1 && page <= currentPage + 1)
                                                    
                                                    if (!shouldShow) {
                                                        // Show ellipsis for gaps
                                                        if (page === currentPage - 2 || page === currentPage + 2) {
                                                            return (
                                                                <span key={page} className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                                                    ...
                                                                </span>
                                                            )
                                                        }
                                                        return null
                                                    }
                                                    
                                                    return (
                                                        <button
                                                            key={page}
                                                            onClick={() => goToPage(page)}
                                                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                                                page === currentPage
                                                                    ? 'z-10 bg-teal-50 border-teal-500 text-teal-600'
                                                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                            }`}
                                                        >
                                                            {page}
                                                        </button>
                                                    )
                                                })}
                                                
                                                <button 
                                                    onClick={goToNextPage}
                                                    disabled={currentPage === totalPages}
                                                    className="relative inline-flex items-center px-3 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Next
                                                </button>
                                            </nav>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && translationToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                        <div className="p-6">
                            {/* Header */}
                            <div className="flex items-center mb-4">
                                <div className="flex-shrink-0">
                                    <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-lg font-medium text-gray-900">Delete Translation</h3>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="mb-6">
                                <p className="text-sm text-gray-500">
                                    Are you sure you want to delete the translation for train <span className="font-semibold text-gray-900">{translationToDelete.trainNumber}</span>?
                                    This action cannot be undone and will remove all language translations.
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={cancelDeleteTranslation}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                                    disabled={deletingTranslation}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDeleteTranslation}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={deletingTranslation}
                                >
                                    {deletingTranslation ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Translation Modal */}
            {showTranslationModal && selectedTranslation && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900">
                                        {getLanguageLabel(modalLanguage)} Translation
                                    </h2>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Train Route: {selectedTranslation.train_number || selectedTranslation.train_route_id.toString().padStart(5, '0')}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowTranslationModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div className="p-6 overflow-y-auto max-h-[60vh]">
                            <div className="space-y-6">
                                {/* Language Toggle */}
                                <div className="flex items-center space-x-4">
                                    <span className="text-sm font-medium text-gray-700">View in:</span>
                                    <div className="flex space-x-2">
                                        {(['en', 'hi', 'mr', 'gu'] as const).map((lang) => (
                                            <button
                                                key={lang}
                                                onClick={() => setModalLanguage(lang)}
                                                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${modalLanguage === lang
                                                    ? 'bg-teal-600 text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                    }`}
                                            >
                                                {getLanguageLabel(lang)}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Translation Content */}
                                <div className="bg-gray-50 rounded-lg p-6">
                                    <div className="space-y-4">
                                        {/* Train Name */}
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
                                                Train Name
                                            </h4>
                                            <p className="text-lg font-semibold text-gray-900">
                                                {getTranslationData(selectedTranslation, modalLanguage).trainName}
                                            </p>
                                        </div>

                                        {/* From Station */}
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
                                                From Station
                                            </h4>
                                            <p className="text-lg text-gray-900">
                                                {getTranslationData(selectedTranslation, modalLanguage).fromStation}
                                            </p>
                                        </div>

                                        {/* To Station */}
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
                                                To Station
                                            </h4>
                                            <p className="text-lg text-gray-900">
                                                {getTranslationData(selectedTranslation, modalLanguage).toStation}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* All Languages Comparison */}
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
                                        All Language Versions
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {(['en', 'hi', 'mr', 'gu'] as const).map((lang) => {
                                            const data = getTranslationData(selectedTranslation, lang)
                                            return (
                                                <div key={lang} className="bg-white border border-gray-200 rounded-lg p-4">
                                                    <div className="flex items-center mb-3">
                                                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-2 ${lang === 'en' ? 'bg-blue-100 text-blue-800' :
                                                            lang === 'hi' ? 'bg-orange-100 text-orange-800' :
                                                                lang === 'mr' ? 'bg-green-100 text-green-800' :
                                                                    'bg-purple-100 text-purple-800'
                                                            }`}>
                                                            {getLanguageCode(lang)}
                                                        </span>
                                                        <span className="font-medium text-gray-900">{getLanguageLabel(lang)}</span>
                                                    </div>
                                                    <div className="space-y-2 text-sm">
                                                        <p><span className="font-medium">Train:</span> {data.trainName}</p>
                                                        <p><span className="font-medium">From:</span> {data.fromStation}</p>
                                                        <p><span className="font-medium">To:</span> {data.toStation}</p>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-200 bg-gray-50">
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => setShowTranslationModal(false)}
                                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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
