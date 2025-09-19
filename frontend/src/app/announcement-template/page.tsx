'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

import DashboardLayout from '@/components/layouts/DashboardLayout'
interface AnnouncementTemplate {
    id: number
    category: string
    english_template: string
    hindi_template?: string
    marathi_template?: string
    gujarati_template?: string
    is_translated: boolean
    detected_placeholders?: string
    created_at: string
    updated_at?: string
}

export default function AnnouncementTemplatePage() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [showProfileDropdown, setShowProfileDropdown] = useState(false)
    const [templates, setTemplates] = useState<AnnouncementTemplate[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [filteredTemplates, setFilteredTemplates] = useState<AnnouncementTemplate[]>([])
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage] = useState(5)
    const [showImportModal, setShowImportModal] = useState(false)
    const [importingTemplates, setImportingTemplates] = useState(false)
    const [dragActive, setDragActive] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [showImportProgressModal, setShowImportProgressModal] = useState(false)
    const [importProgress, setImportProgress] = useState({
        step: '',
        progress: 0,
        isComplete: false,
        error: null as string | null,
        importedCount: 0,
        totalCount: 0
    })
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [deletingTemplate, setDeletingTemplate] = useState(false)
    const [templateToDelete, setTemplateToDelete] = useState<{ id: number, category: string } | null>(null)
    const [showTranslationModal, setShowTranslationModal] = useState(false)
    const [selectedTranslation, setSelectedTranslation] = useState<{
        template: AnnouncementTemplate;
        language: string;
        languageName: string;
        translation: string;
    } | null>(null)

    // Authentication check
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const userData = localStorage.getItem('user')
                const accessToken = localStorage.getItem('accessToken')

                if (!userData || !accessToken) {
                    router.push('/login')
                    return
                }

                const user = JSON.parse(userData)
                setUser(user)

                // Test token validity
                const apiUrl = window.location.hostname === 'localhost'
                    ? 'https://localhost:5001'
                    : 'https://192.168.1.10:5001'

                const response = await fetch(`${apiUrl}/api/v1/auth/me`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                    },
                })

                if (!response.ok) {
                    throw new Error('Token invalid')
                }

            } catch (error) {
                console.error('Auth check failed:', error)
                toast.error('Authentication failed. Please login again.')
                localStorage.clear()
                router.push('/login')
            }
        }

        checkAuth()
    }, [router])

    // Fetch templates function
    const fetchTemplates = async () => {
        try {
            const apiUrl = window.location.hostname === 'localhost'
                ? 'https://localhost:5001'
                : 'https://192.168.1.10:5001'

            const response = await fetch(`${apiUrl}/api/v1/announcement-templates/`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                },
            })

            if (response.ok) {
                const data = await response.json()
                setTemplates(data)
                setFilteredTemplates(data)
            } else {
                toast.error('Failed to fetch announcement templates')
            }
        } catch (error) {
            console.error('Error fetching templates:', error)
            toast.error('Network error while fetching templates')
        } finally {
            setLoading(false)
        }
    }

    // Fetch templates on component mount
    useEffect(() => {
        if (user) {
            fetchTemplates()
        }
    }, [user])

    // Filter templates based on search query
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredTemplates(templates)
        } else {
            const filtered = templates.filter(template =>
                template.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                template.english_template.toLowerCase().includes(searchQuery.toLowerCase())
            )
            setFilteredTemplates(filtered)
        }
        // Reset to first page when search changes
        setCurrentPage(1)
    }, [searchQuery, templates])

    // Calculate pagination
    const totalPages = Math.ceil(filteredTemplates.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const currentTemplates = filteredTemplates.slice(startIndex, endIndex)

    // Pagination handlers
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
        toast.success('Signed out successfully')
        localStorage.removeItem('isLoggedIn')
        localStorage.removeItem('user')
        localStorage.removeItem('accessToken')
        localStorage.removeItem('tokenType')
        router.push('/login')
    }

    // Handle import modal
    const handleImportTemplates = () => {
        setShowImportModal(true)
    }

    // Handle drag and drop
    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true)
        } else if (e.type === "dragleave") {
            setDragActive(false)
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0]
            if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                setSelectedFile(file)
            } else {
                toast.error('Please select an Excel (.xlsx) file')
            }
        }
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                setSelectedFile(file)
            } else {
                toast.error('Please select an Excel (.xlsx) file')
            }
        }
    }

    // Handle import submission
    const handleImportSubmit = async () => {
        if (!selectedFile) {
            toast.error('Please select a file to import')
            return
        }

        setImportingTemplates(true)
        setShowImportProgressModal(true)
        setImportProgress({
            step: 'Validating file...',
            progress: 0,
            isComplete: false,
            error: null,
            importedCount: 0,
            totalCount: 0
        })

        try {
            const apiUrl = window.location.hostname === 'localhost'
                ? 'https://localhost:5001'
                : 'https://192.168.1.10:5001'

            const accessToken = localStorage.getItem('accessToken')

            // Simulate progress steps
            const progressSteps = [
                { step: 'Validating file...', progress: 10 },
                { step: 'Processing templates...', progress: 30 },
                { step: 'Generating translations...', progress: 70 },
                { step: 'Finalizing import...', progress: 90 }
            ]

            for (const step of progressSteps) {
                setImportProgress(prev => ({ ...prev, ...step }))
                await new Promise(resolve => setTimeout(resolve, 800))
            }

            const formData = new FormData()
            formData.append('file', selectedFile)

            const response = await fetch(`${apiUrl}/api/v1/announcement-templates/import`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                },
                body: formData
            })

            if (response.ok) {
                const result = await response.json()

                // Update progress with actual results
                setImportProgress(prev => ({
                    ...prev,
                    step: 'Import completed successfully!',
                    progress: 100,
                    isComplete: true,
                    error: null,
                    importedCount: result.imported_count || 0,
                    totalCount: result.total_count || 0
                }))

                // Refresh the templates list
                await fetchTemplates()

                // Auto-close modal after success
                setTimeout(() => {
                    setShowImportProgressModal(false)
                    setImportProgress({
                        step: '',
                        progress: 0,
                        isComplete: false,
                        error: null,
                        importedCount: 0,
                        totalCount: 0
                    })

                    // Close import modal and reset
                    setShowImportModal(false)
                    setSelectedFile(null)

                    // Show success toast
                    const imported = result.imported_count || 0
                    toast.success(`Successfully imported ${imported} announcement templates with translations!`)
                }, 2000)
            } else {
                const errorData = await response.json().catch(() => ({ detail: 'Import failed' }))
                setImportProgress(prev => ({
                    ...prev,
                    step: 'Import failed',
                    error: errorData.detail || 'Failed to import templates'
                }))
            }
        } catch (error) {
            console.error('Error importing templates:', error)
            setImportProgress(prev => ({
                ...prev,
                step: 'Import failed',
                error: 'Network error occurred'
            }))
        } finally {
            setImportingTemplates(false)
        }
    }

    // Handle cancel import
    const cancelImport = () => {
        setShowImportModal(false)
        setSelectedFile(null)
        setDragActive(false)
    }

    // Handle delete template confirmation
    const handleDeleteTemplate = (templateId: number, category: string) => {
        setTemplateToDelete({ id: templateId, category })
        setShowDeleteModal(true)
    }

    // Handle actual delete operation
    const confirmDeleteTemplate = async () => {
        if (!templateToDelete) return

        setDeletingTemplate(true)
        const loadingToast = toast.loading('Deleting template...')

        try {
            const apiUrl = window.location.hostname === 'localhost'
                ? 'https://localhost:5001'
                : 'https://192.168.1.10:5001'

            const accessToken = localStorage.getItem('accessToken')

            const response = await fetch(`${apiUrl}/api/v1/announcement-templates/${templateToDelete.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            })

            if (response.ok) {
                // Remove the template from the current lists
                setTemplates(prev => prev.filter(template => template.id !== templateToDelete.id))
                setFilteredTemplates(prev => prev.filter(template => template.id !== templateToDelete.id))

                toast.dismiss(loadingToast)
                toast.success(`Template "${templateToDelete.category}" deleted successfully!`)

                // Close modal and reset state
                setShowDeleteModal(false)
                setTemplateToDelete(null)
            } else {
                const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }))
                toast.dismiss(loadingToast)
                toast.error(errorData.detail || 'Failed to delete template')
            }
        } catch (error) {
            console.error('Error deleting template:', error)
            toast.dismiss(loadingToast)
            toast.error('Failed to delete template')
        } finally {
            setDeletingTemplate(false)
        }
    }

    // Handle cancel delete
    const cancelDeleteTemplate = () => {
        setShowDeleteModal(false)
        setTemplateToDelete(null)
    }

    // Handle translation button click
    const handleTranslationClick = (template: AnnouncementTemplate, language: string, languageName: string) => {
        let translation = ''

        switch (language) {
            case 'hindi':
                translation = template.hindi_template || ''
                break
            case 'marathi':
                translation = template.marathi_template || ''
                break
            case 'gujarati':
                translation = template.gujarati_template || ''
                break
        }

        setSelectedTranslation({
            template,
            language,
            languageName,
            translation
        })
        setShowTranslationModal(true)
    }

    // Handle close translation modal
    const closeTranslationModal = () => {
        setShowTranslationModal(false)
        setSelectedTranslation(null)
    }

    const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as Element
        if (!target.closest('.profile-dropdown')) {
            setShowProfileDropdown(false)
        }
    }

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
            </div>
        )
    }

    return (
        <DashboardLayout activeMenuItem="announcement-template">
            
                    <div className="max-w-6xl mx-auto">
                        {/* Page Header */}
                        <div className="mb-8 pt-4">
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">Announcement Templates</h1>
                            <p className="text-gray-600">Manage announcement templates for train route notifications</p>
                        </div>

                        {/* Templates Table with Search and Actions */}
                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                            {/* Search and Actions Bar */}
                            <div className="p-6 border-b border-gray-200">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    {/* Search */}
                                    <div className="flex-1 max-w-md">
                                        <div className="relative">
                                            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                            <input
                                                type="text"
                                                placeholder="Search templates..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center space-x-3">
                                        <button
                                            onClick={handleImportTemplates}
                                            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors duration-200"
                                        >
                                            Import Templates
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Table */}
                            {loading ? (
                                <div className="p-8 text-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
                                    <p className="mt-2 text-gray-500">Loading templates...</p>
                                </div>
                            ) : filteredTemplates.length === 0 ? (
                                <div className="p-8 text-center">
                                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                                    </svg>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
                                    <p className="text-gray-500 mb-4">Get started by importing announcement templates from an Excel file.</p>
                                    <button
                                        onClick={handleImportTemplates}
                                        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors duration-200"
                                    >
                                        Import Templates
                                    </button>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Category
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    English Template
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Translations
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {currentTemplates.map((template) => (
                                                <tr key={template.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {template.category}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm text-gray-900 max-w-md">
                                                            {template.english_template}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex space-x-2">
                                                            {/* Hindi Button */}
                                                            <button
                                                                onClick={() => handleTranslationClick(template, 'hindi', 'हिंदी')}
                                                                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${template.hindi_template
                                                                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                                                    : 'bg-gray-100 text-gray-500 cursor-not-allowed'
                                                                    }`}
                                                                disabled={!template.hindi_template}
                                                                title={template.hindi_template ? 'View Hindi translation' : 'Hindi translation not available'}
                                                            >
                                                                हिंदी
                                                            </button>

                                                            {/* Marathi Button */}
                                                            <button
                                                                onClick={() => handleTranslationClick(template, 'marathi', 'मराठी')}
                                                                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${template.marathi_template
                                                                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                                                    : 'bg-gray-100 text-gray-500 cursor-not-allowed'
                                                                    }`}
                                                                disabled={!template.marathi_template}
                                                                title={template.marathi_template ? 'View Marathi translation' : 'Marathi translation not available'}
                                                            >
                                                                मराठी
                                                            </button>

                                                            {/* Gujarati Button */}
                                                            <button
                                                                onClick={() => handleTranslationClick(template, 'gujarati', 'ગુજરાતી')}
                                                                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${template.gujarati_template
                                                                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                                                    : 'bg-gray-100 text-gray-500 cursor-not-allowed'
                                                                    }`}
                                                                disabled={!template.gujarati_template}
                                                                title={template.gujarati_template ? 'View Gujarati translation' : 'Gujarati translation not available'}
                                                            >
                                                                ગુજરાતી
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <div className="flex items-center space-x-2">
                                                            <button
                                                                onClick={() => handleDeleteTemplate(template.id, template.category)}
                                                                className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-colors"
                                                                title="Delete Template"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}


                            {/* Pagination */}
                            {filteredTemplates.length > 0 && (
                                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                                    <div className="flex-1 flex justify-between sm:hidden">
                                        <button
                                            onClick={goToPreviousPage}
                                            disabled={currentPage === 1}
                                            className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${currentPage === 1
                                                ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                                                : 'text-gray-700 bg-white hover:bg-gray-50'
                                                }`}
                                        >
                                            Previous
                                        </button>
                                        <button
                                            onClick={goToNextPage}
                                            disabled={currentPage === totalPages}
                                            className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${currentPage === totalPages
                                                ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                                                : 'text-gray-700 bg-white hover:bg-gray-50'
                                                }`}
                                        >
                                            Next
                                        </button>
                                    </div>
                                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                        <div>
                                            <p className="text-sm text-gray-700">
                                                Showing <span className="font-medium">{startIndex + 1}</span> to <span className="font-medium">{Math.min(endIndex, filteredTemplates.length)}</span> of <span className="font-medium">{filteredTemplates.length}</span> templates
                                            </p>
                                        </div>
                                        <div>
                                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                                <button
                                                    onClick={goToPreviousPage}
                                                    disabled={currentPage === 1}
                                                    className={`relative inline-flex items-center px-3 py-2 rounded-l-md border border-gray-300 text-sm font-medium ${currentPage === 1
                                                        ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                                                        : 'text-gray-500 bg-white hover:bg-gray-50'
                                                        }`}
                                                >
                                                    Previous
                                                </button>
                                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                                    <button
                                                        key={page}
                                                        onClick={() => goToPage(page)}
                                                        className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium ${page === currentPage
                                                            ? 'z-10 bg-teal-50 border-teal-500 text-teal-600'
                                                            : 'bg-white text-gray-500 hover:bg-gray-50'
                                                            }`}
                                                    >
                                                        {page}
                                                    </button>
                                                ))}
                                                <button
                                                    onClick={goToNextPage}
                                                    disabled={currentPage === totalPages}
                                                    className={`relative inline-flex items-center px-3 py-2 rounded-r-md border border-gray-300 text-sm font-medium ${currentPage === totalPages
                                                        ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                                                        : 'text-gray-500 bg-white hover:bg-gray-50'
                                                        }`}
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