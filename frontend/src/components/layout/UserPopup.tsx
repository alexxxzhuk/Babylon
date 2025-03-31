import type { MeResponse } from '../../types'

export default function UserPopup({ user }: { user: MeResponse['user'] }) {
  return (
    <div className="bg-white rounded shadow-lg p-4 text-sm text-gray-800 w-64 border">
      <div className="mb-2">
        <strong>Имя:</strong> {user.first_name}
      </div>
      <div>
        <strong>Фамилия:</strong> {user.last_name}
      </div>
    </div>
  )
}