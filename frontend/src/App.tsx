import { useEffect, useState } from 'react'
import { getChats } from './api/client'
import Layout from './components/Layout'
import { useAuth } from './hooks/useAuth'
import LoginForm from './components/LoginForm'
import type { Chat } from './types'

export default function App() {
  const { me, loading, error, handleLogin } = useAuth()
  const [chats, setChats] = useState<Chat[]>([])

  useEffect(() => {
    if (me) {
      getChats().then((data) => setChats(data.chats))
    }
  }, [me])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">Загрузка...</div>
  }

  if (!me) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <LoginForm onLogin={handleLogin} error={error} />
      </div>
    )
  }

  return (
    <Layout user={me} chats={chats}>
      <div className="text-gray-700">Добро пожаловать в чат 👋</div>
    </Layout>
  )
}