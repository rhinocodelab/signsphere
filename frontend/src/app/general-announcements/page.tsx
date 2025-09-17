'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

// Create Announcement Form Component
interface CreateAnnouncementFormProps {
    onBack: () => void
    user: any
}

function CreateAnnouncementForm({ onBack, user }: CreateAnnouncementFormProps) {
    const [title, setTitle] = useState('')
    const [category, setCategory] = useState('')
    const [englishText, setEnglishText] = useState('')
    const [hindiText, setHindiText] = useState('')
    const [marathiText, setMarathiText] = useState('')
    const [gujaratiText, setGujaratiText] = useState('')
    const [selectedModel, setSelectedModel] = useState<'male' | 'female'>('male')
    const [isGenerating, setIsGenerating] = useState(false)
    const [islVideoUrl, setIslVideoUrl] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [generationProgress, setGenerationProgress] = useState<{
        step: string
        progress: number
    } | null>(null)
    const [showProgressModal, setShowProgressModal] = useState(false)
    const [progressType, setProgressType] = useState<'translation' | 'video'>('video')

    // Clear all fields function
    const handleClearAll = () => {
        setTitle('')
        setCategory('')
        setEnglishText('')
        setHindiText('')
        setMarathiText('')
        setGujaratiText('')
        setSelectedModel('male')
        setIslVideoUrl(null)
        setGenerationProgress(null)
        toast.success('All fields cleared successfully!')
    }

    // Available categories
    const categories = [
        'Arrival',
        'Departure', 
        'Delay',
        'Platform Change',
        'Safety',
        'Weather',
        'General Information',
        'Emergency',
        'Maintenance',
        'Other'
    ]

    const handleTranslate = async () => {
        if (!englishText.trim()) {
            return
        }

        setShowProgressModal(true)
        setProgressType('translation')
        setGenerationProgress({ step: 'Preparing translation...', progress: 10 })
        
        try {
            const currentHost = window.location.hostname
            const apiUrl = currentHost === 'localhost'
                ? 'https://localhost:5001'
                : (process.env.NEXT_PUBLIC_API_URL || 'https://192.168.1.10:5001')

            const accessToken = localStorage.getItem('accessToken')

            setGenerationProgress({ step: 'Sending request to translation service...', progress: 30 })

            const response = await fetch(`${apiUrl}/api/v1/general-announcements/translate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                    english_text: englishText
                })
            })

            if (response.ok) {
                setGenerationProgress({ step: 'Processing Hindi translation...', progress: 50 })
                await new Promise(resolve => setTimeout(resolve, 300)) // Simulate processing time

                setGenerationProgress({ step: 'Processing Marathi translation...', progress: 70 })
                await new Promise(resolve => setTimeout(resolve, 300)) // Simulate processing time

                setGenerationProgress({ step: 'Processing Gujarati translation...', progress: 90 })
                await new Promise(resolve => setTimeout(resolve, 300)) // Simulate processing time

                const result = await response.json()
                
                // Set all translations at once
                setHindiText(result.translations.hindi)
                setMarathiText(result.translations.marathi)
                setGujaratiText(result.translations.gujarati)

                setGenerationProgress({ step: 'Translation completed!', progress: 100 })
                await new Promise(resolve => setTimeout(resolve, 500)) // Show completion briefly
            } else {
                const errorData = await response.json().catch(() => ({ detail: 'Translation failed' }))
                throw new Error(errorData.detail || 'Failed to translate announcement')
            }
        } catch (error) {
            console.error('Translation error:', error)
            setGenerationProgress({ step: 'Translation failed', progress: 0 })
            await new Promise(resolve => setTimeout(resolve, 1000)) // Show error briefly
        } finally {
            setShowProgressModal(false)
            setGenerationProgress(null)
        }
    }

    const handleGenerateISL = async () => {
        if (!englishText.trim()) {
            return
        }

        setIsGenerating(true)
        setShowProgressModal(true)
        setProgressType('video')
        setGenerationProgress({ step: 'Preparing video generation...', progress: 10 })
        
        try {
            const currentHost = window.location.hostname
            const apiUrl = currentHost === 'localhost'
                ? 'https://localhost:5001'
                : (process.env.NEXT_PUBLIC_API_URL || 'https://192.168.1.10:5001')

            console.log('Generating ISL video for text:', englishText)
            console.log('Using model:', selectedModel)
            console.log('API URL:', apiUrl)

            setGenerationProgress({ step: 'Sending request to server...', progress: 20 })

            const response = await fetch(`${apiUrl}/api/v1/isl-video-generation/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: englishText,
                    model: selectedModel,
                    user_id: user?.id || 1
                })
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.detail || `Video generation failed: ${response.statusText}`)
            }

            setGenerationProgress({ step: 'Parsing text into signs...', progress: 40 })
            await new Promise(resolve => setTimeout(resolve, 500)) // Simulate processing time

            setGenerationProgress({ step: 'Finding video files for signs...', progress: 60 })
            await new Promise(resolve => setTimeout(resolve, 500)) // Simulate processing time

            setGenerationProgress({ step: 'Stitching video files together...', progress: 80 })

            const result = await response.json()
            console.log('ISL video generation result:', result)

            if (result.success) {
                setGenerationProgress({ step: 'Finalizing video...', progress: 90 })
                
                // Set the preview URL for the generated video
                const previewUrl = `${apiUrl}${result.preview_url}`
                setIslVideoUrl(previewUrl)
                
                setGenerationProgress({ step: 'Video generation complete!', progress: 100 })
                await new Promise(resolve => setTimeout(resolve, 500)) // Show completion briefly
                
                // Auto-play the video after generation
                setTimeout(() => {
                    const videoElement = document.querySelector('video') as HTMLVideoElement
                    if (videoElement) {
                        videoElement.play().catch(console.error)
                    }
                }, 100)
            } else {
                throw new Error(result.error || 'Video generation failed')
            }

        } catch (error) {
            console.error('ISL video generation error:', error)
            setGenerationProgress({ step: 'Video generation failed', progress: 0 })
            await new Promise(resolve => setTimeout(resolve, 1000)) // Show error briefly
        } finally {
            setIsGenerating(false)
            setGenerationProgress(null)
            setShowProgressModal(false)
        }
    }

    const handleSave = async () => {
        if (!title.trim() || !category || !englishText.trim()) {
            return
        }

        setIsSaving(true)
        
        try {
            const currentHost = window.location.hostname
            const apiUrl = currentHost === 'localhost'
                ? 'https://localhost:5001'
                : (process.env.NEXT_PUBLIC_API_URL || 'https://192.168.1.10:5001')

            const accessToken = localStorage.getItem('accessToken')

            console.log('Saving announcement with data:', {
                title,
                category,
                englishText,
                hasVideo: !!islVideoUrl,
                videoUrl: islVideoUrl
            })

            const response = await fetch(`${apiUrl}/api/v1/general-announcements/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                    title: title,
                    category: category,
                    english_content: englishText,
                    hindi_content: hindiText || null,
                    marathi_content: marathiText || null,
                    gujarati_content: gujaratiText || null,
                    ai_model_type: selectedModel,
                    isl_video_path: islVideoUrl || null,
                    audio_path: null
                })
            })

            if (response.ok) {
                const savedAnnouncement = await response.json()
                console.log('Announcement saved:', savedAnnouncement)
                onBack() // This will now refresh the announcements list
            } else {
                const errorData = await response.json().catch(() => ({ detail: 'Save failed' }))
                console.error('Save failed:', errorData.detail || 'Failed to save announcement')
            }
        } catch (error) {
            console.error('Save error:', error)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6">
                {/* Two Panel Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* Left Panel - Form Inputs */}
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-2">Create New Announcement</h2>
                            <p className="text-sm text-gray-600">Enter your announcement details and generate ISL video</p>
                        </div>
                
                {/* Title Input */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Announcement Title *
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter announcement title..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900"
                    />
                </div>

                {/* Category Selection */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category *
                    </label>
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900"
                    >
                        <option value="" className="text-gray-900">Select a category...</option>
                        {categories.map((cat) => (
                            <option key={cat} value={cat} className="text-gray-900">
                                {cat}
                            </option>
                        ))}
                    </select>
                </div>
                
                {/* English Text Area */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        English Announcement *
                    </label>
                    <textarea
                        value={englishText}
                        onChange={(e) => setEnglishText(e.target.value)}
                        placeholder="Enter your announcement in English..."
                        className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none text-gray-900"
                    />
                </div>

                {/* Translation Button */}
                <div className="mb-6">
                    <button
                        onClick={handleTranslate}
                        disabled={!englishText.trim()}
                        className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                        </svg>
                        <span>Translate</span>
                    </button>
                </div>

                {/* Translation Results */}
                {(hindiText || marathiText || gujaratiText) && (
                    <div className="mb-6 space-y-4">
                        <h3 className="text-sm font-medium text-gray-700">Translation Results</h3>
                        
                        <div>
                            <label className="block text-xs font-medium text-orange-600 mb-1">Hindi (हिंदी)</label>
                            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-gray-800">
                                {hindiText || 'Translation not available'}
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-xs font-medium text-blue-600 mb-1">Marathi (मराठी)</label>
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-gray-800">
                                {marathiText || 'Translation not available'}
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-xs font-medium text-green-600 mb-1">Gujarati (ગુજરાતી)</label>
                            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-gray-800">
                                {gujaratiText || 'Translation not available'}
                            </div>
                        </div>
                    </div>
                )}

                {/* AI Model Selection */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                        AI Model Selection
                    </label>
                    <div className="flex space-x-4">
                        <label className="flex items-center">
                            <input
                                type="radio"
                                name="model"
                                value="male"
                                checked={selectedModel === 'male'}
                                onChange={(e) => setSelectedModel(e.target.value as 'male')}
                                className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300"
                            />
                            <span className="ml-2 text-sm text-gray-700">Male Model</span>
                        </label>
                        <label className="flex items-center">
                            <input
                                type="radio"
                                name="model"
                                value="female"
                                checked={selectedModel === 'female'}
                                onChange={(e) => setSelectedModel(e.target.value as 'female')}
                                className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300"
                            />
                            <span className="ml-2 text-sm text-gray-700">Female Model</span>
                        </label>
                    </div>
                </div>

                {/* Generate ISL Video Button */}
                <div className="mb-6">
                    <button
                        onClick={handleGenerateISL}
                        disabled={isGenerating || !englishText.trim()}
                        className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                    >
                        {isGenerating ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                <span>Generating ISL Video...</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                <span>Generate ISL Video</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

                    {/* Right Panel - Video Preview */}
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-2">ISL Video Preview</h2>
                            <p className="text-sm text-gray-600">
                                {islVideoUrl 
                                    ? 'Generated Indian Sign Language video is ready for preview'
                                    : 'Generated Indian Sign Language video will appear here'
                                }
                            </p>
                        </div>
                
                        {/* Video Player Area */}
                        {islVideoUrl ? (
                            <div className="space-y-4">
                                {/* Video Player */}
                                <div className="bg-white border border-gray-200 rounded-lg p-4">
                                    <video
                                        src={islVideoUrl}
                                        controls
                                        className="w-full rounded-lg"
                                        style={{ maxHeight: '400px' }}
                                    />
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
                                        <p className="text-sm text-gray-500">Enter your announcement text and click "Generate ISL Video" to create your sign language video</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex space-x-3">
                            <button
                                onClick={onBack}
                                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleClearAll}
                                className="flex-1 px-4 py-2 text-gray-700 bg-yellow-100 hover:bg-yellow-200 rounded-lg transition-colors duration-200"
                            >
                                Clear All
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving || !title.trim() || !category || !englishText.trim()}
                                className="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors duration-200"
                            >
                                {isSaving ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Progress Modal */}
                {showProgressModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-teal-600 mx-auto mb-6"></div>
                                
                                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                                    {progressType === 'translation' ? 'Translating Text' : 'Generating ISL Video'}
                                </h3>
                                
                                <p className="text-gray-600 mb-6">
                                    {generationProgress?.step || 'Processing...'}
                                </p>
                                
                                {/* Progress Bar */}
                                <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                                    <div 
                                        className="bg-teal-600 h-3 rounded-full transition-all duration-500 ease-out"
                                        style={{ width: `${generationProgress?.progress || 0}%` }}
                                    ></div>
                                </div>
                                
                                <p className="text-sm text-gray-500">
                                    {generationProgress?.progress || 0}% Complete
                                </p>
                                
                                {/* Progress Steps */}
                                <div className="mt-6 text-left">
                                    <div className="space-y-2 text-sm">
                                        {progressType === 'translation' ? (
                                            <>
                                                <div className={`flex items-center ${(generationProgress?.progress || 0) >= 10 ? 'text-teal-600' : 'text-gray-400'}`}>
                                                    <div className={`w-2 h-2 rounded-full mr-3 ${(generationProgress?.progress || 0) >= 10 ? 'bg-teal-600' : 'bg-gray-300'}`}></div>
                                                    Preparing translation...
                                                </div>
                                                <div className={`flex items-center ${(generationProgress?.progress || 0) >= 30 ? 'text-teal-600' : 'text-gray-400'}`}>
                                                    <div className={`w-2 h-2 rounded-full mr-3 ${(generationProgress?.progress || 0) >= 30 ? 'bg-teal-600' : 'bg-gray-300'}`}></div>
                                                    Sending request to translation service...
                                                </div>
                                                <div className={`flex items-center ${(generationProgress?.progress || 0) >= 50 ? 'text-teal-600' : 'text-gray-400'}`}>
                                                    <div className={`w-2 h-2 rounded-full mr-3 ${(generationProgress?.progress || 0) >= 50 ? 'bg-teal-600' : 'bg-gray-300'}`}></div>
                                                    Processing Hindi translation...
                                                </div>
                                                <div className={`flex items-center ${(generationProgress?.progress || 0) >= 70 ? 'text-teal-600' : 'text-gray-400'}`}>
                                                    <div className={`w-2 h-2 rounded-full mr-3 ${(generationProgress?.progress || 0) >= 70 ? 'bg-teal-600' : 'bg-gray-300'}`}></div>
                                                    Processing Marathi translation...
                                                </div>
                                                <div className={`flex items-center ${(generationProgress?.progress || 0) >= 90 ? 'text-teal-600' : 'text-gray-400'}`}>
                                                    <div className={`w-2 h-2 rounded-full mr-3 ${(generationProgress?.progress || 0) >= 90 ? 'bg-teal-600' : 'bg-gray-300'}`}></div>
                                                    Processing Gujarati translation...
                                                </div>
                                                <div className={`flex items-center ${(generationProgress?.progress || 0) >= 100 ? 'text-teal-600' : 'text-gray-400'}`}>
                                                    <div className={`w-2 h-2 rounded-full mr-3 ${(generationProgress?.progress || 0) >= 100 ? 'bg-teal-600' : 'bg-gray-300'}`}></div>
                                                    Translation completed!
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className={`flex items-center ${(generationProgress?.progress || 0) >= 10 ? 'text-teal-600' : 'text-gray-400'}`}>
                                                    <div className={`w-2 h-2 rounded-full mr-3 ${(generationProgress?.progress || 0) >= 10 ? 'bg-teal-600' : 'bg-gray-300'}`}></div>
                                                    Preparing video generation...
                                                </div>
                                                <div className={`flex items-center ${(generationProgress?.progress || 0) >= 20 ? 'text-teal-600' : 'text-gray-400'}`}>
                                                    <div className={`w-2 h-2 rounded-full mr-3 ${(generationProgress?.progress || 0) >= 20 ? 'bg-teal-600' : 'bg-gray-300'}`}></div>
                                                    Sending request to server...
                                                </div>
                                                <div className={`flex items-center ${(generationProgress?.progress || 0) >= 40 ? 'text-teal-600' : 'text-gray-400'}`}>
                                                    <div className={`w-2 h-2 rounded-full mr-3 ${(generationProgress?.progress || 0) >= 40 ? 'bg-teal-600' : 'bg-gray-300'}`}></div>
                                                    Parsing text into signs...
                                                </div>
                                                <div className={`flex items-center ${(generationProgress?.progress || 0) >= 60 ? 'text-teal-600' : 'text-gray-400'}`}>
                                                    <div className={`w-2 h-2 rounded-full mr-3 ${(generationProgress?.progress || 0) >= 60 ? 'bg-teal-600' : 'bg-gray-300'}`}></div>
                                                    Finding video files for signs...
                                                </div>
                                                <div className={`flex items-center ${(generationProgress?.progress || 0) >= 80 ? 'text-teal-600' : 'text-gray-400'}`}>
                                                    <div className={`w-2 h-2 rounded-full mr-3 ${(generationProgress?.progress || 0) >= 80 ? 'bg-teal-600' : 'bg-gray-300'}`}></div>
                                                    Stitching video files together...
                                                </div>
                                                <div className={`flex items-center ${(generationProgress?.progress || 0) >= 100 ? 'text-teal-600' : 'text-gray-400'}`}>
                                                    <div className={`w-2 h-2 rounded-full mr-3 ${(generationProgress?.progress || 0) >= 100 ? 'bg-teal-600' : 'bg-gray-300'}`}></div>
                                                    Finalizing video...
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

interface GeneralAnnouncement {
    id: number
    title: string
    english_content: string
    hindi_content?: string
    marathi_content?: string
    gujarati_content?: string
    category: string
    ai_model_type: string
    isl_video_path?: string
    audio_path?: string
    is_active: boolean
    is_translated: boolean
    created_at: string
    updated_at?: string
    created_by_id: number
    creator_username?: string
    creator_full_name?: string
}

export default function GeneralAnnouncementsPage() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [showProfileDropdown, setShowProfileDropdown] = useState(false)
    const [announcements, setAnnouncements] = useState<GeneralAnnouncement[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [filteredAnnouncements, setFilteredAnnouncements] = useState<GeneralAnnouncement[]>([])
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage] = useState(10)
    const [showCreateForm, setShowCreateForm] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [deletingAnnouncement, setDeletingAnnouncement] = useState(false)
    const [announcementToDelete, setAnnouncementToDelete] = useState<{ id: number, title: string } | null>(null)
    const [showViewModal, setShowViewModal] = useState(false)
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<GeneralAnnouncement | null>(null)

    // Mock data for demonstration - will be replaced with actual API calls
    const mockAnnouncements: GeneralAnnouncement[] = [
        {
            id: 1,
            title: "Train Arrival Announcement",
            english_content: "Train 12345 Mumbai Express is arriving at platform 2. Please stand behind the yellow line.",
            hindi_content: "ट्रेन 12345 मुंबई एक्सप्रेस प्लेटफॉर्म 2 पर आ रही है। कृपया पीली रेखा के पीछे खड़े रहें।",
            marathi_content: "ट्रेन 12345 मुंबई एक्सप्रेस प्लॅटफॉर्म 2 वर येत आहे. कृपया पिवळ्या रेषेच्या मागे उभे रहा.",
            gujarati_content: "ટ્રેન 12345 મુંબઈ એક્સપ્રેસ પ્લેટફોર્મ 2 પર આવી રહી છે. કૃપા કરીને પીળી રેખાની પાછળ ઊભા રહો.",
            category: "Arrival",
            ai_model_type: "female",
            isl_video_path: "/videos/isl-general-announcements/announcement_1_sample.mp4",
            audio_path: undefined,
            is_active: true,
            is_translated: true,
            created_at: "2024-01-15T10:30:00Z",
            updated_at: "2024-01-15T10:35:00Z",
            created_by_id: 1,
            creator_username: "admin",
            creator_full_name: "Administrator"
        },
        {
            id: 2,
            title: "Delay Information",
            english_content: "Train 67890 Delhi Express is delayed by 15 minutes due to technical reasons. We apologize for the inconvenience.",
            hindi_content: "ट्रेन 67890 दिल्ली एक्सप्रेस तकनीकी कारणों से 15 मिनट देरी से चल रही है। असुविधा के लिए हम क्षमा चाहते हैं।",
            marathi_content: "ट्रेन 67890 दिल्ली एक्सप्रेस तांत्रिक कारणांमुळे 15 मिनिटे उशीरा चालत आहे. गैरसोयीसाठी आम्ही क्षमा मागतो.",
            gujarati_content: "ટ્રેન 67890 દિલ્હી એક્સપ્રેસ તકનીકી કારણોસર 15 મિનિટ વિલંબથી ચાલી રહી છે. અસુવિધા માટે અમે માફી માંગીએ છીએ.",
            category: "Delay",
            ai_model_type: "male",
            isl_video_path: undefined,
            audio_path: undefined,
            is_active: true,
            is_translated: true,
            created_at: "2024-01-15T11:15:00Z",
            updated_at: "2024-01-15T11:20:00Z",
            created_by_id: 1,
            creator_username: "admin",
            creator_full_name: "Administrator"
        },
        {
            id: 3,
            title: "Platform Change Notice",
            english_content: "Train 11111 Chennai Express will now depart from platform 5 instead of platform 3. Please proceed to platform 5.",
            hindi_content: "ट्रेन 11111 चेन्नई एक्सप्रेस अब प्लेटफॉर्म 3 के बजाय प्लेटफॉर्म 5 से रवाना होगी। कृपया प्लेटफॉर्म 5 पर जाएं।",
            marathi_content: "ट्रेन 11111 चेन्नई एक्सप्रेस आता प्लॅटफॉर्म 3 ऐवजी प्लॅटफॉर्म 5 वरून निघेल. कृपया प्लॅटफॉर्म 5 वर जा.",
            gujarati_content: "ટ્રેન 11111 ચેન્નઈ એક્સપ્રેસ હવે પ્લેટફોર્મ 3 ને બદલે પ્લેટફોર્મ 5 થી નીકળશે. કૃપા કરીને પ્લેટફોર્મ 5 પર જાઓ.",
            category: "Platform Change",
            ai_model_type: "female",
            isl_video_path: "/videos/isl-general-announcements/announcement_3_sample.mp4",
            audio_path: undefined,
            is_active: true,
            is_translated: true,
            created_at: "2024-01-15T12:00:00Z",
            created_by_id: 1,
            creator_username: "admin",
            creator_full_name: "Administrator"
        },
        {
            id: 4,
            title: "Safety Reminder",
            english_content: "Please maintain social distancing and wear masks at all times. Keep your belongings safe.",
            hindi_content: "कृपया सामाजिक दूरी बनाए रखें और हमेशा मास्क पहनें। अपने सामान को सुरक्षित रखें।",
            marathi_content: "कृपया सामाजिक अंतर राखा आणि नेहमी मास्क वापरा. तुमचे सामान सुरक्षित ठेवा.",
            gujarati_content: "કૃપા કરીને સામાજિક અંતર જાળવો અને હંમેશા માસ્ક પહેરો. તમારા સામાનને સુરક્ષિત રાખો.",
            category: "Safety",
            ai_model_type: "male",
            isl_video_path: undefined,
            audio_path: undefined,
            is_active: true,
            is_translated: true,
            created_at: "2024-01-15T13:30:00Z",
            updated_at: "2024-01-15T13:35:00Z",
            created_by_id: 1,
            creator_username: "admin",
            creator_full_name: "Administrator"
        },
        {
            id: 5,
            title: "Weather Alert",
            english_content: "Heavy rainfall expected. Please be careful while walking on platforms and use covered areas.",
            hindi_content: "भारी बारिश की संभावना है। कृपया प्लेटफॉर्म पर चलते समय सावधान रहें और ढके हुए क्षेत्रों का उपयोग करें।",
            marathi_content: "जोरदार पाऊस अपेक्षित आहे. कृपया प्लॅटफॉर्मवर चालताना सावधान रहा आणि झाकलेल्या भागांचा वापर करा.",
            gujarati_content: "ભારે વરસાદની અપેક્ષા છે. કૃપા કરીને પ્લેટફોર્મ પર ચાલતી વખતે સાવધાન રહો અને ઢંકાયેલા વિસ્તારોનો ઉપયોગ કરો.",
            category: "Weather",
            ai_model_type: "female",
            isl_video_path: "/videos/isl-general-announcements/announcement_5_sample.mp4",
            audio_path: undefined,
            is_active: true,
            is_translated: true,
            created_at: "2024-01-14T16:45:00Z",
            updated_at: "2024-01-14T16:50:00Z",
            created_by_id: 1,
            creator_username: "admin",
            creator_full_name: "Administrator"
        }
    ]

    // Authentication check
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const userData = localStorage.getItem('user')
                const accessToken = localStorage.getItem('accessToken')

                if (!userData || !accessToken) {
                    router.push('/login')
                    return
                }

                const user = JSON.parse(userData)
                setUser(user)

                // Test token validity
                const currentHost = window.location.hostname
                const apiUrl = currentHost === 'localhost'
                    ? 'https://localhost:5001'
                    : (process.env.NEXT_PUBLIC_API_URL || 'https://192.168.1.10:5001')

                const response = await fetch(`${apiUrl}/api/v1/auth/me`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                    },
                })

                if (!response.ok) {
                    throw new Error('Token invalid')
                }

            } catch (error) {
                console.error('Auth check failed:', error)
                toast.error('Authentication failed. Please login again.')
                localStorage.clear()
                router.push('/login')
            }
        }

        checkAuth()
    }, [router])

    // Load announcements from API
    useEffect(() => {
        if (user) {
            fetchAnnouncements()
        }
    }, [user])

    const fetchAnnouncements = async () => {
        try {
            const currentHost = window.location.hostname
            const apiUrl = currentHost === 'localhost'
                ? 'https://localhost:5001'
                : (process.env.NEXT_PUBLIC_API_URL || 'https://192.168.1.10:5001')

            const accessToken = localStorage.getItem('accessToken')

            const response = await fetch(`${apiUrl}/api/v1/general-announcements/`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            })

            if (response.ok) {
                const data = await response.json()
                setAnnouncements(data)
                setFilteredAnnouncements(data)
            } else {
                // Silently handle fetch errors - don't show toast
                console.error('Failed to fetch announcements:', response.status)
                setAnnouncements([])
                setFilteredAnnouncements([])
            }
        } catch (error) {
            // Silently handle network errors - don't show toast
            console.error('Error fetching announcements:', error)
            setAnnouncements([])
            setFilteredAnnouncements([])
        } finally {
            setLoading(false)
        }
    }

    // Filter announcements based on search query
    useEffect(() => {
        let filtered = announcements

        // Search filter
        if (searchQuery.trim()) {
            filtered = filtered.filter(announcement =>
                announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                announcement.english_content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                announcement.category.toLowerCase().includes(searchQuery.toLowerCase())
            )
        }

        setFilteredAnnouncements(filtered)
        setCurrentPage(1) // Reset to first page when filters change
    }, [searchQuery, announcements])

    // Calculate pagination
    const totalPages = Math.ceil(filteredAnnouncements.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const currentAnnouncements = filteredAnnouncements.slice(startIndex, endIndex)


    // Pagination handlers
    const goToPage = (page: number) => {
        setCurrentPage(page)
    }

    const goToPreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1)
        }
    }

    const goToNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1)
        }
    }

    const handleLogout = () => {
        toast.success('Signed out successfully')
        localStorage.removeItem('isLoggedIn')
        localStorage.removeItem('user')
        localStorage.removeItem('accessToken')
        localStorage.removeItem('tokenType')
        router.push('/login')
    }

    // Handle view announcement
    const handleViewAnnouncement = (announcement: GeneralAnnouncement) => {
        setSelectedAnnouncement(announcement)
        setShowViewModal(true)
    }

    // Handle delete announcement confirmation
    const handleDeleteAnnouncement = (announcementId: number, title: string) => {
        setAnnouncementToDelete({ id: announcementId, title })
        setShowDeleteModal(true)
    }

    // Handle actual delete operation
    const confirmDeleteAnnouncement = async () => {
        if (!announcementToDelete) return

        setDeletingAnnouncement(true)

        try {
            const currentHost = window.location.hostname
            const apiUrl = currentHost === 'localhost'
                ? 'https://localhost:5001'
                : (process.env.NEXT_PUBLIC_API_URL || 'https://192.168.1.10:5001')

            const accessToken = localStorage.getItem('accessToken')

            const response = await fetch(`${apiUrl}/api/v1/general-announcements/${announcementToDelete.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            })

            if (response.ok) {
                // Remove the announcement from the current lists
                setAnnouncements(prev => prev.filter(announcement => announcement.id !== announcementToDelete.id))
                setFilteredAnnouncements(prev => prev.filter(announcement => announcement.id !== announcementToDelete.id))

                console.log(`Announcement "${announcementToDelete.title}" deleted successfully!`)

                // Close modal and reset state
                setShowDeleteModal(false)
                setAnnouncementToDelete(null)
            } else {
                const errorData = await response.json().catch(() => ({ detail: 'Delete failed' }))
                console.error('Delete failed:', errorData.detail || 'Failed to delete announcement')
            }
        } catch (error) {
            console.error('Error deleting announcement:', error)
        } finally {
            setDeletingAnnouncement(false)
        }
    }

    // Handle cancel delete
    const cancelDeleteAnnouncement = () => {
        setShowDeleteModal(false)
        setAnnouncementToDelete(null)
    }

    // Handle close view modal
    const closeViewModal = () => {
        setShowViewModal(false)
        setSelectedAnnouncement(null)
    }


    // Format date
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as Element
        if (!target.closest('.profile-dropdown')) {
            setShowProfileDropdown(false)
        }
    }

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Fixed Header */}
            <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-40">
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
                                    {user?.username?.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <span className="text-gray-700 font-medium">{user?.username}</span>
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {showProfileDropdown && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                                <div className="px-4 py-2 border-b border-gray-100">
                                    <p className="text-sm font-medium text-gray-900">{user?.full_name}</p>
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
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
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
                            <Link href="/general-announcements" className="flex items-center space-x-3 px-3 py-2 bg-teal-50 text-teal-700 rounded-lg">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                                </svg>
                                <span>General Announcements</span>
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
                    <div className="max-w-7xl mx-auto">
                        {/* Page Header */}
                        <div className="mb-8 pt-4">
                            {!showCreateForm ? (
                                <>
                                    <h1 className="text-3xl font-bold text-gray-900 mb-2">General Announcements</h1>
                                    <p className="text-gray-600">Manage and view all saved general announcements</p>
                                </>
                            ) : (
                                <div className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
                                    <button
                                        onClick={() => setShowCreateForm(false)}
                                        className="hover:text-gray-700 transition-colors"
                                    >
                                        General Announcements
                                    </button>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                    <span className="text-gray-900 font-medium">Create New Announcement</span>
                                </div>
                            )}
                        </div>

                        {!showCreateForm ? (
                            /* Announcements Table with Search and Filters */
                            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                            {/* Search and Filters Bar */}
                            <div className="p-6 border-b border-gray-200">
                                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                    {/* Search */}
                                    <div className="flex-1 max-w-md">
                                        <div className="relative">
                                            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                            <input
                                                type="text"
                                                placeholder="Search announcements..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900"
                                            />
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        {/* Create Button */}
                                        <button
                                            onClick={() => setShowCreateForm(true)}
                                            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors duration-200"
                                        >
                                            Create New Announcement
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Table */}
                            {loading ? (
                                <div className="p-8 text-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
                                    <p className="mt-2 text-gray-500">Loading announcements...</p>
                                </div>
                            ) : filteredAnnouncements.length === 0 ? (
                                <div className="p-8 text-center">
                                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                                    </svg>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No announcements found</h3>
                                    <p className="text-gray-500">No announcements match your current search and filter criteria.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Title
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Category
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Created
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {currentAnnouncements.map((announcement) => (
                                                <tr key={announcement.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm font-medium text-gray-900 max-w-xs">
                                                            {announcement.title}
                                                        </div>
                                                        <div className="text-sm text-gray-500 max-w-xs truncate">
                                                            {announcement.english_content}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                            {announcement.category}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {formatDate(announcement.created_at)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <div className="flex items-center space-x-2">
                                                            <button
                                                                onClick={() => handleViewAnnouncement(announcement)}
                                                                className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded transition-colors"
                                                                title="View Details"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                                </svg>
                                                            </button>
                                                            <button
                                                                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded transition-colors"
                                                                title="Edit"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                </svg>
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteAnnouncement(announcement.id, announcement.title)}
                                                                className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-colors"
                                                                title="Delete"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Pagination */}
                            {filteredAnnouncements.length > 0 && (
                                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                                    <div className="flex-1 flex justify-between sm:hidden">
                                        <button
                                            onClick={goToPreviousPage}
                                            disabled={currentPage === 1}
                                            className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${currentPage === 1
                                                ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                                                : 'text-gray-700 bg-white hover:bg-gray-50'
                                                }`}
                                        >
                                            Previous
                                        </button>
                                        <button
                                            onClick={goToNextPage}
                                            disabled={currentPage === totalPages}
                                            className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${currentPage === totalPages
                                                ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                                                : 'text-gray-700 bg-white hover:bg-gray-50'
                                                }`}
                                        >
                                            Next
                                        </button>
                                    </div>
                                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                        <div>
                                            <p className="text-sm text-gray-700">
                                                Showing <span className="font-medium">{startIndex + 1}</span> to <span className="font-medium">{Math.min(endIndex, filteredAnnouncements.length)}</span> of <span className="font-medium">{filteredAnnouncements.length}</span> announcements
                                            </p>
                                        </div>
                                        <div>
                                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                                <button
                                                    onClick={goToPreviousPage}
                                                    disabled={currentPage === 1}
                                                    className={`relative inline-flex items-center px-3 py-2 rounded-l-md border border-gray-300 text-sm font-medium ${currentPage === 1
                                                        ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                                                        : 'text-gray-500 bg-white hover:bg-gray-50'
                                                        }`}
                                                >
                                                    Previous
                                                </button>
                                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                                    <button
                                                        key={page}
                                                        onClick={() => goToPage(page)}
                                                        className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium ${page === currentPage
                                                            ? 'z-10 bg-teal-50 border-teal-500 text-teal-600'
                                                            : 'bg-white text-gray-500 hover:bg-gray-50'
                                                            }`}
                                                    >
                                                        {page}
                                                    </button>
                                                ))}
                                                <button
                                                    onClick={goToNextPage}
                                                    disabled={currentPage === totalPages}
                                                    className={`relative inline-flex items-center px-3 py-2 rounded-r-md border border-gray-300 text-sm font-medium ${currentPage === totalPages
                                                        ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                                                        : 'text-gray-500 bg-white hover:bg-gray-50'
                                                        }`}
                                                >
                                                    Next
                                                </button>
                                            </nav>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        ) : (
                            /* Create New Announcement Form */
                                <CreateAnnouncementForm onBack={() => {
                    setShowCreateForm(false)
                    fetchAnnouncements() // Refresh the announcements list
                }} user={user} />
                        )}
                    </div>
                </main>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && announcementToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                        <div className="p-6">
                            {/* Header */}
                            <div className="flex items-center mb-4">
                                <div className="flex-shrink-0">
                                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-lg font-medium text-gray-900">Delete Announcement</h3>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="mb-6">
                                <p className="text-sm text-gray-600">
                                    Are you sure you want to delete the announcement <span className="font-medium text-gray-900">"{announcementToDelete.title}"</span>?
                                    This action cannot be undone.
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={cancelDeleteAnnouncement}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                                    disabled={deletingAnnouncement}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDeleteAnnouncement}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={deletingAnnouncement}
                                >
                                    {deletingAnnouncement ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* View Announcement Modal - Video Only */}
            {showViewModal && selectedAnnouncement && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4">
                        <div className="p-6">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-lg font-medium text-gray-900">ISL Video</h3>
                                        <p className="text-sm text-gray-500">{selectedAnnouncement.title}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={closeViewModal}
                                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Video Content */}
                            <div className="flex justify-center">
                                {selectedAnnouncement.isl_video_path ? (
                                    <div className="w-full max-w-4xl">
                                        <video
                                            controls
                                            autoPlay
                                            className="w-full rounded-lg shadow-lg"
                                            poster="/images/placeholders/video-placeholder.jpg"
                                        >
                                            <source src={selectedAnnouncement.isl_video_path} type="video/mp4" />
                                            Your browser does not support the video tag.
                                        </video>
                                    </div>
                                ) : (
                                    <div className="w-full max-w-2xl h-64 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                                        <div className="text-center">
                                            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
                                            <p className="text-gray-500 text-lg font-medium">No ISL video available</p>
                                            <p className="text-gray-400 text-sm mt-2">This announcement doesn't have an associated ISL video</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}