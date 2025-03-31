import { useEffect, useState } from 'react'
import { getChats } from './api/client'
import Layout from './components/layout/Layout'
import { useAuth } from './hooks/useAuth'
import LoginForm from './components/login-form/LoginForm'
import type { Chat } from './types'

export default function App() {
  const { me, loading, error, handleLogin } = useAuth()

  const [chats, setChats] = useState<Chat[]>([])
  const [activeTab, setActiveTab] = useState<'chats' | 'contacts'>('chats')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    if (me) {
      getChats().then((data) => setChats(data.chats))
    }
  }, [me])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        Загрузка...
      </div>
    )
  }

  if (!me) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <LoginForm onLogin={handleLogin} error={error} />
      </div>
    )
  }

  return (
    <Layout
      user={me}
      chats={chats}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onSelectItem={setSelectedId}
      selectedId={selectedId}
    />
  )
}