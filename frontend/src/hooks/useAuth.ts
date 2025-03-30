import { useEffect, useState } from 'react'
import { login, fetchMe, refreshToken } from '../api/client'
import type { MeResponse } from '../types'

export function useAuth() {
  const [me, setMe] = useState<MeResponse['user'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      setLoading(false)
      return
    }
  
    fetchMe()
      .then(({ user }) => setMe(user))
      .catch(async () => {
        // Попробуем обновить токен, если access истёк
        try {
          const res = await refreshToken()
          localStorage.setItem('access_token', res.access_token)
          localStorage.setItem('refresh_token', res.refresh_token)
  
          const { user } = await fetchMe()
          setMe(user)
        } catch {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const handleLogin = async (email: string, password: string) => {
    setError(null)
    try {
      const data = await login(email, password)
  
      // ✅ сохраняем оба токена
      localStorage.setItem('access_token', data.access_token)
      localStorage.setItem('refresh_token', data.refresh_token)
  
      const { user } = await fetchMe()
      setMe(user)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Ошибка входа')
    }
  }

  return { me, loading, error, handleLogin }
}