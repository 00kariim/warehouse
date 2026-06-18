import { api } from './axios'
import type { AiChatResponse } from '../types'

export const chat = async (query: string): Promise<AiChatResponse> => {
  const { data } = await api.post<AiChatResponse>('/ai/chat', { query })
  return data
}
