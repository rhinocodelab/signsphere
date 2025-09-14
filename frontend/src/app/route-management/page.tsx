'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface TrainRoute {
    id: number
    train_number: string
    train_name: string
    from_station_code: string
    from_station: string
    to_station_code: string
    to_station: string
    created_at: string
    updated_at?: string
}

export default function RouteManagementPage() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [showProfileDropdown, setShowProfileDropdown] = useState(false)
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
    const [newRoute, setNewRoute] = useState({
        train_number: '',
        train_name: '',
        from_station_code: '',
        from_station: '',
        to_station_code: '',
        to_station: ''
    })

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
                const apiUrl = window.location.hostname === 'localhost'
                    ? 'https://localhost:5001'
                    : 'https://192.168.1.10:5001'

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

    // Fetch train routes
    useEffect(() => {
        const fetchTrainRoutes = async () => {
            try {
                const apiUrl = window.location.hostname === 'localhost'
                    ? 'https://localhost:5001'
                    : 'https://192.168.1.10:5001'

                const response = await fetch(`${apiUrl}/api/v1/train-routes/`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                    },
                })

                if (response.ok) {
                    const data = await response.json()
                    setTrainRoutes(data)
                    setFilteredRoutes(data)
                } else {
                    toast.error('Failed to fetch train routes')
                }
            } catch (error) {
                console.error('Error fetching train routes:', error)
                toast.error('Network error while fetching train routes')
            } finally {
                setLoading(false)
            }
        }

        if (user) {
            fetchTrainRoutes()
        }
    }, [user])

    // Filter routes based on search query
    useEffect(() => {
        if (!searchQuery.trim()) {
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

    const handleLogout = () => {
        toast.success('Signed out successfully')
        localStorage.removeItem('isLoggedIn')
        localStorage.removeItem('user')
        localStorage.removeItem('accessToken')
        localStorage.removeItem('tokenType')
        router.push('/login')
    }

    const handleClearAllRoutes = () => {
        if (trainRoutes.length === 0) {
            toast.error('No routes to clear')
            return
        }
        setShowClearAllModal(true)
    }

    const confirmClearAllRoutes = async () => {
        setClearing(true)
        try {
            const apiUrl = window.location.hostname === 'localhost'
                ? 'https://localhost:5001'
                : 'https://192.168.1.10:5001'

            const response = await fetch(`${apiUrl}/api/v1/train-routes/`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                },
            })

            if (response.ok) {
                const result = await response.json()
                setTrainRoutes([])
                setFilteredRoutes([])
                setSearchQuery('')
                toast.success(result.message)
            } else {
                const errorData = await response.json()
                toast.error(errorData.detail || 'Failed to clear routes')
            }
        } catch (error) {
            console.error('Error clearing routes:', error)
            toast.error('Network error while clearing routes')
        } finally {
            setClearing(false)
        }
    }

    const cancelClearAllRoutes = () => {
        setShowClearAllModal(false)
    }

    // Handle edit route
    const handleEditRoute = (route: TrainRoute) => {
        setRouteToEdit(route)
        setNewRoute({
            train_number: route.train_number,
            train_name: route.train_name,
            from_station_code: route.from_station_code,
            from_station: route.from_station,
            to_station_code: route.to_station_code,
            to_station: route.to_station
        })
        setShowEditModal(true)
    }

    // Handle edit route form submission
    const handleEditRouteSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!routeToEdit) return

        // Basic validation
        if (!newRoute.train_number.trim()) {
            toast.error('Please enter train number')
            return
        }

        // Train number validation - must be exactly 5 digits
        if (!/^\d{5}$/.test(newRoute.train_number.trim())) {
            toast.error('Train number must be exactly 5 digits')
            return
        }

        // Station validation - From and To stations cannot be the same
        if (newRoute.from_station_code.trim().toUpperCase() === newRoute.to_station_code.trim().toUpperCase()) {
            toast.error('From station code and To station code cannot be the same')
            return
        }

        if (newRoute.from_station.trim().toLowerCase() === newRoute.to_station.trim().toLowerCase()) {
            toast.error('From station name and To station name cannot be the same')
            return
        }
        if (!newRoute.train_name.trim()) {
            toast.error('Please enter train name')
            return
        }
        if (!newRoute.from_station_code.trim()) {
            toast.error('Please enter from station code')
            return
        }
        if (!newRoute.from_station.trim()) {
            toast.error('Please enter from station name')
            return
        }
        if (!newRoute.to_station_code.trim()) {
            toast.error('Please enter to station code')
            return
        }
        if (!newRoute.to_station.trim()) {
            toast.error('Please enter to station name')
            return
        }

        setEditingRoute(true)
        const loadingToast = toast.loading('Updating route...')

        try {
            const apiUrl = window.location.hostname === 'localhost'
                ? 'https://localhost:5001'
                : 'https://192.168.1.10:5001'

            const accessToken = localStorage.getItem('accessToken')

            const response = await fetch(`${apiUrl}/api/v1/train-routes/${routeToEdit.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify(newRoute)
            })

            if (response.ok) {
                const updatedRoute = await response.json()

                // Update the route in the current lists
                setTrainRoutes(prev => prev.map(route =>
                    route.id === routeToEdit.id ? updatedRoute : route
                ))
                setFilteredRoutes(prev => prev.map(route =>
                    route.id === routeToEdit.id ? updatedRoute : route
                ))

                toast.dismiss(loadingToast)
                toast.success('Route updated successfully!')

                // Reset form and close modal
                setNewRoute({
                    train_number: '',
                    train_name: '',
                    from_station_code: '',
                    from_station: '',
                    to_station_code: '',
                    to_station: ''
                })
                setShowEditModal(false)
                setRouteToEdit(null)
            } else {
                const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }))
                toast.dismiss(loadingToast)
                toast.error(errorData.detail || 'Failed to update route')
            }
        } catch (error) {
            console.error('Error updating route:', error)
            toast.dismiss(loadingToast)
            toast.error('Failed to update route')
        } finally {
            setEditingRoute(false)
        }
    }

    // Handle cancel edit
    const cancelEditRoute = () => {
        setShowEditModal(false)
        setRouteToEdit(null)
        setNewRoute({
            train_number: '',
            train_name: '',
            from_station_code: '',
            from_station: '',
            to_station_code: '',
            to_station: ''
        })
    }

    // Handle import modal
    const handleImportRoutes = () => {
        setShowImportModal(true)
    }

    // Handle drag and drop
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

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0]
            if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                file.name.endsWith('.xlsx')) {
                setSelectedFile(file)
            } else {
                toast.error('Please select an Excel (.xlsx) file')
            }
        }
    }

    // Handle file input change
    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                file.name.endsWith('.xlsx')) {
                setSelectedFile(file)
            } else {
                toast.error('Please select an Excel (.xlsx) file')
            }
        }
    }

    // Handle import submission
    const handleImportSubmit = async () => {
        if (!selectedFile) {
            toast.error('Please select a file to import')
            return
        }

        setImportingRoutes(true)
        const loadingToast = toast.loading('Importing routes...')

        try {
            const formData = new FormData()
            formData.append('file', selectedFile)

            const apiUrl = window.location.hostname === 'localhost'
                ? 'https://localhost:5001'
                : 'https://192.168.1.10:5001'

            const accessToken = localStorage.getItem('accessToken')

            const response = await fetch(`${apiUrl}/api/v1/train-routes/import`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                },
                body: formData
            })

            if (response.ok) {
                const result = await response.json()

                // Refresh the routes list
                const routesResponse = await fetch(`${apiUrl}/api/v1/train-routes/`, {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                })

                if (routesResponse.ok) {
                    const routes = await routesResponse.json()
                    setTrainRoutes(routes)
                    setFilteredRoutes(routes)
                }

                toast.dismiss(loadingToast)
                toast.success(`Successfully imported ${result.imported_count} routes!`)

                // Close modal and reset
                setShowImportModal(false)
                setSelectedFile(null)
            } else {
                const errorData = await response.json().catch(() => ({ detail: 'Import failed' }))
                toast.dismiss(loadingToast)
                toast.error(errorData.detail || 'Failed to import routes')
            }
        } catch (error) {
            console.error('Error importing routes:', error)
            toast.dismiss(loadingToast)
            toast.error('Failed to import routes')
        } finally {
            setImportingRoutes(false)
        }
    }

    // Handle cancel import
    const cancelImport = () => {
        setShowImportModal(false)
        setSelectedFile(null)
        setDragActive(false)
    }

    // Handle input change for new route form
    const handleNewRouteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        let formattedValue = value

        // Auto-format based on field type
        if (name === 'from_station_code' || name === 'to_station_code') {
            // Station codes should be uppercase
            formattedValue = value.toUpperCase()
        } else if (name === 'train_name' || name === 'from_station' || name === 'to_station') {
            // Train names and station names should have proper capitalization
            formattedValue = value.replace(/\b\w/g, (char) => char.toUpperCase())
        }

        setNewRoute(prev => ({
            ...prev,
            [name]: formattedValue
        }))
    }

    // Handle add route form submission
    const handleAddRoute = async (e: React.FormEvent) => {
        e.preventDefault()

        // Basic validation
        if (!newRoute.train_number.trim()) {
            toast.error('Please enter train number')
            return
        }

        // Train number validation - must be exactly 5 digits
        if (!/^\d{5}$/.test(newRoute.train_number.trim())) {
            toast.error('Train number must be exactly 5 digits')
            return
        }

        // Station validation - From and To stations cannot be the same
        if (newRoute.from_station_code.trim().toUpperCase() === newRoute.to_station_code.trim().toUpperCase()) {
            toast.error('From station code and To station code cannot be the same')
            return
        }

        if (newRoute.from_station.trim().toLowerCase() === newRoute.to_station.trim().toLowerCase()) {
            toast.error('From station name and To station name cannot be the same')
            return
        }
        if (!newRoute.train_name.trim()) {
            toast.error('Please enter train name')
            return
        }
        if (!newRoute.from_station_code.trim()) {
            toast.error('Please enter from station code')
            return
        }
        if (!newRoute.from_station.trim()) {
            toast.error('Please enter from station name')
            return
        }
        if (!newRoute.to_station_code.trim()) {
            toast.error('Please enter to station code')
            return
        }
        if (!newRoute.to_station.trim()) {
            toast.error('Please enter to station name')
            return
        }

        setAddingRoute(true)
        const loadingToast = toast.loading('Adding new route...')

        try {
            const apiUrl = window.location.hostname === 'localhost'
                ? 'https://localhost:5001'
                : 'https://192.168.1.10:5001'

            const accessToken = localStorage.getItem('accessToken')

            const response = await fetch(`${apiUrl}/api/v1/train-routes/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify(newRoute)
            })

            if (response.ok) {
                const addedRoute = await response.json()

                // Add the new route to the beginning of the current lists (top of table)
                setTrainRoutes(prev => [addedRoute, ...prev])
                setFilteredRoutes(prev => [addedRoute, ...prev])

                toast.dismiss(loadingToast)
                toast.success('Route added successfully!')

                // Reset form and close modal
                setNewRoute({
                    train_number: '',
                    train_name: '',
                    from_station_code: '',
                    from_station: '',
                    to_station_code: '',
                    to_station: ''
                })
                setShowAddRouteModal(false)
            } else {
                const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }))
                toast.dismiss(loadingToast)
                toast.error(errorData.detail || 'Failed to add route')
            }
        } catch (error) {
            console.error('Error adding route:', error)
            toast.dismiss(loadingToast)
            toast.error('Failed to add route')
        } finally {
            setAddingRoute(false)
        }
    }

    // Handle delete route confirmation
    const handleDeleteRoute = (routeId: number, trainNumber: string) => {
        setRouteToDelete({ id: routeId, trainNumber })
        setShowDeleteModal(true)
    }

    // Handle actual delete operation
    const confirmDeleteRoute = async () => {
        if (!routeToDelete) return

        setDeletingRoute(true)
        const loadingToast = toast.loading('Deleting route...')

        try {
            const apiUrl = window.location.hostname === 'localhost'
                ? 'https://localhost:5001'
                : 'https://192.168.1.10:5001'

            const accessToken = localStorage.getItem('accessToken')

            const response = await fetch(`${apiUrl}/api/v1/train-routes/${routeToDelete.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            })

            if (response.ok) {
                // Remove the route from the current lists
                setTrainRoutes(prev => prev.filter(route => route.id !== routeToDelete.id))
                setFilteredRoutes(prev => prev.filter(route => route.id !== routeToDelete.id))

                toast.dismiss(loadingToast)
                toast.success(`Route ${routeToDelete.trainNumber} deleted successfully!`)

                // Close modal and reset state
                setShowDeleteModal(false)
                setRouteToDelete(null)
            } else {
                const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }))
                toast.dismiss(loadingToast)
                toast.error(errorData.detail || 'Failed to delete route')
            }
        } catch (error) {
            console.error('Error deleting route:', error)
            toast.dismiss(loadingToast)
            toast.error('Failed to delete route')
        } finally {
            setDeletingRoute(false)
        }
    }

    // Handle cancel delete
    const cancelDeleteRoute = () => {
        setShowDeleteModal(false)
        setRouteToDelete(null)
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
                                <span className="text-white text-sm font-medium">A</span>
                            </div>
                            <span className="text-sm font-medium text-gray-700">{user?.username}</span>
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {showProfileDropdown && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                                <div className="px-4 py-2 border-b border-gray-100">
                                    <p className="text-sm font-medium text-gray-900">{user?.username}</p>
                                    <p className="text-xs text-gray-500">Administrator</p>
                                </div>
                                <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                                    Sign out
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <div className="flex pt-16">
                {/* Fixed Sidebar */}
                <aside className="fixed left-0 top-16 bottom-0 bg-white border-r border-gray-200 w-64 z-30 overflow-y-auto">
                    <nav className="p-4 pt-8 space-y-2">
                        {/* Dashboard */}
                        <Link href="/dashboard" className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            <span>Dashboard</span>
                        </Link>

                        {/* Route Management - Active */}
                        <Link href="/route-management" className="flex items-center space-x-3 px-3 py-2 bg-teal-50 text-teal-700 rounded-lg">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                            </svg>
                            <span>Route Management</span>
                        </Link>
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1 ml-64 p-6 min-h-screen pb-24">
                    <div className="max-w-6xl mx-auto">
                        {/* Page Header */}
                        <div className="mb-8 pt-4">
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">Route Management</h1>
                            <p className="text-gray-600">Manage train routes and station information</p>
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
                                        <div className="text-sm text-gray-600">
                                            {filteredRoutes.length} of {trainRoutes.length} routes
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <button
                                            onClick={() => {
                                                // Reset form data when opening modal
                                                setNewRoute({
                                                    train_number: '',
                                                    train_name: '',
                                                    from_station_code: '',
                                                    from_station: '',
                                                    to_station_code: '',
                                                    to_station: ''
                                                })
                                                setShowAddRouteModal(true)
                                            }}
                                            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors duration-200"
                                        >
                                            Add Route
                                        </button>
                                        <button
                                            onClick={handleImportRoutes}
                                            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors duration-200"
                                        >
                                            Import
                                        </button>
                                        <button
                                            onClick={handleClearAllRoutes}
                                            disabled={clearing || trainRoutes.length === 0}
                                            className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors duration-200"
                                        >
                                            {clearing ? 'Clearing...' : 'Clear All Routes'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Table Content */}
                            {loading ? (
                                <div className="p-8 text-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-4"></div>
                                    <p className="text-gray-600">Loading train routes...</p>
                                </div>
                            ) : filteredRoutes.length === 0 ? (
                                <div className="p-8 text-center">
                                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                    </svg>
                                    <p className="text-gray-600 mb-2">No train routes found</p>
                                    <p className="text-sm text-gray-500">
                                        {searchQuery ? 'Try adjusting your search criteria' : 'Add your first train route to get started'}
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Train Number
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Train Name
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    From Station
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    To Station
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {filteredRoutes.map((route) => (
                                                <tr key={route.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900">{route.train_number}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900">{route.train_name}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">{route.from_station}</div>
                                                        <div className="text-xs text-gray-500">{route.from_station_code}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">{route.to_station}</div>
                                                        <div className="text-xs text-gray-500">{route.to_station_code}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <div className="flex items-center space-x-2">
                                                            <button
                                                                onClick={() => handleEditRoute(route)}
                                                                className="p-2 text-teal-600 hover:text-teal-900 hover:bg-teal-50 rounded transition-colors"
                                                                title="Edit"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                </svg>
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteRoute(route.id, route.train_number)}
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
                            {filteredRoutes.length > 0 && (
                                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                                    <div className="flex-1 flex justify-between sm:hidden">
                                        <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                                            Previous
                                        </button>
                                        <button className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                                            Next
                                        </button>
                                    </div>
                                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                        <div>
                                            <p className="text-sm text-gray-700">
                                                Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredRoutes.length}</span> of{' '}
                                                <span className="font-medium">{filteredRoutes.length}</span> results
                                            </p>
                                        </div>
                                        <div>
                                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                                <button className="relative inline-flex items-center px-3 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                                                    Previous
                                                </button>
                                                <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                                                    1
                                                </button>
                                                <button className="relative inline-flex items-center px-3 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                                                    Next
                                                </button>
                                            </nav>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>

            {/* Add Route Modal */}
            {showAddRouteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            {/* Header */}
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">Add New Route</h2>
                                <button
                                    onClick={() => {
                                        // Reset form data when closing modal
                                        setNewRoute({
                                            train_number: '',
                                            train_name: '',
                                            from_station_code: '',
                                            from_station: '',
                                            to_station_code: '',
                                            to_station: ''
                                        })
                                        setShowAddRouteModal(false)
                                    }}
                                    className="text-gray-400 hover:text-gray-600 text-sm font-medium"
                                >
                                    Close
                                </button>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleAddRoute} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Train Number */}
                                    <div>
                                        <label htmlFor="train_number" className="block text-sm font-medium text-gray-700 mb-2">
                                            Train Number *
                                        </label>
                                        <input
                                            type="text"
                                            id="train_number"
                                            name="train_number"
                                            value={newRoute.train_number}
                                            onChange={handleNewRouteChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-black"
                                            placeholder="Enter 5-digit train number (e.g., 12345)"
                                            maxLength={5}
                                            pattern="[0-9]{5}"
                                            required
                                        />
                                    </div>

                                    {/* Train Name */}
                                    <div>
                                        <label htmlFor="train_name" className="block text-sm font-medium text-gray-700 mb-2">
                                            Train Name *
                                        </label>
                                        <input
                                            type="text"
                                            id="train_name"
                                            name="train_name"
                                            value={newRoute.train_name}
                                            onChange={handleNewRouteChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-black"
                                            placeholder="e.g., Mumbai Express"
                                            required
                                        />
                                    </div>

                                    {/* From Station Code */}
                                    <div>
                                        <label htmlFor="from_station_code" className="block text-sm font-medium text-gray-700 mb-2">
                                            From Station Code *
                                        </label>
                                        <input
                                            type="text"
                                            id="from_station_code"
                                            name="from_station_code"
                                            value={newRoute.from_station_code}
                                            onChange={handleNewRouteChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-black"
                                            placeholder="e.g., CSMT"
                                            required
                                        />
                                    </div>

                                    {/* From Station Name */}
                                    <div>
                                        <label htmlFor="from_station" className="block text-sm font-medium text-gray-700 mb-2">
                                            From Station Name *
                                        </label>
                                        <input
                                            type="text"
                                            id="from_station"
                                            name="from_station"
                                            value={newRoute.from_station}
                                            onChange={handleNewRouteChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-black"
                                            placeholder="e.g., Chhatrapati Shivaji Maharaj Terminus"
                                            required
                                        />
                                    </div>

                                    {/* To Station Code */}
                                    <div>
                                        <label htmlFor="to_station_code" className="block text-sm font-medium text-gray-700 mb-2">
                                            To Station Code *
                                        </label>
                                        <input
                                            type="text"
                                            id="to_station_code"
                                            name="to_station_code"
                                            value={newRoute.to_station_code}
                                            onChange={handleNewRouteChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-black"
                                            placeholder="e.g., PNBE"
                                            required
                                        />
                                    </div>

                                    {/* To Station Name */}
                                    <div>
                                        <label htmlFor="to_station" className="block text-sm font-medium text-gray-700 mb-2">
                                            To Station Name *
                                        </label>
                                        <input
                                            type="text"
                                            id="to_station"
                                            name="to_station"
                                            value={newRoute.to_station}
                                            onChange={handleNewRouteChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-black"
                                            placeholder="e.g., Patna Junction"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            // Reset form data when canceling
                                            setNewRoute({
                                                train_number: '',
                                                train_name: '',
                                                from_station_code: '',
                                                from_station: '',
                                                to_station_code: '',
                                                to_station: ''
                                            })
                                            setShowAddRouteModal(false)
                                        }}
                                        className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                                        disabled={addingRoute}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={addingRoute}
                                    >
                                        {addingRoute ? 'Adding...' : 'Add Route'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && routeToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                        <div className="p-6">
                            {/* Header */}
                            <div className="flex items-center mb-4">
                                <div className="flex-shrink-0">
                                    <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-lg font-medium text-gray-900">Delete Route</h3>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="mb-6">
                                <p className="text-sm text-gray-500">
                                    Are you sure you want to delete route <span className="font-semibold text-gray-900">{routeToDelete.trainNumber}</span>?
                                    This action cannot be undone.
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={cancelDeleteRoute}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                                    disabled={deletingRoute}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDeleteRoute}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={deletingRoute}
                                >
                                    {deletingRoute ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Clear All Routes Confirmation Modal */}
            {showClearAllModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                        <div className="p-6">
                            {/* Header */}
                            <div className="flex items-center mb-4">
                                <div className="flex-shrink-0">
                                    <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-lg font-medium text-gray-900">Clear All Routes</h3>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="mb-6">
                                <p className="text-sm text-gray-500">
                                    Are you sure you want to delete all <span className="font-semibold text-gray-900">{trainRoutes.length}</span> train routes?
                                    This action cannot be undone and will permanently remove all route data.
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={cancelClearAllRoutes}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                                    disabled={clearing}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmClearAllRoutes}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={clearing}
                                >
                                    {clearing ? 'Clearing...' : 'Clear All'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Route Modal */}
            {showEditModal && routeToEdit && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            {/* Header */}
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">Edit Route</h2>
                                <button
                                    onClick={cancelEditRoute}
                                    className="text-gray-400 hover:text-gray-600 text-sm font-medium"
                                >
                                    Close
                                </button>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleEditRouteSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Train Number */}
                                    <div>
                                        <label htmlFor="edit_train_number" className="block text-sm font-medium text-gray-700 mb-2">
                                            Train Number *
                                        </label>
                                        <input
                                            type="text"
                                            id="edit_train_number"
                                            name="train_number"
                                            value={newRoute.train_number}
                                            onChange={handleNewRouteChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-black"
                                            placeholder="Enter 5-digit train number (e.g., 12345)"
                                            maxLength={5}
                                            pattern="[0-9]{5}"
                                            required
                                        />
                                    </div>

                                    {/* Train Name */}
                                    <div>
                                        <label htmlFor="edit_train_name" className="block text-sm font-medium text-gray-700 mb-2">
                                            Train Name *
                                        </label>
                                        <input
                                            type="text"
                                            id="edit_train_name"
                                            name="train_name"
                                            value={newRoute.train_name}
                                            onChange={handleNewRouteChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-black"
                                            placeholder="e.g., Mumbai Express"
                                            required
                                        />
                                    </div>

                                    {/* From Station Code */}
                                    <div>
                                        <label htmlFor="edit_from_station_code" className="block text-sm font-medium text-gray-700 mb-2">
                                            From Station Code *
                                        </label>
                                        <input
                                            type="text"
                                            id="edit_from_station_code"
                                            name="from_station_code"
                                            value={newRoute.from_station_code}
                                            onChange={handleNewRouteChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-black"
                                            placeholder="e.g., CSMT"
                                            required
                                        />
                                    </div>

                                    {/* From Station Name */}
                                    <div>
                                        <label htmlFor="edit_from_station" className="block text-sm font-medium text-gray-700 mb-2">
                                            From Station Name *
                                        </label>
                                        <input
                                            type="text"
                                            id="edit_from_station"
                                            name="from_station"
                                            value={newRoute.from_station}
                                            onChange={handleNewRouteChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-black"
                                            placeholder="e.g., Chhatrapati Shivaji Maharaj Terminus"
                                            required
                                        />
                                    </div>

                                    {/* To Station Code */}
                                    <div>
                                        <label htmlFor="edit_to_station_code" className="block text-sm font-medium text-gray-700 mb-2">
                                            To Station Code *
                                        </label>
                                        <input
                                            type="text"
                                            id="edit_to_station_code"
                                            name="to_station_code"
                                            value={newRoute.to_station_code}
                                            onChange={handleNewRouteChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-black"
                                            placeholder="e.g., PNBE"
                                            required
                                        />
                                    </div>

                                    {/* To Station Name */}
                                    <div>
                                        <label htmlFor="edit_to_station" className="block text-sm font-medium text-gray-700 mb-2">
                                            To Station Name *
                                        </label>
                                        <input
                                            type="text"
                                            id="edit_to_station"
                                            name="to_station"
                                            value={newRoute.to_station}
                                            onChange={handleNewRouteChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-black"
                                            placeholder="e.g., Patna Junction"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                                    <button
                                        type="button"
                                        onClick={cancelEditRoute}
                                        className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                                        disabled={editingRoute}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={editingRoute}
                                    >
                                        {editingRoute ? 'Updating...' : 'Update Route'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Import Routes Modal */}
            {showImportModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            {/* Header */}
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">Import Train Routes</h2>
                                <button
                                    onClick={cancelImport}
                                    className="text-gray-400 hover:text-gray-600 text-sm font-medium"
                                >
                                    Close
                                </button>
                            </div>

                            <div className="space-y-8">
                                {/* File Upload Section */}
                                <div className="flex justify-center">
                                    <div className="w-full max-w-md">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Upload Excel File</h3>

                                        {/* Drag and Drop Area - Centered and Smaller */}
                                        <div
                                            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${dragActive
                                                ? 'border-teal-500 bg-teal-50'
                                                : 'border-gray-300 hover:border-gray-400'
                                                }`}
                                            onDragEnter={handleDrag}
                                            onDragLeave={handleDrag}
                                            onDragOver={handleDrag}
                                            onDrop={handleDrop}
                                        >
                                            <svg className="mx-auto h-10 w-10 text-gray-400 mb-3" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                            <p className="text-base text-gray-600 mb-2">
                                                Drag & drop your .xlsx file here
                                            </p>
                                            <p className="text-sm text-gray-500 mb-3">or</p>

                                            <input
                                                type="file"
                                                accept=".xlsx"
                                                onChange={handleFileInput}
                                                className="hidden"
                                                id="file-upload"
                                            />
                                            <label
                                                htmlFor="file-upload"
                                                className="inline-flex items-center px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors cursor-pointer text-sm"
                                            >
                                                Browse File
                                            </label>

                                            {selectedFile && (
                                                <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                                                    <div className="flex items-center justify-center">
                                                        <svg className="h-4 w-4 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        <span className="text-xs text-green-700 font-medium">{selectedFile.name}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex justify-center space-x-3 mt-6">
                                            <button
                                                onClick={cancelImport}
                                                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                                                disabled={importingRoutes}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleImportSubmit}
                                                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                                disabled={importingRoutes || !selectedFile}
                                            >
                                                {importingRoutes ? 'Importing...' : 'Import Routes'}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Excel Format Example - Below the drag & drop zone */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Excel Format Example</h3>
                                    <p className="text-sm text-gray-600 mb-4 text-center">
                                        Your Excel file should have the following columns in the first row:
                                    </p>

                                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full text-sm">
                                                <thead>
                                                    <tr className="bg-gray-100">
                                                        <th className="px-3 py-2 text-left font-semibold text-gray-700">Train Number</th>
                                                        <th className="px-3 py-2 text-left font-semibold text-gray-700">Train Name</th>
                                                        <th className="px-3 py-2 text-left font-semibold text-gray-700">From Station Code</th>
                                                        <th className="px-3 py-2 text-left font-semibold text-gray-700">From Station</th>
                                                        <th className="px-3 py-2 text-left font-semibold text-gray-700">To Station Code</th>
                                                        <th className="px-3 py-2 text-left font-semibold text-gray-700">To Station</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr>
                                                        <td className="px-3 py-2 border-b border-gray-200 text-black">12345</td>
                                                        <td className="px-3 py-2 border-b border-gray-200 text-black">Mumbai Express</td>
                                                        <td className="px-3 py-2 border-b border-gray-200 text-black">CSMT</td>
                                                        <td className="px-3 py-2 border-b border-gray-200 text-black">Chhatrapati Shivaji Maharaj Terminus</td>
                                                        <td className="px-3 py-2 border-b border-gray-200 text-black">PNBE</td>
                                                        <td className="px-3 py-2 border-b border-gray-200 text-black">Patna Junction</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}