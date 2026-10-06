import Keycloak from 'keycloak-js'

const keycloak = new Keycloak({
    url: import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8086',
    realm: import.meta.env.VITE_KEYCLOAK_REALM || 'smart-travel',
    clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'smart-travel-client'
})

export default keycloak