// import { useEffect, useState } from 'react'
// import type { Chat, Message } from '../../types'
// import { getMessages, getContactById } from '../../api/client'
// import MessageInput from '../chat/MessageInput'
// import { useChatSocket } from '../../hooks/useChatSocket'
// import { useAuth } from '../../hooks/useAuth'

// interface MainViewProps {
//   activeTab: 'chats' | 'contacts'
//   chats: Chat[]
//   selectedId: string | null
// }

// export default function MainView({ activeTab, selectedId }: MainViewProps) {
//   const { me } = useAuth()
//   const [messages, setMessages] = useState<Message[]>([])
//   const [loading, setLoading] = useState(false)
//   const [error, setError] = useState<string | null>(null)
//   const [contact, setContact] = useState<any>(null)

//   const isChatId = selectedId && !selectedId.startsWith('contact-')
//   const chatSocketEnabled = activeTab === 'chats' && isChatId

//   const { send } = useChatSocket(
//     chatSocketEnabled ? selectedId! : '',
//     (msg) => {
//       console.log('💬 получено сообщение из useChatSocket:', msg)
//       if (String(msg.chat_id) === String(selectedId)) {
//         setMessages((prev) => [...prev, msg]) // 👈 добавляем в конец
//       } else {
//         console.log('⛔️ chat_id не совпадает, сообщение не добавлено')
//       }
//     }
//   )

//   useEffect(() => {
//     if (activeTab === 'chats' && isChatId && selectedId) {
//       setContact(null)
//       setLoading(true)
//       setError(null)

//       getMessages(selectedId)
//         .then((data) => {
//           const safe = Array.isArray(data.messages) ? data.messages : []
//           const sorted = safe.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
//           setMessages(sorted)
//         })
//         .catch(() => setError('Ошибка при загрузке сообщений'))
//         .finally(() => setLoading(false))
//     } else if (activeTab === 'contacts' && selectedId?.startsWith('contact-')) {
//       const contactId = selectedId.replace('contact-', '')
//       setContact(null)
//       setLoading(true)
//       setError(null)

//       getContactById(contactId)
//         .then((data) => setContact(data.contact))
//         .catch(() => setError('Ошибка при загрузке контакта'))
//         .finally(() => setLoading(false))

//       setMessages([])
//     } else {
//       setMessages([])
//       setContact(null)
//     }
//   }, [activeTab, selectedId])

//   if (!selectedId) {
//     return <div className="text-gray-700">Выберите {activeTab === 'chats' ? 'чат' : 'контакт'} слева</div>
//   }

//   if (loading) {
//     return <div className="text-gray-500">Загрузка...</div>
//   }

//   if (error) {
//     return <div className="text-red-500">{error}</div>
//   }

//   if (activeTab === 'contacts' && contact) {
//     return (
//       <div className="text-gray-800 space-y-2">
//         <h2 className="text-xl font-semibold">
//           {contact.first_name} {contact.last_name}
//         </h2>
//         <p><strong>Email:</strong> {contact.email}</p>
//       </div>
//     )
//   }

//   if (activeTab === 'chats' && isChatId) {
//     return (
//       <div className="flex flex-col h-full">
//         <div className="flex-1 overflow-y-auto flex flex-col space-y-2 text-gray-800 max-h-[70vh]">
//           {messages.length === 0 ? (
//             <div className="text-gray-700">Сообщений пока нет</div>
//           ) : (
//             messages.map((msg) => (
//               <div key={msg.id} className="bg-gray-100 p-2 rounded shadow-sm">
//                 <div className="text-sm text-gray-500">
//                   {new Date(msg.created_at).toLocaleString()}
//                 </div>
//                 <div>{msg.original_content}</div>
//               </div>
//             ))
//           )}
//         </div>

//         <MessageInput
//           onSend={async (text) => {
//             await send(text)
//             const message: Message = {
//               id: Date.now(), // временный ID
//               original_content: text,
//               sender_id: me!.id,
//               chat_id: selectedId!,
//               created_at: new Date().toISOString(),
//             }
//             setMessages((prev) => [...prev, message])
//           }}
//         />
//       </div>
//     )
//   }

//   return null
// }

import { useEffect, useRef, useState } from 'react'
import type { Chat, Message } from '../../types'
import { getMessages, getContactById } from '../../api/client'
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

  const isChatId = selectedId && !selectedId.startsWith('contact-')
  const chatSocketEnabled = activeTab === 'chats' && isChatId

  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const { send } = useChatSocket(
    chatSocketEnabled ? selectedId! : '',
    (msg) => {
      console.log('💬 получено сообщение из useChatSocket:', msg)
      if (String(msg.chat_id) === String(selectedId)) {
        setMessages((prev) => [...prev, msg])
      } else {
        console.log('⛔️ chat_id не совпадает, сообщение не добавлено')
      }
    }
  )

  // скроллим вниз при каждом изменении сообщений
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (activeTab === 'chats' && isChatId && selectedId) {
      setContact(null)
      setLoading(true)
      setError(null)

      getMessages(selectedId)
        .then((data) => {
          const safe = Array.isArray(data.messages) ? data.messages : []
          const sorted = safe.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
          setMessages(sorted)
        })
        .catch(() => setError('Ошибка при загрузке сообщений'))
        .finally(() => setLoading(false))
    } else if (activeTab === 'contacts' && selectedId?.startsWith('contact-')) {
      const contactId = selectedId.replace('contact-', '')
      setContact(null)
      setLoading(true)
      setError(null)

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

  if (!selectedId) {
    return <div className="text-gray-700">Выберите {activeTab === 'chats' ? 'чат' : 'контакт'} слева</div>
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
        <p><strong>Email:</strong> {contact.email}</p>
      </div>
    )
  }

  if (activeTab === 'chats' && isChatId) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto flex flex-col space-y-2 text-gray-800 max-h-[70vh]">
          {messages.length === 0 ? (
            <div className="text-gray-700">Сообщений пока нет</div>
          ) : (
            messages.map((msg) => (
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
            ))
          )}
          {/* Якорь для автоскролла */}
          <div ref={messagesEndRef} />
        </div>

        <MessageInput
          onSend={async (text) => {
            await send(text)
            const message: Message = {
              id: Date.now(), // временный ID
              original_content: text,
              sender_id: me!.id,
              chat_id: selectedId!,
              created_at: new Date().toISOString(),
            }
            setMessages((prev) => [...prev, message])
          }}
        />
      </div>
    )
  }

  return null
}