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
    is_translated: boolean
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
    const [showTranslationModal, setShowTranslationModal] = useState(false)
    const [translatingRoute, setTranslatingRoute] = useState<TrainRoute | null>(null)
    const [translationProgress, setTranslationProgress] = useState({
        step: '',
        progress: 0,
        isComplete: false,
        error: null as string | null
    })
    const [showAddRouteProgressModal, setShowAddRouteProgressModal] = useState(false)
    const [addRouteProgress, setAddRouteProgress] = useState({
        step: '',
        progress: 0,
        isComplete: false,
        error: null as string | null
    })
    const [showEditRouteProgressModal, setShowEditRouteProgressModal] = useState(false)
    const [editRouteProgress, setEditRouteProgress] = useState({
        step: '',
        progress: 0,
        isComplete: false,
        error: null as string | null
    })
    const [showImportProgressModal, setShowImportProgressModal] = useState(false)
    const [importProgress, setImportProgress] = useState({
        step: '',
        progress: 0,
        isComplete: false,
        error: null as string | null,
        importedCount: 0,
        skippedCount: 0,
        totalCount: 0
    })
    const [newRoute, setNewRoute] = useState({
        train_number: '',
        train_name: '',
        from_station_code: '',
        from_station: '',
        to_station_code: '',
        to_station: ''
    })
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage] = useState(10)

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

    // Fetch train routes function
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

    // Fetch train routes on component mount
    useEffect(() => {
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
        // Reset to first page when search changes
        setCurrentPage(1)
    }, [searchQuery, trainRoutes])

    // Pagination calculations
    const totalPages = Math.ceil(filteredRoutes.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const currentRoutes = filteredRoutes.slice(startIndex, endIndex)

    // Pagination navigation functions
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

        // Check if any translatable fields have changed
        const translatableFields = ['train_name', 'from_station', 'to_station']
        const hasTranslatableChanges = translatableFields.some(field =>
            routeToEdit[field as keyof TrainRoute] !== newRoute[field as keyof typeof newRoute]
        )

        setEditingRoute(true)

        // Show progress modal if translatable fields changed, otherwise use simple toast
        let loadingToast: string | undefined
        if (hasTranslatableChanges) {
            setShowEditRouteProgressModal(true)
            setEditRouteProgress({ step: 'Validating route data...', progress: 0, isComplete: false, error: null })
        } else {
            loadingToast = toast.loading('Updating route...')
        }

        try {
            const apiUrl = window.location.hostname === 'localhost'
                ? 'https://localhost:5001'
                : 'https://192.168.1.10:5001'

            const accessToken = localStorage.getItem('accessToken')

            // Simulate progress steps if showing progress modal
            if (hasTranslatableChanges) {
                const progressSteps = [
                    { step: 'Validating route data...', progress: 10 },
                    { step: 'Updating route information...', progress: 30 },
                    { step: 'Generating translations...', progress: 70 },
                    { step: 'Finalizing...', progress: 90 }
                ]

                for (const step of progressSteps) {
                    setEditRouteProgress(prev => ({ ...prev, ...step }))
                    await new Promise(resolve => setTimeout(resolve, 500))
                }
            }

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

                if (hasTranslatableChanges) {
                    // Update progress modal
                    setEditRouteProgress(prev => ({
                        ...prev,
                        step: 'Route updated successfully!',
                        progress: 100,
                        isComplete: true,
                        error: null
                    }))

                    // Auto-close modal after success
                    setTimeout(() => {
                        setShowEditRouteProgressModal(false)
                        setEditRouteProgress({ step: '', progress: 0, isComplete: false, error: null })

                        // Reset form and close edit modal
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

                        toast.success('Route updated and translations regenerated!')
                    }, 1500)
                } else {
                    // Simple toast for non-translatable changes
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
                }
            } else {
                const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }))

                if (hasTranslatableChanges) {
                    setEditRouteProgress(prev => ({
                        ...prev,
                        step: 'Failed to update route',
                        error: errorData.detail || 'Unknown error'
                    }))
                } else {
                    toast.dismiss(loadingToast)
                    toast.error(errorData.detail || 'Failed to update route')
                }
            }
        } catch (error) {
            console.error('Error updating route:', error)

            if (hasTranslatableChanges) {
                setEditRouteProgress(prev => ({
                    ...prev,
                    step: 'Failed to update route',
                    error: 'Network error occurred'
                }))
            } else {
                toast.dismiss(loadingToast)
                toast.error('Failed to update route')
            }
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
        setShowImportProgressModal(true)
        setImportProgress({
            step: 'Validating file...',
            progress: 0,
            isComplete: false,
            error: null,
            importedCount: 0,
            skippedCount: 0,
            totalCount: 0
        })

        try {
            const apiUrl = window.location.hostname === 'localhost'
                ? 'https://localhost:5001'
                : 'https://192.168.1.10:5001'

            const accessToken = localStorage.getItem('accessToken')

            // Simulate progress steps
            const progressSteps = [
                { step: 'Validating file...', progress: 10 },
                { step: 'Processing routes...', progress: 30 },
                { step: 'Checking existing routes...', progress: 50 },
                { step: 'Generating translations...', progress: 80 },
                { step: 'Finalizing import...', progress: 90 }
            ]

            for (const step of progressSteps) {
                setImportProgress(prev => ({ ...prev, ...step }))
                await new Promise(resolve => setTimeout(resolve, 800))
            }

            const formData = new FormData()
            formData.append('file', selectedFile)

            const response = await fetch(`${apiUrl}/api/v1/train-routes/import`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                },
                body: formData
            })

            if (response.ok) {
                const result = await response.json()

                // Update progress with actual results
                setImportProgress(prev => ({
                    ...prev,
                    step: 'Import completed successfully!',
                    progress: 100,
                    isComplete: true,
                    error: null,
                    importedCount: result.imported_count || 0,
                    skippedCount: result.skipped_count || 0,
                    totalCount: result.total_count || 0
                }))

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

                // Auto-close modal after success
                setTimeout(() => {
                    setShowImportProgressModal(false)
                    setImportProgress({
                        step: '',
                        progress: 0,
                        isComplete: false,
                        error: null,
                        importedCount: 0,
                        skippedCount: 0,
                        totalCount: 0
                    })

                    // Close import modal and reset
                    setShowImportModal(false)
                    setSelectedFile(null)

                    // Show success toast with detailed results
                    const imported = result.imported_count || 0
                    const skipped = result.skipped_count || 0
                    if (skipped > 0) {
                        toast.success(`Import completed! ${imported} routes imported, ${skipped} existing routes skipped.`)
                    } else {
                        toast.success(`Successfully imported ${imported} routes with translations!`)
                    }
                }, 2000)
            } else {
                const errorData = await response.json().catch(() => ({ detail: 'Import failed' }))
                setImportProgress(prev => ({
                    ...prev,
                    step: 'Import failed',
                    error: errorData.detail || 'Failed to import routes'
                }))
            }
        } catch (error) {
            console.error('Error importing routes:', error)
            setImportProgress(prev => ({
                ...prev,
                step: 'Import failed',
                error: 'Network error occurred'
            }))
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

        // Show progress modal
        setShowAddRouteProgressModal(true)
        setAddRouteProgress({
            step: 'Validating route data...',
            progress: 0,
            isComplete: false,
            error: null
        })

        try {
            // Simulate progress steps
            const progressSteps = [
                { step: 'Validating route data...', progress: 20 },
                { step: 'Creating train route...', progress: 40 },
                { step: 'Generating translations...', progress: 70 },
                { step: 'Finalizing...', progress: 90 }
            ]

            // Simulate progress
            for (const step of progressSteps) {
                setAddRouteProgress(prev => ({
                    ...prev,
                    step: step.step,
                    progress: step.progress
                }))
                await new Promise(resolve => setTimeout(resolve, 500))
            }

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

                // Complete progress
                setAddRouteProgress(prev => ({
                    ...prev,
                    step: 'Route added successfully!',
                    progress: 100,
                    isComplete: true
                }))

                // Wait a moment to show completion
                await new Promise(resolve => setTimeout(resolve, 1000))

                // Close progress modal and reset form
                setShowAddRouteProgressModal(false)
                setNewRoute({
                    train_number: '',
                    train_name: '',
                    from_station_code: '',
                    from_station: '',
                    to_station_code: '',
                    to_station: ''
                })
                setShowAddRouteModal(false)

                toast.success('Route added successfully!')
            } else {
                const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }))
                setAddRouteProgress(prev => ({
                    ...prev,
                    step: 'Failed to add route',
                    error: errorData.detail || 'Unknown error'
                }))
            }
        } catch (error) {
            console.error('Error adding route:', error)
            setAddRouteProgress(prev => ({
                ...prev,
                step: 'Failed to add route',
                error: 'Network error occurred'
            }))
        } finally {
            setAddingRoute(false)
        }
    }

    // Handle delete route confirmation
    const handleDeleteRoute = (routeId: number, trainNumber: string) => {
        setRouteToDelete({ id: routeId, trainNumber })
        setShowDeleteModal(true)
    }

    // Handle translate route
    const handleTranslateRoute = async (route: TrainRoute) => {
        setTranslatingRoute(route)
        setShowTranslationModal(true)
        setTranslationProgress({
            step: 'Initializing translation...',
            progress: 0,
            isComplete: false,
            error: null
        })

        try {
            // Simulate progress steps
            const progressSteps = [
                { step: 'Connecting to AI service...', progress: 20 },
                { step: 'Translating train name...', progress: 40 },
                { step: 'Translating from station...', progress: 60 },
                { step: 'Translating to station...', progress: 80 },
                { step: 'Saving translations...', progress: 90 }
            ]

            // Simulate progress
            for (const progressStep of progressSteps) {
                setTranslationProgress(prev => ({
                    ...prev,
                    step: progressStep.step,
                    progress: progressStep.progress
                }))
                await new Promise(resolve => setTimeout(resolve, 800))
            }

            const translationRequest = {
                train_route_id: route.id,
                train_name_en: route.train_name,
                from_station_en: route.from_station,
                to_station_en: route.to_station,
                source_language_code: "en"
            }

            const response = await fetch('https://localhost:5001/api/v1/train-route-translations/translate-and-save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(translationRequest)
            })

            if (response.ok) {
                setTranslationProgress(prev => ({
                    ...prev,
                    step: 'Translation completed successfully!',
                    progress: 100,
                    isComplete: true
                }))

                // Wait a moment to show completion, then close modal and refresh
                setTimeout(() => {
                    setShowTranslationModal(false)
                    setTranslatingRoute(null)
                    setTranslationProgress({
                        step: '',
                        progress: 0,
                        isComplete: false,
                        error: null
                    })
                    toast.success(`Translation generated for ${route.train_number}`)
                    fetchTrainRoutes()
                }, 1500)
            } else {
                const errorData = await response.json()
                setTranslationProgress(prev => ({
                    ...prev,
                    step: 'Translation failed',
                    error: errorData.detail || 'Failed to generate translation'
                }))
            }
        } catch (error) {
            console.error('Error generating translation:', error)
            setTranslationProgress(prev => ({
                ...prev,
                step: 'Translation failed',
                error: 'Failed to generate translation'
            }))
        }
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
                <aside className="fixed left-0 top-16 bottom-0 bg-white border-r border-gray-200 w-fit min-w-64 max-w-80 z-30 overflow-y-auto">
                    <nav className="p-4 pt-8 space-y-2 w-full">
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
                            <Link href="/general-announcements" className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
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
                    <div className="max-w-6xl mx-auto">
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
                                            {currentRoutes.map((route) => (
                                                <tr key={route.id} className={`hover:bg-gray-50 transition-colors ${!route.is_translated ? 'bg-yellow-50 border-l-4 border-yellow-400' : ''}`}>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center space-x-2">
                                                            <div className="text-sm font-medium text-gray-900">{route.train_number}</div>
                                                            {!route.is_translated && (
                                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800" title="Translation needed">
                                                                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                                    </svg>
                                                                    Not Translated
                                                                </span>
                                                            )}
                                                        </div>
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
                                                            {!route.is_translated && (
                                                                <button
                                                                    onClick={() => handleTranslateRoute(route)}
                                                                    className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded transition-colors"
                                                                    title="Generate Translation"
                                                                >
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                                                                    </svg>
                                                                </button>
                                                            )}
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
                                        <button 
                                            onClick={goToPreviousPage}
                                            disabled={currentPage === 1}
                                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Previous
                                        </button>
                                        <button 
                                            onClick={goToNextPage}
                                            disabled={currentPage === totalPages}
                                            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Next
                                        </button>
                                    </div>
                                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                        <div>
                                            <p className="text-sm text-gray-700">
                                                Showing <span className="font-medium">{startIndex + 1}</span> to <span className="font-medium">{Math.min(endIndex, filteredRoutes.length)}</span> of{' '}
                                                <span className="font-medium">{filteredRoutes.length}</span> results
                                            </p>
                                        </div>
                                        <div>
                                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                                <button 
                                                    onClick={goToPreviousPage}
                                                    disabled={currentPage === 1}
                                                    className="relative inline-flex items-center px-3 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Previous
                                                </button>
                                                
                                                {/* Page numbers */}
                                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                                                    // Show first page, last page, current page, and pages around current page
                                                    const shouldShow = 
                                                        page === 1 || 
                                                        page === totalPages || 
                                                        (page >= currentPage - 1 && page <= currentPage + 1)
                                                    
                                                    if (!shouldShow) {
                                                        // Show ellipsis for gaps
                                                        if (page === currentPage - 2 || page === currentPage + 2) {
                                                            return (
                                                                <span key={page} className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                                                    ...
                                                                </span>
                                                            )
                                                        }
                                                        return null
                                                    }
                                                    
                                                    return (
                                                        <button
                                                            key={page}
                                                            onClick={() => goToPage(page)}
                                                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                                                page === currentPage
                                                                    ? 'z-10 bg-teal-50 border-teal-500 text-teal-600'
                                                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                            }`}
                                                        >
                                                            {page}
                                                        </button>
                                                    )
                                                })}
                                                
                                                <button 
                                                    onClick={goToNextPage}
                                                    disabled={currentPage === totalPages}
                                                    className="relative inline-flex items-center px-3 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
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

                            {/* File Upload Area */}
                            <div className="mb-8">

                                {/* Drag and Drop Area - Centered and Smaller */}
                                <div
                                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive
                                        ? 'border-teal-500 bg-teal-50'
                                        : 'border-gray-300 hover:border-gray-400'
                                        }`}
                                    onDragEnter={handleDrag}
                                    onDragLeave={handleDrag}
                                    onDragOver={handleDrag}
                                    onDrop={handleDrop}
                                >
                                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                                    </svg>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Excel File</h3>
                                    <p className="text-gray-600 mb-4">
                                        Drag and drop your Excel file here, or click to browse
                                    </p>

                                    <input
                                        type="file"
                                        accept=".xlsx,.xls"
                                        onChange={handleFileInput}
                                        className="hidden"
                                        id="file-upload"
                                    />
                                    <label
                                        htmlFor="file-upload"
                                        className="inline-flex items-center px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors cursor-pointer"
                                    >
                                        Choose File
                                    </label>

                                    {selectedFile && (
                                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                            <p className="text-sm text-gray-700">
                                                Selected: <span className="font-medium">{selectedFile.name}</span>
                                            </p>
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

                            {/* Excel Format Example */}
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
                                                    <td className="px-3 py-2 border-b border-gray-200 text-gray-900">12345</td>
                                                    <td className="px-3 py-2 border-b border-gray-200 text-gray-900">Mumbai Express</td>
                                                    <td className="px-3 py-2 border-b border-gray-200 text-gray-900">CSMT</td>
                                                    <td className="px-3 py-2 border-b border-gray-200 text-gray-900">Chhatrapati Shivaji Maharaj Terminus</td>
                                                    <td className="px-3 py-2 border-b border-gray-200 text-gray-900">PNBE</td>
                                                    <td className="px-3 py-2 border-b border-gray-200 text-gray-900">Patna Junction</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Route Progress Modal */}
            {showAddRouteProgressModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                        <div className="p-6">
                            {/* Header */}
                            <div className="flex items-center mb-6">
                                <div className="flex-shrink-0">
                                    <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                                        <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <h3 className="text-lg font-medium text-gray-900">Adding Route</h3>
                                    <p className="text-sm text-gray-500">Train: {newRoute.train_number}</p>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="mb-6">
                                <div className="flex justify-between text-sm text-gray-600 mb-2">
                                    <span>{addRouteProgress.step}</span>
                                    <span>{addRouteProgress.progress}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full transition-all duration-500 ${addRouteProgress.isComplete
                                            ? 'bg-green-500'
                                            : addRouteProgress.error
                                                ? 'bg-red-500'
                                                : 'bg-teal-500'
                                            }`}
                                        style={{ width: `${addRouteProgress.progress}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Status Message */}
                            <div className="mb-6">
                                {addRouteProgress.error ? (
                                    <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
                                        <svg className="w-5 h-5 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <div>
                                            <p className="text-sm font-medium text-red-800">Error</p>
                                            <p className="text-sm text-red-600">{addRouteProgress.error}</p>
                                        </div>
                                    </div>
                                ) : addRouteProgress.isComplete ? (
                                    <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg">
                                        <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        <div>
                                            <p className="text-sm font-medium text-green-800">Success</p>
                                            <p className="text-sm text-green-600">Route added successfully with translations!</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center p-3 bg-teal-50 border border-teal-200 rounded-lg">
                                        <svg className="w-5 h-5 text-teal-500 mr-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        <div>
                                            <p className="text-sm font-medium text-teal-800">Processing</p>
                                            <p className="text-sm text-teal-600">Please wait while we add your route...</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            {addRouteProgress.error && (
                                <div className="flex justify-end space-x-3">
                                    <button
                                        onClick={() => {
                                            setShowAddRouteProgressModal(false)
                                            setAddRouteProgress({
                                                step: '',
                                                progress: 0,
                                                isComplete: false,
                                                error: null
                                            })
                                        }}
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

            {/* Edit Route Progress Modal */}
            {showEditRouteProgressModal && routeToEdit && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                        <div className="p-6">
                            {/* Header */}
                            <div className="flex items-center mb-6">
                                <div className="flex-shrink-0">
                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <h3 className="text-lg font-medium text-gray-900">Updating Route</h3>
                                    <p className="text-sm text-gray-500">Train: {routeToEdit.train_number}</p>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="mb-6">
                                <div className="flex justify-between text-sm text-gray-600 mb-2">
                                    <span>{editRouteProgress.step}</span>
                                    <span>{editRouteProgress.progress}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full transition-all duration-500 ${editRouteProgress.isComplete
                                            ? 'bg-green-500'
                                            : editRouteProgress.error
                                                ? 'bg-red-500'
                                                : 'bg-blue-500'
                                            }`}
                                        style={{ width: `${editRouteProgress.progress}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Status Message */}
                            <div className="mb-6">
                                {editRouteProgress.error ? (
                                    <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
                                        <svg className="w-5 h-5 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <div>
                                            <p className="text-sm font-medium text-red-800">Error</p>
                                            <p className="text-sm text-red-600">{editRouteProgress.error}</p>
                                        </div>
                                    </div>
                                ) : editRouteProgress.isComplete ? (
                                    <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg">
                                        <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        <div>
                                            <p className="text-sm font-medium text-green-800">Success</p>
                                            <p className="text-sm text-green-600">Route updated and translations regenerated!</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                        <svg className="w-5 h-5 text-blue-500 mr-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        <div>
                                            <p className="text-sm font-medium text-blue-800">Processing</p>
                                            <p className="text-sm text-blue-600">Please wait while we update your route...</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            {editRouteProgress.error && (
                                <div className="flex justify-end space-x-3">
                                    <button
                                        onClick={() => {
                                            setShowEditRouteProgressModal(false)
                                            setEditRouteProgress({
                                                step: '',
                                                progress: 0,
                                                isComplete: false,
                                                error: null
                                            })
                                        }}
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

            {/* Import Progress Modal */}
            {showImportProgressModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                        <div className="p-6">
                            {/* Header */}
                            <div className="flex items-center mb-6">
                                <div className="flex-shrink-0">
                                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                                        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <h3 className="text-lg font-medium text-gray-900">Importing Routes</h3>
                                    <p className="text-sm text-gray-500">File: {selectedFile?.name}</p>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="mb-6">
                                <div className="flex justify-between text-sm text-gray-600 mb-2">
                                    <span>{importProgress.step}</span>
                                    <span>{importProgress.progress}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full transition-all duration-500 ${importProgress.isComplete
                                            ? 'bg-green-500'
                                            : importProgress.error
                                                ? 'bg-red-500'
                                                : 'bg-purple-500'
                                            }`}
                                        style={{ width: `${importProgress.progress}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Import Results */}
                            {importProgress.isComplete && (
                                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                                    <div className="flex items-center mb-3">
                                        <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <h4 className="text-sm font-medium text-green-800">Import Summary</h4>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-green-700">Total Processed:</span>
                                            <span className="font-medium text-green-800">{importProgress.totalCount}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-green-700">Successfully Imported:</span>
                                            <span className="font-medium text-green-800">{importProgress.importedCount}</span>
                                        </div>
                                        {importProgress.skippedCount > 0 && (
                                            <div className="flex justify-between">
                                                <span className="text-green-700">Skipped (Already Exist):</span>
                                                <span className="font-medium text-green-800">{importProgress.skippedCount}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Status Message */}
                            <div className="mb-6">
                                {importProgress.error ? (
                                    <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
                                        <svg className="w-5 h-5 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <div>
                                            <p className="text-sm font-medium text-red-800">Error</p>
                                            <p className="text-sm text-red-600">{importProgress.error}</p>
                                        </div>
                                    </div>
                                ) : importProgress.isComplete ? (
                                    <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg">
                                        <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        <div>
                                            <p className="text-sm font-medium text-green-800">Success</p>
                                            <p className="text-sm text-green-600">Routes imported with translations!</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center p-3 bg-purple-50 border border-purple-200 rounded-lg">
                                        <svg className="w-5 h-5 text-purple-500 mr-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        <div>
                                            <p className="text-sm font-medium text-purple-800">Processing</p>
                                            <p className="text-sm text-purple-600">Please wait while we import your routes...</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            {importProgress.error && (
                                <div className="flex justify-end space-x-3">
                                    <button
                                        onClick={() => {
                                            setShowImportProgressModal(false)
                                            setImportProgress({
                                                step: '',
                                                progress: 0,
                                                isComplete: false,
                                                error: null,
                                                importedCount: 0,
                                                skippedCount: 0,
                                                totalCount: 0
                                            })
                                        }}
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

            {/* Translation Progress Modal */}
            {showTranslationModal && translatingRoute && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                        <div className="p-6">
                            {/* Header */}
                            <div className="flex items-center mb-6">
                                <div className="flex-shrink-0">
                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <h3 className="text-lg font-medium text-gray-900">Generating Translation</h3>
                                    <p className="text-sm text-gray-500">Train: {translatingRoute.train_number}</p>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="mb-6">
                                <div className="flex justify-between text-sm text-gray-600 mb-2">
                                    <span>{translationProgress.step}</span>
                                    <span>{translationProgress.progress}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full transition-all duration-500 ${translationProgress.isComplete
                                            ? 'bg-green-500'
                                            : translationProgress.error
                                                ? 'bg-red-500'
                                                : 'bg-blue-500'
                                            }`}
                                        style={{ width: `${translationProgress.progress}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Status Message */}
                            <div className="mb-6">
                                {translationProgress.error ? (
                                    <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
                                        <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span className="text-sm text-red-700">{translationProgress.error}</span>
                                    </div>
                                ) : translationProgress.isComplete ? (
                                    <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg">
                                        <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span className="text-sm text-green-700">Translation completed successfully!</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                                        <span className="text-sm text-blue-700">Processing translation...</span>
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            {translationProgress.error && (
                                <div className="flex justify-end space-x-3">
                                    <button
                                        onClick={() => {
                                            setShowTranslationModal(false)
                                            setTranslatingRoute(null)
                                            setTranslationProgress({
                                                step: '',
                                                progress: 0,
                                                isComplete: false,
                                                error: null
                                            })
                                        }}
                                        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors duration-200"
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