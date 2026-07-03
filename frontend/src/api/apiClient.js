import axios from 'axios'
import keycloak from '../auth/keycloak'

const apiClient = axios.create({
    baseURL: '/api'
})

apiClient.interceptors.request.use(async (config) => {
    if (keycloak.authenticated) {
        try {
            await keycloak.updateToken(30)
            config.headers.Authorization = 'Bearer ' + keycloak.token
        } catch (error) {
            console.error('Failed to refresh token', error)
            keycloak.login()
        }
    }

    return config
})

export default apiClient
