import axios from 'axios'
import type { LoginResponse, MeResponse, Chat, Message } from '../types'

// Создаём основной экземпляр axios
const api = axios.create({
  baseURL: '/api/v1',
})

// 👉 Интерцептор запроса: добавляет access_token в заголовки
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 🛡️ Логика обновления access_token при 401
let isRefreshing = false
let failedQueue: {
  resolve: (value: any) => void
  reject: (error: any) => void
}[] = []

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // if (error.response?.status === 401 && !originalRequest._retry) {
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/auth/login') // 👈 вот это
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return api(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const { access_token, refresh_token } = await refreshToken()
        localStorage.setItem('access_token', access_token)
        localStorage.setItem('refresh_token', refresh_token)

        api.defaults.headers.common.Authorization = `Bearer ${access_token}`
        processQueue(null, access_token)

        originalRequest.headers.Authorization = `Bearer ${access_token}`
        return api(originalRequest)
      } catch (err) {
        processQueue(err, null)
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.pathname = '/login'
        return Promise.reject(err)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default api

// 🔐 Авторизация
export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await api.post('/auth/login', { email, password })
  return res.data
}

// 🔄 Обновление токена
export async function refreshToken(): Promise<{ access_token: string; refresh_token: string }> {
  const refresh_token = localStorage.getItem('refresh_token')
  if (!refresh_token) throw new Error('Нет refresh токена')

  const res = await axios.post(
    '/api/v1/auth/refresh',
    { refresh_token },
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  )

  return res.data
}

// 👤 Получение текущего пользователя
export async function fetchMe(): Promise<MeResponse> {
  const res = await api.get('/me')
  return res.data
}

// 💬 Чаты и сообщения
export async function getChats(): Promise<{ chats: Chat[] }> {
  const res = await api.get('/chats')
  return res.data
}

// export async function getMessages(chatId: string, params?: { before?: string }): Promise<{ messages: Message[] }> {
//   const res = await api.get(`/chats/${chatId}/messages`, {
//     params: params?.before ? { before: params.before } : undefined,
//   })
//   const safeMessages = Array.isArray(res.data.messages) ? res.data.messages : []
//   return { messages: safeMessages }
// }
export async function getMessages(
  chatId: string,
  options?: { before?: string }
): Promise<{ messages: Message[] }> {
  const config = options?.before
    ? { params: { before: options.before } }
    : {} // ⬅️ Никакого `undefined`

  const res = await api.get(`/chats/${chatId}/messages`, config)

  const safeMessages = Array.isArray(res.data.messages) ? res.data.messages : []
  return { messages: safeMessages }
}

export async function sendMessage(chatId: string, content: string): Promise<void> {
  await api.post(`/chats/${chatId}/messages`, {
    original_content: content,
  })
}

// 📇 Контакты
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