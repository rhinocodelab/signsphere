'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { appConfig } from '@/config/app-config'
import toast from 'react-hot-toast'

interface LanguageDetectionResult {
    message: string
    recording_duration: number
    file_size: number
    content_type: string
    detected_language: string
    confidence: number
}

interface SpeechRecognitionResult {
    success: boolean
    transcript: string
    language_code: string
    confidence?: number
    error?: string
}

interface TranslationResult {
    success: boolean
    translated_text: string
    source_language_code: string
    target_language_code: string
    confidence?: number
    error?: string
}

export default function SpeechToISLPage() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [showProfileDropdown, setShowProfileDropdown] = useState(false)
    const [isRecording, setIsRecording] = useState(false)
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
    const [audioUrl, setAudioUrl] = useState<string>('')
    const [recordingTime, setRecordingTime] = useState(0)
    const [tempAudioId, setTempAudioId] = useState<string | null>(null)
    const [detecting, setDetecting] = useState(false)
    const [generating, setGenerating] = useState(false)
    const [result, setResult] = useState<LanguageDetectionResult | null>(null)
    const [transcriptResult, setTranscriptResult] = useState<SpeechRecognitionResult | null>(null)
    const [transcribing, setTranscribing] = useState(false)
    const [translationResult, setTranslationResult] = useState<TranslationResult | null>(null)
    const [translating, setTranslating] = useState(false)
    const [translatedText, setTranslatedText] = useState<string>('')
    const [selectedModel, setSelectedModel] = useState<string>('male')
    const [videoGenerationResult, setVideoGenerationResult] = useState<any>(null)
    const [generatingVideo, setGeneratingVideo] = useState(false)
    const [videoPreviewUrl, setVideoPreviewUrl] = useState<string>('')
    const [videoSaved, setVideoSaved] = useState(false)
    const [videoSpeed, setVideoSpeed] = useState<number>(1.0)
    const [showProgressModal, setShowProgressModal] = useState(false)
    const [progress, setProgress] = useState({
        step: '',
        progress: 0,
        isComplete: false,
        error: null as string | null
    })

    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const audioChunksRef = useRef<Blob[]>([])
    const timerRef = useRef<NodeJS.Timeout | null>(null)

    // Language name to code mapping (English + Native Scripts)
    const languageMapping: { [key: string]: string } = {
        'english': 'en-IN',
        'english (india)': 'en-IN',
        'english (indian)': 'en-IN',
        'inglish': 'en-IN',
        'angrezi': 'en-IN',
        'english language': 'en-IN',
        'indian english': 'en-IN',
        'hindi english': 'en-IN',
        'hindi': 'hi-IN',
        'hindi (india)': 'hi-IN',
        'hindustani': 'hi-IN',
        'khari boli': 'hi-IN',
        'devanagari': 'hi-IN',
        'hindi language': 'hi-IN',
        'standard hindi': 'hi-IN',
        'modern hindi': 'hi-IN',
        'हिन्दी': 'hi-IN',
        'हिंदी': 'hi-IN',
        'हिन्दी (भारत)': 'hi-IN',
        'हिंदी (भारत)': 'hi-IN',
        'हिन्दी भाषा': 'hi-IN',
        'हिंदी भाषा': 'hi-IN',
        'marathi': 'mr-IN',
        'marathi (india)': 'mr-IN',
        'maharashtrian': 'mr-IN',
        'marathi language': 'mr-IN',
        'maharashtra': 'mr-IN',
        'marathi (maharashtra)': 'mr-IN',
        'मराठी': 'mr-IN',
        'मराठी (भारत)': 'mr-IN',
        'मराठी (महाराष्ट्र)': 'mr-IN',
        'मराठी भाषा': 'mr-IN',
        'gujarati': 'gu-IN',
        'gujarati (india)': 'gu-IN',
        'gujrati': 'gu-IN',
        'gujrati (india)': 'gu-IN',
        'gujarati language': 'gu-IN',
        'gujrati language': 'gu-IN',
        'gujarat': 'gu-IN',
        'gujarati (gujarat)': 'gu-IN',
        'gujrati (gujarat)': 'gu-IN',
        'ગુજરાતી': 'gu-IN',
        'ગુજરાતી (ભારત)': 'gu-IN',
        'ગુજરાતી (ગુજરાત)': 'gu-IN',
        'ગુજરાતી ભાષા': 'gu-IN',
        'गुजराती': 'gu-IN',
        'गुजराती (भारत)': 'gu-IN',
        'गुजराती (गुजरात)': 'gu-IN',
        'गुजराती भाषा': 'gu-IN'
    }

    // Language code to native script mapping
    const nativeScriptMapping: { [key: string]: string } = {
        'en-IN': 'English',
        'hi-IN': 'हिंदी',
        'mr-IN': 'मराठी',
        'gu-IN': 'ગુજરાતી'
    }

    // Function to get native script name from language code
    const getNativeScriptName = (languageCode: string): string => {
        return nativeScriptMapping[languageCode] || languageCode
    }

    // Function to map detected language name to language code
    const mapLanguageNameToCode = (detectedLanguage: string): string | null => {
        if (!detectedLanguage) return null
        
        const normalizedLanguage = detectedLanguage.toLowerCase().trim().normalize('NFC')
        
        if (languageMapping[normalizedLanguage]) {
            return languageMapping[normalizedLanguage]
        }
        
        const nfdForm = detectedLanguage.toLowerCase().trim().normalize('NFD')
        if (languageMapping[nfdForm]) {
            return languageMapping[nfdForm]
        }
        
        return null
    }

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

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const mediaRecorder = new MediaRecorder(stream)
            mediaRecorderRef.current = mediaRecorder
            audioChunksRef.current = []

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data)
                }
            }

            mediaRecorder.onstop = () => {
                // Get the actual MIME type from MediaRecorder
                const mimeType = mediaRecorder.mimeType || 'audio/webm'
                console.log('MediaRecorder MIME type:', mimeType)
                
                const audioBlob = new Blob(audioChunksRef.current, { type: mimeType })
                setAudioBlob(audioBlob)
                const url = URL.createObjectURL(audioBlob)
                setAudioUrl(url)
                
                // Automatically save to temp location and start language detection
                setTimeout(() => {
                    handleSaveAudioToTemp(audioBlob)
                }, 500)
            }

            mediaRecorder.start()
            setIsRecording(true)
            setRecordingTime(0)
            
            // Start timer
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1)
            }, 1000)

            toast.success('Recording started')
        } catch (error) {
            console.error('Error starting recording:', error)
            toast.error('Failed to access microphone')
        }
    }

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop()
            setIsRecording(false)
            
            if (timerRef.current) {
                clearInterval(timerRef.current)
                timerRef.current = null
            }

            // Stop all tracks
            if (mediaRecorderRef.current.stream) {
                mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
            }

            toast.success('Recording stopped')
        }
    }

    const clearRecording = async () => {
        // Clean up temporary audio file if it exists
        if (tempAudioId) {
            await handleCleanupTempAudio(tempAudioId)
        }
        
        // Clean up generated ISL video if it exists
        if (videoGenerationResult?.temp_video_id) {
            await handleCleanupTempVideo(videoGenerationResult.temp_video_id)
        }
        
        setAudioBlob(null)
        setAudioUrl('')
        setRecordingTime(0)
        setTempAudioId(null)
        setResult(null)
        setTranscriptResult(null)
        setTranslationResult(null)
        setTranslatedText('')
        setVideoGenerationResult(null)
        setVideoPreviewUrl('')
        setVideoSaved(false)
        setVideoSpeed(1.0)
        setGeneratingVideo(false)
        setDetecting(false)
        setTranscribing(false)
        setTranslating(false)
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    const handleSaveAudioToTemp = async (blob: Blob) => {
        try {
            // Determine filename based on MIME type
            let filename = 'recording.wav'
            if (blob.type.includes('webm')) {
                filename = 'recording.webm'
            } else if (blob.type.includes('ogg')) {
                filename = 'recording.ogg'
            } else if (blob.type.includes('mp4')) {
                filename = 'recording.mp4'
            }
            
            console.log('Saving audio with filename:', filename, 'MIME type:', blob.type)
            
            // Create FormData for the recorded audio blob
            const formData = new FormData()
            formData.append('audio_blob', blob, filename)

            // Get API URL
            const currentHost = window.location.hostname
            const apiUrl = currentHost === 'localhost'
                ? 'https://localhost:5001'
                : (process.env.NEXT_PUBLIC_API_URL || `https://${currentHost}:5001`)

            // Call the save-temp endpoint
            const response = await fetch(`${apiUrl}/api/v1/speech-to-isl/save-temp`, {
                method: 'POST',
                body: formData
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.detail || `Failed to save audio: ${response.statusText}`)
            }

            const result = await response.json()
            setTempAudioId(result.temp_audio_id)
            
            // Automatically start language detection
            setTimeout(() => {
                handleDetectLanguageFromTemp(result.temp_audio_id)
            }, 1000)
            
        } catch (error) {
            console.error('Save audio error:', error)
            toast.error(error instanceof Error ? error.message : 'Failed to save audio')
        }
    }

    const handleDetectLanguageFromTemp = async (tempAudioId: string) => {
        setDetecting(true)
        setResult(null)
        setShowProgressModal(true)
        setProgress({
            step: 'Starting language detection...',
            progress: 0,
            isComplete: false,
            error: null
        })

        try {
            // Simulate progress steps
            const progressSteps = [
                { step: 'Processing recorded audio...', progress: 20 },
                { step: 'Analyzing speech patterns...', progress: 40 },
                { step: 'Detecting language...', progress: 60 },
                { step: 'Finalizing results...', progress: 95 }
            ]

            for (const step of progressSteps) {
                setProgress(prev => ({
                    ...prev,
                    step: step.step,
                    progress: step.progress
                }))
                await new Promise(resolve => setTimeout(resolve, 800))
            }

            // Get API URL
            const currentHost = window.location.hostname
            const apiUrl = currentHost === 'localhost'
                ? 'https://localhost:5001'
                : (process.env.NEXT_PUBLIC_API_URL || `https://${currentHost}:5001`)

            // Call the detect-language endpoint with temp audio ID
            const response = await fetch(`${apiUrl}/api/v1/speech-to-isl/detect-language/${tempAudioId}`, {
                method: 'POST'
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.detail || `Language detection failed: ${response.statusText}`)
            }

            const result = await response.json()
            setResult(result)
            
            setProgress(prev => ({
                ...prev,
                step: 'Language detected successfully!',
                progress: 100,
                isComplete: true
            }))

            await new Promise(resolve => setTimeout(resolve, 1500))

            // Continue with speech recognition
            const languageCode = mapLanguageNameToCode(result.detected_language)
            if (languageCode) {
                setTimeout(() => {
                    handleSpeechRecognitionInModal(languageCode, tempAudioId)
                }, 1000)
            } else {
                setShowProgressModal(false)
                toast.error(`Unsupported language detected: ${result.detected_language}`)
            }
            
        } catch (error) {
            console.error('Detection error:', error)
            setProgress(prev => ({
                ...prev,
                step: 'Language detection failed',
                error: error instanceof Error ? error.message : 'Language detection failed'
            }))
            toast.error(error instanceof Error ? error.message : 'Language detection failed')
        } finally {
            setDetecting(false)
        }
    }

    const handleCleanupTempAudio = async (tempAudioId: string) => {
        try {
            const currentHost = window.location.hostname
            const apiUrl = currentHost === 'localhost'
                ? 'https://localhost:5001'
                : (process.env.NEXT_PUBLIC_API_URL || `https://${currentHost}:5001`)

            const response = await fetch(`${apiUrl}/api/v1/speech-to-isl/cleanup/${tempAudioId}`, {
                method: 'DELETE'
            })

            if (response.ok) {
                console.log(`Temporary audio ${tempAudioId} cleaned up successfully`)
            } else {
                console.warn(`Failed to cleanup temporary audio ${tempAudioId}`)
            }
        } catch (error) {
            console.error('Cleanup error:', error)
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


    const handleSpeechRecognitionInModal = async (languageCode: string, audioId?: string) => {
        const currentTempAudioId = audioId || tempAudioId
        if (!currentTempAudioId) {
            toast.error('No audio file available for transcription')
            return
        }

        setTranscribing(true)
        setShowProgressModal(true)
        setProgress({
            step: 'Starting speech recognition...',
            progress: 0,
            isComplete: false,
            error: null
        })

        try {
            // Simulate progress steps
            const progressSteps = [
                { step: 'Converting speech to text...', progress: 30 },
                { step: 'Processing audio content...', progress: 60 },
                { step: 'Generating transcript...', progress: 90 }
            ]

            for (const step of progressSteps) {
                setProgress(prev => ({
                    ...prev,
                    step: step.step,
                    progress: step.progress
                }))
                await new Promise(resolve => setTimeout(resolve, 1000))
            }

            // Get API URL
            const currentHost = window.location.hostname
            const apiUrl = currentHost === 'localhost'
                ? 'https://localhost:5001'
                : (process.env.NEXT_PUBLIC_API_URL || `https://${currentHost}:5001`)

            // Call the transcription endpoint
            const formData = new FormData()
            formData.append('language_code', languageCode)
            formData.append('enable_automatic_punctuation', 'true')
            formData.append('enable_word_time_offsets', 'true')

            const response = await fetch(`${apiUrl}/api/v1/speech-to-isl/transcribe-speech-isl/${currentTempAudioId}`, {
                method: 'POST',
                body: formData
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.detail || `Transcription failed: ${response.statusText}`)
            }

            const result = await response.json()
            console.log('Transcription result:', result)
            setTranscriptResult(result.transcription_result)
            
            setProgress(prev => ({
                ...prev,
                step: 'Speech recognition completed!',
                progress: 100,
                isComplete: true
            }))

            await new Promise(resolve => setTimeout(resolve, 1500))

            // Continue with translation
            setTimeout(() => {
                handleTranslationInModal(result.transcription_result.transcript, languageCode)
            }, 1000)
            
        } catch (error) {
            console.error('Speech recognition error:', error)
            setProgress(prev => ({
                ...prev,
                step: 'Speech recognition failed',
                error: error instanceof Error ? error.message : 'Speech recognition failed'
            }))
            toast.error(error instanceof Error ? error.message : 'Speech recognition failed')
        } finally {
            setTranscribing(false)
        }
    }

    const handleTranslationInModal = async (text: string, sourceLanguageCode: string) => {
        // Skip translation if already in English
        if (sourceLanguageCode === 'en-IN') {
            setTranslationResult({
                success: true,
                translated_text: text,
                source_language_code: sourceLanguageCode,
                target_language_code: 'en-IN',
                confidence: 1.0
            })
            setTranslatedText(text)
            setShowProgressModal(false)
            return
        }

        setTranslating(true)
        setShowProgressModal(true)
        setProgress({
            step: 'Starting translation...',
            progress: 0,
            isComplete: false,
            error: null
        })

        try {
            // Simulate progress steps
            const progressSteps = [
                { step: 'Translating to English...', progress: 50 },
                { step: 'Finalizing translation...', progress: 90 }
            ]

            for (const step of progressSteps) {
                setProgress(prev => ({
                    ...prev,
                    step: step.step,
                    progress: step.progress
                }))
                await new Promise(resolve => setTimeout(resolve, 800))
            }

            // Get API URL
            const currentHost = window.location.hostname
            const apiUrl = currentHost === 'localhost'
                ? 'https://localhost:5001'
                : (process.env.NEXT_PUBLIC_API_URL || `https://${currentHost}:5001`)

            // Call the translation endpoint
            const formData = new FormData()
            formData.append('text', text)
            formData.append('source_language_code', sourceLanguageCode)
            formData.append('target_language_code', 'en-IN')

            const response = await fetch(`${apiUrl}/api/v1/speech-to-isl/translate`, {
                method: 'POST',
                body: formData
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.detail || `Translation failed: ${response.statusText}`)
            }

            const result = await response.json()
            setTranslationResult(result.translation_result)
            setTranslatedText(result.translation_result.translated_text)
            
            setProgress(prev => ({
                ...prev,
                step: 'Translation completed!',
                progress: 100,
                isComplete: true
            }))

            await new Promise(resolve => setTimeout(resolve, 1500))
            setShowProgressModal(false)
            
        } catch (error) {
            console.error('Translation error:', error)
            setProgress(prev => ({
                ...prev,
                step: 'Translation failed',
                error: error instanceof Error ? error.message : 'Translation failed'
            }))
            toast.error(error instanceof Error ? error.message : 'Translation failed')
        } finally {
            setTranslating(false)
        }
    }

    const handleGenerateISLVideo = async () => {
        if (!translatedText.trim()) {
            toast.error('No translated text available for video generation')
            return
        }

        console.log('Generating ISL video with translated text:', translatedText)
        console.log('Selected model:', selectedModel)
        
        setGeneratingVideo(true)
        setShowProgressModal(true)
        setProgress({
            step: 'Preparing ISL video generation...',
            progress: 0,
            isComplete: false,
            error: null
        })

        try {
            // Simulate progress steps
            const progressSteps = [
                { step: 'Processing English text...', progress: 20 },
                { step: 'Mapping text to ISL signs...', progress: 40 },
                { step: 'Stitching video files...', progress: 60 },
                { step: 'Generating ISL video...', progress: 80 },
                { step: 'Finalizing video...', progress: 95 }
            ]

            // Simulate progress
            for (const step of progressSteps) {
                setProgress(prev => ({
                    ...prev,
                    step: step.step,
                    progress: step.progress
                }))
                await new Promise(resolve => setTimeout(resolve, 800))
            }

            // Get API URL
            const currentHost = window.location.hostname
            const apiUrl = currentHost === 'localhost'
                ? 'https://localhost:5001'
                : (process.env.NEXT_PUBLIC_API_URL || `https://${currentHost}:5001`)

            // Call ISL video generation API
            const response = await fetch(`${apiUrl}/api/v1/isl-video-generation/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: translatedText,
                    model: selectedModel,
                    user_id: user?.id || 1
                })
            })

            if (response.ok) {
                const result = await response.json()
                setVideoGenerationResult(result)
                setVideoPreviewUrl(`${apiUrl}${result.preview_url}`)
                
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
            } else {
                const error = await response.json()
                setProgress(prev => ({
                    ...prev,
                    step: 'Video generation failed',
                    error: error.detail || 'Video generation failed'
                }))
                toast.error(error.detail || 'Video generation failed')
            }

        } catch (error) {
            console.error('Video generation error:', error)
            setProgress(prev => ({
                ...prev,
                step: 'Network error occurred',
                error: 'Network error occurred'
            }))
            toast.error('Network error occurred')
        } finally {
            setGeneratingVideo(false)
        }
    }

    const handleSaveISLVideo = async () => {
        if (!videoGenerationResult) {
            toast.error('No video to save')
            return
        }

        try {
            // Mock save functionality
            await new Promise(resolve => setTimeout(resolve, 1000))
            setVideoSaved(true)
            toast.success('ISL video saved successfully!')
        } catch (error) {
            console.error('Video save error:', error)
            toast.error('Network error occurred')
        }
    }

    const handleVideoSpeedChange = (speed: number) => {
        setVideoSpeed(speed)
        const videoElement = document.querySelector('video') as HTMLVideoElement
        if (videoElement) {
            videoElement.playbackRate = speed
            videoElement.currentTime = 0
            videoElement.play()
        }
    }

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
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
                                            {user?.full_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
                                        </span>
                                    </div>
                                    <span className="text-sm font-medium text-gray-700">{user?.full_name || user?.username}</span>
                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {/* Profile Dropdown */}
                                {showProfileDropdown && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                                        <div className="px-4 py-2 border-b border-gray-100">
                                            <p className="text-sm font-medium text-gray-900">{user?.full_name || user?.username}</p>
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
                            <Link href="/ai-generated-assets/speech-to-isl" className="flex items-center space-x-3 px-3 py-2 bg-teal-50 text-teal-700 rounded-lg">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                </svg>
                                <span>Speech to ISL</span>
                            </Link>
                            <Link href="/ai-generated-assets/text-to-isl" className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
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
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">Speech to ISL</h1>
                            <p className="text-gray-600">Record speech and convert to Indian Sign Language (ISL) videos using AI</p>
                        </div>

                        {/* Main Content Area */}
                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                            <div className="p-6">
                                {/* Two Panel Layout */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    
                                    {/* Left Panel - Speech Recording */}
                                    <div className="space-y-6">
                                        <div>
                                            <h2 className="text-xl font-semibold text-gray-900 mb-2">Speech Recording</h2>
                                            <p className="text-sm text-gray-600">Record your speech to convert to ISL video</p>
                                        </div>
                                        
                                        {/* Recording Interface */}
                                        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-4 text-center min-h-[290px] flex flex-col items-center justify-center">
                                            {audioBlob ? (
                                                <div className="space-y-4 w-full">
                                                    <div className="flex items-center justify-center">
                                                        <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center">
                                                            <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className="text-lg font-medium text-gray-900">Recording Complete</p>
                                                        <p className="text-sm text-gray-500">Duration: {formatTime(recordingTime)}</p>
                                                        <p className="text-sm text-gray-500">{formatFileSize(audioBlob.size)}</p>
                                                    </div>
                                                    
                                                    {/* Language Detection Result */}
                                                    {result && (
                                                        <div className="text-sm text-green-600 font-medium">
                                                            {(() => {
                                                                const languageCode = mapLanguageNameToCode(result.detected_language)
                                                                if (languageCode) {
                                                                    const nativeScript = getNativeScriptName(languageCode)
                                                                    return (
                                                                        <div className="space-y-1">
                                                                            <div>Language: {nativeScript}</div>
                                                                        </div>
                                                                    )
                                                                } else {
                                                                    return (
                                                                        <div className="space-y-1">
                                                                            <div>Language: {result.detected_language} (Unsupported)</div>
                                                                        </div>
                                                                    )
                                                                }
                                                            })()}
                                                        </div>
                                                    )}
                                                    
                                                    {/* Audio Player */}
                                                    {audioUrl && (
                                                        <div className="w-full">
                                                            <audio controls className="w-full">
                                                                <source src={audioUrl} type="audio/wav" />
                                                                Your browser does not support the audio element.
                                                            </audio>
                                                        </div>
                                                    )}
                                                    
                                                    <div className="flex space-x-3">
                                                        <button
                                                            onClick={clearRecording}
                                                            className="text-sm text-red-600 hover:text-red-800 font-medium"
                                                        >
                                                            Clear Recording
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-center">
                                                        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto transition-all duration-200 ${
                                                            isRecording 
                                                                ? 'bg-red-100 animate-pulse' 
                                                                : 'bg-gray-100'
                                                        }`}>
                                                            <svg className={`w-10 h-10 ${isRecording ? 'text-red-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className="text-lg font-medium text-gray-900">
                                                            {isRecording ? 'Recording...' : 'Ready to Record'}
                                                        </p>
                                                        {isRecording && (
                                                            <p className="text-sm text-gray-500">Duration: {formatTime(recordingTime)}</p>
                                                        )}
                                                        <p className="text-sm text-gray-500">
                                                            {isRecording ? 'Click stop to finish recording' : 'Click the microphone to start recording'}
                                                        </p>
                                                    </div>
                                                    
                                                    <button
                                                        onClick={isRecording ? stopRecording : startRecording}
                                                        className={`px-6 py-3 rounded-lg font-medium transition-colors text-sm ${
                                                            isRecording
                                                                ? 'bg-red-600 text-white hover:bg-red-700'
                                                                : 'bg-teal-600 text-white hover:bg-teal-700'
                                                        }`}
                                                    >
                                                        {isRecording ? 'Stop Recording' : 'Start Recording'}
                                                    </button>
                                                    
                                                </div>
                                            )}
                                        </div>

                                        {/* Transcribed Text Area */}
                                        {transcriptResult && (
                                            <div className="space-y-3">
                                                <div>
                                                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Transcribed Text</h3>
                                                    <p className="text-xs text-gray-500 mb-2">Automatically transcribed from your speech</p>
                                                </div>
                                                
                                                <div className="space-y-2">
                                                    <textarea
                                                        value={transcriptResult.transcript}
                                                        readOnly
                                                        className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-sm text-black"
                                                        rows={4}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* Translated Text Area */}
                                        {translationResult && (
                                            <div className="space-y-3">
                                                <div>
                                                    <h3 className="text-lg font-semibold text-gray-900 mb-1">English Translation</h3>
                                                    <p className="text-xs text-gray-500 mb-2">You can edit this text before generating the ISL video</p>
                                                </div>
                                                
                                                <div className="space-y-2">
                                                    <textarea
                                                        value={translatedText}
                                                        onChange={(e) => setTranslatedText(e.target.value)}
                                                        className="w-full p-3 border border-gray-300 rounded-lg bg-white text-sm text-black focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                                        rows={4}
                                                        placeholder="Edit the translated text if needed..."
                                                    />
                                                </div>
                                                
                                                {/* AI Model Selection */}
                                                <div className="space-y-3">
                                                    <div>
                                                        <h4 className="text-sm font-medium text-gray-900">AI Model Selection</h4>
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
                                                
                                                <button
                                                    onClick={handleGenerateISLVideo}
                                                    disabled={generatingVideo}
                                                    className="w-full px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                                                    ? 'Generated Indian Sign Language video will appear here'
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
                                                        src={videoPreviewUrl}
                                                        controls
                                                        className="w-full rounded-lg"
                                                        style={{ maxHeight: '400px' }}
                                                        onLoadedData={(e) => {
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
                                                                    onClick={() => handleVideoSpeedChange(speed)}
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
                                                        onClick={handleSaveISLVideo}
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
                                                        <p className="text-sm text-gray-500">Record speech and click "Generate ISL Video" to create your sign language video</p>
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

            {/* Progress Modal */}
            {showProgressModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                        <div className="text-center">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                {detecting ? 'Detecting Language' : transcribing ? 'Transcribing Speech' : translating ? 'Translating to English' : generatingVideo ? 'Generating ISL Video' : 'Processing...'}
                            </h3>
                            
                            {/* Progress Bar */}
                            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                                <div 
                                    className="bg-teal-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${progress.progress}%` }}
                                ></div>
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-4">{progress.step}</p>
                            
                            {progress.error && (
                                <div className="text-red-600 text-sm">
                                    {progress.error}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            <footer className="bg-white border-t border-gray-200 py-4 mt-12">
                <div className="max-w-6xl mx-auto px-6">
                    <p className="text-center text-sm text-gray-500">
                        SignSphere © 2025 All rights reserved. | Developed by Sundyne Technologies
                    </p>
                </div>
            </footer>
        </div>
    )
}