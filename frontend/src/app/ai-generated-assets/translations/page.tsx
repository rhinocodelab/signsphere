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
            const response = await fetch(`${getApiUrl()}/api/v1/train-route-translations/`)
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
            const response = await fetch(`${getApiUrl()}/api/v1/train-route-translations/${translationToDelete.id}`, {
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
        <DashboardLayout activeMenuItem="translations">
            
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
                
        </DashboardLayout>
    )
}