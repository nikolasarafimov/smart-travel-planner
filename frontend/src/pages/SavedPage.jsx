import { useState } from 'react'
import apiClient from '../api/apiClient'

export default function SavedPage() {
    const [tripId, setTripId] = useState('')
    const [saved, setSaved] = useState([])
    const [cost, setCost] = useState(null)
    const [message, setMessage] = useState('')

    const loadSaved = async () => {
        if (!tripId) {
            setMessage('Enter a trip ID.')
            return
        }

        try {
            const response = await apiClient.get(`/recommendations/saved?tripId=${tripId}`)
            setSaved(response.data)
            setMessage(`Loaded ${response.data.length} saved recommendations.`)
        } catch (error) {
            setMessage('Failed to load saved recommendations.')
            console.error(error)
        }
    }

    const estimateCost = async () => {
        if (!tripId) {
            setMessage('Enter a trip ID.')
            return
        }

        try {
            const response = await apiClient.get(`/trips/${tripId}/estimated-cost`)
            setCost(response.data)
            setMessage('Estimated cost loaded.')
        } catch (error) {
            setMessage('Failed to estimate cost.')
            console.error(error)
        }
    }

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1>Saved Recommendations & Cost</h1>
                    <p>View saved places and calculate estimated trip cost.</p>
                </div>
            </div>

            {message && <div className="message">{message}</div>}

            <div className="panel search-panel">
                <div>
                    <label>Trip ID</label>
                    <input value={tripId} onChange={(e) => setTripId(e.target.value)} placeholder="Example: 1" />
                </div>

                <button className="primary-button" onClick={loadSaved}>
                    Load Saved
                </button>

                <button className="secondary-button" onClick={estimateCost}>
                    Estimate Cost
                </button>
            </div>

            {cost !== null && (
                <div className="cost-card">
                    <span>Estimated Cost</span>
                    <strong>{cost} EUR</strong>
                </div>
            )}

            <div className="list">
                {saved.map((item) => (
                    <div className="list-card" key={item.id}>
                        <div>
                            <h3>{item.recommendation?.name}</h3>
                            <p>{item.recommendation?.description}</p>
                            <p>
                                Type: {item.recommendation?.type} | Price: {item.recommendation?.estimatedPrice} EUR
                            </p>
                            <p className="muted">Saved at: {item.savedAt}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}