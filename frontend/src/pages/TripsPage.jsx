import { useEffect, useState } from 'react'
import apiClient from '../api/apiClient'

export default function TripsPage() {
    const [trips, setTrips] = useState([])
    const [message, setMessage] = useState('')
    const [form, setForm] = useState({
        userId: 'demo-user',
        destination: 'Paris',
        startDate: '2026-07-10',
        endDate: '2026-07-15',
        budget: 800,
        currency: 'EUR'
    })

    const loadTrips = async () => {
        try {
            const response = await apiClient.get('/trips')
            setTrips(response.data)
        } catch (error) {
            setMessage('Failed to load trips.')
            console.error(error)
        }
    }

    useEffect(() => {
        loadTrips()
    }, [])

    const handleChange = (event) => {
        setForm({
            ...form,
            [event.target.name]: event.target.value
        })
    }

    const createTrip = async (event) => {
        event.preventDefault()

        try {
            await apiClient.post('/trips', {
                ...form,
                budget: Number(form.budget)
            })

            setMessage('Trip created successfully.')
            await loadTrips()
        } catch (error) {
            setMessage('Failed to create trip.')
            console.error(error)
        }
    }

    const deleteTrip = async (id) => {
        try {
            await apiClient.delete(`/trips/${id}`)
            setMessage('Trip deleted successfully.')
            await loadTrips()
        } catch (error) {
            setMessage('Failed to delete trip.')
            console.error(error)
        }
    }

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1>Trips</h1>
                    <p>Create and manage planned trips.</p>
                </div>
            </div>

            {message && <div className="message">{message}</div>}

            <div className="content-grid">
                <form className="panel" onSubmit={createTrip}>
                    <h2>Create Trip</h2>

                    <label>User ID</label>
                    <input name="userId" value={form.userId} onChange={handleChange} />

                    <label>Destination</label>
                    <input name="destination" value={form.destination} onChange={handleChange} />

                    <label>Start Date</label>
                    <input type="date" name="startDate" value={form.startDate} onChange={handleChange} />

                    <label>End Date</label>
                    <input type="date" name="endDate" value={form.endDate} onChange={handleChange} />

                    <label>Budget</label>
                    <input type="number" name="budget" value={form.budget} onChange={handleChange} />

                    <label>Currency</label>
                    <input name="currency" value={form.currency} onChange={handleChange} />

                    <button className="primary-button" type="submit">
                        Create Trip
                    </button>
                </form>

                <div className="panel">
                    <h2>All Trips</h2>

                    <div className="list">
                        {trips.length === 0 && <p>No trips found.</p>}

                        {trips.map((trip) => (
                            <div className="list-card" key={trip.id}>
                                <div>
                                    <h3>{trip.destination}</h3>
                                    <p>
                                        {trip.startDate} → {trip.endDate}
                                    </p>
                                    <p>
                                        Budget: {trip.budget} {trip.currency} | Status: {trip.status}
                                    </p>
                                    <p className="muted">Trip ID: {trip.id}</p>
                                </div>

                                <button className="danger-button" onClick={() => deleteTrip(trip.id)}>
                                    Delete
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}