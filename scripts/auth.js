let authToken = null;

export function setAuthToken(token) {
    authToken = token
}

export function getAuthToken() {
    return `Bearer ${authToken}`
}
