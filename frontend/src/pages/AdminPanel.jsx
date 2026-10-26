import { useState, useEffect } from 'react'
import api from '../api'

const statusStyle = {
  active:    'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
}

// Начальное состояние формы добавления номера
const emptyRoom = { name: '', type: '', price_per_night: '', description: '' }

export default function AdminPanel() {
  const [bookings, setBookings] = useState([])
  const [loadingBookings, setLoadingBookings] = useState(true)

  const [form, setForm]         = useState(emptyRoom)
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)
  const [formSuccess, setFormSuccess] = useState(false)

  useEffect(() => {
    fetchAllBookings()
  }, [])

  const fetchAllBookings = async () => {
    setLoadingBookings(true)
    try {
      const response = await api.get('/bookings')
      setBookings(response.data)
    } finally {
      setLoadingBookings(false)
    }
  }

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Отменить это бронирование?')) return
    try {
      await api.patch(`/bookings/${bookingId}/cancel`)
      setBookings((prev) =>
        prev.map((b) => b.id === bookingId ? { ...b, status: 'cancelled' } : b)
      )
    } catch (err) {
      alert(err.response?.data?.detail || 'Ошибка при отмене')
    }
  }

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setFormSuccess(false)
  }

  const handleAddRoom = async (e) => {
    e.preventDefault()
    setFormError('')
    setFormLoading(true)
    try {
      await api.post('/rooms', {
        ...form,
        price_per_night: Number(form.price_per_night),
      })
      setForm(emptyRoom)
      setFormSuccess(true)
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Ошибка при создании номера')
    } finally {
      setFormLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-10">

      {/* ------------------------------------------------------------------ */}
      {/* Форма добавления номера                                             */}
      {/* ------------------------------------------------------------------ */}
      <section>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">➕ Добавить номер</h2>

        <form
          onSubmit={handleAddRoom}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
              <input
                name="name"
                value={form.name}
                onChange={handleFormChange}
                placeholder="Люкс у моря"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Тип</label>
              <input
                name="type"
                value={form.type}
                onChange={handleFormChange}
                placeholder="Стандарт / Люкс / Семейный"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Цена за ночь (₽)</label>
              <input
                name="price_per_night"
                type="number"
                min="0"
                value={form.price_per_night}
                onChange={handleFormChange}
                placeholder="5000"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
              <input
                name="description"
                value={form.description}
                onChange={handleFormChange}
                placeholder="Краткое описание номера"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {formError && (
            <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {formError}
            </p>
          )}
          {formSuccess && (
            <p className="text-green-600 text-sm bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              ✅ Номер успешно добавлен!
            </p>
          )}

          <button
            type="submit"
            disabled={formLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300
                       text-white font-semibold rounded-lg px-6 py-2 transition-colors"
          >
            {formLoading ? 'Сохранение...' : 'Добавить номер'}
          </button>
        </form>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Список всех бронирований                                            */}
      {/* ------------------------------------------------------------------ */}
      <section>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">📋 Все бронирования</h2>

        {loadingBookings && <p className="text-gray-500">Загрузка...</p>}

        {!loadingBookings && bookings.length === 0 && (
          <p className="text-gray-400 text-center py-8">Бронирований пока нет</p>
        )}

        <div className="space-y-3">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4
                         flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
            >
              <div className="flex items-center gap-4">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusStyle[booking.status] ?? 'bg-gray-100 text-gray-600'}`}>
                  {booking.status === 'active' ? 'Активна' : 'Отменена'}
                </span>

                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    Клиент #{booking.user_id} · Номер #{booking.room_id}
                  </p>
                  <p className="text-xs text-gray-500">
                    {booking.check_in} — {booking.check_out} · {booking.total_price.toLocaleString('ru-RU')} ₽
                  </p>
                </div>
              </div>

              {booking.status === 'active' && (
                <button
                  onClick={() => handleCancel(booking.id)}
                  className="text-xs text-red-500 hover:text-red-700 border border-red-200
                             hover:border-red-400 rounded-lg px-3 py-1 transition-colors
                             self-start sm:self-auto"
                >
                  Отменить
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}
