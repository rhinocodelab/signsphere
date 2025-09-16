'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function TextToISLPage() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [showProfileDropdown, setShowProfileDropdown] = useState(false)
    
    // Text input and processing states
    const [inputText, setInputText] = useState('')
    const [translationResult, setTranslationResult] = useState<any>(null)
    const [videoGenerationResult, setVideoGenerationResult] = useState<any>(null)
    const [videoPreviewUrl, setVideoPreviewUrl] = useState('')
    const [videoSaved, setVideoSaved] = useState(false)
    const [videoSpeed, setVideoSpeed] = useState(1.0)
    
    // Processing states
    const [translating, setTranslating] = useState(false)
    const [generatingVideo, setGeneratingVideo] = useState(false)
    const [progress, setProgress] = useState({ current: 0, total: 0, message: '' })
    
    // AI Model selection
    const [selectedModel, setSelectedModel] = useState('male')
    
    // Video ref for playback control
    const videoRef = useRef<HTMLVideoElement>(null)

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

    const handleTranslate = async () => {
        if (!inputText.trim()) {
            toast.error('Please enter some text to translate')
            return
        }

        setTranslating(true)
        setProgress({ current: 0, total: 4, message: 'Starting translation...' })

        try {
            const currentHost = window.location.hostname
            const apiUrl = currentHost === 'localhost'
                ? 'https://localhost:5001'
                : (process.env.NEXT_PUBLIC_API_URL || `https://${currentHost}:5001`)

            setProgress({ current: 1, total: 4, message: 'Translating to Hindi...' })

            // Translate to Hindi
            const hindiFormData = new URLSearchParams()
            hindiFormData.append('text', inputText)
            hindiFormData.append('source_language_code', 'en')
            hindiFormData.append('target_language_code', 'hi')

            const hindiResponse = await fetch(`${apiUrl}/api/v1/speech-to-isl/translate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: hindiFormData
            })

            if (!hindiResponse.ok) {
                throw new Error(`Hindi translation failed: ${hindiResponse.statusText}`)
            }

            const hindiResponseData = await hindiResponse.json()
            const hindiResult = hindiResponseData.translation_result

            setProgress({ current: 2, total: 4, message: 'Translating to Marathi...' })

            // Translate to Marathi
            const marathiFormData = new URLSearchParams()
            marathiFormData.append('text', inputText)
            marathiFormData.append('source_language_code', 'en')
            marathiFormData.append('target_language_code', 'mr')

            const marathiResponse = await fetch(`${apiUrl}/api/v1/speech-to-isl/translate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: marathiFormData
            })

            if (!marathiResponse.ok) {
                throw new Error(`Marathi translation failed: ${marathiResponse.statusText}`)
            }

            const marathiResponseData = await marathiResponse.json()
            const marathiResult = marathiResponseData.translation_result

            setProgress({ current: 3, total: 4, message: 'Translating to Gujarati...' })

            // Translate to Gujarati
            const gujaratiFormData = new URLSearchParams()
            gujaratiFormData.append('text', inputText)
            gujaratiFormData.append('source_language_code', 'en')
            gujaratiFormData.append('target_language_code', 'gu')

            const gujaratiResponse = await fetch(`${apiUrl}/api/v1/speech-to-isl/translate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: gujaratiFormData
            })

            if (!gujaratiResponse.ok) {
                throw new Error(`Gujarati translation failed: ${gujaratiResponse.statusText}`)
            }

            const gujaratiResponseData = await gujaratiResponse.json()
            const gujaratiResult = gujaratiResponseData.translation_result

            // Combine all translations
            const combinedResult = {
                original_text: inputText,
                hindi: hindiResult.translated_text,
                marathi: marathiResult.translated_text,
                gujarati: gujaratiResult.translated_text,
                source_language: 'en',
                target_languages: ['hi', 'mr', 'gu']
            }

            setTranslationResult(combinedResult)
            
            setProgress({ current: 4, total: 4, message: 'Translation complete!' })
            toast.success('Text translated to all languages successfully!')

        } catch (error) {
            console.error('Translation error:', error)
            toast.error('Translation failed. Please try again.')
        } finally {
            setTranslating(false)
            setProgress({ current: 0, total: 0, message: '' })
        }
    }

    const handleGenerateISLVideo = async () => {
        if (!inputText.trim()) {
            toast.error('Please enter some text first')
            return
        }

        setGeneratingVideo(true)
        setProgress({ current: 0, total: 5, message: 'Starting video generation...' })

        try {
            const currentHost = window.location.hostname
            const apiUrl = currentHost === 'localhost'
                ? 'https://localhost:5001'
                : (process.env.NEXT_PUBLIC_API_URL || `https://${currentHost}:5001`)

            setProgress({ current: 1, total: 5, message: 'Preparing video generation...' })

            const response = await fetch(`${apiUrl}/api/v1/isl-video-generation/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: inputText,
                    model: selectedModel,
                    user_id: user?.id || 1
                })
            })

            if (!response.ok) {
                throw new Error(`Video generation failed: ${response.statusText}`)
            }

            setProgress({ current: 2, total: 5, message: 'Generating ISL video...' })

            const result = await response.json()
            setVideoGenerationResult(result)
            setVideoPreviewUrl(`${apiUrl}${result.preview_url}`)
            
            setProgress({ current: 5, total: 5, message: 'Video generation complete!' })
            toast.success('ISL video generated successfully!')

        } catch (error) {
            console.error('Video generation error:', error)
            toast.error('Video generation failed. Please try again.')
        } finally {
            setGeneratingVideo(false)
            setProgress({ current: 0, total: 0, message: '' })
        }
    }

    const handleSaveVideo = async () => {
        if (!videoGenerationResult?.temp_video_id) {
            toast.error('No video to save')
            return
        }

        try {
            const currentHost = window.location.hostname
            const apiUrl = currentHost === 'localhost'
                ? 'https://localhost:5001'
                : (process.env.NEXT_PUBLIC_API_URL || `https://${currentHost}:5001`)

            const response = await fetch(`${apiUrl}/api/v1/isl-video-generation/save/${videoGenerationResult.temp_video_id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: user?.id || 1,
                    original_text: inputText,
                    model_used: selectedModel
                })
            })

            if (response.ok) {
                setVideoSaved(true)
                toast.success('Video saved successfully!')
            } else {
                throw new Error('Failed to save video')
            }
        } catch (error) {
            console.error('Save video error:', error)
            toast.error('Failed to save video. Please try again.')
        }
    }

    const clearAll = async () => {
        // Clean up generated ISL video if it exists
        if (videoGenerationResult?.temp_video_id) {
            await handleCleanupTempVideo(videoGenerationResult.temp_video_id)
        }
        
        setInputText('')
        setTranslationResult(null)
        setVideoGenerationResult(null)
        setVideoPreviewUrl('')
        setVideoSaved(false)
        setVideoSpeed(1.0)
        setGeneratingVideo(false)
        setTranslating(false)
    }

    const handleSpeedChange = (speed: number) => {
        setVideoSpeed(speed)
        
        // Apply speed to video and start playing
        if (videoRef.current) {
            videoRef.current.playbackRate = speed
            videoRef.current.play().catch((error) => {
                console.log('Auto-play was prevented:', error)
                // Auto-play might be blocked by browser, that's okay
            })
        }
    }

    const handleCleanupTempVideo = async (tempVideoId: string) => {
        try {
            const currentHost = window.location.hostname
            const apiUrl = currentHost === 'localhost'
                ? 'https://localhost:5001'
                : (process.env.NEXT_PUBLIC_API_URL || `https://${currentHost}:5001`)

            const response = await fetch(`${apiUrl}/api/v1/isl-video-generation/cleanup/${tempVideoId}`, {
                method: 'DELETE'
            })

            if (response.ok) {
                console.log(`Temporary video ${tempVideoId} cleaned up successfully`)
            } else {
                console.warn(`Failed to cleanup temporary video ${tempVideoId}`)
            }
        } catch (error) {
            console.error('Video cleanup error:', error)
        }
    }

    if (!user) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-40">
                <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                        {/* Left Section - Logo and Title */}
                        <div className="flex items-center space-x-4">
                            <Link href="/dashboard" className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center">
                                    <div className="w-4 h-4 bg-white rounded-full"></div>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xl font-semibold text-gray-900">SignSphere</span>
                                    <span className="text-sm text-gray-500">Western Railway Divyangjan Announcement System</span>
                                </div>
                            </Link>
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
                                            {user?.username?.charAt(0) || 'U'}
                                        </span>
                                    </div>
                                    <span className="text-sm font-medium text-gray-700">{user?.username}</span>
                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {/* Profile Dropdown */}
                                {showProfileDropdown && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                                        <div className="px-4 py-2 border-b border-gray-100">
                                            <p className="text-sm font-medium text-gray-900">{user?.username}</p>
                                            <p className="text-xs text-gray-500">Administrator</p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                localStorage.removeItem('user')
                                                router.push('/login')
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                        >
                                            Sign out
                                        </button>
                                    </div>
                                )}
                            </div>
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
                            <Link href="/ai-generated-assets/audio-to-isl" className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                                </svg>
                                <span>Audio File to ISL</span>
                            </Link>
                            <Link href="/ai-generated-assets/speech-to-isl" className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                </svg>
                                <span>Speech to ISL</span>
                            </Link>
                            <Link href="/ai-generated-assets/text-to-isl" className="flex items-center space-x-3 px-3 py-2 bg-teal-50 text-teal-700 rounded-lg">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span>Text to ISL</span>
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
                        </div>
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1 ml-64 p-6 min-h-screen pb-24">
                    <div className="max-w-6xl mx-auto">
                        {/* Page Header */}
                        <div className="mb-8 pt-4">
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">Text to ISL</h1>
                            <p className="text-gray-600">Type English text and convert to Indian Sign Language (ISL) videos using AI</p>
                        </div>

                        {/* Main Content Area */}
                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                            <div className="p-6">
                                {/* Two Panel Layout */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    
                                    {/* Left Panel - Text Input */}
                                    <div className="space-y-6">
                                        <div>
                                            <h2 className="text-xl font-semibold text-gray-900 mb-2">Text Input</h2>
                                            <p className="text-sm text-gray-600">Type your English text to convert to ISL video</p>
                                        </div>
                                        
                                        {/* Text Input Area */}
                                        <div className="space-y-4">
                                            <div>
                                                <label htmlFor="input-text" className="block text-sm font-medium text-gray-700 mb-2">
                                                    English Text
                                                </label>
                                                <textarea
                                                    id="input-text"
                                                    value={inputText}
                                                    onChange={(e) => setInputText(e.target.value)}
                                                    className="w-full p-3 border border-gray-300 rounded-lg bg-white text-sm text-black focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                                    rows={6}
                                                    placeholder="Type your English text here..."
                                                />
                                            </div>
                                            
                                            <div className="flex space-x-3">
                                                <button
                                                    onClick={handleTranslate}
                                                    disabled={translating || !inputText.trim()}
                                                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                                                        translating || !inputText.trim()
                                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                            : 'bg-blue-600 text-white hover:bg-blue-700'
                                                    }`}
                                                >
                                                    {translating ? 'Translating...' : 'Translate'}
                                                </button>
                                                
                                                <button
                                                    onClick={clearAll}
                                                    className="px-4 py-2 rounded-lg font-medium text-sm text-gray-600 hover:bg-gray-100 transition-colors"
                                                >
                                                    Clear All
                                                </button>
                                            </div>
                                        </div>

                                        {/* Translation Result */}
                                        {translationResult && (
                                            <div className="space-y-4">
                                                <div>
                                                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Translation Results</h3>
                                                    <p className="text-xs text-gray-500 mb-2">Translated from English to Hindi, Marathi, and Gujarati</p>
                                                </div>
                                                
                                                <div className="space-y-3">
                                                    {/* Hindi Translation */}
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Hindi (हिंदी)
                                                        </label>
                                                        <textarea
                                                            value={translationResult.hindi}
                                                            readOnly
                                                            className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-sm text-black"
                                                            rows={3}
                                                        />
                                                    </div>

                                                    {/* Marathi Translation */}
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Marathi (मराठी)
                                                        </label>
                                                        <textarea
                                                            value={translationResult.marathi}
                                                            readOnly
                                                            className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-sm text-black"
                                                            rows={3}
                                                        />
                                                    </div>

                                                    {/* Gujarati Translation */}
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Gujarati (ગુજરાતી)
                                                        </label>
                                                        <textarea
                                                            value={translationResult.gujarati}
                                                            readOnly
                                                            className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-sm text-black"
                                                            rows={3}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* AI Model Selection */}
                                        {translationResult && translationResult.hindi && translationResult.marathi && translationResult.gujarati && (
                                            <div className="space-y-3">
                                                <div>
                                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Model Selection</h3>
                                                    <p className="text-sm text-gray-600">Choose the AI model for ISL video generation</p>
                                                </div>
                                                
                                                <div className="flex space-x-6">
                                                    <label className="flex items-center cursor-pointer">
                                                        <input
                                                            type="radio"
                                                            name="model"
                                                            value="male"
                                                            checked={selectedModel === 'male'}
                                                            onChange={(e) => setSelectedModel(e.target.value)}
                                                            className="mr-3 h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300"
                                                        />
                                                        <span className="text-sm font-medium text-gray-700">Male Model</span>
                                                    </label>
                                                    
                                                    <label className="flex items-center cursor-pointer">
                                                        <input
                                                            type="radio"
                                                            name="model"
                                                            value="female"
                                                            checked={selectedModel === 'female'}
                                                            onChange={(e) => setSelectedModel(e.target.value)}
                                                            className="mr-3 h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300"
                                                        />
                                                        <span className="text-sm font-medium text-gray-700">Female Model</span>
                                                    </label>
                                                </div>
                                            </div>
                                        )}

                                        {/* Action Button */}
                                        {translationResult && translationResult.hindi && translationResult.marathi && translationResult.gujarati && (
                                            <div className="space-y-3">
                                                <button
                                                    onClick={handleGenerateISLVideo}
                                                    disabled={!inputText.trim() || generatingVideo}
                                                    className={`w-full px-4 py-3 rounded-lg font-medium transition-colors ${
                                                        !inputText.trim() || generatingVideo
                                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                            : 'bg-teal-600 text-white hover:bg-teal-700'
                                                    }`}
                                                >
                                                    {generatingVideo ? 'Generating ISL Video...' : 'Generate ISL Video'}
                                                </button>

                                                {/* Progress Bar */}
                                                {progress.total > 0 && (
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between text-sm text-gray-600">
                                                            <span>{progress.message}</span>
                                                            <span>{progress.current}/{progress.total}</span>
                                                        </div>
                                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                                            <div
                                                                className="bg-teal-600 h-2 rounded-full transition-all duration-300"
                                                                style={{ width: `${(progress.current / progress.total) * 100}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Right Panel - ISL Video Output */}
                                    <div className="space-y-6">
                                        <div>
                                            <h2 className="text-xl font-semibold text-gray-900 mb-2">ISL Video Output</h2>
                                            <p className="text-sm text-gray-600">
                                                {videoGenerationResult 
                                                    ? 'Generated Indian Sign Language video is ready for preview'
                                                    : 'Generated Indian Sign Language video will appear here'
                                                }
                                            </p>
                                        </div>

                                        {/* Video Player Area */}
                                        {videoGenerationResult ? (
                                            <div className="space-y-4">
                                                {/* Video Info */}
                                                <div className="bg-white border border-gray-200 rounded-lg p-4">
                                                    <p className="text-sm text-gray-600">
                                                        Duration: {videoGenerationResult.video_duration?.toFixed(1)}s | 
                                                        Signs Used: {videoGenerationResult.signs_used?.length} | 
                                                        Signs Skipped: {videoGenerationResult.signs_skipped?.length}
                                                    </p>
                                                </div>
                                                
                                                {/* Video Player */}
                                                <div className="bg-white border border-gray-200 rounded-lg p-4">
                                                    <video
                                                        ref={videoRef}
                                                        src={videoPreviewUrl}
                                                        controls
                                                        className="w-full rounded-lg"
                                                        style={{ maxHeight: '400px' }}
                                                        onLoadedData={(e) => {
                                                            // Set initial playback rate when video loads
                                                            (e.target as HTMLVideoElement).playbackRate = videoSpeed
                                                        }}
                                                    />
                                                </div>
                                                
                                                {/* Video Speed Control */}
                                                <div className="bg-white border border-gray-200 rounded-lg p-4">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <h4 className="text-sm font-medium text-gray-900 mb-2">Playback Speed</h4>
                                                            <p className="text-xs text-gray-500">Adjust video playback speed</p>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((speed) => (
                                                                <button
                                                                    key={speed}
                                                                    onClick={() => handleSpeedChange(speed)}
                                                                    className={`px-3 py-1 text-sm rounded-md transition-colors ${
                                                                        videoSpeed === speed
                                                                            ? 'bg-teal-600 text-white'
                                                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                                    }`}
                                                                >
                                                                    {speed}x
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                {/* Action Buttons */}
                                                <div className="flex space-x-3">
                                                    <button
                                                        onClick={handleSaveVideo}
                                                        disabled={videoSaved}
                                                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                                            videoSaved
                                                                ? 'bg-green-600 text-white cursor-not-allowed'
                                                                : 'bg-teal-600 text-white hover:bg-teal-700'
                                                        }`}
                                                    >
                                                        {videoSaved ? 'Video Saved ✓' : 'Save Video'}
                                                    </button>
                                                    
                                                    <button
                                                        onClick={handleGenerateISLVideo}
                                                        disabled={generatingVideo}
                                                        className="px-4 py-2 rounded-lg font-medium bg-gray-600 text-white hover:bg-gray-700 transition-colors"
                                                    >
                                                        Regenerate Video
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-4 text-center flex flex-col items-center justify-center min-h-[290px]">
                                                <div className="space-y-4">
                                                    <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto">
                                                        <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <p className="text-lg font-medium text-gray-900">No ISL Video Generated</p>
                                                        <p className="text-sm text-gray-500">Type some text and click "Generate ISL Video" to create your sign language video</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}