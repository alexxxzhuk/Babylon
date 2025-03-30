import type { Chat } from '../types'

export default function Sidebar({ chats }: { chats: Chat[] }) {
  return (
    <aside className="w-64 bg-gray-100 p-4 border-r">
      <h2 className="text-sm font-semibold mb-3 text-gray-600 uppercase">Чаты</h2>
      <ul className="space-y-2">
        {chats.map((chat) => (
          <li key={chat.chat_id} className="p-2 bg-white rounded shadow text-gray-800">
            {chat.participants.map(p => `${p.first_name} ${p.last_name}`).join(', ')}
          </li>
        ))}
      </ul>
    </aside>
  )
}