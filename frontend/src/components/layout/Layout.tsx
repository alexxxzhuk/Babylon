import Header from './Header'
import Sidebar from './Sidebar'
import MainView from './MainView'

import type { Chat, MeResponse } from '../../types'

interface LayoutProps {
  user: MeResponse['user']
  chats: Chat[]
  activeTab: 'chats' | 'contacts'
  onTabChange: (tab: 'chats' | 'contacts') => void
  onSelectItem: (id: string) => void
  selectedId: string | null
}

export default function Layout({
  user,
  chats,
  activeTab,
  onTabChange,
  onSelectItem,
  selectedId
}: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} activeTab={activeTab} onTabChange={onTabChange} />
      <div className="flex flex-1">
        <Sidebar
          chats={chats}
          activeTab={activeTab}
          onSelectItem={onSelectItem}
        />
        <main className="flex-1 p-6">
          <MainView
            activeTab={activeTab}
            chats={chats}
            selectedId={selectedId}
          />
        </main>
      </div>
    </div>
  )
}