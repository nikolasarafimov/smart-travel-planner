import keycloak from '../auth/keycloak'

export default function Navbar({ activePage, setActivePage }) {
    const menuItems = [
        { id: 'dashboard', label: 'Dashboard' },
        { id: 'trips', label: 'Trips' },
        { id: 'recommendations', label: 'Recommendations' },
        { id: 'saved', label: 'Saved & Cost' }
    ]

    return (
        <nav className="navbar">
            <div className="brand">
                <span className="brand-icon">✈️</span>
                <span>Smart Travel Planner</span>
            </div>

            <div className="nav-links">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        className={activePage === item.id ? 'nav-link active' : 'nav-link'}
                        onClick={() => setActivePage(item.id)}
                    >
                        {item.label}
                    </button>
                ))}
            </div>

            <div className="auth-box">
                {keycloak.authenticated ? (
                    <>
                        <span className="user-label">{keycloak.tokenParsed?.preferred_username}</span>
                        <button className="secondary-button" onClick={() => keycloak.logout()}>
                            Logout
                        </button>
                    </>
                ) : (
                    <button className="primary-button" onClick={() => keycloak.login()}>
                        Login
                    </button>
                )}
            </div>
        </nav>
    )
}