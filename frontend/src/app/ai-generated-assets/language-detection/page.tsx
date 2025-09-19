'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { appConfig } from '@/config/app-config'
import toast from 'react-hot-toast'
import { getApiUrl } from '@/utils/api-utils'

import DashboardLayout from '@/components/layouts/DashboardLayout'
interface LanguageDetectionResult {
    message: string
    filename: string
    file_size: number
    content_type: string
    detected_language: string
}

export default function LanguageDetectionPage() {
    const [user, setUser] = useState<any>(null)
    const [showProfileDropdown, setShowProfileDropdown] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [detecting, setDetecting] = useState(false)
    const [result, setResult] = useState<LanguageDetectionResult | null>(null)
    const [dragActive, setDragActive] = useState(false)

    const fileInputRef = useRef<HTMLInputElement>(null)

    const supportedFormats = [
        { name: 'WAV', mimeType: 'audio/wav', extension: '.wav' },
        { name: 'MP3', mimeType: 'audio/mp3', extension: '.mp3' },
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
            const apiUrl = getApiUrl()

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

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    return (
        <DashboardLayout activeMenuItem="language-detection">
            
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h1 className="text-2xl font-bold text-gray-900">Audio Language Detection</h1>
                        <p className="mt-2 text-gray-600">
                            Upload an audio file to detect the spoken language using AI
                        </p>
                    </div>

                    <div className="p-6">
                        {/* File Upload Area */}
                        <div
                            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                                dragActive
                                    ? 'border-indigo-500 bg-indigo-50'
                                    : selectedFile
                                    ? 'border-green-500 bg-green-50'
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
                                        onClick={() => {
                                            setSelectedFile(null)
                                            setResult(null)
                                            if (fileInputRef.current) {
                                                fileInputRef.current.value = ''
                                            }
                                        }}
                                        className="text-sm text-red-600 hover:text-red-800"
                                    >
                                        Remove file
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
                                        <p className="text-lg font-medium text-gray-900">
                                            Drop your audio file here, or{' '}
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="text-indigo-600 hover:text-indigo-500"
                                            >
                                                browse
                                            </button>
                                        </p>
                                        <p className="text-sm text-gray-500 mt-2">
                                            Supported formats: WAV, MP3, AIFF, AAC, OGG, FLAC (max 10MB)
                                        </p>
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

                        {/* Detect Button */}
                        <div className="mt-6">
                            <button
                                onClick={handleDetectLanguage}
                                disabled={!selectedFile || detecting}
                                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                                    !selectedFile || detecting
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                }`}
                            >
                                {detecting ? (
                                    <div className="flex items-center justify-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Detecting Language...
                                    </div>
                                ) : (
                                    'Detect Language'
                                )}
                            </button>
                        </div>

                        {/* Result */}
                        {result && (
                            <div className="mt-6 p-6 bg-green-50 border border-green-200 rounded-lg">
                                <div className="flex items-center">
                                    <svg className="w-6 h-6 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <h3 className="text-lg font-medium text-green-800">Detection Result</h3>
                                </div>
                                <div className="mt-4 space-y-2">
                                    <p className="text-sm text-green-700">
                                        <span className="font-medium">File:</span> {result.filename}
                                    </p>
                                    <p className="text-sm text-green-700">
                                        <span className="font-medium">Size:</span> {formatFileSize(result.file_size)}
                                    </p>
                                    <p className="text-sm text-green-700">
                                        <span className="font-medium">Format:</span> {result.content_type}
                                    </p>
                                    <p className="text-lg font-semibold text-green-800 mt-4">
                                        <span className="font-medium">Detected Language:</span> {result.detected_language}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Supported Formats Info */}
                        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                            <h3 className="text-sm font-medium text-gray-900 mb-3">Supported Audio Formats</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {supportedFormats.map((format) => (
                                    <div key={format.mimeType} className="flex items-center text-sm text-gray-600">
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
                </div>
                
        </DashboardLayout>
    )
}