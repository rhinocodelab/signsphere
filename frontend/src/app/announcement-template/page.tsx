'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

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
        <div className="min-h-screen bg-gray-50">
            {/* Fixed Header */}
            <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-40">
                <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center">
                        <div className="w-4 h-4 bg-white rounded-full"></div>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xl font-semibold text-gray-900">SignSphere</span>
                        <span className="text-sm text-gray-500">Western Railway Divyangjan Announcement System</span>
                    </div>
                </div>

                {/* Right Section - Profile */}
                <div className="flex items-center space-x-4">
                    {/* Profile */}
                    <div className="relative profile-dropdown">
                        <button
                            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                            className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center">
                                <span className="text-white text-sm font-medium">
                                    {user?.username?.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <span className="text-gray-700 font-medium">{user?.username}</span>
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {showProfileDropdown && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                                <div className="px-4 py-2 border-b border-gray-100">
                                    <p className="text-sm font-medium text-gray-900">{user?.full_name}</p>
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
                            <Link href="/ai-generated-assets/translations" className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                                </svg>
                                <span>Train Route Translations</span>
                            </Link>
                            <Link href="/announcement-template" className="flex items-center space-x-3 px-3 py-2 bg-teal-50 text-teal-700 rounded-lg">
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
                </main>
            </div>

            {/* Import Modal */}
            {showImportModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            {/* Header */}
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">Import Announcement Templates</h2>
                                <button
                                    onClick={cancelImport}
                                    className="text-gray-400 hover:text-gray-600 text-sm font-medium"
                                >
                                    Close
                                </button>
                            </div>

                            {/* File Upload Area */}
                            <div className="mb-8">
                                <div
                                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive
                                        ? 'border-teal-500 bg-teal-50'
                                        : 'border-gray-300 hover:border-gray-400'
                                        }`}
                                    onDragEnter={handleDrag}
                                    onDragLeave={handleDrag}
                                    onDragOver={handleDrag}
                                    onDrop={handleDrop}
                                >
                                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                                    </svg>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Excel File</h3>
                                    <p className="text-gray-600 mb-4">
                                        Drag and drop your Excel file here, or click to browse
                                    </p>
                                    <input
                                        type="file"
                                        accept=".xlsx,.xls"
                                        onChange={handleFileSelect}
                                        className="hidden"
                                        id="file-upload"
                                    />
                                    <label
                                        htmlFor="file-upload"
                                        className="inline-flex items-center px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors cursor-pointer"
                                    >
                                        Choose File
                                    </label>
                                    {selectedFile && (
                                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                            <p className="text-sm text-gray-700">
                                                Selected: <span className="font-medium">{selectedFile.name}</span>
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex justify-center space-x-3 mt-6">
                                    <button
                                        onClick={cancelImport}
                                        className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                                        disabled={importingTemplates}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleImportSubmit}
                                        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={importingTemplates || !selectedFile}
                                    >
                                        {importingTemplates ? 'Importing...' : 'Import Templates'}
                                    </button>
                                </div>
                            </div>

                            {/* Excel Format Example */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Excel Format Example</h3>
                                <p className="text-sm text-gray-600 mb-4 text-center">
                                    Your Excel file should have the following columns in the first row:
                                </p>

                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full text-sm">
                                            <thead>
                                                <tr className="bg-gray-100">
                                                    <th className="px-3 py-2 text-left font-semibold text-gray-700">Announcement Category</th>
                                                    <th className="px-3 py-2 text-left font-semibold text-gray-700">English Template</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    <td className="px-3 py-2 border-b border-gray-200 text-gray-900">Arriving</td>
                                                    <td className="px-3 py-2 border-b border-gray-200 text-gray-900">Train {'{train_number}'} {'{train_name}'} is arriving at platform {'{platform_number}'}</td>
                                                </tr>
                                                <tr>
                                                    <td className="px-3 py-2 border-b border-gray-200 text-gray-900">Delay</td>
                                                    <td className="px-3 py-2 border-b border-gray-200 text-gray-900">Train {'{train_number}'} {'{train_name}'} is delayed by {'{delay_minutes}'} minutes</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Import Progress Modal */}
            {showImportProgressModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                        <div className="p-6">
                            {/* Header */}
                            <div className="flex items-center mb-6">
                                <div className="flex-shrink-0">
                                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                                        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <h3 className="text-lg font-medium text-gray-900">Importing Templates</h3>
                                    <p className="text-sm text-gray-500">File: {selectedFile?.name}</p>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="mb-6">
                                <div className="flex justify-between text-sm text-gray-600 mb-2">
                                    <span>{importProgress.step}</span>
                                    <span>{importProgress.progress}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full transition-all duration-500 ${importProgress.isComplete
                                            ? 'bg-green-500'
                                            : importProgress.error
                                                ? 'bg-red-500'
                                                : 'bg-purple-500'
                                            }`}
                                        style={{ width: `${importProgress.progress}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Import Results */}
                            {importProgress.isComplete && (
                                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                                    <div className="flex items-center mb-3">
                                        <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <h4 className="text-sm font-medium text-green-800">Import Summary</h4>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-green-700">Total Processed:</span>
                                            <span className="font-medium text-green-800">{importProgress.totalCount}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-green-700">Successfully Imported:</span>
                                            <span className="font-medium text-green-800">{importProgress.importedCount}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Status Message */}
                            <div className="mb-6">
                                {importProgress.error ? (
                                    <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
                                        <svg className="w-5 h-5 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <div>
                                            <p className="text-sm font-medium text-red-800">Error</p>
                                            <p className="text-sm text-red-600">{importProgress.error}</p>
                                        </div>
                                    </div>
                                ) : importProgress.isComplete ? (
                                    <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg">
                                        <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        <div>
                                            <p className="text-sm font-medium text-green-800">Success</p>
                                            <p className="text-sm text-green-600">Templates imported with translations!</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center p-3 bg-purple-50 border border-purple-200 rounded-lg">
                                        <svg className="w-5 h-5 text-purple-500 mr-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        <div>
                                            <p className="text-sm font-medium text-purple-800">Processing</p>
                                            <p className="text-sm text-purple-600">Please wait while we import your templates...</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            {importProgress.error && (
                                <div className="flex justify-end space-x-3">
                                    <button
                                        onClick={() => {
                                            setShowImportProgressModal(false)
                                            setImportProgress({
                                                step: '',
                                                progress: 0,
                                                isComplete: false,
                                                error: null,
                                                importedCount: 0,
                                                totalCount: 0
                                            })
                                        }}
                                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                                    >
                                        Close
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && templateToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                        <div className="p-6">
                            {/* Header */}
                            <div className="flex items-center mb-4">
                                <div className="flex-shrink-0">
                                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-lg font-medium text-gray-900">Delete Template</h3>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="mb-6">
                                <p className="text-sm text-gray-600">
                                    Are you sure you want to delete the template <span className="font-medium text-gray-900">"{templateToDelete.category}"</span>?
                                    This action cannot be undone.
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={cancelDeleteTemplate}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                                    disabled={deletingTemplate}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDeleteTemplate}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={deletingTemplate}
                                >
                                    {deletingTemplate ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Translation Modal */}
            {showTranslationModal && selectedTranslation && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            {/* Header */}
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">
                                        {selectedTranslation.languageName} Translation
                                    </h2>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Category: {selectedTranslation.template.category}
                                    </p>
                                </div>
                                <button
                                    onClick={closeTranslationModal}
                                    className="text-gray-400 hover:text-gray-600 text-sm font-medium"
                                >
                                    ✕ Close
                                </button>
                            </div>

                            {/* English Template */}
                            <div className="mb-6">
                                <h3 className="text-sm font-medium text-gray-700 mb-2">English Template:</h3>
                                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                                    <p className="text-gray-900">{selectedTranslation.template.english_template}</p>
                                </div>
                            </div>

                            {/* Translation */}
                            <div className="mb-6">
                                <h3 className="text-sm font-medium text-gray-700 mb-2">
                                    {selectedTranslation.languageName} Translation:
                                </h3>
                                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    {selectedTranslation.translation ? (
                                        <p className="text-gray-900">{selectedTranslation.translation}</p>
                                    ) : (
                                        <p className="text-gray-500 italic">Translation not available</p>
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={closeTranslationModal}
                                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
