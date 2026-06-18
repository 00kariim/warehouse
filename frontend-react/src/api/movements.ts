import { api } from './axios'
import type { PageResponse, Product, StockMovement, MovementType } from '../types'

export interface MovementFilters {
  product_id?: string
  warehouse_id?: string
  type?: MovementType
  anomaly_only?: boolean
  from?: string
  to?: string
  page?: number
  size?: number
  sort?: string
}

export const getMovements = async (filters: MovementFilters = {}): Promise<PageResponse<StockMovement>> => {
  const { data } = await api.get<PageResponse<StockMovement>>('/stocks/movements', { params: filters })
  return data
}

export const createMovement = async (body: {
  product_id: string
  warehouse_id: string
  quantity: number
  type: MovementType
  notes?: string
}): Promise<StockMovement> => {
  const { data } = await api.post<StockMovement>('/stocks/movements', body)
  return data
}

export const getLowStock = async (params: { page?: number; size?: number } = {}): Promise<PageResponse<Product>> => {
  const { data } = await api.get<PageResponse<Product>>('/stocks/low-stock', { params })
  return data
}
