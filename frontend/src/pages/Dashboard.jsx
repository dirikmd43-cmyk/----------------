import { useState, useEffect } from 'react'
import api from '../api'

// Цвет бейджа статуса
const statusStyle = {
  active:    'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
}

export default function Dashboard() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    setLoading(true)
    try {
      const response = await api.get('/bookings/me')
      setBookings(response.data)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Вы уверены, что хотите отменить бронирование?')) return
    try {
      await api.patch(`/bookings/${bookingId}/cancel`)
      // Обновляем список после отмены
      setBookings((prev) =>
        prev.map((b) => b.id === bookingId ? { ...b, status: 'cancelled' } : b)
      )
    } catch (err) {
      alert(err.response?.data?.detail || 'Ошибка при отмене')
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">👤 Мои бронирования</h1>

      {loading && <p className="text-gray-500">Загрузка...</p>}

      {!loading && bookings.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-2">📭</p>
          <p>У вас пока нет бронирований</p>
        </div>
      )}

      <div className="space-y-4">
        {bookings.map((booking) => (
          <div
            key={booking.id}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5
                       flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          >
            <div>
              {/* Статус */}
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusStyle[booking.status] ?? 'bg-gray-100 text-gray-600'}`}>
                {booking.status === 'active' ? 'Активна' : 'Отменена'}
              </span>

              <p className="text-gray-800 font-semibold mt-2">
                Номер #{booking.room_id}
              </p>
              <p className="text-sm text-gray-500 mt-0.5">
                {booking.check_in} — {booking.check_out}
              </p>
              <p className="text-blue-600 font-bold mt-1">
                {booking.total_price.toLocaleString('ru-RU')} ₽
              </p>
            </div>

            {booking.status === 'active' && (
              <button
                onClick={() => handleCancel(booking.id)}
                className="text-sm text-red-500 hover:text-red-700 border border-red-200
                           hover:border-red-400 rounded-lg px-4 py-1.5 transition-colors
                           self-start sm:self-auto"
              >
                Отменить
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
