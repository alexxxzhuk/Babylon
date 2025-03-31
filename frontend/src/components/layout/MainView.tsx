// import type { Chat } from '../../types'

// interface MainViewProps {
//   activeTab: 'chats' | 'contacts'
//   chats: Chat[]
//   selectedId: string | null
// }

// export default function MainView({ activeTab, selectedId }: MainViewProps) {
//   if (!selectedId) {
//     return (
//       <div className="text-gray-700">
//         Выберите {activeTab === 'chats' ? 'чат' : 'контакт'} слева
//       </div>
//     )
//   }

//   return (
//     <div className="text-gray-700">
//       {activeTab === 'chats'
//         ? 'Позже тут будут сообщения'
//         : 'Информация о контакте появится позже'}
//     </div>
//   )
// }

import { useEffect, useState } from 'react'
import type { Chat } from '../../types'
import { getContactById, type Contact } from '../../api/client'

interface MainViewProps {
  activeTab: 'chats' | 'contacts'
  chats: Chat[]
  selectedId: string | null
}

export default function MainView({ activeTab, selectedId }: MainViewProps) {
  const [contact, setContact] = useState<Contact | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (activeTab === 'contacts' && selectedId?.startsWith('contact-')) {
      const id = selectedId.replace('contact-', '')
      setLoading(true)
      setError(null)
      getContactById(id)
        .then((data) => setContact(data.contact))
        .catch(() => setError('Не удалось загрузить контакт'))
        .finally(() => setLoading(false))
    } else {
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

  if (activeTab === 'chats') {
    return <div className="text-gray-700">Позже тут будут сообщения</div>
  }

  if (loading) {
    return <div className="text-gray-500">Загрузка контакта...</div>
  }

  if (error) {
    return <div className="text-red-500">{error}</div>
  }

  if (!contact) return null

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