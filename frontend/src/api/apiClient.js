import axios from 'axios'
import keycloak from '../auth/keycloak'

export const apiClient = axios.create({
    baseURL: '/api'
})

export const utilityClient = axios.create({
    baseURL: '/'
})

export const mcpClient = axios.create({
    baseURL: '/mcp-test'
})

apiClient.interceptors.request.use(async (config) => {
    if (keycloak.authenticated) {
        try {
            await keycloak.updateToken(30)

            config.headers = config.headers || {}
            config.headers.Authorization = 'Bearer ' + keycloak.token
        } catch (error) {
            console.error('Failed to refresh token', error)
            keycloak.login()
        }
    }

    return config
})

export function getErrorMessage(error) {
    if (error?.response?.data?.message) {
        return error.response.data.message
    }

    if (error?.response?.data?.error) {
        return error.response.data.error
    }

    if (typeof error?.response?.data === 'string') {
        return error.response.data
    }

    if (error?.message) {
        return error.message
    }

    return 'Unknown error'
}