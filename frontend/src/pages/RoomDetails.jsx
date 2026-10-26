import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../context/AuthContext'

export default function RoomDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [room, setRoom]         = useState(null)
  const [checkIn, setCheckIn]   = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [loading, setLoading]   = useState(true)
  const [booking, setBooking]   = useState(false)
  const [error, setError]       = useState('')

  useEffect(() => {
    api.get(`/rooms/${id}`)
      .then((r) => setRoom(r.data))
      .catch(() => navigate('/'))
      .finally(() => setLoading(false))
  }, [id])

  // Расчёт стоимости на лету через нативный JS
  // Разница в миллисекундах / мс в одних сутках = количество ночей
  const MS_PER_DAY = 1000 * 60 * 60 * 24
  const nights = (checkIn && checkOut)
    ? Math.round((new Date(checkOut) - new Date(checkIn)) / MS_PER_DAY)
    : 0
  const totalPrice = nights > 0 && room ? nights * room.price_per_night : 0

  const handleBooking = async (e) => {
    e.preventDefault()
    if (!user) { navigate('/login'); return }
    if (nights <= 0) { setError('Некорректные даты'); return }

    setError('')
    setBooking(true)
    try {
      await api.post('/bookings', {
        room_id: room.id,
        check_in: checkIn,
        check_out: checkOut,
      })
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка при бронировании')
    } finally {
      setBooking(false)
    }
  }

  if (loading) return <div className="p-8 text-gray-500">Загрузка...</div>
  if (!room)   return null

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">

      {/* Кнопка назад */}
      <button
        onClick={() => navigate(-1)}
        className="text-sm text-blue-600 hover:underline mb-6 flex items-center gap-1"
      >
        ← Назад
      </button>

      {/* Карточка номера */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        {room.image_url && (
          <img
            src={room.image_url}
            alt={room.name}
            className="w-full h-64 md:h-96 object-cover rounded-lg mb-6"
          />
        )}
        <span className="text-xs font-semibold uppercase tracking-wider text-blue-600
                         bg-blue-50 rounded-full px-2 py-0.5">
          {room.type}
        </span>
        <h1 className="text-3xl font-bold text-gray-800 mt-3 mb-2">{room.name}</h1>
        <p className="text-gray-600 leading-relaxed mb-4">{room.description}</p>
        <p className="text-2xl font-bold text-blue-600">
          {room.price_per_night.toLocaleString('ru-RU')} ₽
          <span className="text-gray-400 font-normal text-base"> / ночь</span>
        </p>
      </div>

      {/* Форма бронирования */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">📅 Забронировать</h2>

        <form onSubmit={handleBooking} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Дата заезда</label>
              <input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Дата выезда</label>
              <input
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Итоговая стоимость — показываем только если даты выбраны корректно */}
          {nights > 0 && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Количество ночей</span>
                <span className="font-medium">{nights}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Цена за ночь</span>
                <span className="font-medium">{room.price_per_night.toLocaleString('ru-RU')} ₽</span>
              </div>
              <div className="border-t border-blue-200 mt-2 pt-2 flex justify-between font-bold text-gray-800">
                <span>Итого</span>
                <span className="text-blue-600">{totalPrice.toLocaleString('ru-RU')} ₽</span>
              </div>
            </div>
          )}

          {nights < 0 && (
            <p className="text-red-500 text-sm">Дата выезда должна быть позже даты заезда</p>
          )}

          {error && (
            <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={booking || nights <= 0}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300
                       text-white font-semibold rounded-lg py-2.5 transition-colors"
          >
            {booking ? 'Бронируем...' : user ? 'Забронировать' : 'Войдите, чтобы забронировать'}
          </button>
        </form>
      </div>

    </div>
  )
}
