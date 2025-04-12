import { useEffect, useRef, useState } from 'react'
import type { Chat, Message } from '../../types'
import { getMessages, getContactById, sendMessage } from '../../api/client'
import MessageInput from '../chat/MessageInput'
import { useChatSocket } from '../../hooks/useChatSocket'
import { useAuth } from '../../hooks/useAuth'

interface MainViewProps {
  activeTab: 'chats' | 'contacts'
  chats: Chat[]
  selectedId: string | null
}

export default function MainView({ activeTab, selectedId }: MainViewProps) {
  const { me } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [contact, setContact] = useState<any>(null)
  const [hasMore, setHasMore] = useState(true)
  const [initialScrollDone, setInitialScrollDone] = useState(false)

  const isChatId = selectedId && !selectedId.startsWith('contact-')
  const chatSocketEnabled = activeTab === 'chats' && isChatId

  const containerRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const isAtBottomRef = useRef(true)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' })
  }

  const { send } = useChatSocket(
    chatSocketEnabled ? selectedId! : '',
    (msg) => {
      if (String(msg.chat_id) === String(selectedId)) {
        setMessages((prev) => [...prev, msg])
      }
    }
  )

  const loadMessages = async (before?: string) => {
    if (!isChatId || !selectedId) return
    try {
      setLoading(true)
      const res = await getMessages(selectedId, before ? { before } : undefined)
      const newMessages = Array.isArray(res.messages) ? res.messages : []

      if (before) {
        const sorted = newMessages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        setMessages((prev) => [...sorted, ...prev])
        if (newMessages.length < 50) setHasMore(false)
      } else {
        const sorted = newMessages.reverse()
        setMessages(sorted)
      }
    } catch {
      setError('Ошибка при загрузке сообщений')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'chats' && isChatId && selectedId) {
      setContact(null)
      setMessages([])
      setHasMore(true)
      setInitialScrollDone(false)
      loadMessages()
    } else if (activeTab === 'contacts' && selectedId?.startsWith('contact-')) {
      const contactId = selectedId.replace('contact-', '')
      setContact(null)
      setLoading(true)
      getContactById(contactId)
        .then((data) => setContact(data.contact))
        .catch(() => setError('Ошибка при загрузке контакта'))
        .finally(() => setLoading(false))
      setMessages([])
    } else {
      setMessages([])
      setContact(null)
    }
  }, [activeTab, selectedId])

  useEffect(() => {
    if (!initialScrollDone && messages.length > 0 && !loading) {
      scrollToBottom()
      setInitialScrollDone(true)
    }
  }, [messages, loading, initialScrollDone])

  const handleScroll = async () => {
    if (!containerRef.current || !hasMore || loading) return
  
    const el = containerRef.current
    if (el.scrollTop < 100) {
      const oldest = messages[0]
      if (oldest) {
        const before = oldest.created_at
        const prevHeight = el.scrollHeight
  
        await loadMessages(before)
  
        // Проверка: если сообщения не добавились — ничего не делать
        const newHeight = el.scrollHeight
        if (newHeight > prevHeight) {
          el.scrollTop = newHeight - prevHeight
        }
      }
    }
  }

  if (!selectedId) {
    return <div className="text-gray-700">Выберите {activeTab === 'chats' ? 'чат' : 'контакт'} слева</div>
  }

  if (loading && messages.length === 0) {
    return <div className="text-gray-500">Загрузка...</div>
  }

  if (error) {
    return <div className="text-red-500">{error}</div>
  }

  if (activeTab === 'contacts' && contact) {
    return (
      <div className="text-gray-800 space-y-2">
        <h2 className="text-xl font-semibold">{contact.first_name} {contact.last_name}</h2>
        <p><strong>Email:</strong> {contact.email}</p>
      </div>
    )
  }

  if (activeTab === 'chats' && isChatId) {
    return (
      <div className="flex flex-col h-full">
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto flex flex-col space-y-2 text-gray-800 max-h-[70vh]"
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`max-w-[70%] px-4 py-2 rounded-lg shadow-sm ${
                msg.sender_id === me?.id
                  ? 'bg-blue-600 text-white self-end rounded-br-none'
                  : 'bg-gray-100 text-gray-800 self-start rounded-bl-none'
              }`}
            >
              <div className="text-xs opacity-70 mb-1">
                {new Date(msg.created_at).toLocaleString()}
              </div>
              <div className="break-words">{msg.original_content}</div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <MessageInput
          onSend={async (text) => {
            await sendMessage(selectedId!, text)
            await send(text)
            const message: Message = {
              id: Date.now(),
              original_content: text,
              sender_id: me!.id,
              chat_id: selectedId!,
              created_at: new Date().toISOString(),
            }
            setMessages((prev) => [...prev, message])

            // 📍 Скроллим вниз, если пользователь был не у низа
            if (!isAtBottomRef.current) {
              setTimeout(() => scrollToBottom(), 30)
            }
          }}
        />
      </div>
    )
  }

  return null
}