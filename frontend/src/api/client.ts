import axios from 'axios'
import type { LoginResponse, MeResponse, Chat, Message } from '../types'

const api = axios.create({
    baseURL: '/api/v1',
  })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api

export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await api.post('/auth/login', { email, password })
  return res.data
}

export async function fetchMe(): Promise<MeResponse> {
  const res = await api.get('/me')
  return res.data
}

export async function refreshToken(): Promise<{ access_token: string; refresh_token: string }> {
    const refresh_token = localStorage.getItem('refresh_token')
    if (!refresh_token) throw new Error('Нет refresh токена')
  
    const res = await api.post(
      '/auth/refresh',
      { refresh_token }, // 👈 именно объект
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  
    return res.data
  }

  export async function getChats(): Promise<{ chats: Chat[] }> {
    const res = await api.get('/chats')
    return res.data
  }

  export interface Contact {
    id: number
    first_name: string
    last_name: string
    email: string
  }
  
  export async function getContactById(id: string): Promise<{ contact: Contact }> {
    const res = await api.get(`/contacts/${id}`)
    return res.data
  }

  export async function getMessages(chatId: string): Promise<{ messages: Message[] }> {
    const res = await api.get(`/chats/${chatId}/messages`)
    const safeMessages = Array.isArray(res.data.messages) ? res.data.messages : []
    return { messages: safeMessages }
  }