'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { appConfig } from '@/config/app-config'
import { getImageConfig, validateImagePath, getFallbackImageConfig } from '@/utils/image-utils'
// Eye icons for password visibility toggle

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [keepLoggedIn, setKeepLoggedIn] = useState(true)
  const [imageError, setImageError] = useState(false)
  const [showProjectInfo, setShowProjectInfo] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })

  // Debug: Log environment variables
  console.log('Environment variables:', {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NODE_ENV: process.env.NODE_ENV
  })

  // Get image configuration from config
  const imageConfig = imageError ? getFallbackImageConfig('image') : getImageConfig('image')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form submitted with data:', formData)

    // Basic validation
    if (!formData.username.trim()) {
      toast.error('Please enter your username')
      return
    }

    if (!formData.password.trim()) {
      toast.error('Please enter your password')
      return
    }

    // Show loading toast
    const loadingToast = toast.loading('Signing you in...')

    try {
      // Call backend authentication API
      const formDataForAPI = new URLSearchParams()
      formDataForAPI.append('username', formData.username)
      formDataForAPI.append('password', formData.password)

      // Determine API URL based on current hostname
      const currentHost = window.location.hostname
      const apiUrl = currentHost === 'localhost'
        ? 'https://localhost:5001'
        : (process.env.NEXT_PUBLIC_API_URL || 'https://192.168.1.10:5001')

      console.log('Current hostname:', currentHost)
      console.log('Making request to:', `${apiUrl}/api/v1/auth/login`)

      // Add timeout and retry logic
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

      const response = await fetch(`${apiUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formDataForAPI,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      console.log('Response status:', response.status)
      console.log('Response headers:', Object.fromEntries(response.headers.entries()))

      if (response.ok) {
        const data = await response.json()
        console.log('Login successful, token received:', data.access_token ? 'Yes' : 'No')

        // Store authentication token and user info
        localStorage.setItem('accessToken', data.access_token)
        localStorage.setItem('tokenType', data.token_type)
        localStorage.setItem('isLoggedIn', 'true')
        localStorage.setItem('user', JSON.stringify({
          username: formData.username,
          role: 'admin'
        }))

        // Dismiss loading toast and show success
        toast.dismiss(loadingToast)
        toast.success('Welcome back, admin!')

        // Redirect to dashboard
        router.push('/dashboard')
      } else {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }))
        console.log('Login failed:', errorData)
        toast.dismiss(loadingToast)
        toast.error(errorData.detail || 'Invalid credentials. Please check your username and password.')
      }
    } catch (error) {
      console.error('Login error:', error)
      toast.dismiss(loadingToast)

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          toast.error('Request timeout. Please check your connection and try again.')
        } else if (error.message.includes('ERR_ADDRESS_UNREACHABLE')) {
          toast.error('Cannot reach server. Please check if the backend is running and accessible.')
        } else {
          toast.error(`Network error: ${error.message}`)
        }
      } else {
        toast.error('An unexpected error occurred. Please try again.')
      }
    }
  }

  return (
    <div className="min-h-screen bg-white overflow-hidden flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-center p-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center">
            <div className="w-4 h-4 bg-white rounded-full"></div>
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-semibold text-gray-900">SignSphere</span>
            <span className="text-sm text-gray-500">Western Railway Divyangjan Announcement System</span>
          </div>
        </div>
        <button
          onClick={() => setShowProjectInfo(true)}
          className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors"
        >
          Project Info
        </button>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 pb-16 items-center justify-center p-4">
        {/* Centered Card with Shadow */}
        <div className="w-full max-w-6xl bg-white shadow-2xl overflow-hidden">
          <div className="flex flex-col lg:flex-row min-h-[600px]">
            {/* Left Panel - Branding */}
            <div className="lg:w-1/2 flex flex-col justify-center items-center p-8 lg:p-12 bg-gradient-to-br from-teal-50 to-blue-50">
              <div className="max-w-lg mx-auto text-center flex flex-col justify-center items-center">
                {/* Dynamic Image */}
                <div className="mb-6">
                  <div className="relative w-64 h-64 lg:w-80 lg:h-80 mx-auto flex items-center justify-center">
                    <Image
                      src={imageConfig.path}
                      alt={imageConfig.alt}
                      width={imageConfig.width || 500}
                      height={imageConfig.height || 500}
                      className={imageConfig.className || "max-w-full h-auto object-contain"}
                      onError={() => setImageError(true)}
                      priority
                    />
                  </div>
                </div>

                {/* Promotional Content */}
                <h1 className="text-xl lg:text-2xl font-bold text-gray-800 mb-4">
                  {appConfig.login.leftPanel.title}
                </h1>
                <p className="text-gray-600 mb-8 text-base lg:text-lg">
                  {appConfig.login.leftPanel.subtitle}
                </p>

                {/* Conditional CTA Button */}
                {appConfig.login.leftPanel.ctaButton && (
                  <button className="bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200 mb-6">
                    {appConfig.login.leftPanel.ctaButton.text}
                  </button>
                )}

                {/* Conditional Footer Text */}
                {appConfig.login.leftPanel.footerText && (
                  <p className="text-xs text-gray-500">
                    {appConfig.login.leftPanel.footerText}
                  </p>
                )}
              </div>
            </div>

            {/* Right Panel - Login Form */}
            <div className="lg:w-1/2 flex items-center justify-center p-8 lg:p-12">
              <div className="w-full max-w-md flex flex-col justify-center">
                <h2 className="text-2xl font-semibold text-gray-900 mb-8">
                  {appConfig.login.rightPanel.title}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Username Field */}
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                      {appConfig.login.rightPanel.usernameLabel}
                    </label>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      placeholder={appConfig.login.rightPanel.usernamePlaceholder}
                      value={formData.username}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors text-black"
                      required
                    />
                  </div>

                  {/* Password Field */}
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                      {appConfig.login.rightPanel.passwordLabel}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        name="password"
                        placeholder={appConfig.login.rightPanel.passwordPlaceholder}
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors text-black"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Keep Logged In Checkbox */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="keepLoggedIn"
                      checked={keepLoggedIn}
                      onChange={(e) => setKeepLoggedIn(e.target.checked)}
                      className="w-4 h-4 text-teal-600 bg-gray-100 border-gray-300 rounded focus:ring-teal-500 focus:ring-2"
                    />
                    <label htmlFor="keepLoggedIn" className="ml-2 text-sm text-gray-700">
                      {appConfig.login.rightPanel.keepLoggedInText}
                    </label>
                  </div>

                  {/* Login Button */}
                  <button
                    type="submit"
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
                  >
                    {appConfig.login.rightPanel.loginButtonText}
                  </button>

                </form>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Project Info Modal */}
      {showProjectInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Project Information</h2>
                <button
                  onClick={() => setShowProjectInfo(false)}
                  className="text-gray-400 hover:text-gray-600 text-sm font-medium"
                >
                  Close
                </button>
              </div>

              {/* Content */}
              <div className="space-y-6">
                {/* Mission Section */}
                <div className="text-center">
                  <div className="mb-4">
                    {appConfig.branding.projectInfoImage && (
                      <Image
                        src={appConfig.branding.projectInfoImage.path}
                        alt="Project Mission"
                        width={appConfig.branding.projectInfoImage.width || 101}
                        height={appConfig.branding.projectInfoImage.height || 104}
                        className="mx-auto"
                        style={{ background: 'transparent' }}
                        onError={() => setImageError(true)}
                      />
                    )}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Our Mission</h3>
                  <p className="text-gray-600 leading-relaxed">
                    The Western Railway Divyangjan Announcement System is designed to make travel more accessible
                    for people who are deaf or hard of hearing. Our platform delivers important train announcements
                    using Indian Sign Language (ISL) videos, synchronized subtitles, and text notifications,
                    ensuring equal access to real-time information at railway stations and on trains.
                  </p>
                </div>

                {/* Vision Section */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Our Vision</h3>
                  <p className="text-gray-600 leading-relaxed">
                    We aim to foster independence and confidence for Divyangjan passengers within the Western Railway network
                    by providing an inclusive platform built according to accessibility standards. Our goal is to ensure
                    that every passenger has equal access to crucial travel information, making railway travel more
                    accessible and enjoyable for everyone.
                  </p>
                </div>

                {/* Features Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Key Features</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-start">
                      <span className="text-teal-600 mr-2">•</span>
                      Indian Sign Language (ISL) video announcements
                    </li>
                    <li className="flex items-start">
                      <span className="text-teal-600 mr-2">•</span>
                      Synchronized subtitles for all announcements
                    </li>
                    <li className="flex items-start">
                      <span className="text-teal-600 mr-2">•</span>
                      Real-time text notifications
                    </li>
                    <li className="flex items-start">
                      <span className="text-teal-600 mr-2">•</span>
                      Accessibility-compliant design
                    </li>
                    <li className="flex items-start">
                      <span className="text-teal-600 mr-2">•</span>
                      Train route management system
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
