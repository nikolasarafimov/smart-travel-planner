import Keycloak from 'keycloak-js'

const keycloak = new Keycloak({
    url: 'http://localhost:8086',
    realm: 'smart-travel',
    clientId: 'smart-travel-client'
})

export default keycloak