'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { appConfig } from '@/config/app-config'
import toast from 'react-hot-toast'

interface ISLVideo {
    id: number
    filename: string
    display_name: string
    video_path: string
    file_size: number
    duration_seconds: number
    width: number
    height: number
    model_type: string
    mime_type: string
    file_extension: string
    description: string
    tags: string
    content_type: string
    is_active: boolean
    created_at: string
    updated_at: string
}

interface VideoResponse {
    videos: ISLVideo[]
    total: number
    page: number
    limit: number
    total_pages: number
}

export default function ISLDatasetPage() {
    const [user, setUser] = useState<any>(null)
    const [showProfileDropdown, setShowProfileDropdown] = useState(false)
    const [modelType, setModelType] = useState<'male' | 'female'>('male')
    const [videos, setVideos] = useState<ISLVideo[]>([])
    const [loading, setLoading] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [searchQuery, setSearchQuery] = useState('')

    // Upload modal states
    const [showUploadModal, setShowUploadModal] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [dragActive, setDragActive] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [uploadModelType, setUploadModelType] = useState<'male' | 'female'>('male')
    const [displayName, setDisplayName] = useState('')
    const [description, setDescription] = useState('')
    const [tags, setTags] = useState('')

    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        const checkAuthentication = async () => {
            const isLoggedIn = localStorage.getItem('isLoggedIn')
            const userData = localStorage.getItem('user')

            if (isLoggedIn === 'true' && userData) {
                setUser(JSON.parse(userData))
            } else {
                window.location.href = '/login'
            }
        }

        checkAuthentication()
    }, [])

    useEffect(() => {
        fetchVideos()
    }, [modelType, currentPage, searchQuery])

    const fetchVideos = async () => {
        setLoading(true)
        try {
            const currentHost = window.location.hostname
            const apiUrl = currentHost === 'localhost'
                ? 'https://localhost:5001'
                : (process.env.NEXT_PUBLIC_API_URL || 'https://192.168.1.10:5001')

            const params = new URLSearchParams({
                model_type: modelType,
                page: currentPage.toString(),
                limit: '12'
            })

            if (searchQuery.trim()) {
                params.append('search', searchQuery.trim())
            }

            const response = await fetch(`${apiUrl}/api/v1/isl-videos/?${params}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            })

            if (response.ok) {
                const data: VideoResponse = await response.json()
                setVideos(data.videos)
                setTotalPages(data.total_pages)
            }
        } catch (error) {
            console.error('Error fetching videos:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true)
        } else if (e.type === 'dragleave') {
            setDragActive(false)
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0]
            if (file.type === 'video/mp4') {
                setSelectedFile(file)
                // Set display name with first character capitalized
                const filename = file.name.replace('.mp4', '')
                setDisplayName(filename.charAt(0).toUpperCase() + filename.slice(1))
            } else {
                toast.error('Please upload only MP4 files')
            }
        }
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            if (file.type === 'video/mp4') {
                setSelectedFile(file)
                // Set display name with first character capitalized
                const filename = file.name.replace('.mp4', '')
                setDisplayName(filename.charAt(0).toUpperCase() + filename.slice(1))
            } else {
                toast.error('Please upload only MP4 files')
            }
        }
    }

    const handleUpload = async () => {
        if (!selectedFile) {
            toast.error('Please select a file to upload')
            return
        }

        setUploading(true)
        try {
            const currentHost = window.location.hostname
            const apiUrl = currentHost === 'localhost'
                ? 'https://localhost:5001'
                : (process.env.NEXT_PUBLIC_API_URL || 'https://192.168.1.10:5001')

            const formData = new FormData()
            formData.append('file', selectedFile)
            formData.append('model_type', uploadModelType)
            formData.append('display_name', displayName)

            const response = await fetch(`${apiUrl}/api/v1/isl-videos/upload`, {
                method: 'POST',
                body: formData
            })

            if (response.ok) {
                const result = await response.json()
                toast.success('Video uploaded successfully! Processing will begin shortly.')
                setShowUploadModal(false)
                setSelectedFile(null)
                setDisplayName('')
                fetchVideos() // Refresh the video list
            } else {
                const error = await response.json()
                toast.error(error.detail || 'Upload failed')
            }
        } catch (error) {
            console.error('Upload error:', error)
            toast.error('Upload failed')
        } finally {
            setUploading(false)
        }
    }

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const handleLogout = () => {
        localStorage.removeItem('isLoggedIn')
        localStorage.removeItem('user')
        localStorage.removeItem('accessToken')
        window.location.href = '/login'
    }

    if (!user) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>
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
                                    {user.full_name?.charAt(0) || user.username?.charAt(0) || 'U'}
                                </span>
                            </div>
                            <span className="text-sm font-medium text-gray-700">{user.full_name || user.username}</span>
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {/* Profile Dropdown */}
                        {showProfileDropdown && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                                <div className="px-4 py-2 border-b border-gray-100">
                                    <p className="text-sm font-medium text-gray-900">{user.full_name || user.username}</p>
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
                            <Link href="/ai-generated-assets" className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
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
                            <Link href="/ai-generated-assets/isl-dataset" className="flex items-center space-x-3 px-3 py-2 bg-teal-50 text-teal-700 rounded-lg">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                                </svg>
                                <span>ISL Dataset</span>
                            </Link>
                        </div>
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-6 min-h-screen pb-24 ml-64">
                    <div className="max-w-6xl mx-auto">
                        {/* Page Header */}
                        <div className="mb-8 pt-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900 mb-2">ISL Dataset</h1>
                                    <p className="text-gray-600">Manage Indian Sign Language videos for male and female AI models</p>
                                </div>
                                <button
                                    onClick={() => setShowUploadModal(true)}
                                    className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                                >
                                    Upload Video
                                </button>
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="mb-8">
                            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                                {/* Model Type Toggle */}
                                <div className="flex items-center space-x-4">
                                    <span className="text-sm font-medium text-gray-700">AI Model:</span>
                                    <div className="flex bg-gray-100 rounded-lg p-1">
                                        <button
                                            onClick={() => setModelType('male')}
                                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${modelType === 'male'
                                                ? 'bg-white text-gray-900 shadow-sm'
                                                : 'text-gray-600 hover:text-gray-900'
                                                }`}
                                        >
                                            Male Model
                                        </button>
                                        <button
                                            onClick={() => setModelType('female')}
                                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${modelType === 'female'
                                                ? 'bg-white text-gray-900 shadow-sm'
                                                : 'text-gray-600 hover:text-gray-900'
                                                }`}
                                        >
                                            Female Model
                                        </button>
                                    </div>
                                </div>

                                {/* Search */}
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="text"
                                        placeholder="Search videos..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Video Grid */}
                        {loading ? (
                            <div className="flex justify-center items-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
                            </div>
                        ) : videos.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="text-gray-400 text-6xl mb-4">🎥</div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No videos found</h3>
                                <p className="text-gray-500">
                                    {searchQuery ? 'No videos match your search criteria.' : `No ${modelType} model videos uploaded yet.`}
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                                    {videos.map((video) => (
                                        <div key={video.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                                            <div className="aspect-video bg-gray-100 flex items-center justify-center">
                                                <div className="text-center">
                                                    <div className="text-4xl text-gray-400 mb-2">🎥</div>
                                                    <p className="text-sm text-gray-500">Video Preview</p>
                                                </div>
                                            </div>
                                            <div className="p-4">
                                                <h3 className="font-medium text-gray-900 mb-1 truncate">
                                                    {video.display_name || video.filename}
                                                </h3>
                                                <div className="text-sm text-gray-500 space-y-1">
                                                    <p>Size: {formatFileSize(video.file_size)}</p>
                                                    {video.duration_seconds && (
                                                        <p>Duration: {formatDuration(video.duration_seconds)}</p>
                                                    )}
                                                    <p>Model: {video.model_type}</p>
                                                </div>
                                                {video.description && (
                                                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                                                        {video.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="flex justify-center items-center space-x-2">
                                        <button
                                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                            disabled={currentPage === 1}
                                            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Previous
                                        </button>

                                        <span className="px-3 py-2 text-sm text-gray-700">
                                            Page {currentPage} of {totalPages}
                                        </span>

                                        <button
                                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                            disabled={currentPage === totalPages}
                                            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Next
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </main>
            </div>

            {/* Upload Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-medium text-gray-900">Upload ISL Video</h3>
                                <button
                                    onClick={() => {
                                        setShowUploadModal(false)
                                        setSelectedFile(null)
                                        setDisplayName('')
                                    }}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Model Type Selection */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    AI Model Type
                                </label>
                                <div className="flex bg-gray-100 rounded-lg p-1">
                                    <button
                                        onClick={() => setUploadModelType('male')}
                                        className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${uploadModelType === 'male'
                                            ? 'bg-white text-gray-900 shadow-sm'
                                            : 'text-gray-600 hover:text-gray-900'
                                            }`}
                                    >
                                        Male Model
                                    </button>
                                    <button
                                        onClick={() => setUploadModelType('female')}
                                        className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${uploadModelType === 'female'
                                            ? 'bg-white text-gray-900 shadow-sm'
                                            : 'text-gray-600 hover:text-gray-900'
                                            }`}
                                    >
                                        Female Model
                                    </button>
                                </div>
                            </div>

                            {/* File Upload */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Video File (MP4 only)
                                </label>
                                <div
                                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${dragActive
                                        ? 'border-teal-500 bg-teal-50'
                                        : 'border-gray-300 hover:border-gray-400'
                                        }`}
                                    onDragEnter={handleDrag}
                                    onDragLeave={handleDrag}
                                    onDragOver={handleDrag}
                                    onDrop={handleDrop}
                                >
                                    {selectedFile ? (
                                        <div>
                                            <div className="text-sm font-medium text-gray-900 mb-1">
                                                {selectedFile.name}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {formatFileSize(selectedFile.size)}
                                            </div>
                                            <button
                                                onClick={() => setSelectedFile(null)}
                                                className="mt-2 text-sm text-red-600 hover:text-red-700"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ) : (
                                        <div>
                                            <div className="text-4xl text-gray-400 mb-2">📁</div>
                                            <p className="text-sm text-gray-600 mb-2">
                                                Drag and drop your MP4 video here, or
                                            </p>
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="text-teal-600 hover:text-teal-700 text-sm font-medium"
                                            >
                                                browse files
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".mp4,video/mp4"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                            </div>


                            {/* Actions */}
                            <div className="flex space-x-3">
                                <button
                                    onClick={() => {
                                        setShowUploadModal(false)
                                        setSelectedFile(null)
                                        setDisplayName('')
                                    }}
                                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpload}
                                    disabled={!selectedFile || uploading}
                                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
                                >
                                    {uploading ? 'Uploading...' : 'Upload'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
