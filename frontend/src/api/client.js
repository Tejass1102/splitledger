const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'
const TOKEN_KEY = 'splitledger.token'

export const tokenStore = {
    get: () => localStorage.getItem(TOKEN_KEY),
    set: (token) => localStorage.setItem(TOKEN_KEY, token),
    clear: () => localStorage.removeItem(TOKEN_KEY),
}

// Called when a protected request comes back 401 (expired or invalid token)
let onUnauthorized = null
export function setUnauthorizedHandler(handler) {
    onUnauthorized = handler
}

// Called when the server itself fails (HTTP 5xx), so the app can show a toast
let onServerError = null
export function setServerErrorHandler(handler) {
    onServerError = handler
}

// Wraps the backend's ProblemDetail: { status, title, detail, errors: { field: message } }
export class ApiError extends Error {
    constructor(status, problem) {
        super(problem?.detail || problem?.title || 'Something went wrong. Please try again.')
        this.name = 'ApiError'
        this.status = status
        this.fieldErrors = problem?.errors ?? {}
    }
}

// Turns any thrown error into { message, fieldErrors } for forms
export function describeError(err) {
    if (err instanceof ApiError) {
        return { message: err.message, fieldErrors: err.fieldErrors }
    }
    return { message: 'Something went wrong. Please try again.', fieldErrors: {} }
}

// quiet: true is for background calls (such as polling); a server error then shows no toast
export async function request(path, { method = 'GET', body, auth = true, quiet = false } = {}) {
    const headers = {}
    if (body !== undefined) headers['Content-Type'] = 'application/json'

    const token = tokenStore.get()
    if (auth && token) headers.Authorization = `Bearer ${token}`

    let response
    try {
        response = await fetch(`${API_URL}/api${path}`, {
            method,
            headers,
            body: body !== undefined ? JSON.stringify(body) : undefined,
        })
    } catch {
        throw new ApiError(0, { detail: 'Cannot reach the server. Is the backend running?' })
    }

    if (response.status === 204) return null

    const text = await response.text()
    let data = null
    if (text) {
        try {
            data = JSON.parse(text)
        } catch {
            data = null
        }
    }

    if (!response.ok) {
        // Only logout on 401 for calls that carried a token (not for a wrong password at login)
        if (response.status === 401 && auth && onUnauthorized) onUnauthorized()
        if (response.status >= 500 && !quiet && onServerError) onServerError()
        throw new ApiError(response.status, data)
    }
    return data
}

export const api = {
    get: (path, options) => request(path, options),
    post: (path, body) => request(path, { method: 'POST', body }),
    put: (path, body) => request(path, { method: 'PUT', body }),
    patch: (path, body) => request(path, { method: 'PATCH', body }),
    delete: (path) => request(path, { method: 'DELETE' }),
}