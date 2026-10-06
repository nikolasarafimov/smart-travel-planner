import { useEffect, useMemo, useState } from 'react'
import keycloak from './auth/keycloak'
import { apiClient, utilityClient, mcpClient, getErrorMessage } from './api/apiClient'

function formatDate(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
}

function addDays(days) {
    const date = new Date()
    date.setDate(date.getDate() + days)
    return formatDate(date)
}

function createInitialTripForm(userId = 'demo-user') {
    return {
        userId,
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

function normalizeJsonForDisplay(value) {
    if (Array.isArray(value)) {
        return value.map(normalizeJsonForDisplay)
    }

    if (value && typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value).map(([key, entry]) => [
                key,
                normalizeJsonForDisplay(entry)
            ])
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
    return getRecommendationSource(recommendation) === 'Live API'
        ? 'source-live'
        : 'source-seed'
}

function Icon({ name, size = 20, strokeWidth = 1.8 }) {
    const commonProps = {
        width: size,
        height: size,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        'aria-hidden': true
    }

    const icons = {
        dashboard: (
            <>
                <rect x="3" y="3" width="7" height="7" rx="2" />
                <rect x="14" y="3" width="7" height="7" rx="2" />
                <rect x="3" y="14" width="7" height="7" rx="2" />
                <rect x="14" y="14" width="7" height="7" rx="2" />
            </>
        ),
        trips: (
            <>
                <path d="M2 16.5l20-9-8.5 14-2.4-6.1L5 13z" />
                <path d="M11.1 15.4L22 7.5" />
            </>
        ),
        recommendations: (
            <>
                <circle cx="12" cy="12" r="9" />
                <path d="M15.5 8.5l-2.2 4.8-4.8 2.2 2.2-4.8z" />
            </>
        ),
        saved: (
            <>
                <path d="M6 3h12a1 1 0 011 1v17l-7-4-7 4V4a1 1 0 011-1z" />
            </>
        ),
        mcp: (
            <>
                <rect x="3" y="4" width="18" height="16" rx="3" />
                <path d="M7 9l3 3-3 3" />
                <path d="M13 15h4" />
            </>
        ),
        system: (
            <>
                <rect x="3" y="3" width="7" height="7" rx="2" />
                <rect x="14" y="3" width="7" height="7" rx="2" />
                <rect x="8.5" y="14" width="7" height="7" rx="2" />
                <path d="M6.5 10v2h11v-2" />
                <path d="M12 12v2" />
            </>
        ),
        refresh: (
            <>
                <path d="M20 6v5h-5" />
                <path d="M4 18v-5h5" />
                <path d="M6.1 8a7 7 0 0111.5-2L20 8" />
                <path d="M17.9 16a7 7 0 01-11.5 2L4 16" />
            </>
        ),
        external: (
            <>
                <path d="M14 4h6v6" />
                <path d="M20 4l-9 9" />
                <path d="M18 13v6a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h6" />
            </>
        ),
        logout: (
            <>
                <path d="M10 17l5-5-5-5" />
                <path d="M15 12H3" />
                <path d="M14 3h5a2 2 0 012 2v14a2 2 0 01-2 2h-5" />
            </>
        ),
        plus: (
            <>
                <path d="M12 5v14" />
                <path d="M5 12h14" />
            </>
        ),
        search: (
            <>
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-4-4" />
            </>
        ),
        calendar: (
            <>
                <rect x="3" y="5" width="18" height="16" rx="2" />
                <path d="M16 3v4" />
                <path d="M8 3v4" />
                <path d="M3 10h18" />
            </>
        ),
        wallet: (
            <>
                <path d="M4 6h14a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2h12" />
                <path d="M16 12h4" />
            </>
        ),
        trash: (
            <>
                <path d="M4 7h16" />
                <path d="M9 7V4h6v3" />
                <path d="M6 7l1 14h10l1-14" />
                <path d="M10 11v6" />
                <path d="M14 11v6" />
            </>
        ),
        check: (
            <>
                <circle cx="12" cy="12" r="9" />
                <path d="M8 12l2.5 2.5L16 9" />
            </>
        ),
        eye: (
            <>
                <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z" />
                <circle cx="12" cy="12" r="2.5" />
            </>
        ),
        map: (
            <>
                <path d="M3 6l5-2 8 3 5-2v13l-5 2-8-3-5 2z" />
                <path d="M8 4v13" />
                <path d="M16 7v13" />
            </>
        ),
        mapPin: (
            <>
                <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1116 0z" />
                <circle cx="12" cy="10" r="2.5" />
            </>
        ),
        activity: (
            <>
                <path d="M3 12h4l2-6 4 12 2-6h6" />
            </>
        ),
        shield: (
            <>
                <path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z" />
                <path d="M9 12l2 2 4-4" />
            </>
        ),
        server: (
            <>
                <rect x="3" y="4" width="18" height="6" rx="2" />
                <rect x="3" y="14" width="18" height="6" rx="2" />
                <path d="M7 7h.01" />
                <path d="M7 17h.01" />
            </>
        ),
        globe: (
            <>
                <circle cx="12" cy="12" r="9" />
                <path d="M3 12h18" />
                <path d="M12 3c3 3 3 15 0 18" />
                <path d="M12 3c-3 3-3 15 0 18" />
            </>
        ),
        sparkles: (
            <>
                <path d="M12 3l1.3 3.7L17 8l-3.7 1.3L12 13l-1.3-3.7L7 8l3.7-1.3z" />
                <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" />
                <path d="M5 14l.7 1.8L7.5 16l-1.8.7L5 18.5l-.7-1.8L2.5 16l1.8-.2z" />
            </>
        ),
        route: (
            <>
                <circle cx="5" cy="6" r="2" />
                <circle cx="19" cy="18" r="2" />
                <path d="M7 6h4a3 3 0 010 6H9a3 3 0 000 6h8" />
            </>
        ),
        arrow: (
            <>
                <path d="M5 12h14" />
                <path d="M14 7l5 5-5 5" />
            </>
        ),
        user: (
            <>
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21a8 8 0 0116 0" />
            </>
        ),
        layers: (
            <>
                <path d="M12 3l9 5-9 5-9-5z" />
                <path d="M3 12l9 5 9-5" />
                <path d="M3 16l9 5 9-5" />
            </>
        ),
        code: (
            <>
                <path d="M8 9l-3 3 3 3" />
                <path d="M16 9l3 3-3 3" />
                <path d="M14 5l-4 14" />
            </>
        )
    }

    return (
        <svg {...commonProps}>
            {icons[name] || icons.sparkles}
        </svg>
    )
}

const pages = [
    {
        id: 'dashboard',
        label: 'Dashboard',
        icon: 'dashboard',
        subtitle: 'Your travel workspace at a glance'
    },
    {
        id: 'trips',
        label: 'Trips',
        icon: 'trips',
        subtitle: 'Create, manage and track your journeys'
    },
    {
        id: 'recommendations',
        label: 'Recommendations',
        icon: 'recommendations',
        subtitle: 'Discover places from curated and live data'
    },
    {
        id: 'saved',
        label: 'Saved & Cost',
        icon: 'saved',
        subtitle: 'Manage saved places and estimated costs'
    },
    {
        id: 'mcp',
        label: 'MCP Tester',
        icon: 'mcp',
        subtitle: 'Run travel tools through the MCP service'
    },
    {
        id: 'system',
        label: 'SOA Proof',
        icon: 'system',
        subtitle: 'Architecture, infrastructure and test evidence'
    }
]

const proofItems = [
    {
        title: 'Microservice Architecture',
        category: 'Architecture',
        requirement: 'System composed of independent services.',
        implementation: 'trip-service and recommendation-service are independent Spring Boot microservices.',
        test: 'Create trip, search recommendations, verify separate containers and separate databases.'
    },
    {
        title: 'Domain-Driven Design',
        category: 'Architecture',
        requirement: 'Natural split into bounded contexts and responsibilities.',
        implementation: 'Trip context handles trip planning. Recommendation context handles places, hotels, restaurants and saved recommendations.',
        test: 'Inspect packages: model, repository, service, web/dto/event in each microservice.'
    },
    {
        title: 'API Gateway',
        category: 'Infrastructure',
        requirement: 'Centralized entry point and request routing.',
        implementation: 'api-gateway routes /api/trips/** and /api/recommendations/** to the correct services.',
        test: 'All frontend business requests go through /api/... on the gateway.'
    },
    {
        title: 'External Places API Integration',
        category: 'Integration',
        requirement: 'External data integration with clean service responsibility.',
        implementation: 'Recommendation Service integrates Geoapify Places API. The frontend never calls Geoapify directly.',
        test: 'Search Paris to show Seed Data, then search Rome or Berlin to show Live API results.'
    },
    {
        title: 'External API Fallback and Deduplication',
        category: 'Integration',
        requirement: 'Reliable data handling when external providers are used.',
        implementation: 'The service uses Seed Data first, Live API fallback, and stores live records with externalPlaceId.',
        test: 'Search the same live destination twice and verify that database IDs do not duplicate.'
    },
    {
        title: 'Security with Keycloak',
        category: 'Security',
        requirement: 'Authentication and authorization.',
        implementation: 'Frontend uses Keycloak login and sends JWT bearer token to protected backend endpoints.',
        test: 'Logout and try protected actions. Direct /api/trips without token returns 401.'
    },
    {
        title: 'Service Discovery with Consul',
        category: 'Infrastructure',
        requirement: 'Services register and discover each other.',
        implementation: 'api-gateway, trip-service, recommendation-service and mcp-server register in Consul.',
        test: 'Open Consul UI and verify all services are registered and healthy.'
    },
    {
        title: 'Synchronous Communication with Feign',
        category: 'Communication',
        requirement: 'Inter-service communication.',
        implementation: 'Trip Service calls Recommendation Service using Feign client.',
        test: 'Use Recommendations page and run the Feign test.'
    },
    {
        title: 'Asynchronous Communication with Kafka',
        category: 'Communication',
        requirement: 'Broker/event communication between services.',
        implementation: 'Trip Service publishes trip-created event; Recommendation Service consumes it.',
        test: 'Create a trip, open Kafka UI, verify trip-created topic/message and recommendation-service logs.'
    },
    {
        title: 'Consumer-Driven Contract Testing',
        category: 'Testing',
        requirement: 'Integration testing through Pact.',
        implementation: 'Trip Service is the consumer and Recommendation Service is the provider.',
        test: 'Run Pact consumer and provider tests from Maven.'
    },
    {
        title: 'MCP Server',
        category: 'Integration',
        requirement: 'Implemented and demonstrable MCP server.',
        implementation: 'MCP Server exposes travel tools and communicates with backend services through the API Gateway.',
        test: 'Use MCP Tester page and MCP Inspector.'
    },
    {
        title: 'Dockerized System',
        category: 'Deployment',
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
    {
        label: 'Frontend',
        description: 'React application',
        url: 'http://localhost:3000',
        icon: 'globe'
    },
    {
        label: 'API Gateway',
        description: 'Gateway health',
        url: 'http://localhost:8080/actuator/health',
        icon: 'route'
    },
    {
        label: 'Trip Service',
        description: 'Service health',
        url: 'http://localhost:8081/actuator/health',
        icon: 'trips'
    },
    {
        label: 'Recommendation Service',
        description: 'Service health',
        url: 'http://localhost:8082/actuator/health',
        icon: 'recommendations'
    },
    {
        label: 'MCP Server',
        description: 'Service health',
        url: 'http://localhost:8087/actuator/health',
        icon: 'mcp'
    },
    {
        label: 'Consul',
        description: 'Service discovery',
        url: 'http://localhost:8500',
        icon: 'server'
    },
    {
        label: 'Kafka UI',
        description: 'Event streaming',
        url: 'http://localhost:8085',
        icon: 'activity'
    },
    {
        label: 'Keycloak',
        description: 'Identity management',
        url: 'http://localhost:8086/admin',
        icon: 'shield'
    }
]

function StatusBadge({ value }) {
    const normalized = value || 'UNKNOWN'

    return (
        <span className={'status-badge ' + normalized.toLowerCase()}>
            <span className="status-dot" />
            {normalized}
        </span>
    )
}

function JsonBlock({ data, label = 'Response' }) {
    return (
        <div className="json-shell">
            <div className="json-header">
                <div className="json-title">
                    <Icon name="code" size={16} />
                    <span>{label}</span>
                </div>

                <span className="json-format">JSON</span>
            </div>

            <pre className="json-block">
                {typeof data === 'string'
                    ? data
                    : JSON.stringify(
                        normalizeJsonForDisplay(data),
                        null,
                        2
                    )}
            </pre>
        </div>
    )
}

function EmptyState({ title, text, icon = 'sparkles' }) {
    return (
        <div className="empty-state">
            <div className="empty-icon">
                <Icon name={icon} size={25} />
            </div>

            <h3>{title}</h3>
            <p>{text}</p>
        </div>
    )
}

function MetricCard({ icon, label, value, detail }) {
    return (
        <div className="stat-card metric-card">
            <div className="metric-icon">
                <Icon name={icon} size={21} />
            </div>

            <div className="metric-content">
                <span>{label}</span>
                <strong>{value}</strong>
                {detail && <small>{detail}</small>}
            </div>
        </div>
    )
}

function HealthCard({ label, value, icon = 'server' }) {
    return (
        <div className="health-card">
            <div className="health-card-main">
                <div className="health-icon">
                    <Icon name={icon} size={19} />
                </div>

                <div>
                    <span>{label}</span>
                    <small>Service status</small>
                </div>
            </div>

            <StatusBadge value={value} />
        </div>
    )
}

function PageHeading({ eyebrow, title, text, action }) {
    return (
        <div className="section-heading">
            <div>
                {eyebrow && <p className="eyebrow">{eyebrow}</p>}
                <h2>{title}</h2>
                {text && <p>{text}</p>}
            </div>

            {action && <div className="section-heading-action">{action}</div>}
        </div>
    )
}

function RecommendationCard({ recommendation, onSave }) {
    return (
        <article className="recommendation-card">
            <div className="recommendation-accent" />

            <div className="recommendation-card-top">
                <span className={`source-badge ${getRecommendationSourceClass(recommendation)}`}>
                    {getRecommendationSource(recommendation)}
                </span>

                <span className="type-badge">
                    {recommendation.type || 'UNKNOWN'}
                </span>
            </div>

            <div className="recommendation-icon-wrap">
                <Icon
                    name={
                        recommendation.type === 'HOTEL'
                            ? 'saved'
                            : recommendation.type === 'RESTAURANT'
                                ? 'sparkles'
                                : 'mapPin'
                    }
                    size={24}
                />
            </div>

            <div className="recommendation-copy">
                <h3>
                    {recommendation.name || 'Unnamed recommendation'}
                </h3>

                <p>
                    {recommendation.description ||
                        'No description available for this recommendation.'}
                </p>
            </div>

            <div className="recommendation-meta">
                <div>
                    <span>Rating</span>
                    <strong>
                        {recommendation.rating ?? 'N/A'}
                    </strong>
                </div>

                <div>
                    <span>Estimated price</span>
                    <strong>
                        {formatMoney(recommendation.estimatedPrice)}
                    </strong>
                </div>
            </div>

            {recommendation.source && (
                <div className="recommendation-source">
                    <Icon name="globe" size={14} />
                    <span>{recommendation.source}</span>
                </div>
            )}

            <button
                className="button secondary full recommendation-save-button"
                type="button"
                onClick={() => onSave(recommendation.id)}
            >
                <Icon name="saved" size={17} />
                <span>Save to Trip</span>
                <Icon name="arrow" size={16} />
            </button>
        </article>
    )
}

export default function App() {
    const currentUser =
        keycloak.tokenParsed?.preferred_username ||
        'authenticated-user'

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
    const [tripForm, setTripForm] = useState(() =>
        createInitialTripForm(currentUser)
    )
    const [selectedTripId, setSelectedTripId] = useState('')
    const [selectedTrip, setSelectedTrip] = useState(null)
    const [tripRecommendations, setTripRecommendations] = useState([])

    const [destination, setDestination] = useState('Paris')
    const [recommendationType, setRecommendationType] =
        useState('ATTRACTION')
    const [hotelBudget, setHotelBudget] = useState(100)
    const [recommendations, setRecommendations] = useState([])
    const [saveTripId, setSaveTripId] = useState('')

    const [savedTripId, setSavedTripId] = useState('')
    const [savedRecommendations, setSavedRecommendations] =
        useState([])
    const [tripCost, setTripCost] = useState(null)
    const [recommendationCost, setRecommendationCost] =
        useState(null)

    const [mcpDestination, setMcpDestination] = useState('Paris')
    const [mcpType, setMcpType] = useState('ATTRACTION')
    const [mcpLimit, setMcpLimit] = useState(3)
    const [mcpTripId, setMcpTripId] = useState('')
    const [mcpResult, setMcpResult] = useState(null)

    const activePageData =
        pages.find((page) => page.id === activePage) ||
        pages[0]

    const totalBudget = useMemo(() => {
        return trips.reduce(
            (sum, trip) =>
                sum + Number(trip.budget || 0),
            0
        )
    }, [trips])

    const recommendationSourceStats = useMemo(() => {
        return recommendations.reduce(
            (stats, recommendation) => {
                if (
                    getRecommendationSource(recommendation) ===
                    'Live API'
                ) {
                    stats.live += 1
                } else {
                    stats.seed += 1
                }

                return stats
            },
            {
                live: 0,
                seed: 0
            }
        )
    }, [recommendations])

    const healthyServiceCount = useMemo(() => {
        return Object.values(health).filter(
            (value) => value === 'UP'
        ).length
    }, [health])

    const featuredTrip = useMemo(() => {
        if (selectedTrip) {
            return selectedTrip
        }

        if (selectedTripId) {
            const matchingTrip = trips.find(
                (trip) =>
                    String(trip.id) ===
                    String(selectedTripId)
            )

            if (matchingTrip) {
                return matchingTrip
            }
        }

        return trips[0] || null
    }, [selectedTrip, selectedTripId, trips])

    const savedTrip = useMemo(() => {
        return (
            trips.find(
                (trip) =>
                    String(trip.id) ===
                    String(savedTripId)
            ) || null
        )
    }, [trips, savedTripId])

    const preferredEstimatedCost =
        tripCost !== null
            ? moneyNumber(tripCost)
            : recommendationCost !== null
                ? moneyNumber(recommendationCost)
                : null

    const remainingBudget =
        savedTrip && preferredEstimatedCost !== null
            ? Math.max(
                Number(savedTrip.budget || 0) -
                preferredEstimatedCost,
                0
            )
            : null

    const showToast = (type, message) => {
        setToast({
            type,
            message
        })

        window.setTimeout(
            () => setToast(null),
            4200
        )
    }

    const requireTripId = (id) => {
        if (!id) {
            showToast(
                'warning',
                'Enter or select a Trip ID first.'
            )
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
                    const response =
                        await utilityClient.get(url)

                    result[key] =
                        response.data?.status || 'UP'
                } catch {
                    result[key] = 'DOWN'
                }
            })
        )

        setHealth(result)
    }

    const loadExternalApiStatus = async () => {
        try {
            const response = await apiClient.get(
                '/recommendations/external/status'
            )

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

            showToast(
                'warning',
                'External API status could not be loaded: ' +
                getErrorMessage(error)
            )
        }
    }

    const loadTrips = async () => {
        try {
            const response = await apiClient.get(
                '/trips',
                {
                    params: {
                        userId: currentUser
                    }
                }
            )

            const loadedTrips =
                response.data || []

            setTrips(loadedTrips)

            if (loadedTrips.length === 0) {
                setSelectedTripId('')
                setSelectedTrip(null)
                setSaveTripId('')
                setSavedTripId('')
                setMcpTripId('')
                return
            }

            const availableTripIds = new Set(
                loadedTrips.map((trip) =>
                    String(trip.id)
                )
            )

            const firstTripId =
                String(loadedTrips[0].id)

            if (
                !availableTripIds.has(
                    String(selectedTripId)
                )
            ) {
                setSelectedTripId(firstTripId)
                setSelectedTrip(null)
            }

            if (
                !availableTripIds.has(
                    String(saveTripId)
                )
            ) {
                setSaveTripId(firstTripId)
            }

            if (
                !availableTripIds.has(
                    String(savedTripId)
                )
            ) {
                setSavedTripId(firstTripId)
            }

            if (
                !availableTripIds.has(
                    String(mcpTripId)
                )
            ) {
                setMcpTripId(firstTripId)
            }
        } catch (error) {
            showToast(
                'error',
                'Failed to load trips: ' +
                getErrorMessage(error)
            )
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
        setTripForm(
            createInitialTripForm(currentUser)
        )
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

        if (
            tripForm.endDate <
            tripForm.startDate
        ) {
            showToast(
                'warning',
                'End date must be on or after the start date.'
            )
            return
        }

        try {
            const response = await apiClient.post(
                '/trips',
                {
                    ...tripForm,
                    userId: currentUser,
                    budget: Number(
                        tripForm.budget
                    ),
                    currency:
                        tripForm.currency ||
                        'EUR'
                }
            )

            const created = response.data
            const createdTripId =
                String(created.id)

            setSelectedTripId(createdTripId)
            setSaveTripId(createdTripId)
            setSavedTripId(createdTripId)
            setMcpTripId(createdTripId)

            showToast(
                'success',
                'Trip created successfully. Kafka event should be produced.'
            )

            await loadTrips()
        } catch (error) {
            showToast(
                'error',
                'Failed to create trip: ' +
                getErrorMessage(error)
            )
        }
    }

    const loadTripDetails = async (
        id = selectedTripId
    ) => {
        if (!requireTripId(id)) {
            return
        }

        try {
            const response =
                await apiClient.get(
                    '/trips/' + id
                )

            setSelectedTrip(response.data)
            setSelectedTripId(
                String(response.data.id)
            )

            showToast(
                'success',
                'Trip details loaded.'
            )
        } catch (error) {
            showToast(
                'error',
                'Failed to load trip: ' +
                getErrorMessage(error)
            )
        }
    }

    const updateTripStatus = async (
        trip,
        status
    ) => {
        try {
            await apiClient.put(
                '/trips/' + trip.id,
                {
                    destination:
                    trip.destination,
                    startDate:
                    trip.startDate,
                    endDate:
                    trip.endDate,
                    budget: Number(
                        trip.budget
                    ),
                    currency:
                        trip.currency ||
                        'EUR',
                    status
                }
            )

            showToast(
                'success',
                'Trip status updated to ' +
                status +
                '.'
            )

            await loadTrips()
            await loadTripDetails(trip.id)
        } catch (error) {
            showToast(
                'error',
                'Failed to update trip: ' +
                getErrorMessage(error)
            )
        }
    }

    const deleteTrip = async (id) => {
        try {
            await apiClient.delete(
                '/trips/' + id
            )

            showToast(
                'success',
                'Trip deleted.'
            )

            setSelectedTrip(null)
            await loadTrips()
        } catch (error) {
            showToast(
                'error',
                'Failed to delete trip: ' +
                getErrorMessage(error)
            )
        }
    }

    const loadRecommendations = async () => {
        try {
            const params =
                new URLSearchParams()

            params.set(
                'destination',
                destination
            )

            if (recommendationType) {
                params.set(
                    'type',
                    recommendationType
                )
            }

            const response =
                await apiClient.get(
                    '/recommendations?' +
                    params.toString()
                )

            setRecommendations(
                response.data || []
            )

            showToast(
                'success',
                'Loaded ' +
                (response.data?.length || 0) +
                ' recommendations.'
            )
        } catch (error) {
            showToast(
                'error',
                'Failed to load recommendations: ' +
                getErrorMessage(error)
            )
        }
    }

    const loadAttractions = async () => {
        try {
            const response =
                await apiClient.get(
                    '/recommendations/attractions?destination=' +
                    encodeURIComponent(
                        destination
                    )
                )

            setRecommendations(
                response.data || []
            )

            showToast(
                'success',
                'Attractions loaded.'
            )
        } catch (error) {
            showToast(
                'error',
                'Failed to load attractions: ' +
                getErrorMessage(error)
            )
        }
    }

    const loadRestaurants = async () => {
        try {
            const response =
                await apiClient.get(
                    '/recommendations/restaurants?destination=' +
                    encodeURIComponent(
                        destination
                    )
                )

            setRecommendations(
                response.data || []
            )

            showToast(
                'success',
                'Restaurants loaded.'
            )
        } catch (error) {
            showToast(
                'error',
                'Failed to load restaurants: ' +
                getErrorMessage(error)
            )
        }
    }

    const loadHotels = async () => {
        try {
            const response =
                await apiClient.get(
                    '/recommendations/hotels?destination=' +
                    encodeURIComponent(
                        destination
                    ) +
                    '&budget=' +
                    encodeURIComponent(
                        hotelBudget
                    )
                )

            setRecommendations(
                response.data || []
            )

            showToast(
                'success',
                'Hotels loaded.'
            )
        } catch (error) {
            showToast(
                'error',
                'Failed to load hotels: ' +
                getErrorMessage(error)
            )
        }
    }

    const saveRecommendation = async (
        recommendationId
    ) => {
        if (!requireTripId(saveTripId)) {
            return
        }

        try {
            await apiClient.post(
                '/recommendations/' +
                recommendationId +
                '/save',
                {
                    tripId:
                        Number(saveTripId),
                    userId: currentUser
                }
            )

            setSavedTripId(saveTripId)

            showToast(
                'success',
                'Recommendation saved to trip ' +
                saveTripId +
                '.'
            )
        } catch (error) {
            showToast(
                'error',
                'Failed to save recommendation: ' +
                getErrorMessage(error)
            )
        }
    }

    const loadRecommendationsThroughTrip =
        async () => {
            if (
                !requireTripId(
                    selectedTripId
                )
            ) {
                return
            }

            try {
                const response =
                    await apiClient.get(
                        '/trips/' +
                        selectedTripId +
                        '/recommendations'
                    )

                setTripRecommendations(
                    response.data || []
                )

                showToast(
                    'success',
                    'Feign call successful: Trip Service loaded recommendations.'
                )
            } catch (error) {
                showToast(
                    'error',
                    'Feign test failed: ' +
                    getErrorMessage(error)
                )
            }
        }

    const loadSavedRecommendations =
        async () => {
            if (
                !requireTripId(
                    savedTripId
                )
            ) {
                return
            }

            try {
                const response =
                    await apiClient.get(
                        '/recommendations/saved?tripId=' +
                        savedTripId
                    )

                setSavedRecommendations(
                    response.data || []
                )

                showToast(
                    'success',
                    'Saved recommendations loaded.'
                )
            } catch (error) {
                showToast(
                    'error',
                    'Failed to load saved recommendations: ' +
                    getErrorMessage(error)
                )
            }
        }

    const estimateCostThroughTrip =
        async () => {
            if (
                !requireTripId(
                    savedTripId
                )
            ) {
                return
            }

            try {
                const response =
                    await apiClient.get(
                        '/trips/' +
                        savedTripId +
                        '/estimated-cost'
                    )

                setTripCost(response.data)

                showToast(
                    'success',
                    'Estimated cost loaded through Trip Service.'
                )
            } catch (error) {
                showToast(
                    'error',
                    'Failed to estimate through Trip Service: ' +
                    getErrorMessage(error)
                )
            }
        }

    const estimateCostThroughRecommendation =
        async () => {
            if (
                !requireTripId(
                    savedTripId
                )
            ) {
                return
            }

            try {
                const response =
                    await apiClient.get(
                        '/recommendations/estimate?tripId=' +
                        savedTripId
                    )

                setRecommendationCost(
                    response.data
                )

                showToast(
                    'success',
                    'Estimated cost loaded through Recommendation Service.'
                )
            } catch (error) {
                showToast(
                    'error',
                    'Failed to estimate through Recommendation Service: ' +
                    getErrorMessage(error)
                )
            }
        }

    const runMcpRecommendPlaces =
        async () => {
            if (!mcpDestination.trim()) {
                showToast(
                    'warning',
                    'Enter an MCP destination first.'
                )
                return
            }

            if (Number(mcpLimit) <= 0) {
                showToast(
                    'warning',
                    'MCP limit must be greater than zero.'
                )
                return
            }

            try {
                const params =
                    new URLSearchParams()

                params.set(
                    'destination',
                    mcpDestination
                )
                params.set(
                    'type',
                    mcpType
                )
                params.set(
                    'limit',
                    mcpLimit
                )

                const response =
                    await mcpClient.get(
                        '/recommend-places?' +
                        params.toString()
                    )

                setMcpResult(response.data)

                showToast(
                    'success',
                    'MCP recommend places test successful.'
                )
            } catch (error) {
                showToast(
                    'error',
                    'MCP recommend places failed: ' +
                    getErrorMessage(error)
                )
            }
        }

    const runMcpTripDetails =
        async () => {
            if (
                !requireTripId(mcpTripId)
            ) {
                return
            }

            try {
                const response =
                    await mcpClient.get(
                        '/trip/' +
                        mcpTripId
                    )

                setMcpResult(response.data)

                showToast(
                    'success',
                    'MCP trip details test successful.'
                )
            } catch (error) {
                showToast(
                    'error',
                    'MCP trip details failed: ' +
                    getErrorMessage(error)
                )
            }
        }

    const runMcpSavedAttractions =
        async () => {
            if (
                !requireTripId(mcpTripId)
            ) {
                return
            }

            try {
                const response =
                    await mcpClient.get(
                        '/saved-attractions?tripId=' +
                        mcpTripId
                    )

                setMcpResult(response.data)

                showToast(
                    'success',
                    'MCP saved attractions test successful.'
                )
            } catch (error) {
                showToast(
                    'error',
                    'MCP saved attractions failed: ' +
                    getErrorMessage(error)
                )
            }
        }

    const runMcpEstimate = async () => {
        if (
            !requireTripId(mcpTripId)
        ) {
            return
        }

        try {
            const response =
                await mcpClient.get(
                    '/estimate?tripId=' +
                    mcpTripId
                )

            setMcpResult(response.data)

            showToast(
                'success',
                'MCP estimate test successful.'
            )
        } catch (error) {
            showToast(
                'error',
                'MCP estimate failed: ' +
                getErrorMessage(error)
            )
        }
    }

    const logout = () => {
        keycloak.logout({
            redirectUri:
            window.location.origin
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

                    <p className="eyebrow">
                        Smart Travel Platform
                    </p>

                    <p className="login-text">
                        Plan smarter journeys, discover personalized recommendations
                        and manage your trips from one secure platform.
                    </p>

                    <button
                        className="button primary large login-button"
                        type="button"
                        onClick={() =>
                            keycloak.login()
                        }
                    >
                        <span>
                            Continue with Keycloak
                        </span>

                        <span className="login-arrow">
                            →
                        </span>
                    </button>

                    <p className="secure-login">
                        Secure authentication powered by Keycloak
                    </p>

                    <div className="demo-box">
                        <span>
                            Demo access
                        </span>

                        <strong>
                            demo-user
                        </strong>

                        <span className="demo-separator">
                            •
                        </span>

                        <strong>
                            demo-pass
                        </strong>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="app-shell">
            {toast && (
                <div
                    className={
                        'toast ' +
                        toast.type
                    }
                >
                    <span className="toast-indicator" />
                    <span>{toast.message}</span>
                </div>
            )}

            <aside className="sidebar">
                <div className="sidebar-top">
                    <div className="brand-block">
                        <img
                            src="/smart-travel-logo.png"
                            alt="Smart Travel Planner logo"
                            className="app-logo sidebar-logo"
                        />

                        <div className="brand-copy">
                            <h2>
                                Smart Travel
                            </h2>

                            <span>
                                Planner
                            </span>
                        </div>
                    </div>

                    <div className="workspace-label">
                        <span className="workspace-dot" />
                        Travel workspace
                    </div>

                    <nav className="menu">
                        {pages.map((page) => (
                            <button
                                key={page.id}
                                type="button"
                                className={
                                    activePage ===
                                    page.id
                                        ? 'menu-item active'
                                        : 'menu-item'
                                }
                                onClick={() =>
                                    setActivePage(
                                        page.id
                                    )
                                }
                            >
                                <span className="menu-icon">
                                    <Icon
                                        name={page.icon}
                                        size={20}
                                    />
                                </span>

                                <span className="menu-label">
                                    {page.label}
                                </span>

                                <span className="menu-active-marker" />
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="sidebar-bottom">
                    <div className="sidebar-system-card">
                        <div className="sidebar-system-head">
                            <span className="sidebar-system-icon">
                                <Icon
                                    name="activity"
                                    size={18}
                                />
                            </span>

                            <span>
                                System
                            </span>
                        </div>

                        <div className="sidebar-system-status">
                            <strong>
                                {healthyServiceCount}/4
                            </strong>

                            <span>
                                services online
                            </span>
                        </div>

                        <div className="mini-health-track">
                            <span
                                style={{
                                    width:
                                        `${healthyServiceCount * 25}%`
                                }}
                            />
                        </div>
                    </div>

                    <div className="sidebar-user">
                        <div className="user-avatar">
                            {currentUser
                                .charAt(0)
                                .toUpperCase()}
                        </div>

                        <div className="user-details">
                            <span>
                                Signed in as
                            </span>

                            <strong>
                                {currentUser}
                            </strong>
                        </div>

                        <button
                            className="icon-button sidebar-logout"
                            type="button"
                            onClick={logout}
                            title="Logout"
                        >
                            <Icon
                                name="logout"
                                size={19}
                            />
                        </button>
                    </div>
                </div>
            </aside>

            <main className="main-area">
                <header className="topbar">
                    <div className="topbar-heading">
                        <div className="topbar-page-icon">
                            <Icon
                                name={activePageData.icon}
                                size={22}
                            />
                        </div>

                        <div>
                            <h1>
                                {activePageData.label}
                            </h1>

                            <p>
                                {activePageData.subtitle}
                            </p>
                        </div>
                    </div>

                    <div className="topbar-actions">
                        <div className="system-online-pill">
                            <span
                                className={
                                    healthyServiceCount === 4
                                        ? 'online-dot healthy'
                                        : 'online-dot'
                                }
                            />

                            <span>
                                {healthyServiceCount === 4
                                    ? 'All systems operational'
                                    : `${healthyServiceCount}/4 services online`}
                            </span>
                        </div>

                        <a
                            className="external-link compact"
                            href="http://localhost:8500"
                            target="_blank"
                            rel="noreferrer"
                        >
                            Consul
                            <Icon
                                name="external"
                                size={14}
                            />
                        </a>

                        <a
                            className="external-link compact"
                            href="http://localhost:8085"
                            target="_blank"
                            rel="noreferrer"
                        >
                            Kafka
                            <Icon
                                name="external"
                                size={14}
                            />
                        </a>

                        <a
                            className="external-link compact"
                            href="http://localhost:8086/admin"
                            target="_blank"
                            rel="noreferrer"
                        >
                            Keycloak
                            <Icon
                                name="external"
                                size={14}
                            />
                        </a>
                    </div>
                </header>

                <div className="page-content">
                    {activePage === 'dashboard' && (
                        <section className="page-grid dashboard-page page-enter">
                            <div className="dashboard-hero">
                                <div className="dashboard-hero-copy">
                                    <div className="hero-kicker">
                                        <Icon
                                            name="sparkles"
                                            size={17}
                                        />

                                        <span>
                                            Smart journey planning
                                        </span>
                                    </div>

                                    <h2>
                                        Welcome back,{' '}
                                        <span>{currentUser}</span>.
                                    </h2>

                                    <p>
                                        Create journeys, discover places and keep your travel plans
                                        organized through one secure microservice platform.
                                    </p>

                                    <div className="hero-actions">
                                        <button
                                            className="button primary"
                                            type="button"
                                            onClick={() =>
                                                setActivePage(
                                                    'trips'
                                                )
                                            }
                                        >
                                            <Icon
                                                name="plus"
                                                size={18}
                                            />
                                            Plan a new trip
                                        </button>

                                        <button
                                            className="button secondary"
                                            type="button"
                                            onClick={() =>
                                                setActivePage(
                                                    'recommendations'
                                                )
                                            }
                                        >
                                            <Icon
                                                name="recommendations"
                                                size={18}
                                            />
                                            Explore places
                                        </button>
                                    </div>
                                </div>

                                <div className="hero-route-visual">
                                    <div className="route-glow route-glow-one" />
                                    <div className="route-glow route-glow-two" />

                                    <div className="route-location route-start">
                                        <span>
                                            <Icon
                                                name="mapPin"
                                                size={17}
                                            />
                                        </span>
                                        Start
                                    </div>

                                    <div className="route-path">
                                        <span />
                                        <span />
                                        <span />
                                    </div>

                                    <div className="hero-plane">
                                        <Icon
                                            name="trips"
                                            size={35}
                                        />
                                    </div>

                                    <div className="route-location route-end">
                                        <span>
                                            <Icon
                                                name="mapPin"
                                                size={17}
                                            />
                                        </span>

                                        {featuredTrip?.destination ||
                                            'Next adventure'}
                                    </div>
                                </div>
                            </div>

                            <div className="stats-grid">
                                <MetricCard
                                    icon="trips"
                                    label="Your trips"
                                    value={trips.length}
                                    detail="Planned journeys"
                                />

                                <MetricCard
                                    icon="wallet"
                                    label="Total budget"
                                    value={formatMoney(
                                        totalBudget
                                    )}
                                    detail="Across all trips"
                                />

                                <MetricCard
                                    icon="recommendations"
                                    label="Discoveries"
                                    value={
                                        recommendations.length
                                    }
                                    detail="Loaded recommendations"
                                />

                                <MetricCard
                                    icon="saved"
                                    label="Saved places"
                                    value={
                                        savedRecommendations.length
                                    }
                                    detail="Current loaded trip"
                                />
                            </div>

                            <div className="dashboard-main-grid">
                                <div className="panel health-overview-card">
                                    <PageHeading
                                        eyebrow="Live infrastructure"
                                        title="System health"
                                        text="Real-time availability across the core travel services."
                                        action={
                                            <button
                                                className="button secondary compact-button"
                                                type="button"
                                                onClick={
                                                    loadHealth
                                                }
                                            >
                                                <Icon
                                                    name="refresh"
                                                    size={16}
                                                />
                                                Refresh
                                            </button>
                                        }
                                    />

                                    <div className="health-grid">
                                        <HealthCard
                                            label="API Gateway"
                                            value={
                                                health.gateway
                                            }
                                            icon="route"
                                        />

                                        <HealthCard
                                            label="Trip Service"
                                            value={health.trip}
                                            icon="trips"
                                        />

                                        <HealthCard
                                            label="Recommendation"
                                            value={
                                                health.recommendation
                                            }
                                            icon="recommendations"
                                        />

                                        <HealthCard
                                            label="MCP Server"
                                            value={health.mcp}
                                            icon="mcp"
                                        />
                                    </div>

                                    <div className="health-summary">
                                        <div>
                                            <strong>
                                                {
                                                    healthyServiceCount
                                                }
                                            </strong>

                                            <span>
                                                services healthy
                                            </span>
                                        </div>

                                        <div className="health-progress">
                                            <span
                                                style={{
                                                    width:
                                                        `${healthyServiceCount * 25}%`
                                                }}
                                            />
                                        </div>

                                        <small>
                                            {healthyServiceCount ===
                                            4
                                                ? 'Everything is running normally.'
                                                : 'One or more services require attention.'}
                                        </small>
                                    </div>
                                </div>

                                <div className="panel featured-trip-card">
                                    <PageHeading
                                        eyebrow="Your journey"
                                        title={
                                            featuredTrip
                                                ? 'Next adventure'
                                                : 'Start exploring'
                                        }
                                        text={
                                            featuredTrip
                                                ? 'Your currently selected travel plan.'
                                                : 'Create your first trip to see it here.'
                                        }
                                    />

                                    {featuredTrip ? (
                                        <div className="featured-trip-content">
                                            <div className="featured-destination">
                                                <div className="destination-mark">
                                                    <Icon
                                                        name="mapPin"
                                                        size={23}
                                                    />
                                                </div>

                                                <div>
                                                    <span>
                                                        Destination
                                                    </span>

                                                    <h3>
                                                        {
                                                            featuredTrip.destination
                                                        }
                                                    </h3>
                                                </div>
                                            </div>

                                            <div className="featured-trip-details">
                                                <div>
                                                    <Icon
                                                        name="calendar"
                                                        size={17}
                                                    />

                                                    <span>
                                                        {
                                                            featuredTrip.startDate
                                                        }{' '}
                                                        →{' '}
                                                        {
                                                            featuredTrip.endDate
                                                        }
                                                    </span>
                                                </div>

                                                <div>
                                                    <Icon
                                                        name="wallet"
                                                        size={17}
                                                    />

                                                    <span>
                                                        {formatMoney(
                                                            featuredTrip.budget
                                                        )}
                                                    </span>
                                                </div>

                                                <div>
                                                    <Icon
                                                        name="activity"
                                                        size={17}
                                                    />

                                                    <span>
                                                        {featuredTrip.status ||
                                                            'PLANNED'}
                                                    </span>
                                                </div>
                                            </div>

                                            <button
                                                className="button secondary full"
                                                type="button"
                                                onClick={() => {
                                                    setSelectedTripId(
                                                        String(
                                                            featuredTrip.id
                                                        )
                                                    )
                                                    setActivePage(
                                                        'trips'
                                                    )
                                                }}
                                            >
                                                View trip
                                                <Icon
                                                    name="arrow"
                                                    size={17}
                                                />
                                            </button>
                                        </div>
                                    ) : (
                                        <EmptyState
                                            title="No journeys yet"
                                            text="Create your first travel plan and it will appear here."
                                            icon="trips"
                                        />
                                    )}
                                </div>
                            </div>

                            <div className="panel external-api-card">
                                <PageHeading
                                    eyebrow="External intelligence"
                                    title="Geoapify Places API"
                                    text="Recommendation Service prioritizes local seed data and falls back to live place data whenever curated results are unavailable."
                                    action={
                                        <StatusBadge
                                            value={
                                                externalApiStatus ===
                                                null
                                                    ? 'UNKNOWN'
                                                    : externalApiStatus.enabled &&
                                                    externalApiStatus.apiKeyConfigured
                                                        ? 'UP'
                                                        : 'DOWN'
                                            }
                                        />
                                    }
                                />

                                <div className="external-api-grid">
                                    <div className="integration-stat">
                                        <span>
                                            Provider
                                        </span>

                                        <strong>
                                            {externalApiStatus?.provider ||
                                                'Geoapify Places API'}
                                        </strong>
                                    </div>

                                    <div className="integration-stat">
                                        <span>
                                            API key
                                        </span>

                                        <strong>
                                            {externalApiStatus?.apiKeyConfigured
                                                ? 'Configured'
                                                : 'Missing'}
                                        </strong>
                                    </div>

                                    <div className="integration-stat">
                                        <span>
                                            Strategy
                                        </span>

                                        <strong>
                                            {externalApiStatus?.strategy ||
                                                'Seed Data first, Live API fallback'}
                                        </strong>
                                    </div>

                                    <div className="integration-stat">
                                        <span>
                                            Deduplication
                                        </span>

                                        <strong>
                                            {externalApiStatus?.deduplicationKey ||
                                                'externalPlaceId'}
                                        </strong>
                                    </div>

                                    <div className="integration-stat accent-stat">
                                        <span>
                                            Live results
                                        </span>

                                        <strong>
                                            {
                                                recommendationSourceStats.live
                                            }
                                        </strong>
                                    </div>

                                    <div className="integration-stat">
                                        <span>
                                            Seed results
                                        </span>

                                        <strong>
                                            {
                                                recommendationSourceStats.seed
                                            }
                                        </strong>
                                    </div>
                                </div>

                                <div className="integration-footer">
                                    <div className="api-flow-box">
                                        <Icon
                                            name="route"
                                            size={17}
                                        />

                                        <span>
                                            {externalApiStatus?.backendFlow ||
                                                'Frontend → API Gateway → Recommendation Service → Geoapify'}
                                        </span>
                                    </div>

                                    <button
                                        className="button secondary"
                                        type="button"
                                        onClick={
                                            loadExternalApiStatus
                                        }
                                    >
                                        <Icon
                                            name="refresh"
                                            size={17}
                                        />
                                        Refresh integration
                                    </button>
                                </div>
                            </div>
                        </section>
                    )}

                    {activePage === 'trips' && (
                        <section className="page-grid trips-page page-enter">
                            <div className="page-intro-banner">
                                <div>
                                    <p className="eyebrow">
                                        Journey planner
                                    </p>

                                    <h2>
                                        Turn an idea into your next trip.
                                    </h2>

                                    <p>
                                        Create and manage travel plans while the platform handles persistence,
                                        events and service communication behind the scenes.
                                    </p>
                                </div>

                                <div className="intro-banner-stat">
                                    <span>
                                        Active workspace
                                    </span>

                                    <strong>
                                        {trips.length}{' '}
                                        {trips.length === 1
                                            ? 'trip'
                                            : 'trips'}
                                    </strong>
                                </div>
                            </div>

                            <div className="two-column trips-layout">
                                <form
                                    className="panel trip-form-panel"
                                    onSubmit={createTrip}
                                >
                                    <PageHeading
                                        eyebrow="Create journey"
                                        title="Plan a new trip"
                                        text="Start with the demo values or create a completely new itinerary."
                                    />

                                    <div className="form-section">
                                        <div className="field-group full-field">
                                            <label>
                                                Traveler
                                            </label>

                                            <div className="input-with-icon">
                                                <Icon
                                                    name="user"
                                                    size={18}
                                                />

                                                <input
                                                    name="userId"
                                                    value={
                                                        tripForm.userId
                                                    }
                                                    readOnly
                                                />
                                            </div>
                                        </div>

                                        <div className="field-group full-field">
                                            <label>
                                                Destination
                                            </label>

                                            <div className="input-with-icon">
                                                <Icon
                                                    name="mapPin"
                                                    size={18}
                                                />

                                                <input
                                                    name="destination"
                                                    value={
                                                        tripForm.destination
                                                    }
                                                    onChange={
                                                        handleTripFormChange
                                                    }
                                                    placeholder="Where would you like to go?"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="form-row">
                                            <div className="field-group">
                                                <label>
                                                    Start date
                                                </label>

                                                <div className="input-with-icon">
                                                    <Icon
                                                        name="calendar"
                                                        size={18}
                                                    />

                                                    <input
                                                        type="date"
                                                        name="startDate"
                                                        value={
                                                            tripForm.startDate
                                                        }
                                                        onChange={
                                                            handleTripFormChange
                                                        }
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            <div className="field-group">
                                                <label>
                                                    End date
                                                </label>

                                                <div className="input-with-icon">
                                                    <Icon
                                                        name="calendar"
                                                        size={18}
                                                    />

                                                    <input
                                                        type="date"
                                                        name="endDate"
                                                        value={
                                                            tripForm.endDate
                                                        }
                                                        onChange={
                                                            handleTripFormChange
                                                        }
                                                        min={
                                                            tripForm.startDate ||
                                                            undefined
                                                        }
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="form-row">
                                            <div className="field-group">
                                                <label>
                                                    Budget
                                                </label>

                                                <div className="input-with-icon">
                                                    <Icon
                                                        name="wallet"
                                                        size={18}
                                                    />

                                                    <input
                                                        type="number"
                                                        name="budget"
                                                        value={
                                                            tripForm.budget
                                                        }
                                                        onChange={
                                                            handleTripFormChange
                                                        }
                                                        min="0.01"
                                                        step="0.01"
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            <div className="field-group">
                                                <label>
                                                    Currency
                                                </label>

                                                <select
                                                    name="currency"
                                                    value={
                                                        tripForm.currency
                                                    }
                                                    onChange={
                                                        handleTripFormChange
                                                    }
                                                >
                                                    <option value="EUR">
                                                        EURO
                                                    </option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="trip-form-footer">
                                        <div className="button-row">
                                            <button
                                                className="button ghost"
                                                type="button"
                                                onClick={
                                                    resetTripFormToDemo
                                                }
                                            >
                                                Reset demo
                                            </button>

                                            <button
                                                className="button ghost"
                                                type="button"
                                                onClick={
                                                    clearTripForm
                                                }
                                            >
                                                Clear
                                            </button>
                                        </div>

                                        <button
                                            className="button primary"
                                            type="submit"
                                        >
                                            <Icon
                                                name="plus"
                                                size={18}
                                            />
                                            Create trip
                                        </button>
                                    </div>
                                </form>

                                <div className="panel trips-library-panel">
                                    <PageHeading
                                        eyebrow="Your journeys"
                                        title="Trip library"
                                        text="Inspect, update and manage all travel plans saved for your account."
                                        action={
                                            <button
                                                className="button secondary compact-button"
                                                type="button"
                                                onClick={
                                                    loadTrips
                                                }
                                            >
                                                <Icon
                                                    name="refresh"
                                                    size={16}
                                                />
                                                Reload
                                            </button>
                                        }
                                    />

                                    <div className="trip-lookup">
                                        <div className="input-with-icon">
                                            <Icon
                                                name="search"
                                                size={17}
                                            />

                                            <input
                                                value={
                                                    selectedTripId
                                                }
                                                onChange={(
                                                    event
                                                ) =>
                                                    setSelectedTripId(
                                                        event.target.value
                                                    )
                                                }
                                                placeholder="Enter Trip ID"
                                            />
                                        </div>

                                        <button
                                            className="button secondary"
                                            type="button"
                                            onClick={() =>
                                                loadTripDetails()
                                            }
                                        >
                                            Load details
                                        </button>
                                    </div>

                                    {selectedTrip && (
                                        <div className="selected-trip-card">
                                            <div className="selected-trip-head">
                                                <div>
                                                    <span className="selected-trip-label">
                                                        Selected trip
                                                    </span>

                                                    <h3>
                                                        {
                                                            selectedTrip.destination
                                                        }
                                                    </h3>
                                                </div>

                                                <StatusBadge
                                                    value={
                                                        selectedTrip.status ||
                                                        'PLANNED'
                                                    }
                                                />
                                            </div>

                                            <div className="selected-trip-meta">
                                                <div>
                                                    <Icon
                                                        name="calendar"
                                                        size={17}
                                                    />

                                                    <span>
                                                        {
                                                            selectedTrip.startDate
                                                        }{' '}
                                                        →{' '}
                                                        {
                                                            selectedTrip.endDate
                                                        }
                                                    </span>
                                                </div>

                                                <div>
                                                    <Icon
                                                        name="wallet"
                                                        size={17}
                                                    />

                                                    <span>
                                                        {formatMoney(
                                                            selectedTrip.budget
                                                        )}
                                                    </span>
                                                </div>
                                            </div>

                                            <JsonBlock
                                                data={selectedTrip}
                                                label="Trip payload"
                                            />
                                        </div>
                                    )}

                                    <div className="trip-list">
                                        {trips.length === 0 && (
                                            <EmptyState
                                                title="No trips yet"
                                                text="Create a journey and it will appear in your trip library."
                                                icon="trips"
                                            />
                                        )}

                                        {trips.map((trip) => (
                                            <article
                                                className={
                                                    String(
                                                        selectedTripId
                                                    ) ===
                                                    String(
                                                        trip.id
                                                    )
                                                        ? 'trip-card active'
                                                        : 'trip-card'
                                                }
                                                key={trip.id}
                                            >
                                                <div className="trip-card-main">
                                                    <div className="trip-destination-icon">
                                                        <Icon
                                                            name="mapPin"
                                                            size={20}
                                                        />
                                                    </div>

                                                    <div className="trip-card-copy">
                                                        <div className="trip-card-title">
                                                            <h3>
                                                                {
                                                                    trip.destination
                                                                }
                                                            </h3>

                                                            <span>
                                                                #
                                                                {
                                                                    trip.id
                                                                }
                                                            </span>
                                                        </div>

                                                        <div className="trip-card-date">
                                                            <Icon
                                                                name="calendar"
                                                                size={14}
                                                            />

                                                            <span>
                                                                {
                                                                    trip.startDate
                                                                }{' '}
                                                                →{' '}
                                                                {
                                                                    trip.endDate
                                                                }
                                                            </span>
                                                        </div>

                                                        <div className="trip-card-meta">
                                                            <strong>
                                                                {formatMoney(
                                                                    trip.budget
                                                                )}
                                                            </strong>

                                                            <span>
                                                                {trip.status ||
                                                                    'PLANNED'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="trip-card-actions">
                                                    <button
                                                        className="icon-button"
                                                        type="button"
                                                        title="View trip"
                                                        onClick={() =>
                                                            loadTripDetails(
                                                                trip.id
                                                            )
                                                        }
                                                    >
                                                        <Icon
                                                            name="eye"
                                                            size={18}
                                                        />
                                                    </button>

                                                    <button
                                                        className="icon-button success-icon-button"
                                                        type="button"
                                                        title="Mark completed"
                                                        onClick={() =>
                                                            updateTripStatus(
                                                                trip,
                                                                'COMPLETED'
                                                            )
                                                        }
                                                    >
                                                        <Icon
                                                            name="check"
                                                            size={18}
                                                        />
                                                    </button>

                                                    <button
                                                        className="icon-button danger-icon-button"
                                                        type="button"
                                                        title="Delete trip"
                                                        onClick={() =>
                                                            deleteTrip(
                                                                trip.id
                                                            )
                                                        }
                                                    >
                                                        <Icon
                                                            name="trash"
                                                            size={18}
                                                        />
                                                    </button>
                                                </div>
                                            </article>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                    {activePage ===
                        'recommendations' && (
                            <section className="page-grid recommendations-page page-enter">
                                <div className="recommendations-hero">
                                    <div>
                                        <p className="eyebrow">
                                            Curated discovery
                                        </p>

                                        <h2>
                                            Find places worth adding to your journey.
                                        </h2>

                                        <p>
                                            Search local seed data or automatically fall back to Geoapify for live hotels,
                                            restaurants and attractions.
                                        </p>
                                    </div>

                                    <div className="recommendation-counter">
                                        <strong>
                                            {
                                                recommendations.length
                                            }
                                        </strong>

                                        <span>
                                        results loaded
                                    </span>
                                    </div>
                                </div>

                                <div className="panel recommendation-search-panel">
                                    <PageHeading
                                        eyebrow="Search"
                                        title="Discover recommendations"
                                        text="Choose a destination and category, then explore the results."
                                    />

                                    <div className="search-grid premium-search-grid">
                                        <div className="field-group destination-search-field">
                                            <label>
                                                Destination
                                            </label>

                                            <div className="input-with-icon">
                                                <Icon
                                                    name="mapPin"
                                                    size={18}
                                                />

                                                <input
                                                    value={
                                                        destination
                                                    }
                                                    onChange={(
                                                        event
                                                    ) =>
                                                        setDestination(
                                                            event.target.value
                                                        )
                                                    }
                                                    placeholder="Paris, Rome, Berlin..."
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="field-group">
                                            <label>
                                                Type
                                            </label>

                                            <select
                                                value={
                                                    recommendationType
                                                }
                                                onChange={(
                                                    event
                                                ) =>
                                                    setRecommendationType(
                                                        event.target.value
                                                    )
                                                }
                                            >
                                                <option value="">
                                                    ALL TYPES
                                                </option>
                                                <option value="ATTRACTION">
                                                    ATTRACTION
                                                </option>
                                                <option value="HOTEL">
                                                    HOTEL
                                                </option>
                                                <option value="RESTAURANT">
                                                    RESTAURANT
                                                </option>
                                            </select>
                                        </div>

                                        <div className="field-group">
                                            <label>
                                                Hotel budget
                                            </label>

                                            <div className="input-with-icon">
                                                <Icon
                                                    name="wallet"
                                                    size={18}
                                                />

                                                <input
                                                    type="number"
                                                    value={
                                                        hotelBudget
                                                    }
                                                    onChange={(
                                                        event
                                                    ) =>
                                                        setHotelBudget(
                                                            event.target.value
                                                        )
                                                    }
                                                    min="0"
                                                    step="0.01"
                                                />
                                            </div>
                                        </div>

                                        <div className="field-group">
                                            <label>
                                                Save to trip
                                            </label>

                                            <div className="input-with-icon">
                                                <Icon
                                                    name="trips"
                                                    size={18}
                                                />

                                                <input
                                                    value={
                                                        saveTripId
                                                    }
                                                    onChange={(
                                                        event
                                                    ) =>
                                                        setSaveTripId(
                                                            event.target.value
                                                        )
                                                    }
                                                    placeholder="Trip ID"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="recommendation-search-actions">
                                        <button
                                            className="button primary search-primary-button"
                                            type="button"
                                            onClick={
                                                loadRecommendations
                                            }
                                        >
                                            <Icon
                                                name="search"
                                                size={18}
                                            />
                                            Search places
                                        </button>

                                        <div className="endpoint-actions">
                                            <button
                                                className="filter-button"
                                                type="button"
                                                onClick={
                                                    loadAttractions
                                                }
                                            >
                                                Attractions
                                            </button>

                                            <button
                                                className="filter-button"
                                                type="button"
                                                onClick={
                                                    loadRestaurants
                                                }
                                            >
                                                Restaurants
                                            </button>

                                            <button
                                                className="filter-button"
                                                type="button"
                                                onClick={
                                                    loadHotels
                                                }
                                            >
                                                Hotels under budget
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="recommendation-stats-row">
                                    <div className="mini-stat-card">
                                    <span>
                                        Total results
                                    </span>

                                        <strong>
                                            {
                                                recommendations.length
                                            }
                                        </strong>
                                    </div>

                                    <div className="mini-stat-card live">
                                    <span>
                                        Live API
                                    </span>

                                        <strong>
                                            {
                                                recommendationSourceStats.live
                                            }
                                        </strong>
                                    </div>

                                    <div className="mini-stat-card seed">
                                    <span>
                                        Seed data
                                    </span>

                                        <strong>
                                            {
                                                recommendationSourceStats.seed
                                            }
                                        </strong>
                                    </div>
                                </div>

                                <div className="panel feign-panel">
                                    <div className="feign-content">
                                        <div className="feign-icon">
                                            <Icon
                                                name="route"
                                                size={24}
                                            />
                                        </div>

                                        <div>
                                            <p className="eyebrow">
                                                Service-to-service
                                            </p>

                                            <h3>
                                                Feign communication test
                                            </h3>

                                            <p>
                                                Trip Service requests recommendations through Feign while Consul handles service discovery.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="feign-actions">
                                        <input
                                            value={
                                                selectedTripId
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                setSelectedTripId(
                                                    event.target.value
                                                )
                                            }
                                            placeholder="Trip ID"
                                        />

                                        <button
                                            className="button secondary"
                                            type="button"
                                            onClick={
                                                loadRecommendationsThroughTrip
                                            }
                                        >
                                            Run Feign test
                                            <Icon
                                                name="arrow"
                                                size={16}
                                            />
                                        </button>
                                    </div>

                                    {tripRecommendations.length >
                                        0 && (
                                            <JsonBlock
                                                data={
                                                    tripRecommendations
                                                }
                                                label="Feign response"
                                            />
                                        )}
                                </div>

                                <div className="recommendation-grid">
                                    {recommendations.length ===
                                        0 && (
                                            <div className="recommendation-empty-wrap">
                                                <EmptyState
                                                    title="Nothing discovered yet"
                                                    text="Search for Paris to see curated seed data, or Rome and Berlin to demonstrate live API fallback."
                                                    icon="recommendations"
                                                />
                                            </div>
                                        )}

                                    {recommendations.map(
                                        (recommendation) => (
                                            <RecommendationCard
                                                key={
                                                    recommendation.id
                                                }
                                                recommendation={
                                                    recommendation
                                                }
                                                onSave={
                                                    saveRecommendation
                                                }
                                            />
                                        )
                                    )}
                                </div>
                            </section>
                        )}

                    {activePage === 'saved' && (
                        <section className="page-grid saved-page page-enter">
                            <div className="page-intro-banner saved-intro">
                                <div>
                                    <p className="eyebrow">
                                        Travel collection
                                    </p>

                                    <h2>
                                        Your saved places and travel cost.
                                    </h2>

                                    <p>
                                        Review the recommendations attached to a trip and compare cost estimation across services.
                                    </p>
                                </div>

                                <div className="saved-trip-selector">
                                    <label>
                                        Active Trip ID
                                    </label>

                                    <input
                                        value={
                                            savedTripId
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setSavedTripId(
                                                event.target.value
                                            )
                                        }
                                        placeholder="Trip ID"
                                    />
                                </div>
                            </div>

                            <div className="cost-overview-grid">
                                <div className="cost-card cost-card-featured">
                                    <div className="cost-card-icon">
                                        <Icon
                                            name="wallet"
                                            size={21}
                                        />
                                    </div>

                                    <span>
                                        Trip budget
                                    </span>

                                    <strong>
                                        {savedTrip
                                            ? formatMoney(
                                                savedTrip.budget
                                            )
                                            : '—'}
                                    </strong>

                                    <small>
                                        Original planned budget
                                    </small>
                                </div>

                                <div className="cost-card">
                                    <div className="cost-card-icon">
                                        <Icon
                                            name="trips"
                                            size={21}
                                        />
                                    </div>

                                    <span>
                                        Trip Service estimate
                                    </span>

                                    <strong>
                                        {tripCost === null
                                            ? '—'
                                            : formatMoney(
                                                tripCost
                                            )}
                                    </strong>

                                    <small>
                                        Synchronous service result
                                    </small>
                                </div>

                                <div className="cost-card">
                                    <div className="cost-card-icon">
                                        <Icon
                                            name="recommendations"
                                            size={21}
                                        />
                                    </div>

                                    <span>
                                        Recommendation estimate
                                    </span>

                                    <strong>
                                        {recommendationCost ===
                                        null
                                            ? '—'
                                            : formatMoney(
                                                recommendationCost
                                            )}
                                    </strong>

                                    <small>
                                        Recommendation Service
                                    </small>
                                </div>

                                <div className="cost-card remaining-cost-card">
                                    <div className="cost-card-icon">
                                        <Icon
                                            name="activity"
                                            size={21}
                                        />
                                    </div>

                                    <span>
                                        Remaining budget
                                    </span>

                                    <strong>
                                        {remainingBudget ===
                                        null
                                            ? '—'
                                            : formatMoney(
                                                remainingBudget
                                            )}
                                    </strong>

                                    <small>
                                        After loaded estimate
                                    </small>
                                </div>
                            </div>

                            <div className="saved-content-grid">
                                <div className="panel saved-controls-panel">
                                    <PageHeading
                                        eyebrow="Cost tools"
                                        title="Calculate your plan"
                                        text="Load saved recommendations and compare estimates from two service paths."
                                    />

                                    <div className="saved-action-list">
                                        <button
                                            className="saved-action-button primary-action"
                                            type="button"
                                            onClick={
                                                loadSavedRecommendations
                                            }
                                        >
                                            <span className="saved-action-icon">
                                                <Icon
                                                    name="saved"
                                                    size={20}
                                                />
                                            </span>

                                            <span>
                                                <strong>
                                                    Load saved places
                                                </strong>

                                                <small>
                                                    Retrieve recommendations linked to this trip
                                                </small>
                                            </span>

                                            <Icon
                                                name="arrow"
                                                size={18}
                                            />
                                        </button>

                                        <button
                                            className="saved-action-button"
                                            type="button"
                                            onClick={
                                                estimateCostThroughTrip
                                            }
                                        >
                                            <span className="saved-action-icon">
                                                <Icon
                                                    name="trips"
                                                    size={20}
                                                />
                                            </span>

                                            <span>
                                                <strong>
                                                    Estimate via Trip Service
                                                </strong>

                                                <small>
                                                    Calculate through the Trip context
                                                </small>
                                            </span>

                                            <Icon
                                                name="arrow"
                                                size={18}
                                            />
                                        </button>

                                        <button
                                            className="saved-action-button"
                                            type="button"
                                            onClick={
                                                estimateCostThroughRecommendation
                                            }
                                        >
                                            <span className="saved-action-icon">
                                                <Icon
                                                    name="recommendations"
                                                    size={20}
                                                />
                                            </span>

                                            <span>
                                                <strong>
                                                    Estimate via Recommendation Service
                                                </strong>

                                                <small>
                                                    Compare the second service endpoint
                                                </small>
                                            </span>

                                            <Icon
                                                name="arrow"
                                                size={18}
                                            />
                                        </button>
                                    </div>
                                </div>

                                <div className="panel saved-items-panel">
                                    <PageHeading
                                        eyebrow="Collection"
                                        title="Saved places"
                                        text={`${savedRecommendations.length} saved item${savedRecommendations.length === 1
                                            ? ''
                                            : 's'
                                        } loaded for this trip.`}
                                    />

                                    <div className="saved-items-list">
                                        {savedRecommendations.length ===
                                            0 && (
                                                <EmptyState
                                                    title="No saved places"
                                                    text="Save a recommendation to this trip and load the collection again."
                                                    icon="saved"
                                                />
                                            )}

                                        {savedRecommendations.map(
                                            (saved) => {
                                                const recommendation =
                                                    saved.recommendation ||
                                                    saved

                                                return (
                                                    <article
                                                        className="saved-item-card"
                                                        key={
                                                            saved.id
                                                        }
                                                    >
                                                        <div className="saved-item-icon">
                                                            <Icon
                                                                name="mapPin"
                                                                size={20}
                                                            />
                                                        </div>

                                                        <div className="saved-item-copy">
                                                            <div className="saved-item-head">
                                                                <h3>
                                                                    {recommendation.name ||
                                                                        'Saved recommendation'}
                                                                </h3>

                                                                <span className="type-badge">
                                                                    {recommendation.type ||
                                                                        'PLACE'}
                                                                </span>
                                                            </div>

                                                            <p>
                                                                {recommendation.description ||
                                                                    'No description available.'}
                                                            </p>

                                                            <div className="saved-item-meta">
                                                                <strong>
                                                                    {formatMoney(
                                                                        recommendation.estimatedPrice
                                                                    )}
                                                                </strong>

                                                                <span>
                                                                    Saved ID{' '}
                                                                    {
                                                                        saved.id
                                                                    }
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </article>
                                                )
                                            }
                                        )}
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                    {activePage === 'mcp' && (
                        <section className="page-grid mcp-page page-enter">
                            <div className="mcp-hero">
                                <div className="mcp-hero-icon">
                                    <Icon
                                        name="mcp"
                                        size={31}
                                    />
                                </div>

                                <div>
                                    <p className="eyebrow">
                                        Model Context Protocol
                                    </p>

                                    <h2>
                                        Travel tools, exposed through MCP.
                                    </h2>

                                    <p>
                                        Run helper endpoints against the same secured travel platform and inspect structured results in real time.
                                    </p>
                                </div>

                                <div className="mcp-status-pill">
                                    <span className="online-dot healthy" />
                                    MCP Server
                                    <StatusBadge
                                        value={health.mcp}
                                    />
                                </div>
                            </div>

                            <div className="two-column mcp-layout">
                                <div className="panel mcp-controls-panel">
                                    <PageHeading
                                        eyebrow="Tool configuration"
                                        title="Configure request"
                                        text="Set the input values used by MCP travel tools."
                                    />

                                    <div className="form-section">
                                        <div className="field-group">
                                            <label>
                                                Destination
                                            </label>

                                            <div className="input-with-icon">
                                                <Icon
                                                    name="mapPin"
                                                    size={18}
                                                />

                                                <input
                                                    value={
                                                        mcpDestination
                                                    }
                                                    onChange={(
                                                        event
                                                    ) =>
                                                        setMcpDestination(
                                                            event.target.value
                                                        )
                                                    }
                                                    placeholder="Paris"
                                                />
                                            </div>
                                        </div>

                                        <div className="form-row">
                                            <div className="field-group">
                                                <label>
                                                    Type
                                                </label>

                                                <select
                                                    value={
                                                        mcpType
                                                    }
                                                    onChange={(
                                                        event
                                                    ) =>
                                                        setMcpType(
                                                            event.target.value
                                                        )
                                                    }
                                                >
                                                    <option value="ATTRACTION">
                                                        ATTRACTION
                                                    </option>
                                                    <option value="HOTEL">
                                                        HOTEL
                                                    </option>
                                                    <option value="RESTAURANT">
                                                        RESTAURANT
                                                    </option>
                                                </select>
                                            </div>

                                            <div className="field-group">
                                                <label>
                                                    Result limit
                                                </label>

                                                <input
                                                    type="number"
                                                    value={
                                                        mcpLimit
                                                    }
                                                    onChange={(
                                                        event
                                                    ) =>
                                                        setMcpLimit(
                                                            event.target.value
                                                        )
                                                    }
                                                    min="1"
                                                    max="50"
                                                />
                                            </div>
                                        </div>

                                        <div className="field-group">
                                            <label>
                                                Trip ID
                                            </label>

                                            <div className="input-with-icon">
                                                <Icon
                                                    name="trips"
                                                    size={18}
                                                />

                                                <input
                                                    value={
                                                        mcpTripId
                                                    }
                                                    onChange={(
                                                        event
                                                    ) =>
                                                        setMcpTripId(
                                                            event.target.value
                                                        )
                                                    }
                                                    placeholder="Trip ID"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mcp-tool-list">
                                        <button
                                            className="mcp-tool-button featured"
                                            type="button"
                                            onClick={
                                                runMcpRecommendPlaces
                                            }
                                        >
                                            <span className="mcp-tool-icon">
                                                <Icon
                                                    name="recommendations"
                                                    size={21}
                                                />
                                            </span>

                                            <span>
                                                <strong>
                                                    recommend_places
                                                </strong>

                                                <small>
                                                    Find travel recommendations for a destination
                                                </small>
                                            </span>

                                            <Icon
                                                name="arrow"
                                                size={18}
                                            />
                                        </button>

                                        <button
                                            className="mcp-tool-button"
                                            type="button"
                                            onClick={
                                                runMcpTripDetails
                                            }
                                        >
                                            <span className="mcp-tool-icon">
                                                <Icon
                                                    name="trips"
                                                    size={21}
                                                />
                                            </span>

                                            <span>
                                                <strong>
                                                    get_trip_details
                                                </strong>

                                                <small>
                                                    Retrieve a complete trip through MCP
                                                </small>
                                            </span>

                                            <Icon
                                                name="arrow"
                                                size={18}
                                            />
                                        </button>

                                        <button
                                            className="mcp-tool-button"
                                            type="button"
                                            onClick={
                                                runMcpSavedAttractions
                                            }
                                        >
                                            <span className="mcp-tool-icon">
                                                <Icon
                                                    name="saved"
                                                    size={21}
                                                />
                                            </span>

                                            <span>
                                                <strong>
                                                    get_saved_attractions
                                                </strong>

                                                <small>
                                                    Load saved places for the selected trip
                                                </small>
                                            </span>

                                            <Icon
                                                name="arrow"
                                                size={18}
                                            />
                                        </button>

                                        <button
                                            className="mcp-tool-button"
                                            type="button"
                                            onClick={
                                                runMcpEstimate
                                            }
                                        >
                                            <span className="mcp-tool-icon">
                                                <Icon
                                                    name="wallet"
                                                    size={21}
                                                />
                                            </span>

                                            <span>
                                                <strong>
                                                    estimate_trip_cost
                                                </strong>

                                                <small>
                                                    Calculate saved recommendation cost
                                                </small>
                                            </span>

                                            <Icon
                                                name="arrow"
                                                size={18}
                                            />
                                        </button>
                                    </div>
                                </div>

                                <div className="panel mcp-result-panel">
                                    <PageHeading
                                        eyebrow="Live output"
                                        title="MCP result"
                                        text="Structured response returned by the selected MCP tool."
                                        action={
                                            <span className="response-state">
                                                <span
                                                    className={
                                                        mcpResult !==
                                                        null
                                                            ? 'online-dot healthy'
                                                            : 'online-dot'
                                                    }
                                                />

                                                {mcpResult !==
                                                null
                                                    ? 'Response ready'
                                                    : 'Waiting'}
                                            </span>
                                        }
                                    />

                                    <div className="mcp-result-content">
                                        {mcpResult !==
                                        null ? (
                                            <JsonBlock
                                                data={
                                                    mcpResult
                                                }
                                                label="MCP response"
                                            />
                                        ) : (
                                            <EmptyState
                                                title="No MCP result yet"
                                                text="Choose one of the travel tools and run it to inspect its response."
                                                icon="mcp"
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                    {activePage === 'system' && (
                        <section className="page-grid system-page page-enter">
                            <div className="system-hero">
                                <div className="system-hero-copy">
                                    <p className="eyebrow">
                                        Architecture evidence
                                    </p>

                                    <h2>
                                        A travel application built as a complete SOA ecosystem.
                                    </h2>

                                    <p>
                                        Explore how the platform implements service boundaries, security,
                                        event-driven communication, service discovery, contract testing,
                                        external integration and MCP tooling.
                                    </p>
                                </div>

                                <div className="system-architecture-visual">
                                    <div className="architecture-node architecture-main">
                                        <Icon
                                            name="globe"
                                            size={23}
                                        />
                                        Frontend
                                    </div>

                                    <div className="architecture-line" />

                                    <div className="architecture-node">
                                        <Icon
                                            name="route"
                                            size={20}
                                        />
                                        Gateway
                                    </div>

                                    <div className="architecture-split">
                                        <span />
                                        <span />
                                    </div>

                                    <div className="architecture-service-row">
                                        <div className="architecture-node small">
                                            Trips
                                        </div>

                                        <div className="architecture-node small">
                                            Recommend
                                        </div>

                                        <div className="architecture-node small">
                                            MCP
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="panel requirements-panel">
                                <PageHeading
                                    eyebrow="Requirement coverage"
                                    title="Architecture checklist"
                                    text="Each capability maps directly to its implementation and a reproducible way to test it."
                                />

                                <div className="requirement-grid">
                                    {proofItems.map(
                                        (
                                            item,
                                            index
                                        ) => (
                                            <article
                                                className="requirement-card"
                                                key={
                                                    item.title
                                                }
                                            >
                                                <div className="requirement-card-header">
                                                    <div className="requirement-index">
                                                        {String(
                                                            index +
                                                            1
                                                        ).padStart(
                                                            2,
                                                            '0'
                                                        )}
                                                    </div>

                                                    <span className="requirement-category">
                                                        {
                                                            item.category
                                                        }
                                                    </span>
                                                </div>

                                                <div className="requirement-top">
                                                    <span className="check-dot">
                                                        <Icon
                                                            name="check"
                                                            size={17}
                                                        />
                                                    </span>

                                                    <h3>
                                                        {
                                                            item.title
                                                        }
                                                    </h3>
                                                </div>

                                                <div className="requirement-section">
                                                    <strong>
                                                        Requirement
                                                    </strong>

                                                    <p>
                                                        {
                                                            item.requirement
                                                        }
                                                    </p>
                                                </div>

                                                <div className="requirement-section">
                                                    <strong>
                                                        Implementation
                                                    </strong>

                                                    <p>
                                                        {
                                                            item.implementation
                                                        }
                                                    </p>
                                                </div>

                                                <div className="requirement-section test-section">
                                                    <strong>
                                                        Verification
                                                    </strong>

                                                    <p>
                                                        {
                                                            item.test
                                                        }
                                                    </p>
                                                </div>
                                            </article>
                                        )
                                    )}
                                </div>
                            </div>

                            <div className="two-column system-secondary-grid">
                                <div className="panel demo-flow-panel">
                                    <PageHeading
                                        eyebrow="Walkthrough"
                                        title="Recommended demo flow"
                                        text="A complete presentation path from authentication to architecture verification."
                                    />

                                    <ol className="demo-flow">
                                        {demoFlow.map(
                                            (
                                                step,
                                                index
                                            ) => (
                                                <li
                                                    key={
                                                        step
                                                    }
                                                >
                                                    <span>
                                                        {String(
                                                            index +
                                                            1
                                                        ).padStart(
                                                            2,
                                                            '0'
                                                        )}
                                                    </span>

                                                    <div>
                                                        <p>
                                                            {
                                                                step
                                                            }
                                                        </p>
                                                    </div>
                                                </li>
                                            )
                                        )}
                                    </ol>
                                </div>

                                <div className="panel infrastructure-panel">
                                    <PageHeading
                                        eyebrow="Infrastructure"
                                        title="External consoles"
                                        text="Open each service console and inspect the platform directly."
                                    />

                                    <div className="console-links">
                                        {infrastructureLinks.map(
                                            (link) => (
                                                <a
                                                    key={
                                                        link.label
                                                    }
                                                    href={
                                                        link.url
                                                    }
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    <span className="console-link-icon">
                                                        <Icon
                                                            name={
                                                                link.icon
                                                            }
                                                            size={
                                                                19
                                                            }
                                                        />
                                                    </span>

                                                    <span>
                                                        <strong>
                                                            {
                                                                link.label
                                                            }
                                                        </strong>

                                                        <small>
                                                            {
                                                                link.description
                                                            }
                                                        </small>
                                                    </span>

                                                    <Icon
                                                        name="external"
                                                        size={
                                                            16
                                                        }
                                                    />
                                                </a>
                                            )
                                        )}
                                    </div>

                                    <div className="terminal-box">
                                        <div className="terminal-header">
                                            <span className="terminal-dot red" />
                                            <span className="terminal-dot yellow" />
                                            <span className="terminal-dot green" />
                                            <strong>
                                                Terminal checks
                                            </strong>
                                        </div>

                                        <code>
                                            docker compose ps
                                        </code>

                                        <code>
                                            docker logs --tail=150 smart-travel-recommendation-service
                                        </code>

                                        <code>
                                            docker logs --tail=150 smart-travel-api-gateway
                                        </code>

                                        <code>
                                            docker logs --tail=150 smart-travel-mcp-server
                                        </code>
                                    </div>
                                </div>
                            </div>

                            <div className="panel contract-testing-panel">
                                <div className="contract-testing-copy">
                                    <div className="contract-icon">
                                        <Icon
                                            name="layers"
                                            size={25}
                                        />
                                    </div>

                                    <div>
                                        <p className="eyebrow">
                                            Consumer-driven contracts
                                        </p>

                                        <h2>
                                            Pact testing evidence
                                        </h2>

                                        <p>
                                            Trip Service acts as the consumer while Recommendation Service verifies the provider contract.
                                        </p>
                                    </div>
                                </div>

                                <div className="terminal-box contract-terminal">
                                    <div className="terminal-header">
                                        <span className="terminal-dot red" />
                                        <span className="terminal-dot yellow" />
                                        <span className="terminal-dot green" />

                                        <strong>
                                            Pact verification
                                        </strong>
                                    </div>

                                    <code>
                                        cd trip-service; .\mvnw.cmd -Dtest=TripRecommendationConsumerPactTest test
                                    </code>

                                    <code>
                                        cd recommendation-service; .\mvnw.cmd -Dtest=RecommendationProviderPactVerificationTest test
                                    </code>
                                </div>
                            </div>
                        </section>
                    )}
                </div>
            </main>
        </div>
    )
}