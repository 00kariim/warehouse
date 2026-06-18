import axios from 'axios'

// Access token lives only in memory to prevent XSS harvesting
let _accessToken: string | null = null

export const setAccessToken = (t: string | null) => { _accessToken = t }
export const getAccessToken = () => _accessToken

let _isRefreshing = false
let _refreshSubscribers: ((token: string) => void)[] = []

const subscribeTokenRefresh = (cb: (token: string) => void) => {
  _refreshSubscribers.push(cb)
}
const onRefreshed = (token: string) => {
  _refreshSubscribers.forEach(cb => cb(token))
  _refreshSubscribers = []
}

export const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Attach current access token to every request
api.interceptors.request.use(config => {
  const token = getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// On 401: attempt silent refresh, queue other requests, then retry
api.interceptors.response.use(
  res => res,
  async error => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true

      if (_isRefreshing) {
        return new Promise(resolve => {
          subscribeTokenRefresh(token => {
            original.headers.Authorization = `Bearer ${token}`
            resolve(api(original))
          })
        })
      }

      _isRefreshing = true
      const refreshToken = localStorage.getItem('refresh_token')
      if (!refreshToken) {
        _isRefreshing = false
        window.dispatchEvent(new Event('auth:logout'))
        return Promise.reject(error)
      }

      try {
        const { data } = await axios.post<{ access_token: string; refresh_token: string }>(
          '/api/auth/refresh',
          { refresh_token: refreshToken }
        )
        setAccessToken(data.access_token)
        localStorage.setItem('refresh_token', data.refresh_token)
        onRefreshed(data.access_token)
        original.headers.Authorization = `Bearer ${data.access_token}`
        return api(original)
      } catch {
        window.dispatchEvent(new Event('auth:logout'))
        return Promise.reject(error)
      } finally {
        _isRefreshing = false
      }
    }
    return Promise.reject(error)
  }
)
