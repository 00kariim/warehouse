import { api } from './axios'
import type { PageResponse, AnomalyEvent, ReviewOutcome } from '../types'

export const getAnomalies = async (params: {
  reviewed?: boolean; page?: number; size?: number
} = {}): Promise<PageResponse<AnomalyEvent>> => {
  const { data } = await api.get<PageResponse<AnomalyEvent>>('/anomalies', { params })
  return data
}

export const reviewAnomaly = async (eventId: string, outcome: ReviewOutcome): Promise<AnomalyEvent> => {
  const { data } = await api.patch<AnomalyEvent>(`/anomalies/${eventId}/review`, { outcome })
  return data
}
