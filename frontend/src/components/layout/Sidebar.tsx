import type { Chat } from '../../types'

interface SidebarProps {
  chats: Chat[]
  activeTab: 'chats' | 'contacts'
  onSelectItem: (id: string) => void
}

export default function Sidebar({ chats, activeTab, onSelectItem }: SidebarProps) {
  const uniqueParticipants = Array.from(
    new Map(
      chats.flatMap(chat =>
        chat.participants.map(p => [`${p.id}`, p])
      )
    ).values()
  )

  const items = activeTab === 'chats'
    ? chats.map((chat) => ({
        id: chat.chat_id,
        label: chat.participants.map(p => `${p.first_name} ${p.last_name}`).join(', ')
      }))
    : uniqueParticipants.map((p) => ({
        id: `contact-${p.id}`,
        label: `${p.first_name} ${p.last_name}`
      }))

  return (
    <aside className="w-64 bg-gray-100 p-4 border-r">
      <h2 className="text-sm font-semibold mb-3 text-gray-600 uppercase">
        {activeTab === 'chats' ? 'Чаты' : 'Контакты'}
      </h2>
      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="p-2 bg-white rounded shadow text-gray-800 cursor-pointer hover:bg-gray-50"
            onClick={() => onSelectItem(item.id)}
          >
            {item.label}
          </li>
        ))}
      </ul>
    </aside>
  )
}