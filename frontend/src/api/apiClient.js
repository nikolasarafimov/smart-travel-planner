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

async function attachAccessToken(config) {
    if (!keycloak.authenticated) {
        return config
    }

    try {
        await keycloak.updateToken(30)

        config.headers = config.headers || {}
        config.headers.Authorization = `Bearer ${keycloak.token}`

        return config
    } catch (error) {
        console.error('Failed to refresh access token', error)
        await keycloak.login()

        return Promise.reject(error)
    }
}

apiClient.interceptors.request.use(attachAccessToken)
mcpClient.interceptors.request.use(attachAccessToken)

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