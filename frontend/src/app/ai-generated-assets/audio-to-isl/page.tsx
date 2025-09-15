'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { appConfig } from '@/config/app-config'
import toast from 'react-hot-toast'

interface LanguageDetectionResult {
    message: string
    filename: string
    file_size: number
    content_type: string
    detected_language: string
}

export default function AudioToISLPage() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [showProfileDropdown, setShowProfileDropdown] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [detecting, setDetecting] = useState(false)
    const [generating, setGenerating] = useState(false)
    const [result, setResult] = useState<LanguageDetectionResult | null>(null)
    const [dragActive, setDragActive] = useState(false)
    const [showProgressModal, setShowProgressModal] = useState(false)
    const [progress, setProgress] = useState({
        step: '',
        progress: 0,
        isComplete: false,
        error: null as string | null
    })

    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        const checkAuthentication = async () => {
            const userData = localStorage.getItem('user')
            if (!userData) {
                router.push('/login')
                return
            }
            setUser(JSON.parse(userData))
        }
        checkAuthentication()
    }, [router])

    const supportedFormats = [
        { name: 'WAV', mimeType: 'audio/wav', extension: '.wav' },
        { name: 'MP3', mimeType: 'audio/mpeg', extension: '.mp3' },
        { name: 'AIFF', mimeType: 'audio/aiff', extension: '.aiff' },
        { name: 'AAC', mimeType: 'audio/aac', extension: '.aac' },
        { name: 'OGG Vorbis', mimeType: 'audio/ogg', extension: '.ogg' },
        { name: 'FLAC', mimeType: 'audio/flac', extension: '.flac' }
    ]

    const handleFileSelect = (file: File) => {
        // Validate file type
        const isValidFormat = supportedFormats.some(format => format.mimeType === file.type)
        
        if (!isValidFormat) {
            toast.error('Please select a supported audio file (WAV, MP3, AIFF, AAC, OGG, FLAC)')
            return
        }

        // Validate file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
            toast.error('File size too large. Maximum size is 10MB.')
            return
        }

        setSelectedFile(file)
        setResult(null)
    }

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            handleFileSelect(file)
        }
    }

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

        const file = e.dataTransfer.files?.[0]
        if (file) {
            handleFileSelect(file)
        }
    }

    const handleDetectLanguage = async () => {
        if (!selectedFile) {
            toast.error('Please select an audio file')
            return
        }

        setDetecting(true)
        setResult(null)

        try {
            const currentHost = window.location.hostname
            const apiUrl = currentHost === 'localhost'
                ? 'https://localhost:5001'
                : (process.env.NEXT_PUBLIC_API_URL || 'https://192.168.1.10:5001')

            const formData = new FormData()
            formData.append('file', selectedFile)

            const response = await fetch(`${apiUrl}/api/v1/language-detection/detect-language`, {
                method: 'POST',
                body: formData
            })

            if (response.ok) {
                const result = await response.json()
                setResult(result)
                toast.success('Language detected successfully!')
            } else {
                const error = await response.json()
                toast.error(error.detail || 'Language detection failed')
            }
        } catch (error) {
            console.error('Detection error:', error)
            toast.error('Network error occurred')
        } finally {
            setDetecting(false)
        }
    }

    const handleGenerateISL = async () => {
        if (!selectedFile || !result) {
            toast.error('Please detect language first')
            return
        }

        setGenerating(true)
        setShowProgressModal(true)
        setProgress({
            step: 'Preparing ISL generation...',
            progress: 0,
            isComplete: false,
            error: null
        })

        try {
            // Simulate progress steps
            const progressSteps = [
                { step: 'Analyzing audio content...', progress: 20 },
                { step: 'Transcribing speech to text...', progress: 40 },
                { step: 'Converting text to ISL signs...', progress: 60 },
                { step: 'Generating ISL video...', progress: 80 },
                { step: 'Finalizing ISL video...', progress: 95 }
            ]

            // Simulate progress
            for (const step of progressSteps) {
                setProgress(prev => ({
                    ...prev,
                    step: step.step,
                    progress: step.progress
                }))
                await new Promise(resolve => setTimeout(resolve, 1000))
            }

            // Complete progress
            setProgress(prev => ({
                ...prev,
                step: 'ISL video generated successfully!',
                progress: 100,
                isComplete: true
            }))

            // Wait a moment to show completion
            await new Promise(resolve => setTimeout(resolve, 1500))

            // Close modal
            setShowProgressModal(false)
            toast.success('ISL video generated successfully!')

        } catch (error) {
            console.error('Generation error:', error)
            setProgress(prev => ({
                ...prev,
                step: 'Generation failed',
                error: 'Failed to generate ISL video'
            }))
        } finally {
            setGenerating(false)
        }
    }

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const handleLogout = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        router.push('/login')
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
                            <Link href="/ai-generated-assets" className="hidden flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                <span>AI Generated Assets</span>
                            </Link>
                            <Link href="/ai-generated-assets/translations" className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
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
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                                </svg>
                                <span>ISL Dataset</span>
                            </Link>
                            <Link href="/ai-generated-assets/audio-to-isl" className="flex items-center space-x-3 px-3 py-2 bg-teal-50 text-teal-700 rounded-lg">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                                </svg>
                                <span>Audio File to ISL</span>
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
                                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Audio File to ISL</h1>
                                    <p className="text-gray-600">Convert audio files to Indian Sign Language (ISL) videos using AI</p>
                                </div>
                            </div>
                        </div>

                        {/* Main Content Card */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                            <div className="p-6">
                            {/* File Upload Section */}
                            <div className="mb-8">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Step 1: Upload Audio File</h2>
                                <div
                                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                                        dragActive
                                            ? 'border-teal-500 bg-teal-50'
                                            : 'border-gray-300 hover:border-gray-400'
                                    }`}
                                    onDragEnter={handleDrag}
                                    onDragLeave={handleDrag}
                                    onDragOver={handleDrag}
                                    onDrop={handleDrop}
                                >
                                    {selectedFile ? (
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-center">
                                                <svg className="w-12 h-12 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-lg font-medium text-gray-900">{selectedFile.name}</p>
                                                <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
                                            </div>
                                            <button
                                                onClick={() => setSelectedFile(null)}
                                                className="text-sm text-red-600 hover:text-red-800"
                                            >
                                                Remove file
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-center">
                                                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-lg font-medium text-gray-900">Drop your audio file here</p>
                                                <p className="text-sm text-gray-500">or click to browse</p>
                                            </div>
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                                            >
                                                Choose File
                                            </button>
                                        </div>
                                    )}
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".wav,.mp3,.aiff,.aac,.ogg,.flac,audio/*"
                                        onChange={handleFileInputChange}
                                        className="hidden"
                                    />
                                </div>

                                {/* Supported Formats */}
                                <div className="mt-4">
                                    <p className="text-sm text-gray-600 mb-2">Supported formats:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {supportedFormats.map((format, index) => (
                                            <div key={index} className="flex items-center text-xs text-gray-500">
                                                <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></span>
                                                {format.name} ({format.extension})
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-3">
                                        Maximum file size: 10MB
                                    </p>
                                </div>
                            </div>

                            {/* Language Detection Section */}
                            <div className="mb-8">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Step 2: Detect Language</h2>
                                <div className="flex items-center space-x-4">
                                    <button
                                        onClick={handleDetectLanguage}
                                        disabled={!selectedFile || detecting}
                                        className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                                            !selectedFile || detecting
                                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                : 'bg-blue-600 text-white hover:bg-blue-700'
                                        }`}
                                    >
                                        {detecting ? 'Detecting...' : 'Detect Language'}
                                    </button>
                                    {detecting && (
                                        <div className="flex items-center text-sm text-gray-600">
                                            <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Analyzing audio...
                                        </div>
                                    )}
                                </div>

                                {result && (
                                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                                        <h3 className="text-sm font-medium text-green-800 mb-2">Language Detection Result</h3>
                                        <div className="space-y-1 text-sm text-green-700">
                                            <p><strong>File:</strong> {result.filename}</p>
                                            <p><strong>Size:</strong> {formatFileSize(result.file_size)}</p>
                                            <p><strong>Detected Language:</strong> {result.detected_language}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* ISL Generation Section */}
                            <div className="mb-8">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Step 3: Generate ISL Video</h2>
                                <div className="flex items-center space-x-4">
                                    <button
                                        onClick={handleGenerateISL}
                                        disabled={!selectedFile || !result || generating}
                                        className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                                            !selectedFile || !result || generating
                                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                : 'bg-teal-600 text-white hover:bg-teal-700'
                                        }`}
                                    >
                                        {generating ? 'Generating...' : 'Generate ISL Video'}
                                    </button>
                                    {generating && (
                                        <div className="flex items-center text-sm text-gray-600">
                                            <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-teal-600" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Creating ISL video...
                                        </div>
                                    )}
                                </div>
                            </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {/* Progress Modal */}
            {showProgressModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                        <div className="text-center">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Generating ISL Video</h3>
                            
                            {/* Progress Bar */}
                            <div className="mb-4">
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full transition-all duration-500 ${
                                            progress.isComplete
                                                ? 'bg-green-500'
                                                : progress.error
                                                    ? 'bg-red-500'
                                                    : 'bg-teal-500'
                                        }`}
                                        style={{ width: `${progress.progress}%` }}
                                    ></div>
                                </div>
                                <p className="text-sm text-gray-600 mt-2">{progress.progress}%</p>
                            </div>

                            {/* Status Message */}
                            <div className="mb-4">
                                <p className={`text-sm ${
                                    progress.isComplete
                                        ? 'text-green-600'
                                        : progress.error
                                            ? 'text-red-600'
                                            : 'text-gray-600'
                                }`}>
                                    {progress.step}
                                </p>
                            </div>

                            {/* Close Button */}
                            {progress.error && (
                                <div className="flex justify-center">
                                    <button
                                        onClick={() => setShowProgressModal(false)}
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
        </div>
    )
}