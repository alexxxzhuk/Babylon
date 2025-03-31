import type { MeResponse } from '../../types'

export default function Welcome({ me }: { me: MeResponse['user'] }) {
  return (
    <div className="text-center bg-green-100 p-6 rounded shadow">
      <h1 className="text-2xl font-bold text-green-800 mb-2">
        Привет, {me.first_name} {me.last_name}!
      </h1>
      <p className="text-gray-600">Вы успешно авторизовались 🎉</p>
    </div>
  )
}