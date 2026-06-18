// ─── Domain types aligned to backend entities and API spec §6 ────────────────

export interface PageResponse<T> {
  data: T[]
  page: number
  size: number
  totalElements: number // Spring Jackson camelCase (no snake_case config found)
  totalPages: number
}

export interface AuthResponse {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
  role: 'ADMIN' | 'MANAGER' | 'OPERATOR'
}

export interface Product {
  id: string
  sku: string
  name: string
  description?: string
  minStock: number
  currentStock: number
  createdAt: string
  updatedAt: string
}

export interface Warehouse {
  id: string
  name: string
  location?: string
  createdAt: string
}

export type MovementType = 'IN' | 'OUT' | 'ADJUSTMENT'

export interface StockMovement {
  id: string
  product: Product
  warehouse: Warehouse
  userId: string
  quantity: number
  type: MovementType
  notes?: string
  timestamp: string
  anomalyFlag: boolean
}

export type ReviewOutcome = 'TRUE_POSITIVE' | 'FALSE_POSITIVE'

export interface AnomalyEvent {
  id: string
  movement: StockMovement
  confidenceScore: number
  modelVersion: string
  reviewedBy?: { id: string; username: string }
  reviewOutcome?: ReviewOutcome
  createdAt: string
}

export interface User {
  id: string
  username: string
  role: 'ADMIN' | 'MANAGER' | 'OPERATOR'
  createdAt: string
}

export interface AiChatResponse {
  answer: string
  sql_executed: string
  data: Record<string, unknown>[]
  row_count: number
  truncated: boolean
}

export interface ApiError {
  error: string
  message: string
  status: number
  timestamp: string
  path: string
  violations?: { field: string; message: string }[]
}
