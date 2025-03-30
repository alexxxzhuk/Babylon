import type { MeResponse } from '../types'

export default function Header({ user }: { user: MeResponse['user'] }) {
  return (
    <header className="bg-white shadow p-4 flex justify-between items-center">
      <div className="text-lg font-medium text-gray-800">
        👋 Привет, {user.first_name} {user.last_name}
      </div>
    </header>
  )
}