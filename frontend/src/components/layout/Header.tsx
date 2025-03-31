// import { MessageCircle, Users } from 'lucide-react'
// import type { MeResponse } from '../../types'

// interface HeaderProps {
//   user: MeResponse['user']
//   activeTab: 'chats' | 'contacts'
//   onTabChange: (tab: 'chats' | 'contacts') => void
// }

// export default function Header({ user, activeTab, onTabChange }: HeaderProps) {
//   return (
//     <header className="bg-white shadow p-4 flex justify-between items-center">
//       <div className="flex space-x-4">
//         <TabButton
//           icon={<MessageCircle className="w-5 h-5" />}
//           active={activeTab === 'chats'}
//           onClick={() => onTabChange('chats')}
//         />
//         <TabButton
//           icon={<Users className="w-5 h-5" />}
//           active={activeTab === 'contacts'}
//           onClick={() => onTabChange('contacts')}
//         />
//       </div>
//       <div className="text-gray-800 font-medium">
//         👋 Привет, {user.first_name} {user.last_name}
//       </div>
//     </header>
//   )
// }

// function TabButton({
//   icon,
//   active,
//   onClick,
// }: {
//   icon: React.ReactNode
//   active: boolean
//   onClick: () => void
// }) {
//   return (
//     <button
//       onClick={onClick}
//       className={`p-2 rounded ${active ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
//     >
//       {icon}
//     </button>
//   )
// }

import { useState } from 'react'
import { MessageCircle, Users, Settings } from 'lucide-react'
import type { MeResponse } from '../../types'
import UserPopup from './UserPopup.tsx'

interface HeaderProps {
  user: MeResponse['user']
  activeTab: 'chats' | 'contacts'
  onTabChange: (tab: 'chats' | 'contacts') => void
}

export default function Header({ user, activeTab, onTabChange }: HeaderProps) {
  const [showPopup, setShowPopup] = useState(false)

  return (
    <header className="bg-white shadow p-4 flex justify-between items-center">
      {/* Левая часть — иконки вкладок */}
      <div className="flex space-x-4">
        <TabButton
          icon={<MessageCircle className="w-5 h-5" />}
          active={activeTab === 'chats'}
          onClick={() => onTabChange('chats')}
        />
        <TabButton
          icon={<Users className="w-5 h-5" />}
          active={activeTab === 'contacts'}
          onClick={() => onTabChange('contacts')}
        />
      </div>

      {/* Правая часть — имя и шестерёнка */}
      <div className="relative flex items-center space-x-4">
        <span className="text-gray-800 font-medium whitespace-nowrap">
          {user.first_name} {user.last_name}
        </span>
        <button
          onClick={() => setShowPopup(!showPopup)}
          className="p-2 rounded hover:bg-gray-100"
        >
          <Settings className="w-5 h-5 text-gray-600" />
        </button>

        {/* вне потока, чтобы не двигал layout */}
        <div className="absolute right-0 top-full mt-2 z-10 pointer-events-none">
          {showPopup && (
            <div className="pointer-events-auto">
              <UserPopup user={user} />
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

function TabButton({
  icon,
  active,
  onClick,
}: {
  icon: React.ReactNode
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`p-2 rounded ${active ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
    >
      {icon}
    </button>
  )
}