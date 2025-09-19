'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { appConfig } from '@/config/app-config'
import toast from 'react-hot-toast'
import DashboardLayout from '@/components/layouts/DashboardLayout'

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
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [user, setUser] = useState<any>(null)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [dragActive, setDragActive] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [processingStep, setProcessingStep] = useState('')
    const [processingProgress, setProcessingProgress] = useState(0)
    const [languageDetectionResult, setLanguageDetectionResult] = useState<LanguageDetectionResult | null>(null)
    const [speechRecognitionResult, setSpeechRecognitionResult] = useState<SpeechRecognitionResult | null>(null)
    const [translationResult, setTranslationResult] = useState<TranslationResult | null>(null)
    const [islVideoUrl, setIslVideoUrl] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const checkAuthentication = async () => {
            const isLoggedIn = localStorage.getItem('isLoggedIn')
            const userData = localStorage.getItem('user')
            const accessToken = localStorage.getItem('accessToken')

            if (!isLoggedIn || !userData || !accessToken) {
                router.push('/login')
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
                    router.push('/login')
                }
            } catch (error) {
                console.error('Authentication check failed:', error)
                localStorage.removeItem('isLoggedIn')
                localStorage.removeItem('user')
                localStorage.removeItem('accessToken')
                router.push('/login')
            }
        }

        checkAuthentication()
    }, [router])

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
            if (file.type.startsWith('audio/')) {
                setSelectedFile(file)
                setError(null)
            } else {
                setError('Please select an audio file')
            }
        }
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            if (file.type.startsWith('audio/')) {
                setSelectedFile(file)
                setError(null)
            } else {
                setError('Please select an audio file')
            }
        }
    }

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const processAudioFile = async () => {
        if (!selectedFile) {
            toast.error('Please select an audio file first')
            return
        }

        setIsProcessing(true)
        setProcessingStep('Starting language detection...')
        setProcessingProgress(10)
        setError(null)

        try {
            const currentHost = window.location.hostname
            const apiUrl = currentHost === 'localhost'
                ? 'https://localhost:5001'
                : (process.env.NEXT_PUBLIC_API_URL || 'https://192.168.1.10:5001')

            // Step 1: Language Detection
            const formData = new FormData()
            formData.append('file', selectedFile)

            const languageResponse = await fetch(`${apiUrl}/api/v1/language-detection/detect-language`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                },
                body: formData,
            })

            if (!languageResponse.ok) {
                throw new Error('Language detection failed')
            }

            const languageResult: LanguageDetectionResult = await languageResponse.json()
            setLanguageDetectionResult(languageResult)
            setProcessingStep('Language detected, starting speech recognition...')
            setProcessingProgress(30)

            // Step 2: Speech Recognition
            const speechFormData = new FormData()
            speechFormData.append('file', selectedFile)
            speechFormData.append('language', languageResult.detected_language)

            const speechResponse = await fetch(`${apiUrl}/api/v1/speech-to-isl/recognize-speech`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                },
                body: speechFormData,
            })

            if (!speechResponse.ok) {
                throw new Error('Speech recognition failed')
            }

            const speechResult: SpeechRecognitionResult = await speechResponse.json()
            setSpeechRecognitionResult(speechResult)
            setProcessingStep('Speech recognized, translating to English...')
            setProcessingProgress(50)

            // Step 3: Translation (if needed)
            if (speechResult.language_code !== 'en') {
                const translationResponse = await fetch(`${apiUrl}/api/v1/translations/translate-text`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                    },
                    body: JSON.stringify({
                        text: speechResult.transcript,
                        source_language: speechResult.language_code,
                        target_language: 'en'
                    }),
                })

                if (translationResponse.ok) {
                    const translationResult: TranslationResult = await translationResponse.json()
                    setTranslationResult(translationResult)
                }
            }

            setProcessingStep('Generating ISL video...')
            setProcessingProgress(70)

            // Step 4: Generate ISL Video
            const islResponse = await fetch(`${apiUrl}/api/v1/text-to-isl/generate-video`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                },
                body: JSON.stringify({
                    text: translationResult?.translated_text || speechResult.transcript,
                    language: 'en'
                }),
            })

            if (!islResponse.ok) {
                throw new Error('ISL video generation failed')
            }

            const islResult = await islResponse.json()
            setIslVideoUrl(islResult.video_url)
            setProcessingStep('Processing complete!')
            setProcessingProgress(100)

            toast.success('Audio successfully converted to ISL video!')

        } catch (error) {
            console.error('Error processing audio:', error)
            setError(error instanceof Error ? error.message : 'An error occurred during processing')
            toast.error('Failed to process audio file')
        } finally {
            setIsProcessing(false)
        }
    }

    const resetProcess = () => {
        setSelectedFile(null)
        setLanguageDetectionResult(null)
        setSpeechRecognitionResult(null)
        setTranslationResult(null)
        setIslVideoUrl(null)
        setError(null)
        setProcessingStep('')
        setProcessingProgress(0)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
            </div>
        )
    }

    return (
        <DashboardLayout activeMenuItem="audio-to-isl">
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
                                            <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-lg font-medium text-gray-900">{selectedFile.name}</p>
                                            <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
                                            <p className="text-sm text-gray-500">{selectedFile.type}</p>
                                        </div>
                                        <button
                                            onClick={resetProcess}
                                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                                        >
                                            Remove File
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-center">
                                            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-lg font-medium text-gray-900">Drop your audio file here</p>
                                            <p className="text-sm text-gray-500">or click to browse</p>
                                        </div>
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                                        >
                                            Choose File
                                        </button>
                                    </div>
                                )}
                            </div>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="audio/*"
                                onChange={handleFileSelect}
                                className="hidden"
                            />

                            {error && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <p className="text-red-700 text-sm">{error}</p>
                                </div>
                            )}

                            <button
                                onClick={processAudioFile}
                                disabled={!selectedFile || isProcessing}
                                className={`w-full px-6 py-3 rounded-lg font-semibold transition-colors duration-200 ${
                                    !selectedFile || isProcessing
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : 'bg-teal-600 hover:bg-teal-700 text-white'
                                }`}
                            >
                                {isProcessing ? 'Processing...' : 'Convert to ISL Video'}
                            </button>
                        </div>

                        {/* Right Panel - Results */}
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900 mb-2">Processing Results</h2>
                                <p className="text-sm text-gray-600">View the results of your audio processing</p>
                            </div>

                            {/* Processing Progress */}
                            {isProcessing && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-blue-800">Processing</span>
                                        <span className="text-sm text-blue-600">{processingProgress}%</span>
                                    </div>
                                    <div className="w-full bg-blue-200 rounded-full h-2">
                                        <div
                                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${processingProgress}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-sm text-blue-700 mt-2">{processingStep}</p>
                                </div>
                            )}

                            {/* Language Detection Result */}
                            {languageDetectionResult && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <h3 className="font-medium text-green-800 mb-2">Language Detection</h3>
                                    <p className="text-sm text-green-700">
                                        <span className="font-medium">Detected Language:</span> {languageDetectionResult.detected_language}
                                    </p>
                                    <p className="text-sm text-green-700">
                                        <span className="font-medium">File:</span> {languageDetectionResult.filename}
                                    </p>
                                </div>
                            )}

                            {/* Speech Recognition Result */}
                            {speechRecognitionResult && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <h3 className="font-medium text-blue-800 mb-2">Speech Recognition</h3>
                                    <p className="text-sm text-blue-700 mb-2">
                                        <span className="font-medium">Transcript:</span>
                                    </p>
                                    <p className="text-sm text-blue-600 bg-blue-100 p-2 rounded">
                                        {speechRecognitionResult.transcript}
                                    </p>
                                    <div className="mt-2 text-xs text-blue-600">
                                        <span>Confidence: {Math.round(speechRecognitionResult.confidence * 100)}%</span>
                                        <span className="mx-2">•</span>
                                        <span>Duration: {speechRecognitionResult.duration}s</span>
                                        <span className="mx-2">•</span>
                                        <span>Words: {speechRecognitionResult.word_count}</span>
                                    </div>
                                </div>
                            )}

                            {/* Translation Result */}
                            {translationResult && (
                                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                    <h3 className="font-medium text-purple-800 mb-2">Translation</h3>
                                    <p className="text-sm text-purple-700 mb-2">
                                        <span className="font-medium">Original ({translationResult.source_language_code}):</span>
                                    </p>
                                    <p className="text-sm text-purple-600 bg-purple-100 p-2 rounded mb-2">
                                        {translationResult.original_text}
                                    </p>
                                    <p className="text-sm text-purple-700 mb-2">
                                        <span className="font-medium">Translated (English):</span>
                                    </p>
                                    <p className="text-sm text-purple-600 bg-purple-100 p-2 rounded">
                                        {translationResult.translated_text}
                                    </p>
                                </div>
                            )}

                            {/* ISL Video Result */}
                            {islVideoUrl && (
                                <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                                    <h3 className="font-medium text-teal-800 mb-2">ISL Video</h3>
                                    <div className="bg-black rounded-lg overflow-hidden">
                                        <video
                                            controls
                                            className="w-full h-auto"
                                            style={{ maxHeight: '300px' }}
                                        >
                                            <source src={islVideoUrl} type="video/mp4" />
                                            Your browser does not support the video tag.
                                        </video>
                                    </div>
                                    <div className="mt-3 flex space-x-2">
                                        <a
                                            href={islVideoUrl}
                                            download
                                            className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white text-sm rounded transition-colors"
                                        >
                                            Download Video
                                        </a>
                                        <button
                                            onClick={resetProcess}
                                            className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-colors"
                                        >
                                            Process Another
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}