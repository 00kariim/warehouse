import { api } from './axios'
import type { PageResponse, User } from '../types'

export const getUsers = async (params: { page?: number; size?: number } = {}): Promise<PageResponse<User>> => {
  const { data } = await api.get<PageResponse<User>>('/users', { params })
  return data
}

export const createUser = async (body: {
  username: string; password: string; role: 'ADMIN' | 'MANAGER' | 'OPERATOR'
}): Promise<User> => {
  const { data } = await api.post<User>('/users', body)
  return data
}
