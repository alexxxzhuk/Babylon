// import { useState } from 'react'

// interface Props {
//   onSend: (text: string) => void
// }

// export default function MessageInput({ onSend }: Props) {
//   const [text, setText] = useState('')
//   const [loading, setLoading] = useState(false)
//   const [error, setError] = useState<string | null>(null)

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()
//     if (!text.trim()) return

//     setLoading(true)
//     setError(null)

//     try {
//       onSend(text.trim())
//       setText('')
//     } catch {
//       setError('Не удалось отправить сообщение')
//     } finally {
//       setLoading(false)
//     }
//   }

//   return (
//     <form onSubmit={handleSubmit} className="flex gap-2 mt-4">
//       <input
//         type="text"
//         className="flex-1 border rounded px-3 py-2 text-sm"
//         placeholder="Введите сообщение..."
//         value={text}
//         onChange={(e) => setText(e.target.value)}
//         disabled={loading}
//       />
//       <button
//         type="submit"
//         className="bg-blue-600 text-white px-4 py-2 rounded text-sm disabled:opacity-50"
//         disabled={loading || !text.trim()}
//       >
//         Отправить
//       </button>
//       {error && <div className="text-red-500 text-sm ml-2">{error}</div>}
//     </form>
//   )
// }

import { useState } from 'react'

interface Props {
  onSend: (text: string) => Promise<void> // 👈 теперь асинхронно
}

export default function MessageInput({ onSend }: Props) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return

    setLoading(true)
    setError(null)

    try {
      await onSend(text.trim()) // 👈 ждём завершения отправки
      setText('')
    } catch {
      setError('Не удалось отправить сообщение')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mt-4">
      <input
        type="text"
        className="flex-1 border rounded px-3 py-2 text-sm"
        placeholder="Введите сообщение..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={loading}
      />
      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded text-sm disabled:opacity-50"
        disabled={loading || !text.trim()}
      >
        Отправить
      </button>
      {error && <div className="text-red-500 text-sm ml-2">{error}</div>}
    </form>
  )
}