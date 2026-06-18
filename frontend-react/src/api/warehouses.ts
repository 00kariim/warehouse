import { api } from './axios'
import type { PageResponse, Warehouse } from '../types'

export const getWarehouses = async (params: {
  name?: string; page?: number; size?: number; sort?: string
} = {}): Promise<PageResponse<Warehouse>> => {
  const { data } = await api.get<PageResponse<Warehouse>>('/warehouses', { params })
  return data
}

export const createWarehouse = async (body: { name: string; location?: string }): Promise<Warehouse> => {
  const { data } = await api.post<Warehouse>('/warehouses', body)
  return data
}

export const updateWarehouse = async (id: string, body: { name?: string; location?: string }): Promise<Warehouse> => {
  const { data } = await api.put<Warehouse>(`/warehouses/${id}`, body)
  return data
}
