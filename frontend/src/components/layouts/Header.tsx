'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface User {
    id: number
    username: string
    full_name: string
    email: string
    role: string
}

export default function Header() {
    const router = useRouter()
    const [user, setUser] = useState<User | null>(null)
    const [showProfileDropdown, setShowProfileDropdown] = useState(false)

    useEffect(() => {
        const userData = localStorage.getItem('user')
        if (userData) {
            try {
                setUser(JSON.parse(userData))
            } catch (error) {
                console.error('Error parsing user data:', error)
                localStorage.removeItem('user')
                router.push('/login')
            }
        } else {
            router.push('/login')
        }
    }, [router])

    const handleLogout = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        router.push('/login')
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
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600"></div>
            </header>
        )
    }

    return (
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
                <div className="relative profile-dropdown">
                    <button
                        onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                        className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                    >
                        <span className="sr-only">Open user menu</span>
                        <div className="h-8 w-8 rounded-full bg-teal-500 flex items-center justify-center">
                            <span className="text-white text-sm font-medium">
                                {(user?.full_name?.charAt(0) || 'U').toUpperCase()}
                            </span>
                        </div>
                        <span className="ml-2 text-gray-700 font-medium">{user?.full_name || user?.username}</span>
                        <svg className="ml-1 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {showProfileDropdown && (
                        <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                            <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                                <div className="font-medium">{user?.full_name || user?.username}</div>
                                <div className="text-gray-500">{user?.email}</div>
                                <div className="text-xs text-teal-600 font-medium">{user?.role}</div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                            >
                                Sign out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
}