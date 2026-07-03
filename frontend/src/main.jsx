import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import keycloak from './auth/keycloak.js'
import './styles/global.css'

keycloak
    .init({
        onLoad: 'check-sso',
        pkceMethod: 'S256',
        checkLoginIframe: false
    })
    .then(() => {
        ReactDOM.createRoot(document.getElementById('root')).render(
            <React.StrictMode>
                <App />
            </React.StrictMode>
        )
    })
    .catch((error) => {
        console.error('Keycloak initialization failed', error)
    })