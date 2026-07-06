import { useEffect, useMemo, useState } from 'react'
import keycloak from './auth/keycloak'
import { apiClient, utilityClient, mcpClient, getErrorMessage } from './api/apiClient'

function formatDate(date) {
    return date.toISOString().split('T')[0]
}

function addDays(days) {
    const date = new Date()
    date.setDate(date.getDate() + days)
    return formatDate(date)
}

function createInitialTripForm() {
    return {
        userId: 'demo-user',
        destination: 'Paris',
        startDate: addDays(1),
        endDate: addDays(6),
        budget: 800,
        currency: 'EUR'
    }
}

function moneyNumber(value) {
    if (value === null || value === undefined || value === '') {
        return 0
    }

    if (typeof value === 'object') {
        return Number(
            value.total ??
            value.totalCost ??
            value.estimatedCost ??
            value.amount ??
            value.cost ??
            0
        )
    }

    return Number(value || 0)
}

function formatMoney(value) {
    const amount = moneyNumber(value)

    return `${new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(Number.isNaN(amount) ? 0 : amount)} EURO`
}

function displayCurrency(currency) {
    if (!currency) return ''
    return currency === 'EUR' ? 'EURO' : currency
}

function normalizeJsonForDisplay(value) {
    if (Array.isArray(value)) {
        return value.map(normalizeJsonForDisplay)
    }

    if (value && typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value).map(([key, entry]) => [key, normalizeJsonForDisplay(entry)])
        )
    }

    if (value === 'EUR') {
        return 'EURO'
    }

    return value
}

function getRecommendationSource(recommendation) {
    if (recommendation?.source?.toLowerCase().includes('geoapify')) {
        return 'Live API'
    }

    if (recommendation?.externalPlaceId) {
        return 'Live API'
    }

    return 'Seed Data'
}

function getRecommendationSourceClass(recommendation) {
    return getRecommendationSource(recommendation) === 'Live API' ? 'source-live' : 'source-seed'
}

const pages = [
    { id: 'dashboard', label: 'Dashboard', icon: '◈' },
    { id: 'trips', label: 'Trips', icon: '✦' },
    { id: 'recommendations', label: 'Recommendations', icon: '◆' },
    { id: 'saved', label: 'Saved & Cost', icon: '◇' },
    { id: 'mcp', label: 'MCP Tester', icon: '✧' },
    { id: 'system', label: 'SOA Proof', icon: '●' }
]

const proofItems = [
    {
        title: 'Microservice Architecture',
        requirement: 'System composed of independent services.',
        implementation: 'trip-service and recommendation-service are independent Spring Boot microservices.',
        test: 'Create trip, search recommendations, verify separate containers and separate databases.'
    },
    {
        title: 'Domain-Driven Design',
        requirement: 'Natural split into bounded contexts and responsibilities.',
        implementation: 'Trip context handles trip planning. Recommendation context handles places, hotels, restaurants and saved recommendations.',
        test: 'Inspect packages: model, repository, service, web/dto/event in each microservice.'
    },
    {
        title: 'API Gateway',
        requirement: 'Centralized entry point and request routing.',
        implementation: 'api-gateway routes /api/trips/** and /api/recommendations/** to the correct services.',
        test: 'All frontend business requests go through /api/... on the gateway.'
    },
    {
        title: 'External Places API Integration',
        requirement: 'External data integration with clean service responsibility.',
        implementation: 'Recommendation Service integrates Geoapify Places API. The frontend never calls Geoapify directly.',
        test: 'Search Paris to show Seed Data, then search Rome or Berlin to show Live API results.'
    },
    {
        title: 'External API Fallback and Deduplication',
        requirement: 'Reliable data handling when external providers are used.',
        implementation: 'The service uses Seed Data first, Live API fallback, and stores live records with externalPlaceId.',
        test: 'Search the same live destination twice and verify that database IDs do not duplicate.'
    },
    {
        title: 'Security with Keycloak',
        requirement: 'Authentication and authorization.',
        implementation: 'Frontend uses Keycloak login and sends JWT bearer token to protected backend endpoints.',
        test: 'Logout and try protected actions. Direct /api/trips without token returns 401.'
    },
    {
        title: 'Service Discovery with Consul',
        requirement: 'Services register and discover each other.',
        implementation: 'api-gateway, trip-service, recommendation-service and mcp-server register in Consul.',
        test: 'Open Consul UI and verify all services are registered and healthy.'
    },
    {
        title: 'Synchronous Communication with Feign',
        requirement: 'Inter-service communication.',
        implementation: 'Trip Service calls Recommendation Service using Feign client.',
        test: 'Use Recommendations page → Run Feign Test.'
    },
    {
        title: 'Asynchronous Communication with Kafka',
        requirement: 'Broker/event communication between services.',
        implementation: 'Trip Service publishes trip-created event; Recommendation Service consumes it.',
        test: 'Create a trip, open Kafka UI, verify trip-created topic/message and recommendation-service logs.'
    },
    {
        title: 'Consumer-Driven Contract Testing',
        requirement: 'Integration testing through Pact.',
        implementation: 'Trip Service is the consumer and Recommendation Service is the provider.',
        test: 'Run Pact consumer and provider tests from Maven.'
    },
    {
        title: 'MCP Server',
        requirement: 'Implemented and demonstrable MCP server.',
        implementation: 'MCP Server exposes travel tools and communicates with backend services through the API Gateway.',
        test: 'Use MCP Tester page and MCP Inspector.'
    },
    {
        title: 'Dockerized System',
        requirement: 'Functional system with all components running together.',
        implementation: 'Docker Compose starts frontend, gateway, services, databases, Kafka, Consul, Keycloak and MCP server.',
        test: 'Run docker compose ps and verify all containers are Up.'
    }
]

const demoFlow = [
    'Login through Keycloak as demo-user.',
    'Refresh health checks on Dashboard.',
    'Create a trip for Paris.',
    'Verify Kafka trip-created event.',
    'Search Paris recommendations to show Seed Data.',
    'Search Rome or Berlin recommendations to show Live API.',
    'Save one recommendation to the created trip.',
    'Run Feign test from Trip Service to Recommendation Service.',
    'Load saved recommendations.',
    'Estimate cost through Trip Service and Recommendation Service.',
    'Run MCP recommend_places and get_trip_details tests.',
    'Open Consul UI and verify service discovery.',
    'Run Pact contract tests from terminal.'
]

const infrastructureLinks = [
    { label: 'Frontend', url: 'http://localhost:3000' },
    { label: 'API Gateway Health', url: 'http://localhost:8080/actuator/health' },
    { label: 'Trip Service Health', url: 'http://localhost:8081/actuator/health' },
    { label: 'Recommendation Health', url: 'http://localhost:8082/actuator/health' },
    { label: 'MCP Health', url: 'http://localhost:8087/actuator/health' },
    { label: 'Consul UI', url: 'http://localhost:8500' },
    { label: 'Kafka UI', url: 'http://localhost:8085' },
    { label: 'Keycloak Admin', url: 'http://localhost:8086/admin' }
]

function StatusBadge({ value }) {
    const normalized = value || 'UNKNOWN'
    return <span className={'status-badge ' + normalized.toLowerCase()}>{normalized}</span>
}

function JsonBlock({ data }) {
    return (
        <pre className="json-block">
            {typeof data === 'string' ? data : JSON.stringify(normalizeJsonForDisplay(data), null, 2)}
        </pre>
    )
}

function EmptyState({ title, text }) {
    return (
        <div className="empty-state">
            <div className="empty-icon">⌁</div>
            <h3>{title}</h3>
            <p>{text}</p>
        </div>
    )
}

function MetricCard({ label, value }) {
    return (
        <div className="stat-card">
            <span>{label}</span>
            <strong>{value}</strong>
        </div>
    )
}

function HealthCard({ label, value }) {
    return (
        <div className="health-card">
            <span>{label}</span>
            <StatusBadge value={value} />
        </div>
    )
}

function RecommendationCard({ recommendation, onSave }) {
    return (
        <div className="recommendation-card">
            <div className="recommendation-card-top">
                <span className={`source-badge ${getRecommendationSourceClass(recommendation)}`}>
                    {getRecommendationSource(recommendation)}
                </span>

                <span className="type-badge">
                    {recommendation.type || 'UNKNOWN'}
                </span>
            </div>

            <h3>{recommendation.name || 'Unnamed recommendation'}</h3>

            <p>{recommendation.description || 'No description available.'}</p>

            <div className="recommendation-meta">
                <span>Rating: {recommendation.rating ?? 'N/A'}</span>
                <span>Price: {formatMoney(recommendation.estimatedPrice)}</span>
            </div>

            {recommendation.source && (
                <p className="source-detail">
                    Source: {recommendation.source}
                </p>
            )}

            <button
                className="button secondary full-mobile"
                type="button"
                onClick={() => onSave(recommendation.id)}
            >
                Save to Trip
            </button>
        </div>
    )
}

export default function App() {
    const [activePage, setActivePage] = useState('dashboard')
    const [toast, setToast] = useState(null)

    const [health, setHealth] = useState({
        gateway: 'UNKNOWN',
        trip: 'UNKNOWN',
        recommendation: 'UNKNOWN',
        mcp: 'UNKNOWN'
    })

    const [externalApiStatus, setExternalApiStatus] = useState(null)

    const [trips, setTrips] = useState([])
    const [tripForm, setTripForm] = useState(createInitialTripForm)
    const [selectedTripId, setSelectedTripId] = useState('')
    const [selectedTrip, setSelectedTrip] = useState(null)
    const [tripRecommendations, setTripRecommendations] = useState([])

    const [destination, setDestination] = useState('Paris')
    const [recommendationType, setRecommendationType] = useState('ATTRACTION')
    const [hotelBudget, setHotelBudget] = useState(100)
    const [recommendations, setRecommendations] = useState([])
    const [saveTripId, setSaveTripId] = useState('')

    const [savedTripId, setSavedTripId] = useState('')
    const [savedRecommendations, setSavedRecommendations] = useState([])
    const [tripCost, setTripCost] = useState(null)
    const [recommendationCost, setRecommendationCost] = useState(null)

    const [mcpDestination, setMcpDestination] = useState('Paris')
    const [mcpType, setMcpType] = useState('ATTRACTION')
    const [mcpLimit, setMcpLimit] = useState(3)
    const [mcpTripId, setMcpTripId] = useState('')
    const [mcpResult, setMcpResult] = useState(null)

    const currentUser = keycloak.tokenParsed?.preferred_username || 'authenticated-user'

    const totalBudget = useMemo(() => {
        return trips.reduce((sum, trip) => sum + Number(trip.budget || 0), 0)
    }, [trips])

    const recommendationSourceStats = useMemo(() => {
        return recommendations.reduce(
            (stats, recommendation) => {
                if (getRecommendationSource(recommendation) === 'Live API') {
                    stats.live += 1
                } else {
                    stats.seed += 1
                }

                return stats
            },
            { live: 0, seed: 0 }
        )
    }, [recommendations])

    const showToast = (type, message) => {
        setToast({ type, message })
        window.setTimeout(() => setToast(null), 4200)
    }

    const requireTripId = (id) => {
        if (!id) {
            showToast('warning', 'Enter or select a Trip ID first.')
            return false
        }

        return true
    }

    const loadHealth = async () => {
        const checks = [
            ['gateway', '/gateway-health'],
            ['trip', '/trip-health'],
            ['recommendation', '/recommendation-health'],
            ['mcp', '/mcp-health']
        ]

        const result = {
            gateway: 'UNKNOWN',
            trip: 'UNKNOWN',
            recommendation: 'UNKNOWN',
            mcp: 'UNKNOWN'
        }

        await Promise.all(
            checks.map(async ([key, url]) => {
                try {
                    const response = await utilityClient.get(url)
                    result[key] = response.data?.status || 'UP'
                } catch {
                    result[key] = 'DOWN'
                }
            })
        )

        setHealth(result)
    }

    const loadExternalApiStatus = async () => {
        try {
            const response = await apiClient.get('/recommendations/external/status')
            setExternalApiStatus(response.data)
        } catch (error) {
            setExternalApiStatus({
                provider: 'Geoapify Places API',
                enabled: false,
                apiKeyConfigured: false,
                strategy: 'Unavailable',
                deduplicationKey: 'externalPlaceId',
                backendFlow: 'Status endpoint failed'
            })

            showToast('warning', 'External API status could not be loaded: ' + getErrorMessage(error))
        }
    }

    const loadTrips = async () => {
        try {
            const response = await apiClient.get('/trips')
            const loadedTrips = response.data || []
            setTrips(loadedTrips)

            if (loadedTrips.length > 0 && !selectedTripId) {
                const firstTripId = String(loadedTrips[0].id)
                setSelectedTripId(firstTripId)
                setSaveTripId(firstTripId)
                setSavedTripId(firstTripId)
                setMcpTripId(firstTripId)
            }
        } catch (error) {
            showToast('error', 'Failed to load trips: ' + getErrorMessage(error))
        }
    }

    useEffect(() => {
        if (keycloak.authenticated) {
            loadHealth()
            loadTrips()
            loadExternalApiStatus()
        }
    }, [])

    const handleTripFormChange = (event) => {
        setTripForm({
            ...tripForm,
            [event.target.name]: event.target.value
        })
    }

    const resetTripFormToDemo = () => {
        setTripForm(createInitialTripForm())
    }

    const clearTripForm = () => {
        setTripForm({
            userId: currentUser || '',
            destination: '',
            startDate: '',
            endDate: '',
            budget: '',
            currency: 'EUR'
        })
    }

    const createTrip = async (event) => {
        event.preventDefault()

        try {
            const response = await apiClient.post('/trips', {
                ...tripForm,
                budget: Number(tripForm.budget),
                currency: 'EUR'
            })

            const created = response.data
            const createdTripId = String(created.id)

            setSelectedTripId(createdTripId)
            setSaveTripId(createdTripId)
            setSavedTripId(createdTripId)
            setMcpTripId(createdTripId)
            showToast('success', 'Trip created successfully. Kafka event should be produced.')
            await loadTrips()
        } catch (error) {
            showToast('error', 'Failed to create trip: ' + getErrorMessage(error))
        }
    }

    const loadTripDetails = async (id = selectedTripId) => {
        if (!requireTripId(id)) return

        try {
            const response = await apiClient.get('/trips/' + id)
            setSelectedTrip(response.data)
            setSelectedTripId(String(response.data.id))
            showToast('success', 'Trip details loaded.')
        } catch (error) {
            showToast('error', 'Failed to load trip: ' + getErrorMessage(error))
        }
    }

    const updateTripStatus = async (trip, status) => {
        try {
            await apiClient.put('/trips/' + trip.id, {
                userId: trip.userId || currentUser,
                destination: trip.destination,
                startDate: trip.startDate,
                endDate: trip.endDate,
                budget: Number(trip.budget),
                currency: 'EUR',
                status
            })

            showToast('success', 'Trip status updated to ' + status + '.')
            await loadTrips()
            await loadTripDetails(trip.id)
        } catch (error) {
            showToast('error', 'Failed to update trip: ' + getErrorMessage(error))
        }
    }

    const deleteTrip = async (id) => {
        try {
            await apiClient.delete('/trips/' + id)
            showToast('success', 'Trip deleted.')
            setSelectedTrip(null)
            setSelectedTripId('')
            await loadTrips()
        } catch (error) {
            showToast('error', 'Failed to delete trip: ' + getErrorMessage(error))
        }
    }

    const loadRecommendations = async () => {
        try {
            const params = new URLSearchParams()
            params.set('destination', destination)

            if (recommendationType) {
                params.set('type', recommendationType)
            }

            const response = await apiClient.get('/recommendations?' + params.toString())
            setRecommendations(response.data || [])
            showToast('success', 'Loaded ' + (response.data?.length || 0) + ' recommendations.')
        } catch (error) {
            showToast('error', 'Failed to load recommendations: ' + getErrorMessage(error))
        }
    }

    const loadAttractions = async () => {
        try {
            const response = await apiClient.get('/recommendations/attractions?destination=' + encodeURIComponent(destination))
            setRecommendations(response.data || [])
            showToast('success', 'Attractions loaded.')
        } catch (error) {
            showToast('error', 'Failed to load attractions: ' + getErrorMessage(error))
        }
    }

    const loadRestaurants = async () => {
        try {
            const response = await apiClient.get('/recommendations/restaurants?destination=' + encodeURIComponent(destination))
            setRecommendations(response.data || [])
            showToast('success', 'Restaurants loaded.')
        } catch (error) {
            showToast('error', 'Failed to load restaurants: ' + getErrorMessage(error))
        }
    }

    const loadHotels = async () => {
        try {
            const response = await apiClient.get(
                '/recommendations/hotels?destination=' +
                encodeURIComponent(destination) +
                '&budget=' +
                encodeURIComponent(hotelBudget)
            )
            setRecommendations(response.data || [])
            showToast('success', 'Hotels loaded.')
        } catch (error) {
            showToast('error', 'Failed to load hotels: ' + getErrorMessage(error))
        }
    }

    const saveRecommendation = async (recommendationId) => {
        if (!requireTripId(saveTripId)) return

        try {
            await apiClient.post('/recommendations/' + recommendationId + '/save', {
                tripId: Number(saveTripId),
                userId: currentUser
            })

            setSavedTripId(saveTripId)
            showToast('success', 'Recommendation saved to trip ' + saveTripId + '.')
        } catch (error) {
            showToast('error', 'Failed to save recommendation: ' + getErrorMessage(error))
        }
    }

    const loadRecommendationsThroughTrip = async () => {
        if (!requireTripId(selectedTripId)) return

        try {
            const response = await apiClient.get('/trips/' + selectedTripId + '/recommendations')
            setTripRecommendations(response.data || [])
            showToast('success', 'Feign call successful: Trip Service loaded recommendations.')
        } catch (error) {
            showToast('error', 'Feign test failed: ' + getErrorMessage(error))
        }
    }

    const loadSavedRecommendations = async () => {
        if (!requireTripId(savedTripId)) return

        try {
            const response = await apiClient.get('/recommendations/saved?tripId=' + savedTripId)
            setSavedRecommendations(response.data || [])
            showToast('success', 'Saved recommendations loaded.')
        } catch (error) {
            showToast('error', 'Failed to load saved recommendations: ' + getErrorMessage(error))
        }
    }

    const estimateCostThroughTrip = async () => {
        if (!requireTripId(savedTripId)) return

        try {
            const response = await apiClient.get('/trips/' + savedTripId + '/estimated-cost')
            setTripCost(response.data)
            showToast('success', 'Estimated cost loaded through Trip Service.')
        } catch (error) {
            showToast('error', 'Failed to estimate through Trip Service: ' + getErrorMessage(error))
        }
    }

    const estimateCostThroughRecommendation = async () => {
        if (!requireTripId(savedTripId)) return

        try {
            const response = await apiClient.get('/recommendations/estimate?tripId=' + savedTripId)
            setRecommendationCost(response.data)
            showToast('success', 'Estimated cost loaded through Recommendation Service.')
        } catch (error) {
            showToast('error', 'Failed to estimate through Recommendation Service: ' + getErrorMessage(error))
        }
    }

    const runMcpRecommendPlaces = async () => {
        try {
            const params = new URLSearchParams()
            params.set('destination', mcpDestination)
            params.set('type', mcpType)
            params.set('limit', mcpLimit)

            const response = await mcpClient.get('/recommend-places?' + params.toString())
            setMcpResult(response.data)
            showToast('success', 'MCP recommend places test successful.')
        } catch (error) {
            showToast('error', 'MCP recommend places failed: ' + getErrorMessage(error))
        }
    }

    const runMcpTripDetails = async () => {
        if (!requireTripId(mcpTripId)) return

        try {
            const response = await mcpClient.get('/trip/' + mcpTripId)
            setMcpResult(response.data)
            showToast('success', 'MCP trip details test successful.')
        } catch (error) {
            showToast('error', 'MCP trip details failed: ' + getErrorMessage(error))
        }
    }

    const runMcpSavedAttractions = async () => {
        if (!requireTripId(mcpTripId)) return

        try {
            const response = await mcpClient.get('/saved-attractions?tripId=' + mcpTripId)
            setMcpResult(response.data)
            showToast('success', 'MCP saved attractions test successful.')
        } catch (error) {
            showToast('error', 'MCP saved attractions failed: ' + getErrorMessage(error))
        }
    }

    const runMcpEstimate = async () => {
        if (!requireTripId(mcpTripId)) return

        try {
            const response = await mcpClient.get('/estimate?tripId=' + mcpTripId)
            setMcpResult(response.data)
            showToast('success', 'MCP estimate test successful.')
        } catch (error) {
            showToast('error', 'MCP estimate failed: ' + getErrorMessage(error))
        }
    }

    const logout = () => {
        keycloak.logout({
            redirectUri: window.location.origin
        })
    }

    if (!keycloak.authenticated) {
        return (
            <div className="login-shell">
                <div className="ambient ambient-one" />
                <div className="ambient ambient-two" />

                <div className="login-card">
                    <img
                        src="/smart-travel-logo.png"
                        alt="Smart Travel Planner logo"
                        className="app-logo login-logo"
                    />

                    <p className="eyebrow">SOA Microservices Platform</p>

                    <p className="login-text">
                        A premium frontend for testing trips, recommendations, Keycloak security,
                        Kafka events, Feign communication, MCP tools and Dockerized service orchestration.
                    </p>

                    <button className="button primary large" onClick={() => keycloak.login()}>
                        Login with Keycloak
                    </button>

                    <div className="demo-box">
                        <span>Demo credentials</span>
                        <strong>demo-user / demo-pass</strong>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="app-shell">
            {toast && <div className={'toast ' + toast.type}>{toast.message}</div>}

            <aside className="sidebar">
                <div className="brand-block">
                    <img
                        src="/smart-travel-logo.png"
                        alt="Smart Travel Planner logo"
                        className="app-logo sidebar-logo"
                    />

                    <div>
                        <h2>Smart Travel</h2>
                        <span>Planner Console</span>
                    </div>
                </div>

                <nav className="menu">
                    {pages.map((page) => (
                        <button
                            key={page.id}
                            className={activePage === page.id ? 'menu-item active' : 'menu-item'}
                            onClick={() => setActivePage(page.id)}
                        >
                            <span>{page.icon}</span>
                            {page.label}
                        </button>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <span>Authenticated as</span>
                    <strong>{currentUser}</strong>
                </div>
            </aside>

            <main className="main-area">
                <header className="topbar">
                    <div>
                        <p className="eyebrow">Dockerized SOA System</p>
                        <h1>{pages.find((page) => page.id === activePage)?.label}</h1>
                    </div>

                    <div className="topbar-actions">
                        <a className="external-link" href="http://localhost:8500" target="_blank" rel="noreferrer">
                            Consul
                        </a>

                        <a className="external-link" href="http://localhost:8085" target="_blank" rel="noreferrer">
                            Kafka UI
                        </a>

                        <a className="external-link" href="http://localhost:8086/admin" target="_blank" rel="noreferrer">
                            Keycloak
                        </a>

                        <button className="button secondary" onClick={logout}>
                            Logout
                        </button>
                    </div>
                </header>

                {activePage === 'dashboard' && (
                    <section className="page-grid">
                        <div className="hero-card">
                            <div>
                                <p className="eyebrow">Production-style project demo</p>
                                <h2>Plan, recommend, save and estimate trips through secured microservices.</h2>
                                <p>
                                    This frontend uses Keycloak JWT authentication and sends all business requests
                                    through the API Gateway. It is designed for a clean project presentation and
                                    full functional testing.
                                </p>
                            </div>

                            <button className="button primary" onClick={loadHealth}>
                                Refresh System Health
                            </button>
                        </div>

                        <div className="stats-grid">
                            <MetricCard label="Total trips" value={trips.length} />
                            <MetricCard label="Total planned budget" value={formatMoney(totalBudget)} />
                            <MetricCard label="Recommendations loaded" value={recommendations.length} />
                            <MetricCard label="Saved loaded" value={savedRecommendations.length} />
                        </div>

                        <div className="health-grid">
                            <HealthCard label="API Gateway" value={health.gateway} />
                            <HealthCard label="Trip Service" value={health.trip} />
                            <HealthCard label="Recommendation Service" value={health.recommendation} />
                            <HealthCard label="MCP Server" value={health.mcp} />
                        </div>

                        <div className="external-api-card">
                            <div className="external-api-header">
                                <div>
                                    <p className="eyebrow">External Integration</p>
                                    <h2>Geoapify Places API</h2>
                                    <p>
                                        Recommendation Service uses local Seed Data first. If no seed data exists
                                        for the selected destination and type, it falls back to the live external API.
                                    </p>
                                </div>

                                <StatusBadge
                                    value={
                                        externalApiStatus === null
                                            ? 'UNKNOWN'
                                            : externalApiStatus.enabled && externalApiStatus.apiKeyConfigured
                                                ? 'UP'
                                                : 'DOWN'
                                    }
                                />
                            </div>

                            <div className="external-api-grid">
                                <div>
                                    <span>Provider</span>
                                    <strong>{externalApiStatus?.provider || 'Geoapify Places API'}</strong>
                                </div>

                                <div>
                                    <span>API key</span>
                                    <strong>{externalApiStatus?.apiKeyConfigured ? 'Configured' : 'Missing'}</strong>
                                </div>

                                <div>
                                    <span>Strategy</span>
                                    <strong>{externalApiStatus?.strategy || 'Seed Data first, Live API fallback'}</strong>
                                </div>

                                <div>
                                    <span>Deduplication</span>
                                    <strong>{externalApiStatus?.deduplicationKey || 'externalPlaceId'}</strong>
                                </div>

                                <div>
                                    <span>Live results loaded</span>
                                    <strong>{recommendationSourceStats.live}</strong>
                                </div>

                                <div>
                                    <span>Seed results loaded</span>
                                    <strong>{recommendationSourceStats.seed}</strong>
                                </div>
                            </div>

                            <div className="api-flow-box">
                                {externalApiStatus?.backendFlow || 'Frontend -> API Gateway -> Recommendation Service -> Geoapify'}
                            </div>

                            <button className="button secondary" onClick={loadExternalApiStatus}>
                                Refresh External API Status
                            </button>
                        </div>
                    </section>
                )}

                {activePage === 'trips' && (
                    <section className="two-column">
                        <form className="panel" onSubmit={createTrip}>
                            <div className="panel-header">
                                <h2>Create Trip</h2>
                                <p>
                                    Demo values are prefilled for faster testing. Creating a trip persists data
                                    and triggers a Kafka event.
                                </p>
                            </div>

                            <label>User ID</label>
                            <input name="userId" value={tripForm.userId} onChange={handleTripFormChange} />

                            <label>Destination</label>
                            <input name="destination" value={tripForm.destination} onChange={handleTripFormChange} />

                            <div className="form-row">
                                <div>
                                    <label>Start date</label>
                                    <input type="date" name="startDate" value={tripForm.startDate} onChange={handleTripFormChange} />
                                </div>

                                <div>
                                    <label>End date</label>
                                    <input type="date" name="endDate" value={tripForm.endDate} onChange={handleTripFormChange} />
                                </div>
                            </div>

                            <div className="form-row">
                                <div>
                                    <label>Budget</label>
                                    <input type="number" name="budget" value={tripForm.budget} onChange={handleTripFormChange} />
                                </div>

                                <div>
                                    <label>Currency</label>
                                    <select name="currency" value={tripForm.currency} onChange={handleTripFormChange}>
                                        <option value="EUR">EURO</option>
                                    </select>
                                </div>
                            </div>

                            <div className="button-row">
                                <button className="button secondary" type="button" onClick={resetTripFormToDemo}>
                                    Use Demo Data
                                </button>

                                <button className="button ghost" type="button" onClick={clearTripForm}>
                                    Clear
                                </button>
                            </div>

                            <button className="button primary full" type="submit">
                                Create Trip
                            </button>
                        </form>

                        <div className="panel">
                            <div className="panel-header horizontal">
                                <div>
                                    <h2>Trips</h2>
                                    <p>Load, inspect, update and delete trips.</p>
                                </div>

                                <button className="button secondary" onClick={loadTrips}>
                                    Reload
                                </button>
                            </div>

                            <div className="input-action">
                                <input
                                    value={selectedTripId}
                                    onChange={(event) => setSelectedTripId(event.target.value)}
                                    placeholder="Trip ID"
                                />

                                <button className="button secondary" onClick={() => loadTripDetails()}>
                                    Load Details
                                </button>
                            </div>

                            {selectedTrip && (
                                <div className="details-card">
                                    <h3>{selectedTrip.destination}</h3>
                                    <p>
                                        {selectedTrip.startDate} → {selectedTrip.endDate}
                                    </p>
                                    <p>
                                        {formatMoney(selectedTrip.budget)} · {selectedTrip.status}
                                    </p>

                                    <JsonBlock data={selectedTrip} />
                                </div>
                            )}

                            <div className="card-list">
                                {trips.length === 0 && (
                                    <EmptyState title="No trips yet" text="Create a trip to test Trip Service and Kafka." />
                                )}

                                {trips.map((trip) => (
                                    <div className="compact-card" key={trip.id}>
                                        <div>
                                            <h3>{trip.destination}</h3>
                                            <p>{trip.startDate} → {trip.endDate}</p>
                                            <span>
                                                ID {trip.id} · {formatMoney(trip.budget)} · {trip.status}
                                            </span>
                                        </div>

                                        <div className="compact-actions">
                                            <button className="button ghost" onClick={() => loadTripDetails(trip.id)}>
                                                View
                                            </button>

                                            <button className="button ghost" onClick={() => updateTripStatus(trip, 'COMPLETED')}>
                                                Complete
                                            </button>

                                            <button className="button danger" onClick={() => deleteTrip(trip.id)}>
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {activePage === 'recommendations' && (
                    <section className="page-grid">
                        <div className="panel">
                            <div className="panel-header">
                                <h2>Search Recommendations</h2>
                                <p>
                                    Tests Recommendation Service through API Gateway. Paris demonstrates Seed Data,
                                    while destinations such as Rome or Berlin demonstrate Live API fallback.
                                </p>
                            </div>

                            <div className="search-grid">
                                <div>
                                    <label>Destination</label>
                                    <input value={destination} onChange={(event) => setDestination(event.target.value)} />
                                </div>

                                <div>
                                    <label>Type</label>
                                    <select value={recommendationType} onChange={(event) => setRecommendationType(event.target.value)}>
                                        <option value="">ALL</option>
                                        <option value="ATTRACTION">ATTRACTION</option>
                                        <option value="HOTEL">HOTEL</option>
                                        <option value="RESTAURANT">RESTAURANT</option>
                                    </select>
                                </div>

                                <div>
                                    <label>Hotel budget</label>
                                    <input type="number" value={hotelBudget} onChange={(event) => setHotelBudget(event.target.value)} />
                                </div>

                                <div>
                                    <label>Trip ID for saving</label>
                                    <input value={saveTripId} onChange={(event) => setSaveTripId(event.target.value)} />
                                </div>
                            </div>

                            <div className="button-row">
                                <button className="button primary" onClick={loadRecommendations}>
                                    Search
                                </button>

                                <button className="button secondary" onClick={loadAttractions}>
                                    Attractions endpoint
                                </button>

                                <button className="button secondary" onClick={loadRestaurants}>
                                    Restaurants endpoint
                                </button>

                                <button className="button secondary" onClick={loadHotels}>
                                    Hotels endpoint
                                </button>
                            </div>
                        </div>

                        <div className="panel">
                            <div className="panel-header horizontal">
                                <div>
                                    <h2>Feign Test</h2>
                                    <p>Trip Service calls Recommendation Service through Feign and Consul.</p>
                                </div>

                                <button className="button primary" onClick={loadRecommendationsThroughTrip}>
                                    Run Feign Test
                                </button>
                            </div>

                            <div className="input-action">
                                <input
                                    value={selectedTripId}
                                    onChange={(event) => setSelectedTripId(event.target.value)}
                                    placeholder="Trip ID"
                                />
                            </div>

                            {tripRecommendations.length > 0 && <JsonBlock data={tripRecommendations} />}
                        </div>

                        <div className="recommendation-grid">
                            {recommendations.length === 0 && (
                                <EmptyState title="No recommendations loaded" text="Search for Paris, Rome or Berlin recommendations first." />
                            )}

                            {recommendations.map((recommendation) => (
                                <RecommendationCard
                                    key={recommendation.id}
                                    recommendation={recommendation}
                                    onSave={saveRecommendation}
                                />
                            ))}
                        </div>
                    </section>
                )}

                {activePage === 'saved' && (
                    <section className="two-column">
                        <div className="panel">
                            <div className="panel-header">
                                <h2>Saved Recommendations</h2>
                                <p>Tests save/load of recommendations and estimated cost.</p>
                            </div>

                            <label>Trip ID</label>
                            <input value={savedTripId} onChange={(event) => setSavedTripId(event.target.value)} />

                            <div className="button-row vertical">
                                <button className="button primary" onClick={loadSavedRecommendations}>
                                    Load Saved Recommendations
                                </button>

                                <button className="button secondary" onClick={estimateCostThroughTrip}>
                                    Estimate via Trip Service
                                </button>

                                <button className="button secondary" onClick={estimateCostThroughRecommendation}>
                                    Estimate via Recommendation Service
                                </button>
                            </div>

                            <div className="cost-grid">
                                <div className="cost-card">
                                    <span>Trip endpoint cost</span>
                                    <strong>{tripCost === null ? '—' : formatMoney(tripCost)}</strong>
                                </div>

                                <div className="cost-card">
                                    <span>Recommendation endpoint cost</span>
                                    <strong>{recommendationCost === null ? '—' : formatMoney(recommendationCost)}</strong>
                                </div>
                            </div>
                        </div>

                        <div className="panel">
                            <div className="panel-header">
                                <h2>Saved Items</h2>
                                <p>Loaded from Recommendation Service.</p>
                            </div>

                            <div className="card-list">
                                {savedRecommendations.length === 0 && (
                                    <EmptyState title="No saved recommendations" text="Save a recommendation to this trip first." />
                                )}

                                {savedRecommendations.map((saved) => {
                                    const recommendation = saved.recommendation || saved

                                    return (
                                        <div className="compact-card" key={saved.id}>
                                            <div>
                                                <h3>{recommendation.name || 'Saved recommendation'}</h3>
                                                <p>{recommendation.description || 'No description available.'}</p>
                                                <span>
                                                    {recommendation.type} · {formatMoney(recommendation.estimatedPrice)} · Saved ID {saved.id}
                                                </span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </section>
                )}

                {activePage === 'mcp' && (
                    <section className="two-column">
                        <div className="panel">
                            <div className="panel-header">
                                <h2>MCP REST Tester</h2>
                                <p>Tests MCP Server helper endpoints through the Docker frontend proxy.</p>
                            </div>

                            <label>Destination</label>
                            <input value={mcpDestination} onChange={(event) => setMcpDestination(event.target.value)} />

                            <label>Type</label>
                            <select value={mcpType} onChange={(event) => setMcpType(event.target.value)}>
                                <option value="ATTRACTION">ATTRACTION</option>
                                <option value="HOTEL">HOTEL</option>
                                <option value="RESTAURANT">RESTAURANT</option>
                            </select>

                            <label>Limit</label>
                            <input type="number" value={mcpLimit} onChange={(event) => setMcpLimit(event.target.value)} />

                            <label>Trip ID</label>
                            <input value={mcpTripId} onChange={(event) => setMcpTripId(event.target.value)} />

                            <div className="button-row vertical">
                                <button className="button primary" onClick={runMcpRecommendPlaces}>
                                    MCP recommend_places
                                </button>

                                <button className="button secondary" onClick={runMcpTripDetails}>
                                    MCP get_trip_details
                                </button>

                                <button className="button secondary" onClick={runMcpSavedAttractions}>
                                    MCP get_saved_attractions
                                </button>

                                <button className="button secondary" onClick={runMcpEstimate}>
                                    MCP estimate_trip_cost
                                </button>
                            </div>
                        </div>

                        <div className="panel">
                            <div className="panel-header">
                                <h2>MCP Result</h2>
                                <p>Response returned by MCP Server.</p>
                            </div>

                            {mcpResult ? (
                                <JsonBlock data={mcpResult} />
                            ) : (
                                <EmptyState title="No MCP result yet" text="Run one MCP test from the left panel." />
                            )}
                        </div>
                    </section>
                )}

                {activePage === 'system' && (
                    <section className="page-grid">
                        <div className="hero-card proof-hero">
                            <div>
                                <p className="eyebrow">Project Requirement Coverage</p>
                                <h2>SOA implementation proof and testing checklist.</h2>
                                <p>
                                    This page summarizes how the project satisfies the microservice architecture
                                    requirements: gateway routing, service discovery, Keycloak security, Kafka events,
                                    Feign communication, Pact testing, Docker deployment, external API integration
                                    and MCP server integration.
                                </p>
                            </div>
                        </div>

                        <div className="panel">
                            <div className="panel-header">
                                <h2>Requirement Coverage</h2>
                                <p>Each card maps one specification requirement to an implementation and a test.</p>
                            </div>

                            <div className="requirement-grid">
                                {proofItems.map((item) => (
                                    <div className="requirement-card" key={item.title}>
                                        <div className="requirement-top">
                                            <span className="check-dot">✓</span>
                                            <h3>{item.title}</h3>
                                        </div>

                                        <div className="requirement-section">
                                            <strong>Requirement</strong>
                                            <p>{item.requirement}</p>
                                        </div>

                                        <div className="requirement-section">
                                            <strong>Implementation</strong>
                                            <p>{item.implementation}</p>
                                        </div>

                                        <div className="requirement-section">
                                            <strong>How to test</strong>
                                            <p>{item.test}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="two-column">
                            <div className="panel">
                                <div className="panel-header">
                                    <h2>Recommended Demo Flow</h2>
                                    <p>Use this order for full functional testing and later for the video.</p>
                                </div>

                                <ol className="demo-flow">
                                    {demoFlow.map((step, index) => (
                                        <li key={step}>
                                            <span>{index + 1}</span>
                                            <p>{step}</p>
                                        </li>
                                    ))}
                                </ol>
                            </div>

                            <div className="panel">
                                <div className="panel-header">
                                    <h2>External Consoles</h2>
                                    <p>Open these tools to prove infrastructure components.</p>
                                </div>

                                <div className="console-links">
                                    {infrastructureLinks.map((link) => (
                                        <a key={link.label} href={link.url} target="_blank" rel="noreferrer">
                                            {link.label}
                                        </a>
                                    ))}
                                </div>

                                <div className="terminal-box">
                                    <h3>Useful terminal checks</h3>
                                    <code>docker compose ps</code>
                                    <code>docker logs --tail=150 smart-travel-recommendation-service</code>
                                    <code>docker logs --tail=150 smart-travel-api-gateway</code>
                                    <code>docker logs --tail=150 smart-travel-mcp-server</code>
                                </div>
                            </div>
                        </div>

                        <div className="panel">
                            <div className="panel-header">
                                <h2>Contract Testing Evidence</h2>
                                <p>Pact tests are not executed from the UI. They are verified from terminal.</p>
                            </div>

                            <div className="terminal-box">
                                <code>.\mvnw.cmd -f trip-service\pom.xml -Dtest=TripRecommendationConsumerPactTest test</code>
                                <code>.\mvnw.cmd -f recommendation-service\pom.xml -Dtest=RecommendationProviderPactVerificationTest test</code>
                            </div>
                        </div>
                    </section>
                )}
            </main>
        </div>
    )
}