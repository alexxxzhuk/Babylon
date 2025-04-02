import { useEffect, useState } from 'react'
import type { Chat, Message } from '../../types'
import { getMessages, getContactById } from '../../api/client'
import MessageInput from '../chat/MessageInput.tsx'

interface MainViewProps {
  activeTab: 'chats' | 'contacts'
  chats: Chat[]
  selectedId: string | null
}

export default function MainView({ activeTab, selectedId }: MainViewProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [contact, setContact] = useState<any>(null)

  const loadMessages = () => {
    if (selectedId) {
      setLoading(true)
      setError(null)
      getMessages(selectedId)
        .then((data) => setMessages(Array.isArray(data.messages) ? data.messages : []))
        .catch(() => setError('Ошибка при загрузке сообщений'))
        .finally(() => setLoading(false))
    }
  }

  useEffect(() => {
    if (activeTab === 'chats' && selectedId) {
      loadMessages()
    } else if (activeTab === 'contacts' && selectedId?.startsWith('contact-')) {
      const contactId = selectedId.replace('contact-', '')
      setLoading(true)
      setError(null)
      getContactById(contactId)
        .then((data) => setContact(data.contact))
        .catch(() => setError('Ошибка при загрузке контакта'))
        .finally(() => setLoading(false))
    } else {
      setMessages([])
      setContact(null)
    }
  }, [activeTab, selectedId])

  if (!selectedId) {
    return (
      <div className="text-gray-700">
        Выберите {activeTab === 'chats' ? 'чат' : 'контакт'} слева
      </div>
    )
  }

  if (loading) {
    return <div className="text-gray-500">Загрузка...</div>
  }

  if (error) {
    return <div className="text-red-500">{error}</div>
  }

  if (activeTab === 'contacts' && contact) {
    return (
      <div className="text-gray-800 space-y-2">
        <h2 className="text-xl font-semibold">
          {contact.first_name} {contact.last_name}
        </h2>
        <p>
          <strong>Email:</strong> {contact.email}
        </p>
      </div>
    )
  }

  if (activeTab === 'chats') {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto flex flex-col space-y-2 text-gray-800 max-h-[70vh]">
          {messages.length === 0 ? (
            <div className="text-gray-700">Сообщений пока нет</div>
          ) : (
            messages
              .slice()
              .reverse()
              .map((msg) => (
                <div key={msg.id} className="bg-gray-100 p-2 rounded shadow-sm">
                  <div className="text-sm text-gray-500">
                    {new Date(msg.created_at).toLocaleString()}
                  </div>
                  <div>{msg.original_content}</div>
                </div>
              ))
          )}
        </div>

        <MessageInput
          chatId={selectedId}
          onMessageSent={loadMessages}
        />
      </div>
    )
  }

  return null
}