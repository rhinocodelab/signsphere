'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { getApiUrl } from '@/utils/api-utils'

import DashboardLayout from '@/components/layouts/DashboardLayout'
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
    const [showProgressModal, setShowProgressModal] = useState(false)
    const [progress, setProgress] = useState({
        step: '',
        progress: 0,
        isComplete: false,
        error: null as string | null,
        completedSteps: {
            textTranslation: false,
            videoGeneration: false
        }
    })
    const [showVideoProgressModal, setShowVideoProgressModal] = useState(false)
    const [videoProgress, setVideoProgress] = useState({
        step: '',
        progress: 0,
        isComplete: false,
        error: null as string | null
    })
    
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
        setShowProgressModal(true)
        setProgress({
            step: 'Starting translation...',
            progress: 0,
            isComplete: false,
            error: null,
            completedSteps: {
                textTranslation: false,
                videoGeneration: false
            }
        })

        try {
            const apiUrl = getApiUrl()

            setProgress(prev => ({
                ...prev,
                step: 'Translating to Hindi...',
                progress: 25
            }))

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

            setProgress(prev => ({
                ...prev,
                step: 'Translating to Marathi...',
                progress: 50
            }))

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

            setProgress(prev => ({
                ...prev,
                step: 'Translating to Gujarati...',
                progress: 75
            }))

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
            
            setProgress(prev => ({
                ...prev,
                step: 'Translation complete!',
                progress: 100,
                isComplete: true,
                completedSteps: {
                    ...prev.completedSteps,
                    textTranslation: true
                }
            }))
            
            // Wait a moment to show completion
            await new Promise(resolve => setTimeout(resolve, 1500))
            
            // Close modal
            setShowProgressModal(false)
            toast.success('Text translated to all languages successfully!')

        } catch (error) {
            console.error('Translation error:', error)
            setProgress(prev => ({
                ...prev,
                step: 'Translation failed',
                error: 'Translation failed. Please try again.'
            }))
            toast.error('Translation failed. Please try again.')
        } finally {
            setTranslating(false)
        }
    }

    const handleGenerateISLVideo = async () => {
        if (!inputText.trim()) {
            toast.error('Please enter some text first')
            return
        }

        setGeneratingVideo(true)
        setShowVideoProgressModal(true)
        setVideoProgress({
            step: 'Starting video generation...',
            progress: 0,
            isComplete: false,
            error: null
        })

        try {
            const apiUrl = getApiUrl()

            setVideoProgress(prev => ({
                ...prev,
                step: 'Preparing video generation...',
                progress: 20
            }))

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

            setVideoProgress(prev => ({
                ...prev,
                step: 'Generating ISL video...',
                progress: 60
            }))

            const result = await response.json()
            setVideoGenerationResult(result)
            setVideoPreviewUrl(`${apiUrl}${result.preview_url}`)
            
            setVideoProgress(prev => ({
                ...prev,
                step: 'Video generation complete!',
                progress: 100,
                isComplete: true
            }))
            
            // Wait a moment to show completion
            await new Promise(resolve => setTimeout(resolve, 1500))
            
            // Close modal
            setShowVideoProgressModal(false)
            toast.success('ISL video generated successfully!')

        } catch (error) {
            console.error('Video generation error:', error)
            setVideoProgress(prev => ({
                ...prev,
                step: 'Video generation failed',
                error: 'Video generation failed. Please try again.'
            }))
            toast.error('Video generation failed. Please try again.')
        } finally {
            setGeneratingVideo(false)
        }
    }

    const handleSaveVideo = async () => {
        if (!videoGenerationResult?.temp_video_id) {
            toast.error('No video to save')
            return
        }

        try {
            const apiUrl = getApiUrl()

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
            const apiUrl = getApiUrl()

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

    const handleRetryTranslation = async () => {
        if (!inputText.trim()) {
            toast.error('Please enter some text to translate')
            return
        }

        // Reset progress and start over
        setProgress({
            step: 'Retrying translation...',
            progress: 0,
            isComplete: false,
            error: null,
            completedSteps: {
                textTranslation: false,
                videoGeneration: false
            }
        })

        // Clear previous results
        setTranslationResult(null)

        // Start the translation process again
        await handleTranslate()
    }

    const handleCancelTranslation = () => {
        // Clear translation state
        setTranslationResult(null)
        setShowProgressModal(false)
        setProgress({
            step: '',
            progress: 0,
            isComplete: false,
            error: null,
            completedSteps: {
                textTranslation: false,
                videoGeneration: false
            }
        })

        toast('Translation cancelled')
    }

    const handleRetryVideoGeneration = async () => {
        if (!inputText.trim()) {
            toast.error('Please enter some text first')
            return
        }

        // Reset video progress and start over
        setVideoProgress({
            step: 'Retrying video generation...',
            progress: 0,
            isComplete: false,
            error: null
        })

        // Clear previous video results
        setVideoGenerationResult(null)
        setVideoPreviewUrl('')
        setVideoSaved(false)

        // Start the video generation process again
        await handleGenerateISLVideo()
    }

    const handleCancelVideoGeneration = () => {
        // Clear video generation state
        setVideoGenerationResult(null)
        setVideoPreviewUrl('')
        setVideoSaved(false)
        setShowVideoProgressModal(false)
        setVideoProgress({
            step: '',
            progress: 0,
            isComplete: false,
            error: null
        })

        toast('Video generation cancelled')
    }

    if (!user) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>
    }

    return (
        <DashboardLayout activeMenuItem="text-to-isl">
            
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

            {/* Translation Progress Modal */}
            {showProgressModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <div className="text-center">
                            <div className="mb-4">
                                <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    {progress.isComplete ? (
                                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : progress.error ? (
                                        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    ) : (
                                        <svg className="w-8 h-8 text-teal-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                    )}
                                </div>
                                
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    {progress.isComplete ? 'Translation Complete!' : progress.error ? 'Translation Failed' : 'Translating Text'}
                                </h3>
                                
                                <p className="text-sm text-gray-600 mb-4">
                                    {progress.error || progress.step}
                                </p>
                            </div>

                            {/* Progress Bar */}
                            <div className="mb-6">
                                <div className="flex justify-between text-xs text-gray-500 mb-2">
                                    <span>Progress</span>
                                    <span>{progress.progress}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                        className={`h-2 rounded-full transition-all duration-300 ${
                                            progress.error ? 'bg-red-500' : 'bg-teal-600'
                                        }`}
                                        style={{ width: `${progress.progress}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Translation Steps */}
                            <div className="space-y-2 mb-6">
                                <div className="flex items-center space-x-3">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                        progress.completedSteps.textTranslation ? 'bg-green-500' : 
                                        progress.error && !progress.completedSteps.textTranslation ? 'bg-red-500' : 
                                        'bg-gray-200'
                                    }`}>
                                        {progress.completedSteps.textTranslation && (
                                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                        {progress.error && !progress.completedSteps.textTranslation && (
                                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        )}
                                    </div>
                                    <span className={`text-sm ${
                                        progress.completedSteps.textTranslation ? 'text-green-600 font-medium' : 
                                        progress.error && !progress.completedSteps.textTranslation ? 'text-red-600 font-medium' : 
                                        'text-gray-500'
                                    }`}>
                                        Multi-Language Translation
                                    </span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            {progress.error && (
                                <div className="flex space-x-3">
                                    <button
                                        onClick={handleRetryTranslation}
                                        className="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors"
                                    >
                                        Retry
                                    </button>
                                    <button
                                        onClick={handleCancelTranslation}
                                        className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Video Generation Progress Modal */}
            {showVideoProgressModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <div className="text-center">
                            <div className="mb-4">
                                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    {videoProgress.isComplete ? (
                                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : videoProgress.error ? (
                                        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    ) : (
                                        <svg className="w-8 h-8 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                    )}
                                </div>
                                
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    {videoProgress.isComplete ? 'Video Generation Complete!' : videoProgress.error ? 'Video Generation Failed' : 'Generating ISL Video'}
                                </h3>
                                
                                <p className="text-sm text-gray-600 mb-4">
                                    {videoProgress.error || videoProgress.step}
                                </p>
                            </div>

                            {/* Progress Bar */}
                            <div className="mb-6">
                                <div className="flex justify-between text-xs text-gray-500 mb-2">
                                    <span>Progress</span>
                                    <span>{videoProgress.progress}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                        className={`h-2 rounded-full transition-all duration-300 ${
                                            videoProgress.error ? 'bg-red-500' : 'bg-blue-600'
                                        }`}
                                        style={{ width: `${videoProgress.progress}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Video Generation Steps */}
                            <div className="space-y-2 mb-6">
                                <div className="flex items-center space-x-3">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                        videoProgress.progress >= 20 ? 'bg-green-500' : 
                                        videoProgress.error ? 'bg-red-500' : 
                                        'bg-gray-200'
                                    }`}>
                                        {videoProgress.progress >= 20 && (
                                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                        {videoProgress.error && videoProgress.progress < 20 && (
                                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        )}
                                    </div>
                                    <span className={`text-sm ${
                                        videoProgress.progress >= 20 ? 'text-green-600 font-medium' : 
                                        videoProgress.error ? 'text-red-600 font-medium' : 
                                        'text-gray-500'
                                    }`}>
                                        Processing Text
                                    </span>
                                </div>
                                
                                <div className="flex items-center space-x-3">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                        videoProgress.progress >= 60 ? 'bg-green-500' : 
                                        videoProgress.error && videoProgress.progress >= 20 && videoProgress.progress < 60 ? 'bg-red-500' : 
                                        'bg-gray-200'
                                    }`}>
                                        {videoProgress.progress >= 60 && (
                                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                        {videoProgress.error && videoProgress.progress >= 20 && videoProgress.progress < 60 && (
                                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        )}
                                    </div>
                                    <span className={`text-sm ${
                                        videoProgress.progress >= 60 ? 'text-green-600 font-medium' : 
                                        videoProgress.error && videoProgress.progress >= 20 && videoProgress.progress < 60 ? 'text-red-600 font-medium' : 
                                        'text-gray-500'
                                    }`}>
                                        Generating ISL Video
                                    </span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            {videoProgress.error && (
                                <div className="flex space-x-3">
                                    <button
                                        onClick={handleRetryVideoGeneration}
                                        className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                                    >
                                        Retry
                                    </button>
                                    <button
                                        onClick={handleCancelVideoGeneration}
                                        className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    )
}