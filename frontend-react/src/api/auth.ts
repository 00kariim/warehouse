import axios from 'axios'
import { api, setAccessToken } from './axios'
import type { AuthResponse } from '../types'

export const login = async (username: string, password: string): Promise<AuthResponse> => {
  const { data } = await axios.post<AuthResponse>('/api/auth/login', { username, password })
  return data
}

export const refresh = async (refreshToken: string): Promise<AuthResponse> => {
  const { data } = await axios.post<AuthResponse>('/api/auth/refresh', { refresh_token: refreshToken })
  return data
}

export const logout = async (refreshToken: string): Promise<void> => {
  await api.post('/auth/logout', { refresh_token: refreshToken })
  setAccessToken(null)
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('user_role')
  localStorage.removeItem('username')
}
