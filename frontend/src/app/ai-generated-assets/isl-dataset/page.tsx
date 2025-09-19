'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { appConfig } from '@/config/app-config'
import toast from 'react-hot-toast'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import { getApiUrl } from '@/utils/api-utils'

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
    const [showVideoModal, setShowVideoModal] = useState(false)
    const [playingVideo, setPlayingVideo] = useState<ISLVideo | null>(null)
    const [videoBlobUrl, setVideoBlobUrl] = useState<string | null>(null)
    const [showSyncProgressModal, setShowSyncProgressModal] = useState(false)
    const [syncProgress, setSyncProgress] = useState({
        currentStep: '',
        progress: 0,
        isComplete: false,
        error: null as string | null,
        completedSteps: {
            maleModelScan: false,
            maleModelProcess: false,
            femaleModelScan: false,
            femaleModelProcess: false
        },
        results: {
            maleProcessed: 0,
            maleErrors: 0,
            femaleProcessed: 0,
            femaleErrors: 0
        }
    })
    const [deleting, setDeleting] = useState(false)

    // Sync modal states
    const [showSyncModal, setShowSyncModal] = useState(false)
    const [syncing, setSyncing] = useState(false)
    const [forceReprocess, setForceReprocess] = useState(false)

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
                const apiUrl = getApiUrl()

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

    // Cleanup blob URLs when component unmounts
    useEffect(() => {
        return () => {
            if (videoBlobUrl) {
                URL.revokeObjectURL(videoBlobUrl)
            }
        }
    }, [videoBlobUrl])

    const loadVideos = async () => {
        setLoading(true)
        try {
            const apiUrl = getApiUrl()

            const response = await fetch(`${apiUrl}/api/v1/isl-videos?model_type=${modelType}&page=${currentPage}&limit=60`, {
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
            const apiUrl = getApiUrl()

            const response = await fetch(`${apiUrl}/api/v1/isl-videos/statistics/summary`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
            })

            if (response.ok) {
                const data = await response.json()
                setMaleVideoCount(data.male_videos || 0)
                setFemaleVideoCount(data.female_videos || 0)
            } else {
                console.error('Failed to load video statistics:', response.status, response.statusText)
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
            const apiUrl = getApiUrl()

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

    const handlePlayVideo = async (video: ISLVideo) => {
        setPlayingVideo(video)
        setShowVideoModal(true)
        
        try {
            const apiUrl = getApiUrl()
            const response = await fetch(`${apiUrl}/api/v1/isl-videos/${video.id}/stream`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                },
            })
            
            if (response.ok) {
                const blob = await response.blob()
                const blobUrl = URL.createObjectURL(blob)
                setVideoBlobUrl(blobUrl)
            } else {
                console.error('Failed to fetch video:', response.status, response.statusText)
                toast.error('Failed to load video')
            }
        } catch (error) {
            console.error('Error fetching video:', error)
            toast.error('Error loading video')
        }
    }

    const handleUpdateVideo = async () => {
        if (!editingVideo) return

        setUpdating(true)
        try {
            const apiUrl = getApiUrl()

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
            const apiUrl = getApiUrl()

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
        setShowSyncModal(false)
        setShowSyncProgressModal(true)
        
        // Initialize progress
        setSyncProgress({
            currentStep: 'Starting sync process...',
            progress: 0,
            isComplete: false,
            error: null,
            completedSteps: {
                maleModelScan: false,
                maleModelProcess: false,
                femaleModelScan: false,
                femaleModelProcess: false
            },
            results: {
                maleProcessed: 0,
                maleErrors: 0,
                femaleProcessed: 0,
                femaleErrors: 0
            }
        })

        try {
            const apiUrl = getApiUrl()
            const modelTypes = ['male', 'female']
            
            for (let i = 0; i < modelTypes.length; i++) {
                const currentModelType = modelTypes[i]
                const isMale = currentModelType === 'male'
                
                try {
                    // Step 1: Scanning directory
                    setSyncProgress(prev => ({
                        ...prev,
                        currentStep: `Scanning ${currentModelType} model directory...`,
                        progress: (i * 40) + 10
                    }))
                    
                    // Step 2: Processing videos
                    setSyncProgress(prev => ({
                        ...prev,
                        currentStep: `Processing ${currentModelType} model videos...`,
                        progress: (i * 40) + 20,
                        completedSteps: {
                            ...prev.completedSteps,
                            [isMale ? 'maleModelScan' : 'femaleModelScan']: true
                        }
                    }))

                    // Create FormData with required parameters
                    const formData = new FormData()
                    formData.append('model_type', currentModelType)
                    formData.append('force_reprocess', forceReprocess.toString())

                    const response = await fetch(`${apiUrl}/api/v1/isl-videos/sync`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                        },
                        body: formData
                    })

                    if (response.ok) {
                        const result = await response.json()
                        const processed = result.processed || 0
                        const errors = result.errors ? result.errors.length : 0
                        
                        setSyncProgress(prev => ({
                            ...prev,
                            currentStep: `Completed ${currentModelType} model processing`,
                            progress: (i * 40) + 40,
                            completedSteps: {
                                ...prev.completedSteps,
                                [isMale ? 'maleModelProcess' : 'femaleModelProcess']: true
                            },
                            results: {
                                ...prev.results,
                                [isMale ? 'maleProcessed' : 'femaleProcessed']: processed,
                                [isMale ? 'maleErrors' : 'femaleErrors']: errors
                            }
                        }))
                        
                        console.log(`${currentModelType} model sync: ${result.message}`)
                    } else {
                        const errorData = await response.json()
                        console.error(`Failed to sync ${currentModelType} model:`, errorData.detail)
                        
                        setSyncProgress(prev => ({
                            ...prev,
                            currentStep: `Error processing ${currentModelType} model`,
                            progress: (i * 40) + 40,
                            completedSteps: {
                                ...prev.completedSteps,
                                [isMale ? 'maleModelProcess' : 'femaleModelProcess']: true
                            },
                            results: {
                                ...prev.results,
                                [isMale ? 'maleErrors' : 'femaleErrors']: 1
                            }
                        }))
                    }
                } catch (error) {
                    console.error(`Error syncing ${currentModelType} model:`, error)
                    setSyncProgress(prev => ({
                        ...prev,
                        currentStep: `Error processing ${currentModelType} model`,
                        progress: (i * 40) + 40,
                        completedSteps: {
                            ...prev.completedSteps,
                            [isMale ? 'maleModelProcess' : 'femaleModelProcess']: true
                        },
                        results: {
                            ...prev.results,
                            [isMale ? 'maleErrors' : 'femaleErrors']: 1
                        }
                    }))
                }
            }

            // Final step: Complete
            setSyncProgress(prev => ({
                ...prev,
                currentStep: 'Sync completed successfully!',
                progress: 100,
                isComplete: true
            }))

            // Show summary message
            const totalProcessed = syncProgress.results.maleProcessed + syncProgress.results.femaleProcessed
            const totalErrors = syncProgress.results.maleErrors + syncProgress.results.femaleErrors
            
            if (totalErrors === 0) {
                toast.success(`Videos synced successfully! Processed ${totalProcessed} videos from both model directories.`)
            } else {
                toast.success(`Sync completed with ${totalProcessed} videos processed. ${totalErrors} errors occurred.`)
            }
            
            loadVideos()
            loadVideoCounts()
        } catch (error) {
            console.error('Error syncing videos:', error)
            setSyncProgress(prev => ({
                ...prev,
                currentStep: 'Sync failed',
                error: 'An unexpected error occurred during sync',
                isComplete: true
            }))
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
                            
                            {/* Model Count Statistics */}
                            <div className="flex items-center space-x-6 mt-4">
                                <div className="flex items-center space-x-2">
                                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                    <span className="text-sm font-medium text-gray-700">Male Model:</span>
                                    <span className="text-sm font-bold text-blue-600">{maleVideoCount}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div className="w-3 h-3 bg-pink-500 rounded-full"></div>
                                    <span className="text-sm font-medium text-gray-700">Female Model:</span>
                                    <span className="text-sm font-bold text-pink-600">{femaleVideoCount}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div className="w-3 h-3 bg-teal-500 rounded-full"></div>
                                    <span className="text-sm font-medium text-gray-700">Total:</span>
                                    <span className="text-sm font-bold text-teal-600">{maleVideoCount + femaleVideoCount}</span>
                                </div>
                            </div>
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
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <span className="text-sm font-medium text-gray-700">Filter by Model Type:</span>
                            <div className="flex bg-gray-100 rounded-lg p-1">
                                <button
                                    type="button"
                                    onClick={() => setModelType('male')}
                                    className={`px-6 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                                        modelType === 'male'
                                            ? 'bg-white text-blue-600 shadow-sm'
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    Male Model
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setModelType('female')}
                                    className={`px-6 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                                        modelType === 'female'
                                            ? 'bg-white text-pink-600 shadow-sm'
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    Female Model
                                </button>
                            </div>
                        </div>
                        
                        {/* Current Selection Summary */}
                        <div className="text-sm text-gray-600">
                            Showing <span className="font-semibold text-teal-600">{modelType === 'male' ? maleVideoCount : femaleVideoCount}</span> {modelType} model videos
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
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2">
                    {loading ? (
                        // Loading skeleton
                        Array.from({ length: 60 }).map((_, index) => (
                            <div key={index} className="bg-white rounded-lg border border-gray-200 p-2 animate-pulse">
                                <div className="aspect-square bg-gray-200 rounded-lg mb-1"></div>
                                <div className="h-2 bg-gray-200 rounded mb-1"></div>
                                <div className="h-1 bg-gray-200 rounded w-2/3"></div>
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
                            <div key={video.id} className="group bg-white rounded-lg border border-gray-200 p-2 hover:shadow-lg transition-all duration-200 cursor-pointer relative">
                                {/* ISL Icon */}
                                <div className="aspect-square bg-gray-50 rounded-lg mb-1 flex items-center justify-center overflow-hidden">
                                    <img 
                                        src="/images/icons/isl.png" 
                                        alt="ISL Video" 
                                        className="w-12 h-12 object-contain"
                                    />
                                </div>
                                
                                {/* Video Name */}
                                <div className="text-center">
                                    <h3 className="text-[10px] font-medium text-gray-900 truncate leading-tight" title={video.display_name}>
                                        {video.display_name}
                                    </h3>
                                </div>

                                {/* Hover Overlay */}
                                <div className="absolute inset-0 bg-black bg-opacity-75 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                                    <div className="text-center text-white">
                                        {/* File Size */}
                                        <div className="text-[10px] mb-2">
                                            {formatFileSize(video.file_size)}
                                        </div>
                                        
                                        {/* Action Buttons */}
                                        <div className="flex space-x-1 justify-center">
                                            {/* Play Button */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handlePlayVideo(video)
                                                }}
                                                className="bg-green-600 hover:bg-green-700 text-white p-1 rounded-full transition-colors"
                                                title="Play Video"
                                            >
                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M8 5v14l11-7z"/>
                                                </svg>
                                            </button>
                                            
                                            {/* Delete Button */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setDeletingVideo(video)
                                                    setShowDeleteModal(true)
                                                }}
                                                className="bg-red-600 hover:bg-red-700 text-white p-1 rounded-full transition-colors"
                                                title="Delete Video"
                                            >
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
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
                        <p className="text-gray-600 mb-4">
                            This will scan both male-model and female-model directories and sync all available ISL videos to the database.
                        </p>
                        
                        {/* Force Reprocess Option */}
                        <div className="mb-6">
                            <label className="flex items-center space-x-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={forceReprocess}
                                    onChange={(e) => setForceReprocess(e.target.checked)}
                                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                                />
                                <div>
                                    <span className="text-sm font-medium text-gray-700">Force reprocess existing videos</span>
                                    <p className="text-xs text-gray-500">Check this to reprocess videos that are already in the database</p>
                                </div>
                            </label>
                        </div>
                        
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

            {/* Video Modal */}
            {showVideoModal && playingVideo && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="text-lg font-semibold text-gray-900">
                                {playingVideo.display_name}
                            </h3>
                            <button
                                onClick={() => {
                                    setShowVideoModal(false)
                                    setPlayingVideo(null)
                                    if (videoBlobUrl) {
                                        URL.revokeObjectURL(videoBlobUrl)
                                        setVideoBlobUrl(null)
                                    }
                                }}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-4">
                            <div className="aspect-video bg-black rounded-lg overflow-hidden">
                                {videoBlobUrl ? (
                                    <video
                                        className="w-full h-full"
                                        controls
                                        autoPlay
                                        preload="metadata"
                                        onError={(e) => {
                                            console.error('Video error:', e)
                                            console.error('Video source:', videoBlobUrl)
                                        }}
                                        onLoadStart={() => {
                                            console.log('Video loading started:', videoBlobUrl)
                                        }}
                                    >
                                        <source src={videoBlobUrl} type="video/mp4" />
                                        Your browser does not support the video tag.
                                    </video>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-white">
                                        <div className="text-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                                            <p>Loading video...</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Sync Progress Modal */}
            {showSyncProgressModal && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b">
                            <h3 className="text-xl font-semibold text-gray-900">Syncing ISL Videos</h3>
                            {syncProgress.isComplete && (
                                <button
                                    onClick={() => setShowSyncProgressModal(false)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>
                        
                        <div className="p-6">
                            {/* Progress Bar */}
                            <div className="mb-6">
                                <div className="flex justify-between text-sm text-gray-600 mb-2">
                                    <span>Progress</span>
                                    <span>{syncProgress.progress}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${syncProgress.progress}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Current Step */}
                            <div className="mb-6">
                                <h4 className="text-lg font-medium text-gray-900 mb-2">Current Step</h4>
                                <p className="text-gray-600">{syncProgress.currentStep}</p>
                                {forceReprocess && (
                                    <p className="text-sm text-orange-600 mt-1">
                                        ⚠️ Force reprocess enabled - existing videos will be reprocessed
                                    </p>
                                )}
                            </div>

                            {/* Step Progress */}
                            <div className="mb-6">
                                <h4 className="text-lg font-medium text-gray-900 mb-4">Sync Steps</h4>
                                <div className="space-y-3">
                                    {/* Male Model Steps */}
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                            syncProgress.completedSteps.maleModelScan ? 'bg-green-500' : 'bg-gray-300'
                                        }`}>
                                            {syncProgress.completedSteps.maleModelScan && (
                                                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                        </div>
                                        <span className="text-sm text-gray-700">Scan male-model directory</span>
                                    </div>
                                    
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                            syncProgress.completedSteps.maleModelProcess ? 'bg-green-500' : 'bg-gray-300'
                                        }`}>
                                            {syncProgress.completedSteps.maleModelProcess && (
                                                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                        </div>
                                        <span className="text-sm text-gray-700">Process male-model videos</span>
                                    </div>

                                    {/* Female Model Steps */}
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                            syncProgress.completedSteps.femaleModelScan ? 'bg-green-500' : 'bg-gray-300'
                                        }`}>
                                            {syncProgress.completedSteps.femaleModelScan && (
                                                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                        </div>
                                        <span className="text-sm text-gray-700">Scan female-model directory</span>
                                    </div>
                                    
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                            syncProgress.completedSteps.femaleModelProcess ? 'bg-green-500' : 'bg-gray-300'
                                        }`}>
                                            {syncProgress.completedSteps.femaleModelProcess && (
                                                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                        </div>
                                        <span className="text-sm text-gray-700">Process female-model videos</span>
                                    </div>
                                </div>
                            </div>

                            {/* Results Summary */}
                            {syncProgress.isComplete && (
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h4 className="text-lg font-medium text-gray-900 mb-3">Sync Results</h4>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="font-medium text-black">Male Model:</span>
                                            <span className="ml-2 text-black">{syncProgress.results.maleProcessed} videos processed</span>
                                            {syncProgress.results.maleErrors > 0 && (
                                                <span className="ml-2 text-red-600">({syncProgress.results.maleErrors} errors)</span>
                                            )}
                                        </div>
                                        <div>
                                            <span className="font-medium text-black">Female Model:</span>
                                            <span className="ml-2 text-black">{syncProgress.results.femaleProcessed} videos processed</span>
                                            {syncProgress.results.femaleErrors > 0 && (
                                                <span className="ml-2 text-red-600">({syncProgress.results.femaleErrors} errors)</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="mt-3 pt-3 border-t border-gray-200">
                                        <span className="font-medium text-black">Total:</span>
                                        <span className="ml-2 text-black">{syncProgress.results.maleProcessed + syncProgress.results.femaleProcessed} videos processed</span>
                                        {(syncProgress.results.maleErrors + syncProgress.results.femaleErrors) > 0 && (
                                            <span className="ml-2 text-red-600">({syncProgress.results.maleErrors + syncProgress.results.femaleErrors} errors)</span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Error Display */}
                            {syncProgress.error && (
                                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                                    <div className="flex items-center">
                                        <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                        <span className="text-red-800 font-medium">Error:</span>
                                    </div>
                                    <p className="text-red-700 mt-1">{syncProgress.error}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    )
}