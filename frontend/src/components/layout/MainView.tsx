import type { Chat } from '../../types'

interface MainViewProps {
  activeTab: 'chats' | 'contacts'
  chats: Chat[]
  selectedId: string | null
}

export default function MainView({ activeTab, selectedId }: MainViewProps) {
  if (!selectedId) {
    return (
      <div className="text-gray-700">
        Выберите {activeTab === 'chats' ? 'чат' : 'контакт'} слева
      </div>
    )
  }

  return (
    <div className="text-gray-700">
      {activeTab === 'chats'
        ? 'Позже тут будут сообщения'
        : 'Информация о контакте появится позже'}
    </div>
  )
}