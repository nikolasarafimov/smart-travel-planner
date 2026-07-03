import { useState } from 'react'
import apiClient from '../api/apiClient'

export default function RecommendationsPage() {
    const [destination, setDestination] = useState('Paris')
    const [type, setType] = useState('ATTRACTION')
    const [tripId, setTripId] = useState('')
    const [recommendations, setRecommendations] = useState([])
    const [message, setMessage] = useState('')

    const searchRecommendations = async () => {
        try {
            const url = type
                ? `/recommendations?destination=${destination}&type=${type}`
                : `/recommendations?destination=${destination}`

            const response = await apiClient.get(url)
            setRecommendations(response.data)
            setMessage(`Found ${response.data.length} recommendations.`)
        } catch (error) {
            setMessage('Failed to load recommendations.')
            console.error(error)
        }
    }

    const saveRecommendation = async (recommendationId) => {
        if (!tripId) {
            setMessage('Enter a trip ID before saving.')
            return
        }

        try {
            await apiClient.post(`/recommendations/${recommendationId}/save`, {
                tripId: Number(tripId),
                userId: 'demo-user'
            })

            setMessage('Recommendation saved to trip.')
        } catch (error) {
            setMessage('Failed to save recommendation.')
            console.error(error)
        }
    }

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1>Recommendations</h1>
                    <p>Search attractions, hotels and restaurants for a destination.</p>
                </div>
            </div>

            {message && <div className="message">{message}</div>}

            <div className="panel search-panel">
                <div>
                    <label>Destination</label>
                    <input value={destination} onChange={(e) => setDestination(e.target.value)} />
                </div>

                <div>
                    <label>Type</label>
                    <select value={type} onChange={(e) => setType(e.target.value)}>
                        <option value="">ALL</option>
                        <option value="ATTRACTION">ATTRACTION</option>
                        <option value="HOTEL">HOTEL</option>
                        <option value="RESTAURANT">RESTAURANT</option>
                    </select>
                </div>

                <div>
                    <label>Trip ID for saving</label>
                    <input value={tripId} onChange={(e) => setTripId(e.target.value)} placeholder="Example: 1" />
                </div>

                <button className="primary-button" onClick={searchRecommendations}>
                    Search
                </button>
            </div>

            <div className="recommendations-grid">
                {recommendations.map((item) => (
                    <div className="recommendation-card" key={item.id}>
                        <div className="badge">{item.type}</div>
                        <h3>{item.name}</h3>
                        <p>{item.description}</p>

                        <div className="card-meta">
                            <span>тнР {item.rating}</span>
                            <span>{item.estimatedPrice} EUR</span>
                        </div>

                        <p className="muted">Source: {item.source}</p>

                        <button className="secondary-button" onClick={() => saveRecommendation(item.id)}>
                            Save to Trip
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )
}