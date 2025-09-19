'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { appConfig } from '@/config/app-config'
import toast from 'react-hot-toast'
import DashboardLayout from '@/components/layouts/DashboardLayout'

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
    const [modelType, setModelType] = useState<'male' | 'female'>('male')
    const [videos, setVideos] = useState<ISLVideo[]>([])
    const [loading, setLoading] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [searchQuery, setSearchQuery] = useState('')
    const [maleVideoCount, setMaleVideoCount] = useState(0)
    const [femaleVideoCount, setFemaleVideoCount] = useState(0)

    // Upload modal states
    const [showUploadModal, setShowUploadModal] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [newVideo, setNewVideo] = useState({
        display_name: '',
        description: '',
        tags: '',
        model_type: 'male'
    })

    // Edit modal states
    const [showEditModal, setShowEditModal] = useState(false)
    const [editingVideo, setEditingVideo] = useState<ISLVideo | null>(null)
    const [updating, setUpdating] = useState(false)

    // Delete modal states
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [deletingVideo, setDeletingVideo] = useState<ISLVideo | null>(null)
    const [deleting, setDeleting] = useState(false)

    // Sync modal states
    const [showSyncModal, setShowSyncModal] = useState(false)
    const [syncing, setSyncing] = useState(false)

    useEffect(() => {
        const checkAuthentication = async () => {
            const isLoggedIn = localStorage.getItem('isLoggedIn')
            const userData = localStorage.getItem('user')
            const accessToken = localStorage.getItem('accessToken')

            if (!isLoggedIn || !userData || !accessToken) {
                window.location.href = '/login'
                return
            }

            try {
                const currentHost = window.location.hostname
                const apiUrl = currentHost === 'localhost'
                    ? 'https://localhost:5001'
                    : (process.env.NEXT_PUBLIC_API_URL || 'https://192.168.1.10:5001')

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
                    localStorage.removeItem('isLoggedIn')
                    localStorage.removeItem('user')
                    localStorage.removeItem('accessToken')
                    window.location.href = '/login'
                }
            } catch (error) {
                console.error('Authentication check failed:', error)
                localStorage.removeItem('isLoggedIn')
                localStorage.removeItem('user')
                localStorage.removeItem('accessToken')
                window.location.href = '/login'
            }
        }

        checkAuthentication()
    }, [])

    useEffect(() => {
        if (user) {
            loadVideos()
            loadVideoCounts()
        }
    }, [user, modelType, currentPage])

    const loadVideos = async () => {
        setLoading(true)
        try {
            const currentHost = window.location.hostname
            const apiUrl = currentHost === 'localhost'
                ? 'https://localhost:5001'
                : (process.env.NEXT_PUBLIC_API_URL || 'https://192.168.1.10:5001')

            const response = await fetch(`${apiUrl}/api/v1/isl-videos?model_type=${modelType}&page=${currentPage}&limit=12`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                    'Content-Type': 'application/json',
                },
            })

            if (response.ok) {
                const data: VideoResponse = await response.json()
                setVideos(data.videos)
                setTotalPages(data.total_pages)
            } else {
                toast.error('Failed to load videos')
            }
        } catch (error) {
            console.error('Error loading videos:', error)
            toast.error('Error loading videos')
        } finally {
            setLoading(false)
        }
    }

    const loadVideoCounts = async () => {
        try {
            const currentHost = window.location.hostname
            const apiUrl = currentHost === 'localhost'
                ? 'https://localhost:5001'
                : (process.env.NEXT_PUBLIC_API_URL || 'https://192.168.1.10:5001')

            const [maleResponse, femaleResponse] = await Promise.all([
                fetch(`${apiUrl}/api/v1/isl-videos/count?model_type=male`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
                }),
                fetch(`${apiUrl}/api/v1/isl-videos/count?model_type=female`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
                })
            ])

            if (maleResponse.ok && femaleResponse.ok) {
                const maleData = await maleResponse.json()
                const femaleData = await femaleResponse.json()
                setMaleVideoCount(maleData.count)
                setFemaleVideoCount(femaleData.count)
            }
        } catch (error) {
            console.error('Error loading video counts:', error)
        }
    }

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0])
        }
    }

    const handleUpload = async () => {
        if (!selectedFile || !newVideo.display_name) {
            toast.error('Please fill in all required fields')
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
            formData.append('display_name', newVideo.display_name)
            formData.append('description', newVideo.description)
            formData.append('tags', newVideo.tags)
            formData.append('model_type', modelType)

            const response = await fetch(`${apiUrl}/api/v1/isl-videos/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                },
                body: formData,
            })

            if (response.ok) {
                toast.success('Video uploaded successfully')
                setShowUploadModal(false)
                setNewVideo({ display_name: '', description: '', tags: '', model_type: 'male' })
                setSelectedFile(null)
                loadVideos()
                loadVideoCounts()
            } else {
                const errorData = await response.json()
                toast.error(errorData.detail || 'Failed to upload video')
            }
        } catch (error) {
            console.error('Error uploading video:', error)
            toast.error('Error uploading video')
        } finally {
            setUploading(false)
        }
    }

    const handleEditVideo = (video: ISLVideo) => {
        setEditingVideo(video)
        setShowEditModal(true)
    }

    const handleUpdateVideo = async () => {
        if (!editingVideo) return

        setUpdating(true)
        try {
            const currentHost = window.location.hostname
            const apiUrl = currentHost === 'localhost'
                ? 'https://localhost:5001'
                : (process.env.NEXT_PUBLIC_API_URL || 'https://192.168.1.10:5001')

            const response = await fetch(`${apiUrl}/api/v1/isl-videos/${editingVideo.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                },
                body: JSON.stringify({
                    display_name: editingVideo.display_name,
                    description: editingVideo.description,
                    tags: editingVideo.tags,
                    is_active: editingVideo.is_active
                }),
            })

            if (response.ok) {
                toast.success('Video updated successfully')
                setShowEditModal(false)
                setEditingVideo(null)
                loadVideos()
            } else {
                toast.error('Failed to update video')
            }
        } catch (error) {
            console.error('Error updating video:', error)
            toast.error('Error updating video')
        } finally {
            setUpdating(false)
        }
    }

    const handleDeleteVideo = async () => {
        if (!deletingVideo) return

        setDeleting(true)
        try {
            const currentHost = window.location.hostname
            const apiUrl = currentHost === 'localhost'
                ? 'https://localhost:5001'
                : (process.env.NEXT_PUBLIC_API_URL || 'https://192.168.1.10:5001')

            const response = await fetch(`${apiUrl}/api/v1/isl-videos/${deletingVideo.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                },
            })

            if (response.ok) {
                toast.success('Video deleted successfully')
                setShowDeleteModal(false)
                setDeletingVideo(null)
                loadVideos()
                loadVideoCounts()
            } else {
                toast.error('Failed to delete video')
            }
        } catch (error) {
            console.error('Error deleting video:', error)
            toast.error('Error deleting video')
        } finally {
            setDeleting(false)
        }
    }

    const handleSyncVideos = async () => {
        setSyncing(true)
        try {
            const currentHost = window.location.hostname
            const apiUrl = currentHost === 'localhost'
                ? 'https://localhost:5001'
                : (process.env.NEXT_PUBLIC_API_URL || 'https://192.168.1.10:5001')

            const response = await fetch(`${apiUrl}/api/v1/isl-videos/sync`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                },
            })

            if (response.ok) {
                toast.success('Videos synced successfully')
                setShowSyncModal(false)
                loadVideos()
                loadVideoCounts()
            } else {
                toast.error('Failed to sync videos')
            }
        } catch (error) {
            console.error('Error syncing videos:', error)
            toast.error('Error syncing videos')
        } finally {
            setSyncing(false)
        }
    }

    const filteredVideos = videos.filter(video =>
        video.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        video.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        video.tags.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
            </div>
        )
    }

    return (
        <DashboardLayout activeMenuItem="isl-dataset">
            <div className="max-w-6xl mx-auto">
                {/* Page Header */}
                <div className="mb-8 pt-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">ISL Dictionary</h1>
                            <p className="text-gray-600">Manage Indian Sign Language videos for male and female AI models</p>
                        </div>
                        <div className="flex space-x-3">
                            <button
                                onClick={() => setShowSyncModal(true)}
                                disabled={syncing}
                                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                <span>Sync Videos</span>
                            </button>
                            <button
                                onClick={() => setShowUploadModal(true)}
                                className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                <span>Upload Video</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Model Type Toggle */}
                <div className="mb-6">
                    <div className="flex items-center space-x-4">
                        <span className="text-sm font-medium text-gray-700">Model Type:</span>
                        <div className="flex bg-gray-100 rounded-lg p-1">
                            <button
                                type="button"
                                onClick={() => setModelType('male')}
                                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                                    modelType === 'male'
                                        ? 'bg-white text-teal-600 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                Male Model ({maleVideoCount} videos)
                            </button>
                            <button
                                type="button"
                                onClick={() => setModelType('female')}
                                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                                    modelType === 'female'
                                        ? 'bg-white text-teal-600 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                Female Model ({femaleVideoCount} videos)
                            </button>
                        </div>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="mb-6">
                    <div className="relative">
                        <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search videos by name or description..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none w-full max-w-md text-black"
                        />
                    </div>
                </div>

                {/* Videos Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {loading ? (
                        // Loading skeleton
                        Array.from({ length: 8 }).map((_, index) => (
                            <div key={index} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
                                <div className="aspect-video bg-gray-200 rounded-lg mb-3"></div>
                                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                            </div>
                        ))
                    ) : filteredVideos.length === 0 ? (
                        <div className="col-span-full text-center py-12">
                            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No videos found</h3>
                            <p className="text-gray-500 mb-4">
                                {searchQuery ? 'No videos match your search criteria.' : 'No videos available for this model type.'}
                            </p>
                            <button
                                onClick={() => setShowUploadModal(true)}
                                className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                            >
                                Upload First Video
                            </button>
                        </div>
                    ) : (
                        filteredVideos.map((video) => (
                            <div key={video.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                                <div className="aspect-video bg-gray-100 rounded-lg mb-3 overflow-hidden">
                                    <video
                                        className="w-full h-full object-cover"
                                        controls
                                        preload="metadata"
                                    >
                                        <source src={`${appConfig.api.baseUrl}/api/v1/isl-videos/${video.filename}`} type="video/mp4" />
                                        Your browser does not support the video tag.
                                    </video>
                                </div>
                                <div className="space-y-2">
                                    <h3 className="font-medium text-gray-900 truncate" title={video.display_name}>
                                        {video.display_name}
                                    </h3>
                                    <p className="text-sm text-gray-600 line-clamp-2" title={video.description}>
                                        {video.description}
                                    </p>
                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                        <span>{formatFileSize(video.file_size)}</span>
                                        <span>{video.duration_seconds}s</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                            video.is_active
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                        }`}>
                                            {video.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                        <div className="flex space-x-1">
                                            <button
                                                onClick={() => handleEditVideo(video)}
                                                className="text-indigo-600 hover:text-indigo-900 text-xs"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setDeletingVideo(video)
                                                    setShowDeleteModal(true)
                                                }}
                                                className="text-red-600 hover:text-red-900 text-xs"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="mt-8 flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                            Showing page {currentPage} of {totalPages}
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                const pageNum = i + 1;
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`px-3 py-2 text-sm font-medium rounded-md ${
                                            currentPage === pageNum
                                                ? 'bg-teal-600 text-white'
                                                : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                                        }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                            <button
                                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Upload Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload ISL Video</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Display Name *</label>
                                <input
                                    type="text"
                                    value={newVideo.display_name}
                                    onChange={(e) => setNewVideo({ ...newVideo, display_name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                                    placeholder="e.g., Hello"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    value={newVideo.description}
                                    onChange={(e) => setNewVideo({ ...newVideo, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                                    rows={3}
                                    placeholder="Describe this sign..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                                <input
                                    type="text"
                                    value={newVideo.tags}
                                    onChange={(e) => setNewVideo({ ...newVideo, tags: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                                    placeholder="e.g., greeting, basic, common"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Video File *</label>
                                <input
                                    type="file"
                                    accept="video/*"
                                    onChange={handleFileSelect}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => setShowUploadModal(false)}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpload}
                                disabled={uploading || !newVideo.display_name || !selectedFile}
                                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors disabled:opacity-50"
                            >
                                {uploading ? 'Uploading...' : 'Upload'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && editingVideo && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Edit Video</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Display Name *</label>
                                <input
                                    type="text"
                                    value={editingVideo.display_name}
                                    onChange={(e) => setEditingVideo({ ...editingVideo, display_name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    value={editingVideo.description}
                                    onChange={(e) => setEditingVideo({ ...editingVideo, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                                    rows={3}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                                <input
                                    type="text"
                                    value={editingVideo.tags}
                                    onChange={(e) => setEditingVideo({ ...editingVideo, tags: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={editingVideo.is_active}
                                        onChange={(e) => setEditingVideo({ ...editingVideo, is_active: e.target.checked })}
                                        className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">Active</span>
                                </label>
                            </div>
                        </div>
                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdateVideo}
                                disabled={updating}
                                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors disabled:opacity-50"
                            >
                                {updating ? 'Updating...' : 'Update'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && deletingVideo && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Delete Video</h2>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to delete "{deletingVideo.display_name}"? This action cannot be undone.
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteVideo}
                                disabled={deleting}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                            >
                                {deleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Sync Modal */}
            {showSyncModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Sync Videos</h2>
                        <p className="text-gray-600 mb-6">
                            This will scan the server directory and sync all available ISL videos to the database.
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowSyncModal(false)}
                                disabled={syncing}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSyncVideos}
                                disabled={syncing}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                            >
                                {syncing ? 'Syncing...' : 'Sync Videos'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    )
}