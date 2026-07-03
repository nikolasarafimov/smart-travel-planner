import { useState } from 'react'
import keycloak from './auth/keycloak'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import TripsPage from './pages/TripsPage'
import RecommendationsPage from './pages/RecommendationsPage'
import SavedPage from './pages/SavedPage'

export default function App() {
  const [activePage, setActivePage] = useState('dashboard')

  if (!keycloak.authenticated) {
    return (
        <div className="login-page">
          <div className="login-card">
            <div className="login-icon">✈️</div>
            <h1>Smart Travel Planner</h1>
            <p>
              Plan trips, explore recommendations and estimate travel costs through
              a secure microservice architecture.
            </p>

            <button className="primary-button large" onClick={() => keycloak.login()}>
              Login with Keycloak
            </button>

            <p className="muted">
              Demo user: demo-user / demo-pass
            </p>
          </div>
        </div>
    )
  }

  return (
      <div className="app">
        <Navbar activePage={activePage} setActivePage={setActivePage} />

        <main>
          {activePage === 'dashboard' && <Dashboard />}
          {activePage === 'trips' && <TripsPage />}
          {activePage === 'recommendations' && <RecommendationsPage />}
          {activePage === 'saved' && <SavedPage />}
        </main>
      </div>
  )
}