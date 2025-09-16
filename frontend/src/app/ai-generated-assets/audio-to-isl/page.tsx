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

interface SpeechRecognitionResult {
    success: boolean
    transcript: string
    confidence: number
    language_code: string
    duration: number
    word_count: number
    word_time_offsets?: Array<{
        word: string
        start_time: number
        end_time: number
    }>
    cached: boolean
    audio_info?: {
        sample_rate: number
        duration: number
        file_extension: string
        encoding: string
        channels: number
        file_size: number
    }
}

interface TranslationResult {
    success: boolean
    original_text: string
    translated_text: string
    source_language_code: string
    target_language_code: string
    confidence?: number
    error?: string
}

export default function AudioToISLPage() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [showProfileDropdown, setShowProfileDropdown] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
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
    const [dragActive, setDragActive] = useState(false)
    const [showProgressModal, setShowProgressModal] = useState(false)
    const [progress, setProgress] = useState({
        step: '',
        progress: 0,
        isComplete: false,
        error: null as string | null
    })

    const fileInputRef = useRef<HTMLInputElement>(null)

    // Language name to code mapping (English + Native Scripts)
    const languageMapping: { [key: string]: string } = {
        // English variations
        'english': 'en-IN',
        'english (india)': 'en-IN',
        'english (indian)': 'en-IN',
        'inglish': 'en-IN',
        'angrezi': 'en-IN',
        'english language': 'en-IN',
        'indian english': 'en-IN',
        'hindi english': 'en-IN',
        
        // Hindi variations (English + Devanagari)
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
        
        // Marathi variations (English + Devanagari)
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
        
        // Gujarati variations (English + Gujarati Script + Devanagari Script)
        'gujarati': 'gu-IN',
        'gujarati (india)': 'gu-IN',
        'gujrati': 'gu-IN',
        'gujrati (india)': 'gu-IN',
        'gujarati language': 'gu-IN',
        'gujrati language': 'gu-IN',
        'gujarat': 'gu-IN',
        'gujarati (gujarat)': 'gu-IN',
        'gujrati (gujarat)': 'gu-IN',
        // Gujarati in Gujarati script
        'ગુજરાતી': 'gu-IN',
        'ગુજરાતી (ભારત)': 'gu-IN',
        'ગુજરાતી (ગુજરાત)': 'gu-IN',
        'ગુજરાતી ભાષા': 'gu-IN',
        // Gujarati in Devanagari script (common in language detection APIs)
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
        
        // Normalize the detected language (lowercase, trim, Unicode normalization)
        const normalizedLanguage = detectedLanguage.toLowerCase().trim().normalize('NFC')
        
        // Direct mapping
        if (languageMapping[normalizedLanguage]) {
            return languageMapping[normalizedLanguage]
        }
        
        // Try with different Unicode normalization forms
        const nfdForm = detectedLanguage.toLowerCase().trim().normalize('NFD')
        if (languageMapping[nfdForm]) {
            return languageMapping[nfdForm]
        }
        
        // Partial matching for more flexible detection
        for (const [key, code] of Object.entries(languageMapping)) {
            const normalizedKey = key.normalize('NFC')
            if (normalizedLanguage.includes(normalizedKey) || normalizedKey.includes(normalizedLanguage)) {
                return code
            }
        }
        
        // Additional partial matching with NFD form
        for (const [key, code] of Object.entries(languageMapping)) {
            const normalizedKey = key.normalize('NFD')
            if (nfdForm.includes(normalizedKey) || normalizedKey.includes(nfdForm)) {
                return code
            }
        }
        
        // If no mapping found, return null
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
        setTranscriptResult(null)
        
        // Automatically start language detection with the file directly
        setTimeout(() => {
            handleDetectLanguageWithFile(file)
        }, 500) // Small delay to show file selection first
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

    const handleDetectLanguageWithFile = async (file: File) => {
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
                { step: 'Uploading audio file...', progress: 20 },
                { step: 'Processing audio content...', progress: 40 },
                { step: 'Analyzing speech patterns...', progress: 60 },
                { step: 'Detecting language...', progress: 80 },
                { step: 'Finalizing results...', progress: 95 }
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

            const currentHost = window.location.hostname
            const apiUrl = currentHost === 'localhost'
                ? 'https://localhost:5001'
                : (process.env.NEXT_PUBLIC_API_URL || 'https://192.168.1.10:5001')

            const formData = new FormData()
            formData.append('file', file)

            const response = await fetch(`${apiUrl}/api/v1/language-detection/detect-language`, {
                method: 'POST',
                body: formData
            })

            if (response.ok) {
                const result = await response.json()
                setResult(result)
                
                // Complete progress
                setProgress(prev => ({
                    ...prev,
                    step: 'Language detected successfully!',
                    progress: 100,
                    isComplete: true
                }))

                // Wait a moment to show completion
                await new Promise(resolve => setTimeout(resolve, 1500))

                // Only proceed with speech recognition if language detection was successful
                if (result && result.detected_language) {
                    console.log(`Language detection successful: ${result.detected_language}`)
                    
                    // Map detected language name to language code
                    const languageCode = mapLanguageNameToCode(result.detected_language)
                    
                    if (languageCode) {
                        console.log(`✅ Mapped "${result.detected_language}" to language code: ${languageCode}`)
                        // Continue with speech recognition in the same modal (don't close modal yet)
                        setTimeout(() => {
                            handleSpeechRecognitionInModal(file, languageCode)
                        }, 1000)
                    } else {
                        console.log(`❌ No language code mapping found for: "${result.detected_language}"`)
                        console.log(`Available mappings:`, Object.keys(languageMapping))
                        // Close modal and show error
                        setShowProgressModal(false)
                        toast.error(`Unsupported language detected: ${result.detected_language}. Supported languages: English, Hindi, Marathi, Gujarati`)
                    }
                } else {
                    console.log('Language detection result is invalid, skipping speech recognition')
                    // Close modal and show error
                    setShowProgressModal(false)
                    toast.error('Language detection result is invalid')
                }
                
            } else {
                const error = await response.json()
                setProgress(prev => ({
                    ...prev,
                    step: 'Language detection failed',
                    error: error.detail || 'Language detection failed'
                }))
                toast.error(error.detail || 'Language detection failed')
                
                // Do NOT proceed with speech recognition if language detection failed
                console.log('Language detection failed, skipping speech recognition')
            }
        } catch (error) {
            console.error('Detection error:', error)
            setProgress(prev => ({
                ...prev,
                step: 'Network error occurred',
                error: 'Network error occurred'
            }))
            toast.error('Network error occurred')
        } finally {
            setDetecting(false)
        }
    }

    const handleSpeechRecognitionInModal = async (file: File, languageCode: string) => {
        // Validate that we have a valid language code before proceeding
        if (!languageCode || languageCode.trim() === '') {
            toast.error('Invalid language code for speech recognition')
            return
        }

        // Validate that the language code is one of our supported languages
        const supportedLanguages = ['en-IN', 'hi-IN', 'mr-IN', 'gu-IN']
        if (!supportedLanguages.includes(languageCode)) {
            console.log(`Unsupported language code: ${languageCode}. Supported: ${supportedLanguages.join(', ')}`)
            toast.error(`Unsupported language code: ${languageCode}. Supported: ${supportedLanguages.join(', ')}`)
            return
        }

        console.log(`Starting speech recognition for language: ${languageCode}`)

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
                { step: 'Preprocessing audio file...', progress: 20 },
                { step: 'Uploading to speech recognition service...', progress: 40 },
                { step: 'Processing speech patterns...', progress: 60 },
                { step: 'Transcribing audio to text...', progress: 80 },
                { step: 'Finalizing transcription...', progress: 95 }
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

            const currentHost = window.location.hostname
            const apiUrl = currentHost === 'localhost'
                ? 'https://localhost:5001'
                : (process.env.NEXT_PUBLIC_API_URL || 'https://192.168.1.10:5001')

            const formData = new FormData()
            formData.append('file', file)
            formData.append('language_code', languageCode)
            formData.append('enable_automatic_punctuation', 'true')
            formData.append('enable_word_time_offsets', 'true')

            const response = await fetch(`${apiUrl}/api/v1/speech-recognition/transcribe`, {
                method: 'POST',
                body: formData
            })

            if (response.ok) {
                const transcriptResult = await response.json()
                setTranscriptResult(transcriptResult)
                
                // Check if we need translation (skip if already English)
                if (languageCode === 'en-IN') {
                    // Skip translation for English, use transcribed text directly
                    setTranslatedText(transcriptResult.transcript)
                    setTranslationResult({
                        success: true,
                        original_text: transcriptResult.transcript,
                        translated_text: transcriptResult.transcript,
                        source_language_code: 'en-IN',
                        target_language_code: 'en-IN'
                    })
                    
                    // Complete progress
                    setProgress(prev => ({
                        ...prev,
                        step: 'Process completed successfully!',
                        progress: 100,
                        isComplete: true
                    }))

                    // Wait a moment to show completion
                    await new Promise(resolve => setTimeout(resolve, 1500))

                    // Close modal
                    setShowProgressModal(false)
                    toast.success('Audio processed successfully!')
                } else {
                    // Continue with translation for non-English languages
                    await handleTranslationInModal(transcriptResult.transcript, languageCode)
                }
            } else {
                const error = await response.json()
                setProgress(prev => ({
                    ...prev,
                    step: 'Speech recognition failed',
                    error: error.detail || 'Speech recognition failed'
                }))
                toast.error(error.detail || 'Speech recognition failed')
            }
        } catch (error) {
            console.error('Speech recognition error:', error)
            setProgress(prev => ({
                ...prev,
                step: 'Network error occurred',
                error: 'Network error occurred'
            }))
            toast.error('Network error occurred')
        } finally {
            setTranscribing(false)
        }
    }

    const handleTranslationInModal = async (text: string, sourceLanguageCode: string) => {
        console.log(`Starting translation: ${sourceLanguageCode} -> en-IN`)
        
        setTranslating(true)
        setProgress({
            step: 'Starting translation...',
            progress: 0,
            isComplete: false,
            error: null
        })

        try {
            // Simulate progress steps
            const progressSteps = [
                { step: 'Preparing text for translation...', progress: 20 },
                { step: 'Sending to translation service...', progress: 40 },
                { step: 'Processing translation...', progress: 60 },
                { step: 'Finalizing translation...', progress: 80 }
            ]

            // Simulate progress
            for (const step of progressSteps) {
                setProgress(prev => ({
                    ...prev,
                    step: step.step,
                    progress: step.progress
                }))
                await new Promise(resolve => setTimeout(resolve, 600))
            }

            const currentHost = window.location.hostname
            const apiUrl = currentHost === 'localhost'
                ? 'https://localhost:5001'
                : (process.env.NEXT_PUBLIC_API_URL || 'https://192.168.1.10:5001')

            const response = await fetch(`${apiUrl}/api/v1/text-translation/translate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: text,
                    source_language_code: sourceLanguageCode,
                    target_language_code: 'en-IN'
                })
            })

            if (response.ok) {
                const translationResult = await response.json()
                setTranslationResult(translationResult)
                setTranslatedText(translationResult.translated_text)
                
                // Complete progress
                setProgress(prev => ({
                    ...prev,
                    step: 'Translation completed successfully!',
                    progress: 100,
                    isComplete: true
                }))

                // Wait a moment to show completion
                await new Promise(resolve => setTimeout(resolve, 1500))

                // Close modal
                setShowProgressModal(false)
                toast.success('Audio processed and translated successfully!')
            } else {
                const error = await response.json()
                setProgress(prev => ({
                    ...prev,
                    step: 'Translation failed',
                    error: error.detail || 'Translation failed'
                }))
                toast.error(error.detail || 'Translation failed')
                // Don't close modal on translation failure - let user see the error
            }
        } catch (error) {
            console.error('Translation error:', error)
            setProgress(prev => ({
                ...prev,
                step: 'Network error occurred',
                error: 'Network error occurred'
            }))
            toast.error('Network error occurred')
        } finally {
            setTranslating(false)
        }
    }

    const handleDetectLanguage = async () => {
        if (!selectedFile) {
            toast.error('Please select an audio file')
            return
        }
        await handleDetectLanguageWithFile(selectedFile)
    }

    const handleGenerateISLVideo = async () => {
        if (!selectedFile || !result || !transcriptResult || !translationResult) {
            toast.error('Please complete audio processing first')
            return
        }

        if (!translatedText.trim()) {
            toast.error('Please provide English translation text')
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

            const currentHost = window.location.hostname
            const apiUrl = currentHost === 'localhost'
                ? 'https://localhost:5001'
                : (process.env.NEXT_PUBLIC_API_URL || 'https://192.168.1.10:5001')

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
        if (!videoGenerationResult) return
        
        try {
            const currentHost = window.location.hostname
            const apiUrl = currentHost === 'localhost'
                ? 'https://localhost:5001'
                : (process.env.NEXT_PUBLIC_API_URL || 'https://192.168.1.10:5001')

            const response = await fetch(`${apiUrl}/api/v1/isl-video-generation/save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    temp_video_id: videoGenerationResult.temp_video_id,
                    user_id: user?.id || 1
                })
            })

            if (response.ok) {
                const result = await response.json()
                setVideoSaved(true)
                toast.success('ISL video saved successfully!')
                console.log('Video saved:', result.final_video_url)
            } else {
                const error = await response.json()
                toast.error(error.detail || 'Failed to save video')
            }
        } catch (error) {
            console.error('Video save error:', error)
            toast.error('Network error occurred')
        }
    }

    const handleCleanupTempVideo = async (tempVideoId: string) => {
        try {
            const currentHost = window.location.hostname
            const apiUrl = currentHost === 'localhost'
                ? 'https://localhost:5001'
                : (process.env.NEXT_PUBLIC_API_URL || 'https://192.168.1.10:5001')

            const response = await fetch(`${apiUrl}/api/v1/isl-video-generation/cleanup/${tempVideoId}`, {
                method: 'DELETE'
            })

            if (response.ok) {
                console.log(`Temporary video ${tempVideoId} cleaned up successfully`)
            } else {
                console.warn(`Failed to cleanup temporary video ${tempVideoId}`)
            }
        } catch (error) {
            console.error('Cleanup error:', error)
        }
    }

    const handleVideoSpeedChange = (speed: number) => {
        setVideoSpeed(speed)
        // Apply speed to video element and restart playback
        const videoElement = document.querySelector('video') as HTMLVideoElement
        if (videoElement) {
            // Store current time to potentially resume from same position
            const currentTime = videoElement.currentTime
            const wasPlaying = !videoElement.paused
            
            // Set new playback rate
            videoElement.playbackRate = speed
            
            // Restart video from beginning with new speed
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
                            <Link href="/ai-generated-assets/audio-to-isl" className="flex items-center space-x-3 px-3 py-2 bg-teal-50 text-teal-700 rounded-lg">
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
                                {/* Two Panel Layout */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    
                                    {/* Left Panel - Audio Upload */}
                                    <div className="space-y-6">
                                        <div>
                                            <h2 className="text-xl font-semibold text-gray-900 mb-2">Audio Input</h2>
                                            <p className="text-sm text-gray-600">Upload your audio file to convert to ISL video</p>
                                        </div>
                                        
                                        {/* Audio Drop Zone */}
                                        <div
                                            className={`border-2 border-dashed rounded-xl p-4 text-center transition-all duration-200 ${
                                                dragActive
                                                    ? 'border-teal-500 bg-teal-50 scale-105'
                                                    : 'border-gray-300 hover:border-teal-400 hover:bg-gray-50'
                                            }`}
                                            onDragEnter={handleDrag}
                                            onDragLeave={handleDrag}
                                            onDragOver={handleDrag}
                                            onDrop={handleDrop}
                                        >
                                            {selectedFile ? (
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-center">
                                                        <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center">
                                                            <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className="text-lg font-medium text-gray-900">{selectedFile.name}</p>
                                                        <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
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
                                                                            <div className="text-xs text-gray-500">({result.detected_language})</div>
                                                                        </div>
                                                                    )
                                                                } else {
                                                                    return `Language: ${result.detected_language} (Unsupported)`
                                                                }
                                                            })()}
                                                        </div>
                                                    )}
                                                    
                                                    <button
                                                        onClick={async () => {
                                                            // Clean up temporary video if it exists
                                                            if (videoGenerationResult?.temp_video_id) {
                                                                await handleCleanupTempVideo(videoGenerationResult.temp_video_id)
                                                            }
                                                            
                                                            // Clear all state
                                                            setSelectedFile(null)
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
                                                        }}
                                                        className="text-sm text-red-600 hover:text-red-800 font-medium"
                                                    >
                                                        Remove file
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-center">
                                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                                                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className="text-lg font-medium text-gray-900">Drop your audio file here</p>
                                                        <p className="text-sm text-gray-500">or click to browse</p>
                                                    </div>
                                                    <button
                                                        onClick={() => fileInputRef.current?.click()}
                                                        className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm"
                                                    >
                                                        Choose Audio File
                                                    </button>
                                                    
                                                    {/* Supported Formats Info */}
                                                    <div className="text-xs text-gray-500 space-y-1">
                                                        <p className="font-medium">Supported formats:</p>
                                                        <p>WAV • MP3 • AIFF • AAC • OGG Vorbis • FLAC</p>
                                                        <p>Maximum file size: 10MB</p>
                                                    </div>
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

                                        {/* Transcribed Text Area */}
                                        {transcriptResult && (
                                            <div className="space-y-3">
                                                <div>
                                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Transcribed Text</h3>
                                                </div>
                                                
                                                <div className="space-y-2">
                                                    <textarea
                                                        value={transcriptResult.transcript}
                                                        readOnly
                                                        className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-gray-50 text-gray-700"
                                                        placeholder="Transcribed text will appear here..."
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* English Translation Text Area */}
                                        {translationResult && (
                                            <div className="space-y-3">
                                                <div>
                                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">English Translation</h3>
                                                </div>
                                                
                                                <div className="space-y-2">
                                                    <textarea
                                                        value={translatedText}
                                                        onChange={(e) => setTranslatedText(e.target.value)}
                                                        className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white text-gray-700"
                                                        placeholder="English translation will appear here..."
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* AI Model Selection */}
                                        {translationResult && (
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
                                        <div className="space-y-3">
                                            <button
                                                onClick={handleGenerateISLVideo}
                                                disabled={!selectedFile || !result || !transcriptResult || !translationResult || generatingVideo}
                                                className={`w-full px-4 py-3 rounded-lg font-medium transition-colors ${
                                                    !selectedFile || !result || !transcriptResult || !translationResult || generatingVideo
                                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                        : 'bg-teal-600 text-white hover:bg-teal-700'
                                                }`}
                                            >
                                                {generatingVideo ? 'Generating ISL Video...' : 'Generate ISL Video'}
                                            </button>
                                        </div>


                                    </div>

                                    {/* Right Panel - ISL Video Player */}
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
                                                        <p className="text-sm text-gray-500">Upload an audio file and click "Generate ISL Video" to create your sign language video</p>
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
                                {detecting ? 'Detecting Language' : transcribing ? 'Transcribing Audio' : translating ? 'Translating to English' : generatingVideo ? 'Generating ISL Video' : 'Processing...'}
                            </h3>
                            
                            {/* Progress Bar */}
                            <div className="mb-4">
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full transition-all duration-500 ${
                                            progress.isComplete
                                                ? 'bg-green-500'
                                                : progress.error
                                                    ? 'bg-red-500'
                                                    : detecting
                                                        ? 'bg-blue-500'
                                                        : transcribing
                                                            ? 'bg-purple-500'
                                                            : translating
                                                                ? 'bg-orange-500'
                                                                : generatingVideo
                                                                    ? 'bg-teal-500'
                                                                    : 'bg-gray-500'
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