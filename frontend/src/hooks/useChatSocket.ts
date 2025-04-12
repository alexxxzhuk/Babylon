import { useEffect, useRef } from 'react'
import type { Message } from '../types'

export function useChatSocket(chatId: string, onMessage: (msg: Message) => void) {
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    if (!chatId) return

    const token = localStorage.getItem('access_token')
    if (!token) return

    const socket = new WebSocket(`ws://localhost/api/v1/ws?token=${token}`)
    wsRef.current = socket

    socket.onopen = () => {
      console.log('✅ WebSocket открыт')
    }

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data)
      console.log('📡 Получено сообщение по WebSocket:', data)

      if (data.type === 'chat_message' && String(data.chat_id) === chatId) {
        const message: Message = {
          id: Date.now(), // временно
          original_content: data.content,
          sender_id: data.sender,
          chat_id: data.chat_id,
          created_at: new Date().toISOString(),
        }

        console.log('📩 Пришло сообщение по WebSocket:', message)
        onMessage(message)
      }
    }

    return () => socket.close()
  }, [chatId])

  return {
    send: (text: string) => {
      const payload = {
        type: 'chat_message',
        chat_id: chatId,
        content: text,
      }
      wsRef.current?.send(JSON.stringify(payload))
    },
  }
}