import { api } from './axios'
import type { PageResponse, Product } from '../types'

export interface ProductFilters {
  low_stock?: boolean
  page?: number
  size?: number
  sort?: string
}

export const getProducts = async (filters: ProductFilters = {}): Promise<PageResponse<Product>> => {
  const { data } = await api.get<PageResponse<Product>>('/products', { params: filters })
  return data
}

export const getProduct = async (id: string): Promise<Product> => {
  const { data } = await api.get<Product>(`/products/${id}`)
  return data
}

export const createProduct = async (body: {
  sku: string; name: string; description?: string; min_stock: number; current_stock: number
}): Promise<Product> => {
  const { data } = await api.post<Product>('/products', body)
  return data
}

export const updateProduct = async (id: string, body: {
  name?: string; description?: string; min_stock?: number
}): Promise<Product> => {
  const { data } = await api.put<Product>(`/products/${id}`, body)
  return data
}

export const deleteProduct = async (id: string): Promise<void> => {
  await api.delete(`/products/${id}`)
}
