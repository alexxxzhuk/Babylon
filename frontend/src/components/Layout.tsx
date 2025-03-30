import Header from './Header.tsx'
import Sidebar from './Sidebar.tsx'
import type { ReactNode } from 'react'
import type { MeResponse } from '../types'
import type { Chat } from '../types'

type Props = {
  user: MeResponse['user']
  chats: Chat[]
  children: ReactNode
}

export default function Layout({ user, chats, children }: Props) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} />
      <div className="flex flex-1">
        <Sidebar chats={chats} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}