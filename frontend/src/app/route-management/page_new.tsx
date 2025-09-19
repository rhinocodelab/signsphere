'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import DashboardLayout from '@/components/layouts/DashboardLayout'

interface TrainRoute {
    id: number
    train_number: string
    train_name: string
    from_station_code: string
    from_station: string
    to_station_code: string
    to_station: string
    is_translated: boolean
    created_at: string
    updated_at?: string
}

export default function RouteManagementPage() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [trainRoutes, setTrainRoutes] = useState<TrainRoute[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [filteredRoutes, setFilteredRoutes] = useState<TrainRoute[]>([])
    const [clearing, setClearing] = useState(false)
    const [showAddRouteModal, setShowAddRouteModal] = useState(false)
    const [addingRoute, setAddingRoute] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [deletingRoute, setDeletingRoute] = useState(false)
    const [routeToDelete, setRouteToDelete] = useState<{ id: number, trainNumber: string } | null>(null)
    const [showClearAllModal, setShowClearAllModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [editingRoute, setEditingRoute] = useState(false)
    const [routeToEdit, setRouteToEdit] = useState<TrainRoute | null>(null)
    const [showImportModal, setShowImportModal] = useState(false)
    const [importingRoutes, setImportingRoutes] = useState(false)
    const [dragActive, setDragActive] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [showTranslationModal, setShowTranslationModal] = useState(false)
    const [translatingRoute, setTranslatingRoute] = useState<TrainRoute | null>(null)
    const [translationProgress, setTranslationProgress] = useState({
        step: '',
        progress: 0,
        isComplete: false,
        error: null as string | null
    })

    // Form states for adding/editing routes
    const [newRoute, setNewRoute] = useState({
        train_number: '',
        train_name: '',
        from_station_code: '',
        from_station: '',
        to_station_code: '',
        to_station: ''
    })

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

    useEffect(() => {
        if (user) {
            loadTrainRoutes()
        }
    }, [user])

    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredRoutes(trainRoutes)
        } else {
            const filtered = trainRoutes.filter(route =>
                route.train_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                route.train_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                route.from_station.toLowerCase().includes(searchQuery.toLowerCase()) ||
                route.to_station.toLowerCase().includes(searchQuery.toLowerCase())
            )
            setFilteredRoutes(filtered)
        }
    }, [searchQuery, trainRoutes])

    const loadTrainRoutes = async () => {
        setLoading(true)
        try {
            const currentHost = window.location.hostname
            const apiUrl = currentHost === 'localhost'
                ? 'https://localhost:5001'
                : (process.env.NEXT_PUBLIC_API_URL || 'https://192.168.1.10:5001')

            const response = await fetch(`${apiUrl}/api/v1/train-routes`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                    'Content-Type': 'application/json',
                },
            })

            if (response.ok) {
                const data = await response.json()
                setTrainRoutes(data)
                setFilteredRoutes(data)
            } else {
                toast.error('Failed to load train routes')
            }
        } catch (error) {
            console.error('Error loading train routes:', error)
            toast.error('Error loading train routes')
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = () => {
        localStorage.removeItem('isLoggedIn')
        localStorage.removeItem('user')
        localStorage.removeItem('accessToken')
        router.push('/login')
    }

    const handleAddRoute = async () => {
        if (!newRoute.train_number || !newRoute.train_name || !newRoute.from_station || !newRoute.to_station) {
            toast.error('Please fill in all required fields')
            return
        }

        setAddingRoute(true)
        try {
            const currentHost = window.location.hostname
            const apiUrl = currentHost === 'localhost'
                ? 'https://localhost:5001'
                : (process.env.NEXT_PUBLIC_API_URL || 'https://192.168.1.10:5001')

            const response = await fetch(`${apiUrl}/api/v1/train-routes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                },
                body: JSON.stringify(newRoute),
            })

            if (response.ok) {
                toast.success('Route added successfully')
                setShowAddRouteModal(false)
                setNewRoute({
                    train_number: '',
                    train_name: '',
                    from_station_code: '',
                    from_station: '',
                    to_station_code: '',
                    to_station: ''
                })
                loadTrainRoutes()
            } else {
                const errorData = await response.json()
                toast.error(errorData.detail || 'Failed to add route')
            }
        } catch (error) {
            console.error('Error adding route:', error)
            toast.error('Error adding route')
        } finally {
            setAddingRoute(false)
        }
    }

    const handleDeleteRoute = async () => {
        if (!routeToDelete) return

        setDeletingRoute(true)
        try {
            const currentHost = window.location.hostname
            const apiUrl = currentHost === 'localhost'
                ? 'https://localhost:5001'
                : (process.env.NEXT_PUBLIC_API_URL || 'https://192.168.1.10:5001')

            const response = await fetch(`${apiUrl}/api/v1/train-routes/${routeToDelete.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                },
            })

            if (response.ok) {
                toast.success('Route deleted successfully')
                setShowDeleteModal(false)
                setRouteToDelete(null)
                loadTrainRoutes()
            } else {
                toast.error('Failed to delete route')
            }
        } catch (error) {
            console.error('Error deleting route:', error)
            toast.error('Error deleting route')
        } finally {
            setDeletingRoute(false)
        }
    }

    const handleClearAllRoutes = async () => {
        setClearing(true)
        try {
            const currentHost = window.location.hostname
            const apiUrl = currentHost === 'localhost'
                ? 'https://localhost:5001'
                : (process.env.NEXT_PUBLIC_API_URL || 'https://192.168.1.10:5001')

            const response = await fetch(`${apiUrl}/api/v1/train-routes/clear-all`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                },
            })

            if (response.ok) {
                toast.success('All routes cleared successfully')
                setShowClearAllModal(false)
                loadTrainRoutes()
            } else {
                toast.error('Failed to clear all routes')
            }
        } catch (error) {
            console.error('Error clearing routes:', error)
            toast.error('Error clearing routes')
        } finally {
            setClearing(false)
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
        <DashboardLayout activeMenuItem="route-management">
            {/* Page Header */}
            <div className="mb-8 pt-4">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Route Management</h1>
                <p className="text-gray-600">Manage train routes and station information</p>

                {/* Translation Information */}
                <div className="mt-4 p-3 bg-teal-50 border border-teal-200 rounded-lg">
                    <div className="flex items-start space-x-3">
                        <svg className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                            <p className="text-sm text-teal-800">
                                <span className="font-medium">Translation Information:</span> All train route translations (Hindi, Marathi, Gujarati) are available in the
                                <Link href="/ai-generated-assets/translations" className="font-medium text-teal-700 hover:text-teal-900 underline mx-1">
                                    Train Route Translations
                                </Link>
                                page.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Train Routes Table with Search and Actions */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                {/* Search and Actions Bar */}
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="relative">
                                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Search by train number, name, or station..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none w-80 text-black"
                                />
                            </div>
                            <span className="text-sm text-gray-500">
                                {filteredRoutes.length} of {trainRoutes.length} routes
                            </span>
                        </div>

                        <div className="flex items-center space-x-3">
                            <button
                                onClick={() => setShowAddRouteModal(true)}
                                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                <span>Add Route</span>
                            </button>

                            <button
                                onClick={() => setShowImportModal(true)}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                                </svg>
                                <span>Import CSV</span>
                            </button>

                            <button
                                onClick={() => setShowClearAllModal(true)}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                <span>Clear All</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Routes Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Train Number</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Train Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From Station</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">To Station</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Translated</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center">
                                        <div className="flex items-center justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
                                            <span className="ml-2 text-gray-600">Loading routes...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredRoutes.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                        {searchQuery ? 'No routes found matching your search.' : 'No routes found. Add your first route to get started.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredRoutes.map((route) => (
                                    <tr key={route.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {route.train_number}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {route.train_name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {route.from_station}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {route.to_station}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                route.is_translated
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                                {route.is_translated ? 'Yes' : 'No'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(route.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => {
                                                        setRouteToEdit(route)
                                                        setShowEditModal(true)
                                                    }}
                                                    className="text-indigo-600 hover:text-indigo-900"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setRouteToDelete({ id: route.id, trainNumber: route.train_number })
                                                        setShowDeleteModal(true)
                                                    }}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Route Modal */}
            {showAddRouteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Add New Route</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Train Number *</label>
                                <input
                                    type="text"
                                    value={newRoute.train_number}
                                    onChange={(e) => setNewRoute({ ...newRoute, train_number: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                                    placeholder="e.g., 12951"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Train Name *</label>
                                <input
                                    type="text"
                                    value={newRoute.train_name}
                                    onChange={(e) => setNewRoute({ ...newRoute, train_name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                                    placeholder="e.g., Rajdhani Express"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">From Station *</label>
                                <input
                                    type="text"
                                    value={newRoute.from_station}
                                    onChange={(e) => setNewRoute({ ...newRoute, from_station: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                                    placeholder="e.g., Mumbai Central"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">To Station *</label>
                                <input
                                    type="text"
                                    value={newRoute.to_station}
                                    onChange={(e) => setNewRoute({ ...newRoute, to_station: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                                    placeholder="e.g., New Delhi"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => setShowAddRouteModal(false)}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddRoute}
                                disabled={addingRoute}
                                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors disabled:opacity-50"
                            >
                                {addingRoute ? 'Adding...' : 'Add Route'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Delete Route</h2>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to delete route <span className="font-medium">{routeToDelete?.trainNumber}</span>? This action cannot be undone.
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteRoute}
                                disabled={deletingRoute}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                            >
                                {deletingRoute ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Clear All Confirmation Modal */}
            {showClearAllModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Clear All Routes</h2>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to delete all routes? This action cannot be undone and will remove all {trainRoutes.length} routes.
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowClearAllModal(false)}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleClearAllRoutes}
                                disabled={clearing}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                            >
                                {clearing ? 'Clearing...' : 'Clear All'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    )
}